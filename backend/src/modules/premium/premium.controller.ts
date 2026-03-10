import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { CollaboratorRole, PrivateLinkScope, PromotionType, UserRole } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { randomBytes, createHash } from "node:crypto";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class CreatePrivateLinkDto {
  @IsString()
  releaseId!: string;

  @IsOptional()
  @IsEnum(PrivateLinkScope)
  scope?: PrivateLinkScope;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(10000)
  maxPlays?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(720)
  expiresInHours?: number;
}

class CreateCollabDto {
  @IsString()
  releaseId!: string;

  @IsString()
  artistId!: string;

  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;
}

class RepostDto {
  @IsString()
  releaseId!: string;

  @IsOptional()
  @IsString()
  message?: string;
}

class PromotionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsEnum(PromotionType)
  promotionType!: PromotionType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetCents?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

class CreatePlaylistDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AddPlaylistTrackDto {
  @IsString()
  releaseId!: string;
}

@Controller("premium")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PremiumController {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateFavoritesPlaylist(userId: string) {
    const existing = await this.prisma.playlist.findFirst({
      where: { userId, title: "Favorites" },
      select: { id: true, userId: true, title: true }
    });
    if (existing) return existing;

    return this.prisma.playlist.create({
      data: {
        userId,
        title: "Favorites",
        description: "Saved tracks from SauroraaMusic",
        isPublic: false
      },
      select: { id: true, userId: true, title: true }
    });
  }

  @Post("private-links")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createPrivateLink(
    @Body() dto: CreatePrivateLinkDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
      select: { id: true, artist: { select: { userId: true } } }
    });
    if (!release) throw new BadRequestException("Release not found");
    if (release.artist.userId !== req.user!.userId) throw new UnauthorizedException("Not release owner");

    const token = randomBytes(24).toString("base64url");
    const expiresInHours = dto.expiresInHours ?? 24;

    return this.prisma.privateListeningLink.create({
      data: {
        token,
        scope: dto.scope ?? PrivateLinkScope.STREAM,
        releaseId: dto.releaseId,
        creatorId: req.user!.userId,
        maxPlays: dto.maxPlays ?? 50,
        expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000)
      }
    });
  }

  @Post("playlists")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async createPlaylist(
    @Body() dto: CreatePlaylistDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    return this.prisma.playlist.create({
      data: {
        userId: req.user!.userId,
        title: dto.title,
        description: dto.description
      }
    });
  }

  @Get("playlists/me")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async myPlaylists(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.playlist.findMany({
      where: { userId: req.user!.userId },
      include: {
        tracks: {
          include: { release: { select: { id: true, title: true, slug: true, coverPath: true } } },
          orderBy: { position: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("playlists/:playlistId/tracks")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async addTrack(
    @Param("playlistId") playlistId: string,
    @Body() dto: AddPlaylistTrackDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { id: true, userId: true }
    });
    if (!playlist) throw new BadRequestException("Playlist not found");
    if (playlist.userId !== req.user!.userId) throw new UnauthorizedException("Not playlist owner");

    const nextPosition = await this.prisma.playlistTrack.count({ where: { playlistId } });
    return this.prisma.playlistTrack.create({
      data: {
        playlistId,
        releaseId: dto.releaseId,
        position: nextPosition + 1
      }
    });
  }

  @Get("favorites/me")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async myFavorites(@Req() req: Request & { user?: { userId: string } }) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { userId: req.user!.userId, title: "Favorites" },
      include: {
        tracks: {
          include: {
            release: {
              select: {
                id: true,
                slug: true,
                title: true,
                coverPath: true,
                artist: { select: { id: true, displayName: true, avatar: true } }
              }
            }
          },
          orderBy: { position: "asc" }
        }
      }
    });

    return playlist ?? { id: null, title: "Favorites", tracks: [] };
  }

  @Get("favorites/:releaseId/status")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async favoriteStatus(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { userId: req.user!.userId, title: "Favorites" },
      select: { id: true }
    });
    if (!playlist) return { saved: false };

    const track = await this.prisma.playlistTrack.findUnique({
      where: {
        playlistId_releaseId: {
          playlistId: playlist.id,
          releaseId
        }
      }
    });

    return { saved: Boolean(track), playlistId: playlist.id };
  }

  @Post("favorites/:releaseId")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async saveFavorite(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const playlist = await this.getOrCreateFavoritesPlaylist(req.user!.userId);
    const existing = await this.prisma.playlistTrack.findUnique({
      where: {
        playlistId_releaseId: {
          playlistId: playlist.id,
          releaseId
        }
      }
    });
    if (existing) return { saved: true, playlistId: playlist.id };

    const nextPosition = await this.prisma.playlistTrack.count({ where: { playlistId: playlist.id } });
    await this.prisma.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        releaseId,
        position: nextPosition + 1
      }
    });

    return { saved: true, playlistId: playlist.id };
  }

  @Post("favorites/:releaseId/remove")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async removeFavorite(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { userId: req.user!.userId, title: "Favorites" },
      select: { id: true }
    });
    if (!playlist) return { saved: false };

    await this.prisma.playlistTrack.deleteMany({
      where: {
        playlistId: playlist.id,
        releaseId
      }
    });

    return { saved: false, playlistId: playlist.id };
  }

  @Get("private-links/:token")
  async resolvePrivateLink(@Param("token") token: string) {
    const link = await this.prisma.privateListeningLink.findUnique({
      where: { token },
      include: { release: true }
    });
    if (!link) throw new BadRequestException("Invalid link");
    if (link.expiresAt < new Date()) throw new BadRequestException("Link expired");
    if (link.playsCount >= link.maxPlays) throw new BadRequestException("Link usage limit reached");

    await this.prisma.privateListeningLink.update({
      where: { id: link.id },
      data: { playsCount: { increment: 1 }, lastUsedAt: new Date() }
    });

    return {
      releaseId: link.releaseId,
      scope: link.scope,
      streamPath: link.scope === "STREAM" ? link.release.hlsPreviewPath : null,
      downloadPath: link.scope === "DOWNLOAD" ? link.release.audioPath : null
    };
  }

  @Post("collabs")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createCollab(
    @Body() dto: CreateCollabDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
      include: { artist: true }
    });
    if (!release) throw new BadRequestException("Release not found");
    if (release.artist.userId !== req.user!.userId) throw new UnauthorizedException("Not release owner");

    return this.prisma.releaseCollaborator.upsert({
      where: {
        releaseId_artistId_role: {
          releaseId: dto.releaseId,
          artistId: dto.artistId,
          role: dto.role ?? CollaboratorRole.FEATURED
        }
      },
      create: {
        releaseId: dto.releaseId,
        artistId: dto.artistId,
        role: dto.role ?? CollaboratorRole.FEATURED,
        accepted: false
      },
      update: {}
    });
  }

  @Post("collabs/:releaseId/accept")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async acceptCollab(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    if (!artist) throw new BadRequestException("Artist profile required");

    return this.prisma.releaseCollaborator.updateMany({
      where: { releaseId, artistId: artist.id },
      data: { accepted: true }
    });
  }

  @Post("reposts")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async repost(@Body() dto: RepostDto, @Req() req: Request & { user?: { userId: string } }) {
    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
      select: { id: true, artistId: true }
    });
    if (!release) throw new BadRequestException("Release not found");

    const repost = await this.prisma.repost.upsert({
      where: {
        userId_releaseId: {
          userId: req.user!.userId,
          releaseId: dto.releaseId
        }
      },
      create: {
        userId: req.user!.userId,
        releaseId: dto.releaseId,
        message: dto.message
      },
      update: { message: dto.message }
    });

    await this.prisma.fanScore.upsert({
      where: {
        userId_artistId: {
          userId: req.user!.userId,
          artistId: release.artistId
        }
      },
      create: {
        userId: req.user!.userId,
        artistId: release.artistId,
        reposts: 1,
        score: 10
      },
      update: {
        reposts: { increment: 1 },
        score: { increment: 10 }
      }
    });

    return repost;
  }

  @Get("feed/reposts")
  async repostFeed(@Query("take") take = "30") {
    const limit = Math.min(Math.max(Number(take) || 30, 1), 100);
    return this.prisma.repost.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        release: { select: { id: true, slug: true, title: true, coverPath: true } }
      }
    });
  }

  @Get("fan-ranking/:artistId")
  async fanRanking(@Param("artistId") artistId: string, @Query("take") take = "20") {
    const limit = Math.min(Math.max(Number(take) || 20, 1), 100);
    return this.prisma.fanScore.findMany({
      where: { artistId },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }
    });
  }

  @Post("promotions")
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.AGENCY)
  async createPromotion(
    @Body() dto: PromotionDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    if (!artist) throw new BadRequestException("Artist profile required");

    return this.prisma.promotionCampaign.create({
      data: {
        artistId: artist.id,
        releaseId: dto.releaseId,
        promotionType: dto.promotionType,
        title: dto.title,
        budgetCents: dto.budgetCents ?? 0,
        status: "DRAFT",
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null
      }
    });
  }

  @Get("promotions/me")
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.AGENCY)
  async myPromotions(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    if (!artist) return [];
    return this.prisma.promotionCampaign.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("early-access/:releaseId")
  async checkEarlyAccess(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      select: { id: true, earlyAccessAt: true, releaseDate: true }
    });
    if (!release) throw new BadRequestException("Release not found");

    const now = new Date();
    const isEarlyWindow = Boolean(
      release.earlyAccessAt &&
        release.releaseDate &&
        now >= release.earlyAccessAt &&
        now < release.releaseDate
    );

    if (!isEarlyWindow) return { allowed: true, reason: "public_window" };
    if (!req.user?.userId) return { allowed: false, reason: "login_required" };

    const hasOrder = await this.prisma.orderItem.findFirst({
      where: {
        releaseId,
        order: { userId: req.user.userId, status: "completed" }
      },
      select: { id: true }
    });

    return {
      allowed: Boolean(hasOrder),
      reason: hasOrder ? "entitled" : "early_access_locked"
    };
  }

  @Post("ai-tagging/:releaseId")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async requestAiTagging(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    return this.prisma.aiTaggingJob.create({
      data: {
        releaseId,
        requestedBy: req.user!.userId,
        status: "QUEUED"
      }
    });
  }

  @Get("dj-mode/:releaseId")
  async djModeMetadata(@Param("releaseId") releaseId: string) {
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        title: true,
        bpm: true,
        genre: true,
        mood: true,
        energy: true,
        waveformPath: true
      }
    });
    if (!release) throw new BadRequestException("Release not found");
    return release;
  }

  @Post("watermark/:releaseId/issue")
  @Roles(UserRole.ADMIN, UserRole.ARTIST)
  async issueWatermark(
    @Param("releaseId") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const fingerprintHash = createHash("sha256")
      .update(`${releaseId}:${req.user!.userId}:${Date.now()}:${randomBytes(8).toString("hex")}`)
      .digest("hex");

    return this.prisma.leakFingerprint.create({
      data: {
        releaseId,
        userId: req.user!.userId,
        fingerprintHash,
        watermarkRef: `wm_${fingerprintHash.slice(0, 14)}`
      }
    });
  }
}
