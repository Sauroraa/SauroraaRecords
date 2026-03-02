import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

@Controller("tips")
export class TipsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("artist/:artistId")
  getArtistTips(@Param("artistId") artistId: string) {
    return this.prisma.tip.findMany({
      where: { artistId },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  myTips(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.tip.findMany({
      where: { userId: req.user!.userId },
      include: { artist: { select: { displayName: true, avatar: true } } },
      orderBy: { createdAt: "desc" }
    });
  }
}
