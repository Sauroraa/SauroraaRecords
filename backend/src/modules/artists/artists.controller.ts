import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

function slugifyArtist(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "artist";
}

class UpdateArtistDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsString() payoutIban?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsString() soundcloudUrl?: string;
  @IsOptional() @IsString() discordUrl?: string;
  @IsOptional() @IsString() websiteUrl?: string;
}

class DownloadConfigDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsArray() requiredActions?: string[];
}

const ARTIST_FULL_INCLUDE = {
  user: {
    select: {
      email: true,
      firstName: true,
      lastName: true,
      subscription: { select: { plan: true, status: true } }
    }
  },
  agencyLinks: { include: { agency: { select: { displayName: true } } }, take: 1 },
  _count: { select: { followers: true, releases: true } }
};

@Controller("artists")
export class ArtistsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.artist.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { followers: true } }
      }
    });
  }

  // ─── Admin: backfill slugs for existing artists ──────────────────────────────
  @Post("admin/backfill-slugs")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async backfillSlugs() {
    const artists = await this.prisma.artist.findMany({ where: { slug: null } });
    let updated = 0;
    for (const artist of artists) {
      if (!artist.displayName) continue;
      const base = slugifyArtist(artist.displayName);
      let slug = base;
      let attempt = 0;
      while (true) {
        const existing = await this.prisma.artist.findUnique({ where: { slug } });
        if (!existing || existing.id === artist.id) break;
        slug = `${base}-${++attempt}`;
      }
      await this.prisma.artist.update({ where: { id: artist.id }, data: { slug } });
      updated++;
    }
    return { updated };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  me(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      include: ARTIST_FULL_INCLUDE
    });
  }

  @Get("me/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async stats(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) return { totalRevenue: 0, totalDownloads: 0, totalReleases: 0, totalFollowers: 0 };

    const [revenues, downloadSessions, releases, followers] = await Promise.all([
      this.prisma.artistRevenue.aggregate({ where: { artistId: artist.id }, _sum: { netDue: true } }),
      this.prisma.freeDownloadSession.count({ where: { release: { artistId: artist.id } } }),
      this.prisma.release.count({ where: { artistId: artist.id } }),
      this.prisma.follow.count({ where: { artistId: artist.id } })
    ]);

    return {
      totalRevenue: Number(revenues._sum.netDue ?? 0),
      totalDownloads: downloadSessions,
      totalReleases: releases,
      totalFollowers: followers
    };
  }

  @Get("me/download-config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async getDownloadConfig(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) return { enabled: false, requiredActions: [] };
    const config = await this.prisma.artistDownloadConfig.findUnique({ where: { artistId: artist.id } });
    return config ?? { enabled: false, requiredActions: [] };
  }

  @Put("me/download-config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async updateDownloadConfig(
    @Req() req: Request & { user?: { userId: string } },
    @Body() dto: DownloadConfigDto
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) return { enabled: false, requiredActions: [] };
    return this.prisma.artistDownloadConfig.upsert({
      where: { artistId: artist.id },
      update: { enabled: dto.enabled ?? true, requiredActions: dto.requiredActions ?? [] },
      create: { artistId: artist.id, enabled: dto.enabled ?? true, requiredActions: dto.requiredActions ?? [] }
    });
  }

  @Get("me/revenue")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async getRevenue(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) return [];
    const revenues = await this.prisma.artistRevenue.findMany({
      where: { artistId: artist.id },
      orderBy: { month: "asc" }
    });
    return revenues.map((r) => ({
      month: r.month,
      gross: Number(r.totalSales),
      net: Number(r.netDue),
      label: Number(r.commission)
    }));
  }

  @Get(":id/stats")
  async publicStats(@Param("id") id: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id }, select: { id: true } });
    if (!artist) throw new NotFoundException("Artist not found");

    const tracks = await this.prisma.release.findMany({
      where: { artistId: id, published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        coverPath: true,
        createdAt: true,
        _count: { select: { streamEvents: true, downloadSessions: true, comments: true } }
      }
    });

    const totalViews = tracks.reduce((sum, track) => sum + track._count.streamEvents, 0);

    return {
      artistId: id,
      totalViews,
      totalTracks: tracks.length,
      tracks: tracks.map((track) => ({
        id: track.id,
        slug: track.slug,
        title: track.title,
        coverPath: track.coverPath,
        createdAt: track.createdAt,
        views: track._count.streamEvents,
        downloads: track._count.downloadSessions,
        comments: track._count.comments
      }))
    };
  }

  @Get(":idOrSlug")
  async one(@Param("idOrSlug") idOrSlug: string) {
    // Accept both UUID id and slug
    const artist = await this.prisma.artist.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: ARTIST_FULL_INCLUDE
    });
    if (!artist) throw new NotFoundException("Artist not found");
    return artist;
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async updateMe(
    @Req() req: Request & { user?: { userId: string } },
    @Body() dto: UpdateArtistDto
  ) {
    // Auto-generate unique slug from displayName if provided
    let slugData: { slug?: string } = {};
    if (dto.displayName) {
      const base = slugifyArtist(dto.displayName);
      let slug = base;
      let attempt = 0;
      while (true) {
        const existing = await this.prisma.artist.findUnique({ where: { slug } });
        if (!existing || existing.userId === req.user!.userId) break;
        slug = `${base}-${++attempt}`;
      }
      slugData = { slug };
    }

    return this.prisma.artist.upsert({
      where: { userId: req.user!.userId },
      create: { userId: req.user!.userId, ...dto, ...slugData },
      update: { ...dto, ...slugData },
      include: ARTIST_FULL_INCLUDE
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateArtistDto) {
    return this.prisma.artist.update({ where: { id }, data: dto });
  }

  // ─── Advanced Analytics ────────────────────────────────────────────────────────

  @Get("me/analytics/advanced")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async advancedAnalytics(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [streamsByDay, downloadsByDay, topTracks, commentsByDay, repostsByDay, followerGrowth] = await Promise.all([
      // Streams by day (last 30 days)
      this.prisma.streamEvent.groupBy({
        by: ["createdAt"],
        where: { release: { artistId: artist.id }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      // Downloads by day
      this.prisma.freeDownloadSession.groupBy({
        by: ["createdAt"],
        where: { release: { artistId: artist.id }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      // Top tracks by stream count
      this.prisma.release.findMany({
        where: { artistId: artist.id, published: true },
        include: { _count: { select: { streamEvents: true, downloadSessions: true, comments: true } } },
        orderBy: { streamEvents: { _count: "desc" } },
        take: 10
      }),
      // Comments by day
      this.prisma.comment.groupBy({
        by: ["createdAt"],
        where: { release: { artistId: artist.id }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      // Reposts by day
      this.prisma.repost.groupBy({
        by: ["createdAt"],
        where: { release: { artistId: artist.id }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true }
      }),
      // Follower growth
      this.prisma.follow.findMany({
        where: { artistId: artist.id, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" }
      })
    ]);

    const bucketByDay = (events: { createdAt: Date; _count: { id: number } }[]) => {
      const map = new Map<string, number>();
      for (const e of events) {
        const day = e.createdAt.toISOString().slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + e._count.id);
      }
      return Object.fromEntries(map);
    };

    return {
      streamsByDay: bucketByDay(streamsByDay as { createdAt: Date; _count: { id: number } }[]),
      downloadsByDay: bucketByDay(downloadsByDay as { createdAt: Date; _count: { id: number } }[]),
      commentsByDay: bucketByDay(commentsByDay as { createdAt: Date; _count: { id: number } }[]),
      repostsByDay: bucketByDay(repostsByDay as { createdAt: Date; _count: { id: number } }[]),
      followerGrowth: followerGrowth.map((f) => f.createdAt.toISOString().slice(0, 10)),
      topTracks: topTracks.map((t) => ({
        id: t.id,
        title: t.title,
        coverPath: t.coverPath,
        streams: t._count.streamEvents,
        downloads: t._count.downloadSessions,
        comments: t._count.comments
      }))
    };
  }

  // ─── Fan Broadcasts ───────────────────────────────────────────────────────────

  @Post("me/broadcasts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async sendBroadcast(
    @Body() body: { title: string; message: string },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      include: { followers: { select: { followerId: true } } }
    });
    if (!artist) throw new NotFoundException("Artist not found");

    const broadcast = await this.prisma.artistBroadcast.create({
      data: {
        artistId: artist.id,
        title: body.title,
        body: body.message,
        recipients: {
          create: artist.followers.map((f) => ({ userId: f.followerId }))
        }
      }
    });
    return { ...broadcast, recipientCount: artist.followers.length };
  }

  @Get("me/broadcasts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async listBroadcasts(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    return this.prisma.artistBroadcast.findMany({
      where: { artistId: artist.id },
      include: { _count: { select: { recipients: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("me/inbox")
  @UseGuards(JwtAuthGuard)
  async inbox(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.artistBroadcastRecipient.findMany({
      where: { userId: req.user!.userId },
      include: { broadcast: { include: { artist: { select: { id: true, displayName: true, avatar: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  // ─── Promotion Campaigns ──────────────────────────────────────────────────────

  @Post("me/promotions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createPromotion(
    @Body() body: { title: string; promotionType: string; releaseId?: string; budgetCents?: number },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    return this.prisma.promotionCampaign.create({
      data: {
        artistId: artist.id,
        title: body.title,
        promotionType: body.promotionType as "HOMEPAGE_FEATURE" | "FOLLOWER_PUSH" | "DISCOVERY_BOOST",
        releaseId: body.releaseId,
        budgetCents: body.budgetCents ?? 0,
        status: "DRAFT"
      }
    });
  }

  @Get("me/promotions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async listPromotions(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    return this.prisma.promotionCampaign.findMany({
      where: { artistId: artist.id },
      include: { release: { select: { id: true, title: true, coverPath: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  // ─── API Keys ────────────────────────────────────────────────────────────────

  @Post("me/api-keys")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createApiKey(
    @Body() body: { name: string },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const crypto = await import("crypto");
    const rawKey = `srk_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    await this.prisma.publicApiClient.create({
      data: { name: body.name, keyHash, scopes: ["releases:read", "artist:read"], createdBy: req.user!.userId }
    });
    return { key: rawKey, note: "Save this key — it will not be shown again" };
  }

  @Get("me/api-keys")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async listApiKeys(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.publicApiClient.findMany({
      where: { createdBy: req.user!.userId },
      select: { id: true, name: true, scopes: true, rateLimit: true, active: true, createdAt: true }
    });
  }

  @Patch("me/api-keys/:id/revoke")
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(@Param("id") id: string, @Req() req: Request & { user?: { userId: string } }) {
    const key = await this.prisma.publicApiClient.findUnique({ where: { id } });
    if (!key || key.createdBy !== req.user!.userId) throw new NotFoundException("Key not found");
    return this.prisma.publicApiClient.update({ where: { id }, data: { active: false } });
  }
}
