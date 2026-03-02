import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class CreatePreorderDto {
  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  dubpackId?: string;

  @IsDateString()
  releaseDate!: string;
}

@Controller("preorders")
@UseGuards(JwtAuthGuard)
export class PreordersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async myPreorders(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.preorder.findMany({
      where: { userId: req.user!.userId },
      include: { release: true, dubpack: true },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post()
  async create(
    @Body() dto: CreatePreorderDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    return this.prisma.preorder.create({
      data: {
        userId: req.user!.userId,
        releaseId: dto.releaseId,
        dubpackId: dto.dubpackId,
        releaseDate: new Date(dto.releaseDate)
      }
    });
  }
}
