import { Body, Controller, Get, NotFoundException, Param, Patch, Put, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class UpdateArtistDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() avatar?: string;
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
  user: { select: { email: true, firstName: true, lastName: true } },
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
        _count: { select: { downloadSessions: true, comments: true } }
      }
    });

    const totalViews = tracks.reduce((sum, track) => sum + track._count.downloadSessions, 0);

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
        views: track._count.downloadSessions,
        comments: track._count.comments
      }))
    };
  }

  @Get(":id")
  async one(@Param("id") id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
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
    return this.prisma.artist.upsert({
      where: { userId: req.user!.userId },
      create: { userId: req.user!.userId, ...dto },
      update: dto,
      include: ARTIST_FULL_INCLUDE
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateArtistDto) {
    return this.prisma.artist.update({ where: { id }, data: dto });
  }
}
