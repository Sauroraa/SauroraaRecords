import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";
import { getPlatformCommission } from "../../utils/commission";

class ItemDto {
  @IsString()
  releaseId!: string;

  @IsNumber()
  @Type(() => Number)
  price!: number;
}

class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}

@Controller("orders")
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: {
        items: {
          include: {
            release: { select: { title: true, slug: true, coverPath: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request & { user?: { userId: string; role: UserRole } }
  ) {
    const total = dto.items.reduce((sum, i) => sum + i.price, 0);
    const currentUserId = req.user!.userId;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: currentUserId,
          total,
          items: {
            create: dto.items.map((item) => ({
              releaseId: item.releaseId,
              price: item.price
            }))
          }
        },
        include: { items: true }
      });

      const orderWithRelease = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              release: {
                select: {
                  id: true,
                  artistId: true
                }
              }
            }
          }
        }
      });

      for (const item of orderWithRelease?.items ?? []) {
        if (!item.release) continue;

        const artist = await tx.artist.findUnique({
          where: { id: item.release.artistId },
          select: { userId: true }
        });
        if (!artist) continue;

        const subscription = await tx.subscription.findUnique({
          where: { userId: artist.userId },
          select: { plan: true }
        });

        const gross = Number(item.price);
        const commissionRate = getPlatformCommission(subscription?.plan);
        const commission = Number((gross * commissionRate).toFixed(2));
        const net = Number((gross - commission).toFixed(2));

        await tx.ledgerEntry.createMany({
          data: [
            {
              artistId: item.release.artistId,
              releaseId: item.release.id,
              orderId: order.id,
              entryType: "SALE_GROSS",
              amount: gross,
              currency: "EUR",
              description: "Release sale gross amount"
            },
            {
              artistId: item.release.artistId,
              releaseId: item.release.id,
              orderId: order.id,
              entryType: "PLATFORM_COMMISSION",
              amount: commission,
              currency: "EUR",
              description: "Platform commission"
            },
            {
              artistId: item.release.artistId,
              releaseId: item.release.id,
              orderId: order.id,
              entryType: "ARTIST_NET",
              amount: net,
              currency: "EUR",
              description: "Artist net due"
            }
          ]
        });
      }

      return order;
    });
  }
}
