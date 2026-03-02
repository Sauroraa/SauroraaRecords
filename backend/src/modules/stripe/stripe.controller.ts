import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards
} from "@nestjs/common";
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import Stripe from "stripe";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class CheckoutItemDto {
  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  dubpackId?: string;
}

class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

class TipDto {
  @IsString()
  artistId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new BadRequestException("Stripe not configured");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

@Controller("stripe")
export class StripeController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body() dto: CheckoutDto,
    @Req() req: Request & { user?: { userId: string; email: string } }
  ) {
    const stripe = getStripe();
    const userId = req.user!.userId;

    // Resolve items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = { type: "purchase", userId };

    let totalDiscount = 0;
    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode }
      });
      if (
        promo &&
        promo.uses < promo.maxUses &&
        (!promo.expiresAt || promo.expiresAt > new Date())
      ) {
        totalDiscount = promo.discount;
        metadata.promoCode = dto.promoCode;
        await this.prisma.promoCode.update({
          where: { id: promo.id },
          data: { uses: { increment: 1 } }
        });
      }
    }

    for (const item of dto.items) {
      if (item.releaseId) {
        const release = await this.prisma.release.findUnique({ where: { id: item.releaseId } });
        if (!release) continue;
        const price = Math.round(Number(release.price) * (1 - totalDiscount / 100) * 100);
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: { name: release.title },
            unit_amount: price
          },
          quantity: 1
        });
      }
      if (item.dubpackId) {
        const dubpack = await this.prisma.dubpack.findUnique({ where: { id: item.dubpackId } });
        if (!dubpack) continue;
        const price = Math.round(Number(dubpack.price) * (1 - totalDiscount / 100) * 100);
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: { name: `${dubpack.title} [DUBPACK]` },
            unit_amount: price
          },
          quantity: 1
        });
      }
    }

    if (lineItems.length === 0) throw new BadRequestException("No valid items");

    const itemsJson = JSON.stringify(dto.items);
    metadata.items = itemsJson;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: req.user!.email,
      metadata,
      success_url: dto.successUrl || `${process.env.APP_URL || "http://localhost:3000"}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: dto.cancelUrl || `${process.env.APP_URL || "http://localhost:3000"}/shop`
    });

    return { sessionUrl: session.url };
  }

  @Post("tip")
  @UseGuards(JwtAuthGuard)
  async tip(
    @Body() dto: TipDto,
    @Req() req: Request & { user?: { userId: string; email: string } }
  ) {
    const stripe = getStripe();
    const userId = req.user!.userId;

    const artist = await this.prisma.artist.findUnique({
      where: { id: dto.artistId },
      include: { user: { select: { email: true } } }
    });
    if (!artist) throw new BadRequestException("Artist not found");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Tip for ${artist.displayName ?? artist.user.email}` },
            unit_amount: dto.amount * 100
          },
          quantity: 1
        }
      ],
      customer_email: req.user!.email,
      metadata: {
        type: "tip",
        userId,
        artistId: dto.artistId,
        amount: String(dto.amount)
      },
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/artist/${artist.id}?tipped=1`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/artist/${artist.id}`
    });

    return { sessionUrl: session.url };
  }

  @Post("webhook")
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new BadRequestException("Webhook secret not configured");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody!, signature, webhookSecret);
    } catch {
      throw new BadRequestException("Webhook signature invalid");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};

      if (meta.type === "purchase") {
        await this.handlePurchase(session, meta);
      } else if (meta.type === "tip") {
        await this.handleTip(meta, session);
      }
    }

    return { received: true };
  }

  private async handlePurchase(
    session: Stripe.Checkout.Session,
    meta: Record<string, string>
  ) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { stripeSessionId: session.id }
    });
    if (existingOrder) return;

    const items: { releaseId?: string; dubpackId?: string }[] = JSON.parse(meta.items || "[]");
    const userId = meta.userId;

    const orderItems = await Promise.all(
      items.map(async (item) => {
        if (item.releaseId) {
          const release = await this.prisma.release.findUnique({ where: { id: item.releaseId } });
          if (!release) return null;
          return { releaseId: item.releaseId, price: release.price };
        }
        if (item.dubpackId) {
          const dubpack = await this.prisma.dubpack.findUnique({ where: { id: item.dubpackId } });
          if (!dubpack) return null;
          return { dubpackId: item.dubpackId, price: dubpack.price };
        }
        return null;
      })
    );

    const validItems = orderItems.filter(Boolean) as { releaseId?: string; dubpackId?: string; price: unknown }[];
    const total = session.amount_total ? session.amount_total / 100 : 0;

    await this.prisma.order.create({
      data: {
        userId,
        total,
        stripeSessionId: session.id,
        status: "completed",
        items: {
          create: validItems.map((item) => ({
            releaseId: item.releaseId,
            dubpackId: item.dubpackId,
            price: Number(item.price)
          }))
        }
      }
    });

    // Create notification for user
    await this.prisma.notification.create({
      data: {
        userId,
        type: "PURCHASE_CONFIRMED",
        body: "Your purchase is confirmed. Download your files in your dashboard."
      }
    });
  }

  private async handleTip(meta: Record<string, string>, session: Stripe.Checkout.Session) {
    await this.prisma.tip.create({
      data: {
        userId: meta.userId,
        artistId: meta.artistId,
        amount: Number(meta.amount),
        stripeSessionId: session.id
      }
    });
  }
}
