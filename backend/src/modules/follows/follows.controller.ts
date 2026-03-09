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

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async myFollows(@Req() req: Request & { user?: { userId: string } }) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: req.user!.userId },
      include: {
        artist: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            _count: { select: { followers: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return follows.map((f) => f.artist);
  }

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

  @Get("artist/:artistId/followers")
  async getFollowers(@Param("artistId") artistId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        follower: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            artist: { select: { id: true, displayName: true, avatar: true } }
          }
        }
      }
    });
    return follows.map(f => ({
      userId: f.follower.id,
      email: f.follower.email,
      displayName: f.follower.artist?.displayName ?? f.follower.firstName ?? f.follower.email.split("@")[0],
      avatar: f.follower.artist?.avatar ?? f.follower.avatarUrl ?? null,
      artistId: f.follower.artist?.id ?? null,
      followedAt: f.createdAt
    }));
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
