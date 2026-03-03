import {
  Body, Controller, Delete, Get, NotFoundException, Param, Patch,
  Post, Query, Req, UseGuards
} from "@nestjs/common";
import { ReleaseType, UserRole } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

const ARTIST_INCLUDE = {
  artist: {
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      agencyLinks: {
        include: { agency: { select: { displayName: true } } },
        take: 1
      },
      _count: { select: { followers: true } }
    }
  }
};

class CreateReleaseDto {
  @IsOptional() @IsString() slug?: string;
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumberString() price!: string;
  @IsEnum(ReleaseType) type!: ReleaseType;
  @IsString() audioPath!: string;
  @IsOptional() @IsString() coverPath?: string;
  @IsOptional() @IsString() previewClip?: string;
  @IsOptional() @IsBoolean() exclusiveFollowersOnly?: boolean;
  @IsOptional() @IsString() releaseDate?: string;
}

class UpdateReleaseDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsBoolean() exclusiveFollowersOnly?: boolean;
  @IsOptional() @IsString() releaseDate?: string;
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

  // ─── List ────────────────────────────────────────────────────────────────────

  @Get()
  async list(@Req() req: Request & { user?: { role?: UserRole } }, @Query("admin") admin?: string) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (admin === "true" && isAdmin) return this.listAll();

    return this.prisma.release.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });
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

  // ─── Single release ───────────────────────────────────────────────────────────

  @Get(":slug")
  async one(@Param("slug") slug: string) {
    const release = await this.prisma.release.findUnique({
      where: { slug },
      include: {
        ...ARTIST_INCLUDE,
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });
    if (!release) throw new NotFoundException("Release not found");
    return release;
  }

  // ─── Gate config ──────────────────────────────────────────────────────────────

  @Patch(":id/gate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
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
        description: dto.description,
        price: dto.price,
        type: dto.type,
        audioPath: dto.audioPath,
        coverPath: dto.coverPath,
        previewClip: dto.previewClip,
        exclusiveFollowersOnly: dto.exclusiveFollowersOnly ?? false,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined
      }
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
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
        description: dto.description,
        published: dto.published,
        exclusiveFollowersOnly: dto.exclusiveFollowersOnly,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined
      }
    });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
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
}
