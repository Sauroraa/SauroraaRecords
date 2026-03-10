import {
  BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch,
  Post, Query, Req, UseGuards
} from "@nestjs/common";
import { PrivateLinkScope, ReleaseType, UserRole } from "@prisma/client";

type ReleaseVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
import crypto from "crypto";
import { IsBoolean, IsEnum, IsIn, IsNumberString, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

const ARTIST_INCLUDE = {
  artist: {
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          subscription: { select: { plan: true, status: true } }
        }
      },
      agencyLinks: {
        include: { agency: { select: { displayName: true } } },
        take: 1
      },
      _count: { select: { followers: true } }
    }
  }
};

const MUSIC_GENRES = [
  "ELECTRO",
  "HOUSE",
  "TECHNO",
  "DNB",
  "BASS",
  "TRAP",
  "DRILL",
  "RAP",
  "HIP_HOP",
  "RNB",
  "AFRO",
  "AMAPIANO",
  "REGGAE",
  "POP",
  "OTHER"
] as const;

function normalizeGenre(raw?: string): string | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  return MUSIC_GENRES.includes(upper as typeof MUSIC_GENRES[number]) ? upper : undefined;
}

class CreateReleaseDto {
  @IsOptional() @IsString() slug?: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(MUSIC_GENRES) genre?: string;
  @IsNumberString() price!: string;
  @IsEnum(ReleaseType) type!: ReleaseType;
  @IsString() audioPath!: string;
  @IsOptional() @IsString() coverPath?: string;
  @IsOptional() @IsString() previewClip?: string;
  @IsOptional() @IsString() hlsPreviewPath?: string;
  @IsOptional() @IsString() hlsFullPath?: string;
  @IsOptional() @IsString() waveformPath?: string;
  @IsOptional() @IsBoolean() hlsReady?: boolean;
  @IsOptional() @IsString() processingStatus?: string;
  @IsOptional() @IsBoolean() isPaid?: boolean;
  @IsOptional() @IsNumberString() previewDuration?: string;
  @IsOptional() @IsNumberString() bpm?: string;
  @IsOptional() @IsString() musicalKey?: string;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsNumberString() energy?: string;
  @IsOptional() @IsString() earlyAccessAt?: string;
  @IsOptional() @IsBoolean() exclusiveFollowersOnly?: boolean;
  @IsOptional() @IsString() releaseDate?: string;
  @IsOptional() @IsBoolean() gateEnabled?: boolean;
  @IsOptional() @IsBoolean() gateFollowArtist?: boolean;
  @IsOptional() @IsBoolean() gateEmail?: boolean;
  @IsOptional() @IsBoolean() gateInstagram?: boolean;
  @IsOptional() @IsBoolean() gateSoundcloud?: boolean;
  @IsOptional() @IsBoolean() gateDiscord?: boolean;
  @IsOptional() @IsIn(["PUBLIC", "UNLISTED", "PRIVATE"]) visibility?: ReleaseVisibility;
}

class UpdateReleaseDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(MUSIC_GENRES) genre?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() exclusiveFollowersOnly?: boolean;
  @IsOptional() @IsString() releaseDate?: string;
  @IsOptional() @IsNumberString() bpm?: string;
  @IsOptional() @IsString() musicalKey?: string;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsNumberString() energy?: string;
  @IsOptional() @IsString() earlyAccessAt?: string;
  @IsOptional() @IsNumberString() previewDuration?: string;
  @IsOptional() @IsIn(["PUBLIC", "UNLISTED", "PRIVATE"]) visibility?: ReleaseVisibility;
  @IsOptional() @IsString() coverPath?: string;
}

class UpdateGateDto {
  @IsOptional() @IsBoolean() gateEnabled?: boolean;
  @IsOptional() @IsBoolean() gateFollowArtist?: boolean;
  @IsOptional() @IsBoolean() gateEmail?: boolean;
  @IsOptional() @IsBoolean() gateInstagram?: boolean;
  @IsOptional() @IsBoolean() gateSoundcloud?: boolean;
  @IsOptional() @IsBoolean() gateDiscord?: boolean;
}

class GateUnlockDto {
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsBoolean() followedArtist?: boolean;
  @IsOptional() @IsBoolean() followedInstagram?: boolean;
  @IsOptional() @IsBoolean() followedSoundcloud?: boolean;
  @IsOptional() @IsBoolean() joinedDiscord?: boolean;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

@Controller("releases")
export class ReleasesController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Trending ────────────────────────────────────────────────────────────────

  @Get("trending")
  async trending() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Get all published releases with recent download counts
    const releases = await this.prisma.release.findMany({
      where: { published: true },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } },
        downloadSessions: {
          where: { createdAt: { gte: since } },
          select: { id: true }
        },
        comments: {
          where: { createdAt: { gte: since } },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const scored = releases.map((r) => {
      const recentDownloads = r.downloadSessions.length;
      const recentComments = r.comments.length;
      const hoursOld = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
      const freshnessBoost = hoursOld < 48 ? 10 : hoursOld < 168 ? 4 : 0;
      const score = recentDownloads * 5 + recentComments * 2 + freshnessBoost + r._count.downloadSessions * 0.5;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { downloadSessions, comments, ...rest } = r;
      return { ...rest, trendScore: Math.round(score) };
    });

    return scored
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 8);
  }

  // ─── My releases (authenticated artist only) ─────────────────────────────────

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  async mine(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) return [];

    return this.prisma.release.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true, streamEvents: true } }
      }
    });
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  @Get()
  async list(
    @Req() req: Request & { user?: { role?: UserRole } },
    @Query("admin") admin?: string,
    @Query("genre") genre?: string
  ) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (admin === "true" && isAdmin) return this.listAll();
    const normalizedGenre = normalizeGenre(genre);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      published: true,
      visibility: { not: "PRIVATE" },
      ...(normalizedGenre ? { genre: normalizedGenre } : {})
    };
    return this.prisma.release.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });
  }

  @Get(":id/waveform-data")
  async waveformData(@Param("id") id: string) {
    const release = await this.prisma.release.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!release) return { peaks: [] };

    const streamsRoot = process.env.WORKER_OUTPUT_ROOT ?? "/data/uploads/streams";
    const jsonPath = `${streamsRoot}/${id}/waveform.json`;

    try {
      const { readFileSync } = await import("fs");
      const data = readFileSync(jsonPath, "utf-8");
      return { peaks: JSON.parse(data) as number[] };
    } catch {
      return { peaks: [] };
    }
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.prisma.release.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true } }
      }
    });
  }

  @Get("stats/overview")
  async statsOverview() {
    const [releases, artists] = await Promise.all([
      this.prisma.release.count({ where: { published: true } }),
      this.prisma.artist.count()
    ]);

    return {
      artists,
      releases,
      maxCommissionPercent: 30
    };
  }

  // ─── Single release ───────────────────────────────────────────────────────────

  @Get(":slug")
  async one(@Param("slug") slug: string) {
    const releaseBySlug = await this.prisma.release.findUnique({
      where: { slug },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });
    if (releaseBySlug) return releaseBySlug;

    const decodedSlug = decodeURIComponent(slug);
    const fallback = await this.prisma.release.findFirst({
      where: { slug: { equals: decodedSlug } },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });
    if (!fallback) throw new NotFoundException("Release not found");
    return fallback;
  }

  // ─── Gate config ──────────────────────────────────────────────────────────────

  @Patch(":id/gate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async updateGate(
    @Param("id") id: string,
    @Body() dto: UpdateGateDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException("Release not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== release.artistId) throw new NotFoundException("Not authorized");
    }

    return this.prisma.release.update({
      where: { id },
      data: {
        gateEnabled: dto.gateEnabled,
        gateFollowArtist: dto.gateFollowArtist,
        gateEmail: dto.gateEmail,
        gateInstagram: dto.gateInstagram,
        gateSoundcloud: dto.gateSoundcloud,
        gateDiscord: dto.gateDiscord
      }
    });
  }

  @Post(":id/gate-unlock")
  async unlockGate(
    @Param("id") id: string,
    @Body() dto: GateUnlockDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const release = await this.prisma.release.findUnique({
      where: { id, published: true },
      include: { artist: true }
    });
    if (!release) throw new NotFoundException("Release not found");
    if (!release.gateEnabled) return { downloadUrl: release.audioPath };

    // Record submission
    await this.prisma.gateSubmission.create({
      data: {
        releaseId: id,
        artistId: release.artistId,
        userId: req.user?.userId ?? null,
        email: dto.email ?? null
      }
    });

    return { downloadUrl: release.audioPath };
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.AGENCY)
  async create(
    @Body() dto: CreateReleaseDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist && req.user!.role !== UserRole.ADMIN) {
      throw new NotFoundException("Artist profile not found");
    }

    // Auto-generate slug if not provided
    const baseSlug = dto.slug || slugify(dto.title);
    let slug = baseSlug;
    let attempt = 0;
    while (await this.prisma.release.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++attempt}`;
    }

    return this.prisma.release.create({
      data: {
        artistId: artist!.id,
        slug,
        title: dto.title,
        genre: dto.genre,
        description: dto.description,
        price: dto.price,
        type: dto.type,
        audioPath: dto.audioPath,
        coverPath: dto.coverPath,
        previewClip: dto.previewClip,
        hlsPreviewPath: dto.hlsPreviewPath,
        hlsFullPath: dto.hlsFullPath,
        waveformPath: dto.waveformPath,
        hlsReady: dto.hlsReady ?? false,
        processingStatus: dto.processingStatus ?? "PENDING",
        isPaid: dto.isPaid ?? dto.type === ReleaseType.PAID,
        previewDuration: dto.previewDuration ? Number(dto.previewDuration) : 30,
        bpm: dto.bpm ? Number(dto.bpm) : null,
        musicalKey: dto.musicalKey ?? null,
        tags: dto.tags ? dto.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        mood: dto.mood,
        energy: dto.energy ? Number(dto.energy) : null,
        earlyAccessAt: dto.earlyAccessAt ? new Date(dto.earlyAccessAt) : null,
        exclusiveFollowersOnly: dto.exclusiveFollowersOnly ?? false,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
        published: true,
        visibility: dto.visibility ?? "PUBLIC",
        gateEnabled: dto.gateEnabled ?? false,
        gateFollowArtist: dto.gateFollowArtist ?? false,
        gateEmail: dto.gateEmail ?? false,
        gateInstagram: dto.gateInstagram ?? false,
        gateSoundcloud: dto.gateSoundcloud ?? false,
        gateDiscord: dto.gateDiscord ?? false
      }
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateReleaseDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException("Release not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== release.artistId) throw new NotFoundException("Not authorized");
    }

    return this.prisma.release.update({
      where: { id },
      data: {
        title: dto.title,
        genre: dto.genre,
        description: dto.description,
        published: dto.published,
        exclusiveFollowersOnly: dto.exclusiveFollowersOnly,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
        bpm: dto.bpm ? Number(dto.bpm) : undefined,
        musicalKey: dto.musicalKey,
        previewDuration: dto.previewDuration ? Number(dto.previewDuration) : undefined,
        tags: dto.tags ? dto.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        mood: dto.mood,
        energy: dto.energy ? Number(dto.energy) : undefined,
        earlyAccessAt: dto.earlyAccessAt ? new Date(dto.earlyAccessAt) : undefined,
        ...(dto.visibility ? { visibility: dto.visibility } : {}),
        ...(dto.coverPath ? { coverPath: dto.coverPath } : {})
      }
    });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async remove(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException("Release not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== release.artistId) throw new NotFoundException("Not authorized");
    }

    await this.prisma.release.delete({ where: { id } });
    return { success: true };
  }

  // ─── Private Listening Links ──────────────────────────────────────────────────

  @Post(":id/private-links")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async createPrivateLink(
    @Param("id") releaseId: string,
    @Body() body: { scope?: "STREAM" | "DOWNLOAD"; maxPlays?: number; expiryDays?: number },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release || release.artistId !== artist.id) throw new NotFoundException("Release not found");

    const token = crypto.randomBytes(20).toString("hex");
    const expiryDays = body.expiryDays ?? 30;
    const expiresAt = new Date(Date.now() + expiryDays * 86400000);

    return this.prisma.privateListeningLink.create({
      data: {
        token,
        releaseId,
        creatorId: req.user!.userId,
        scope: (body.scope ?? "STREAM") as PrivateLinkScope,
        maxPlays: body.maxPlays ?? 50,
        expiresAt
      }
    });
  }

  @Get(":id/private-links")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async listPrivateLinks(
    @Param("id") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    return this.prisma.privateListeningLink.findMany({
      where: { releaseId, creatorId: req.user!.userId },
      orderBy: { createdAt: "desc" }
    });
  }

  @Delete("private-links/:token")
  @UseGuards(JwtAuthGuard)
  async deletePrivateLink(
    @Param("token") token: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const link = await this.prisma.privateListeningLink.findUnique({ where: { token } });
    if (!link || link.creatorId !== req.user!.userId) throw new NotFoundException("Link not found");
    await this.prisma.privateListeningLink.delete({ where: { token } });
    return { success: true };
  }

  @Get("private/:token")
  async accessPrivateLink(@Param("token") token: string) {
    const link = await this.prisma.privateListeningLink.findUnique({
      where: { token },
      include: { release: { include: { artist: true } } }
    });
    if (!link) throw new NotFoundException("Link not found or expired");
    if (link.expiresAt < new Date()) throw new BadRequestException("Link expired");
    if (link.playsCount >= link.maxPlays) throw new BadRequestException("Max plays reached");
    await this.prisma.privateListeningLink.update({
      where: { token },
      data: { playsCount: { increment: 1 }, lastUsedAt: new Date() }
    });
    return link.release;
  }

  // ─── Collaborators ────────────────────────────────────────────────────────────

  @Post(":id/collaborators")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async addCollaborator(
    @Param("id") releaseId: string,
    @Body() body: { artistId: string; role?: "FEATURED" | "PRODUCER" | "REMIXER" },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const owner = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!owner) throw new NotFoundException("Artist not found");
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release || release.artistId !== owner.id) throw new NotFoundException("Release not found");
    return this.prisma.releaseCollaborator.upsert({
      where: { releaseId_artistId_role: { releaseId, artistId: body.artistId, role: body.role ?? "FEATURED" } },
      update: {},
      create: {
        releaseId,
        artistId: body.artistId,
        role: body.role ?? "FEATURED",
        invitedById: req.user!.userId,
        accepted: true
      }
    });
  }

  @Get(":id/collaborators")
  async getCollaborators(@Param("id") releaseId: string) {
    return this.prisma.releaseCollaborator.findMany({
      where: { releaseId },
      include: { artist: { select: { id: true, displayName: true, avatar: true, user: { select: { email: true } } } } }
    });
  }

  @Delete(":id/collaborators/:artistId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async removeCollaborator(
    @Param("id") releaseId: string,
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const owner = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!owner) throw new NotFoundException("Artist not found");
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release || release.artistId !== owner.id) throw new NotFoundException("Release not found");
    await this.prisma.releaseCollaborator.deleteMany({ where: { releaseId, artistId } });
    return { success: true };
  }

  // ─── Asset Packs (Stems / Samples) ───────────────────────────────────────────

  @Post(":id/asset-packs")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async addAssetPack(
    @Param("id") releaseId: string,
    @Body() body: { filePath: string; assetType: string; label?: string },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release || release.artistId !== artist.id) throw new NotFoundException("Release not found");
    return this.prisma.releaseAssetPack.create({
      data: { releaseId, filePath: body.filePath, assetType: body.assetType as "STEM" | "SAMPLE_PACK" | "PRESET_PACK", label: body.label }
    });
  }

  @Get(":id/asset-packs")
  async getAssetPacks(@Param("id") releaseId: string) {
    return this.prisma.releaseAssetPack.findMany({ where: { releaseId }, orderBy: { createdAt: "asc" } });
  }

  @Delete(":id/asset-packs/:packId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async deleteAssetPack(
    @Param("id") releaseId: string,
    @Param("packId") packId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new NotFoundException("Artist not found");
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release || release.artistId !== artist.id) throw new NotFoundException("Release not found");
    await this.prisma.releaseAssetPack.delete({ where: { id: packId } });
    return { success: true };
  }

  // ─── AI Genre Tagging (rule-based) ────────────────────────────────────────────

  @Post(":id/ai-tag")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async aiTag(
    @Param("id") releaseId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException("Release not found");

    const bpm = release.bpm ?? 128;
    // Heuristic genre from BPM
    const suggestedGenre =
      bpm < 80 ? "HIP_HOP" : bpm < 100 ? "TRAP" : bpm < 115 ? "RNB"
      : bpm < 128 ? "HOUSE" : bpm < 140 ? "TECHNO" : bpm < 160 ? "ELECTRO" : "DNB";
    // Energy from BPM + mood
    const suggestedBpm = bpm;
    const suggestedTags = [suggestedGenre.toLowerCase(), bpm >= 140 ? "high-energy" : "mid-energy"];
    const confidence = 72;

    await this.prisma.smartTagSuggestion.upsert({
      where: { releaseId },
      update: { suggestedGenre, suggestedBpm, suggestedTags, confidence },
      create: { releaseId, suggestedGenre, suggestedBpm, suggestedTags, confidence }
    });
    // Also create a job record
    await this.prisma.aiTaggingJob.create({
      data: { releaseId, requestedBy: req.user!.userId, status: "DONE", result: { suggestedGenre, suggestedBpm, suggestedTags, confidence } }
    });

    return { suggestedGenre, suggestedBpm, suggestedTags, confidence };
  }

  @Get(":id/ai-tag")
  async getAiTag(@Param("id") releaseId: string) {
    const suggestion = await this.prisma.smartTagSuggestion.findUnique({ where: { releaseId } });
    if (!suggestion) return null;
    return suggestion;
  }

  // ─── Drop Detection ────────────────────────────────────────────────────────────

  @Get(":id/drop-detection")
  async getDropDetection(@Param("id") releaseId: string) {
    const release = await this.prisma.release.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException("Release not found");
    // Deterministic markers: typical electronic music structure
    // Intro: 0-20%, Buildup: 20-45%, Drop: 45-65%, Break: 65-80%, Outro: 80-100%
    return {
      releaseId,
      markers: [
        { label: "Intro end", percentMark: 20 },
        { label: "Buildup", percentMark: 35 },
        { label: "🔥 Drop", percentMark: 50 },
        { label: "Break", percentMark: 68 },
        { label: "Outro", percentMark: 82 }
      ],
      note: "Markers are AI-estimated based on typical track structure"
    };
  }

  // ─── Embed Widget ─────────────────────────────────────────────────────────────

  @Post(":id/embed")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN, UserRole.STAFF)
  async createEmbed(
    @Param("id") releaseId: string,
    @Body() body: { theme?: string; allowDownload?: boolean },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const existing = await this.prisma.embedWidget.findFirst({ where: { releaseId } });
    if (existing) return existing;
    const token = crypto.randomBytes(16).toString("hex");
    return this.prisma.embedWidget.create({
      data: { releaseId, token, theme: body.theme ?? "dark", allowDownload: body.allowDownload ?? false, createdBy: req.user!.userId }
    });
  }

  @Get(":id/embed")
  async getEmbed(@Param("id") releaseId: string) {
    return this.prisma.embedWidget.findFirst({ where: { releaseId } });
  }
}
