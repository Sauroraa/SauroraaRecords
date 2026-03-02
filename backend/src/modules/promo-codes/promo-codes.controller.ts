import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class CreatePromoCodeDto {
  @IsString()
  code!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discount!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

@Controller("promo-codes")
export class PromoCodesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("validate")
  async validate(@Body() body: { code: string }) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: body.code } });
    if (!promo) throw new BadRequestException("Invalid promo code");
    if (promo.uses >= promo.maxUses) throw new BadRequestException("Promo code expired");
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException("Promo code expired");
    }
    return { discount: promo.discount, code: promo.code };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  list() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePromoCodeDto) {
    return this.prisma.promoCode.create({
      data: {
        code: dto.code,
        discount: dto.discount,
        maxUses: dto.maxUses ?? 100,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined
      }
    });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string) {
    await this.prisma.promoCode.delete({ where: { id } });
    return { success: true };
  }
}
