import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class ItemDto {
  @IsString()
  releaseId!: string;

  @IsNumber()
  @Type(() => Number)
  price!: number;
}

class CreateOrderDto {
  @IsString()
  userId!: string;

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
  async create(@Body() dto: CreateOrderDto) {
    const total = dto.items.reduce((sum, i) => sum + i.price, 0);

    return this.prisma.order.create({
      data: {
        userId: dto.userId,
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
  }
}
