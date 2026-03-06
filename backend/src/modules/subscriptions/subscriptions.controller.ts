import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards
} from "@nestjs/common";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import Stripe from "stripe";
import { SubscriptionPlan } from "@prisma/client";

class CheckoutSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new ServiceUnavailableException("Stripe not configured");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

function getPriceId(plan: SubscriptionPlan): string | null {
  switch (plan) {
    case SubscriptionPlan.ARTIST_FREE:
      return null;
    case SubscriptionPlan.ARTIST_BASIC:
      return process.env.STRIPE_PRICE_ARTIST_BASIC || "";
    case SubscriptionPlan.ARTIST_PRO:
      return process.env.STRIPE_PRICE_ARTIST_PRO || "";
    case SubscriptionPlan.AGENCY_START:
      return process.env.STRIPE_PRICE_AGENCY_START || "";
    case SubscriptionPlan.AGENCY_PRO:
      return process.env.STRIPE_PRICE_AGENCY_PRO || "";
  }
}

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.subscription.findUnique({
      where: { userId: req.user!.userId }
    });
  }

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Body() dto: CheckoutSubscriptionDto,
    @Req() req: Request & { user?: { userId: string; email: string } }
  ) {
    const userId = req.user!.userId;

    // free plan does not require Stripe
    if (dto.plan === SubscriptionPlan.ARTIST_FREE) {
      const sub = await this.prisma.subscription.upsert({
        where: { userId },
        update: {
          plan: dto.plan,
          status: "active",
          stripeSubscriptionId: null,
          stripeCustomerId: null
        },
        create: {
          userId,
          plan: dto.plan,
          status: "active"
        }
      });
      return { message: "Subscribed to free plan", subscription: sub };
    }

    const priceId = getPriceId(dto.plan);
    if (!priceId) throw new ServiceUnavailableException("Price not configured for plan — set STRIPE_PRICE_* env vars");

    const stripe = getStripe();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    let customerId: string | undefined;
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    if (existing && existing.stripeCustomerId) {
      customerId = existing.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { type: "subscription", userId, plan: dto.plan },
      success_url:
        dto.successUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/artist?subscribed=1`,
      cancel_url: dto.cancelUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/artist`
    });

    return { sessionUrl: session.url };
  }

  @Delete("me")
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req: Request & { user?: { userId: string } }) {
    const userId = req.user!.userId;
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new BadRequestException("No active subscription");

    if (sub.stripeSubscriptionId) {
      const stripe = getStripe();
      try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } catch {
        // ignore errors
      }
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { status: "cancelled" }
    });
    return { success: true };
  }
}
