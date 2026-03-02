import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

@Controller("follows")
export class FollowsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("artist/:artistId")
  async getFollowInfo(
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId?: string } }
  ) {
    const count = await this.prisma.follow.count({ where: { artistId } });
    const userId = req.user?.userId;
    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_artistId: { followerId: userId, artistId } }
      });
      isFollowing = !!follow;
    }
    return { count, isFollowing };
  }

  @Post("artist/:artistId")
  @UseGuards(JwtAuthGuard)
  async follow(
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_artistId: { followerId: userId, artistId } }
    });
    if (existing) return { following: true };

    await this.prisma.follow.create({
      data: { followerId: userId, artistId }
    });
    return { following: true };
  }

  @Delete("artist/:artistId")
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;
    await this.prisma.follow.deleteMany({
      where: { followerId: userId, artistId }
    });
    return { following: false };
  }
}
