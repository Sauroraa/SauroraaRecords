import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { StreamScope } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { Request } from "express";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class TrackViewDto {
  @IsString()
  releaseId!: string;

  @IsOptional()
  @IsEnum(StreamScope)
  scope?: StreamScope;

  @IsOptional()
  @IsString()
  playlistPath?: string;
}

class ShareDto {
  @IsString()
  releaseId!: string;

  @IsOptional()
  @IsString()
  message?: string;
}

@Controller("engagement")
export class EngagementController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  @Post("view")
  async createView(@Body() dto: TrackViewDto, @Req() req: Request) {
    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
      select: { id: true, artistId: true }
    });
    if (!release) throw new BadRequestException("Release not found");

    const userId = this.extractUserId(req);
    const xff = req.headers["x-forwarded-for"];
    const forwarded = Array.isArray(xff) ? xff[0] : xff;
    const ipAddress = forwarded?.split(",")[0]?.trim() || req.ip || null;
    const ua = req.headers["user-agent"];
    const userAgent = typeof ua === "string" ? ua : null;

    await this.prisma.streamEvent.create({
      data: {
        userId,
        releaseId: dto.releaseId,
        scope: dto.scope ?? StreamScope.PREVIEW,
        playlistPath: dto.playlistPath ?? `/release/${dto.releaseId}`,
        ipAddress,
        userAgent
      }
    });

    if (userId) {
      await this.prisma.fanScore.upsert({
        where: {
          userId_artistId: {
            userId,
            artistId: release.artistId
          }
        },
        create: {
          userId,
          artistId: release.artistId,
          streams: 1,
          score: 1
        },
        update: {
          streams: { increment: 1 },
          score: { increment: 1 }
        }
      });
    }

    return { success: true };
  }

  @Post("share")
  @UseGuards(JwtAuthGuard)
  async share(
    @Body() dto: ShareDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException("Login required");

    const release = await this.prisma.release.findUnique({
      where: { id: dto.releaseId },
      select: { id: true, artistId: true }
    });
    if (!release) throw new BadRequestException("Release not found");

    const repost = await this.prisma.repost.upsert({
      where: {
        userId_releaseId: {
          userId,
          releaseId: dto.releaseId
        }
      },
      create: {
        userId,
        releaseId: dto.releaseId,
        message: dto.message
      },
      update: { message: dto.message }
    });

    await this.prisma.fanScore.upsert({
      where: {
        userId_artistId: {
          userId,
          artistId: release.artistId
        }
      },
      create: {
        userId,
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

  @Get("release/:releaseId/summary")
  async summary(@Param("releaseId") releaseId: string) {
    const [views, comments, shares, uniqueListeners] = await Promise.all([
      this.prisma.streamEvent.count({ where: { releaseId } }),
      this.prisma.comment.count({ where: { releaseId } }),
      this.prisma.repost.count({ where: { releaseId } }),
      this.prisma.streamEvent.groupBy({
        by: ["userId"],
        where: { releaseId, userId: { not: null } }
      })
    ]);

    return {
      releaseId,
      views,
      comments,
      shares,
      uniqueListeners: uniqueListeners.length
    };
  }

  // ─── Listening Heatmap ────────────────────────────────────────────────────────

  @Post("heatmap/:releaseId")
  async recordHeatmap(
    @Param("releaseId") releaseId: string,
    @Body() body: { secondMark: number }
  ) {
    if (typeof body.secondMark !== "number" || body.secondMark < 0) return { skip: true };
    await this.prisma.listeningHeatmap.upsert({
      where: { releaseId_secondMark: { releaseId, secondMark: Math.floor(body.secondMark) } },
      update: { listeners: { increment: 1 } },
      create: { releaseId, secondMark: Math.floor(body.secondMark), listeners: 1 }
    });
    return { success: true };
  }

  @Get("heatmap/:releaseId")
  async getHeatmap(@Param("releaseId") releaseId: string) {
    const data = await this.prisma.listeningHeatmap.findMany({
      where: { releaseId },
      orderBy: { secondMark: "asc" }
    });
    return data;
  }

  // ─── Fan Leaderboard ──────────────────────────────────────────────────────────

  @Get("fans/:artistId/leaderboard")
  async fanLeaderboard(@Param("artistId") artistId: string) {
    return this.prisma.fanScore.findMany({
      where: { artistId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { score: "desc" },
      take: 20
    });
  }

  private extractUserId(req: Request): string | null {
    const auth = req.headers.authorization;
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.access_token;
    const token = bearer || cookieToken;
    if (!token) return null;

    try {
      const payload = this.jwtService.verify<{ sub?: string }>(token, {
        secret: process.env.JWT_SECRET || "change_me_jwt"
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
