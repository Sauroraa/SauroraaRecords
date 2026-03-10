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
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { NotificationsService } from "../notifications/notifications.service";
import { Request } from "express";

@Controller("follows")
export class FollowsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

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
  @UseGuards(OptionalJwtAuthGuard)
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

  @Get("artist/:artistId/following")
  async getFollowing(@Param("artistId") artistId: string) {
    // Get artists that this artist follows
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId }, select: { userId: true } });
    if (!artist) return [];
    const follows = await this.prisma.follow.findMany({
      where: { followerId: artist.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        artist: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            avatar: true,
            _count: { select: { followers: true } }
          }
        }
      }
    });
    return follows.map(f => ({
      artistId: f.artist.id,
      slug: f.artist.slug,
      displayName: f.artist.displayName,
      avatar: f.artist.avatar,
      followersCount: f.artist._count.followers,
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

    const [artist, follower] = await Promise.all([
      this.prisma.artist.findUnique({
        where: { id: artistId },
        select: { userId: true, displayName: true }
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          artist: { select: { displayName: true } }
        }
      })
    ]);

    if (artist?.userId && artist.userId !== userId && follower) {
      const followerName =
        follower.artist?.displayName ??
        follower.firstName ??
        follower.email.split("@")[0];

      await this.notifications.create({
        userId: artist.userId,
        type: "NEW_FOLLOWER",
        body: `${followerName} started following you.`
      });
    }

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
