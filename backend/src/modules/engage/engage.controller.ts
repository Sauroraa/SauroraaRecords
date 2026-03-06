import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { EngageActionType, EngageCampaignStatus, UserRole } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { Response, Request } from "express";
import { createHash, randomBytes } from "crypto";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma.service";

class CampaignActionDto {
  @IsEnum(EngageActionType)
  actionType!: EngageActionType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  position?: number;

  @IsOptional()
  @IsString()
  label?: string;
}

class CreateCampaignDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  downloadPath?: string;

  @IsOptional()
  @IsString()
  soundcloudArtistId?: string;

  @IsOptional()
  @IsString()
  soundcloudTrackId?: string;

  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @IsOptional()
  @IsString()
  discordServerId?: string;

  @IsOptional()
  @IsString()
  discordInviteUrl?: string;

  @IsOptional()
  @IsString()
  newsletterTag?: string;

  @IsOptional()
  @IsString()
  releaseCountdown?: string;

  @IsOptional()
  @IsString()
  pixelFacebookId?: string;

  @IsOptional()
  @IsString()
  pixelGoogleId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignActionDto)
  actions?: CampaignActionDto[];
}

class StartSessionDto {
  @IsOptional()
  @IsString()
  email?: string;
}

class CompleteActionDto {
  @IsString()
  actionId!: string;
}

@Controller("engage")
export class EngageController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Artist: create campaign ────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) throw new UnauthorizedException("Artist profile required");

    const campaign = await this.prisma.engageCampaign.create({
      data: {
        artistId: artist.id,
        releaseId: dto.releaseId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        downloadPath: dto.downloadPath ?? null,
        soundcloudArtistId: dto.soundcloudArtistId ?? null,
        soundcloudTrackId: dto.soundcloudTrackId ?? null,
        instagramHandle: dto.instagramHandle ?? null,
        discordServerId: dto.discordServerId ?? null,
        discordInviteUrl: dto.discordInviteUrl ?? null,
        newsletterTag: dto.newsletterTag ?? null,
        releaseCountdown: dto.releaseCountdown ? new Date(dto.releaseCountdown) : null,
        pixelFacebookId: dto.pixelFacebookId ?? null,
        pixelGoogleId: dto.pixelGoogleId ?? null,
        actions: dto.actions?.length
          ? {
              create: dto.actions.map((a, idx) => ({
                actionType: a.actionType,
                required: a.required ?? true,
                position: a.position ?? idx,
                label: a.label ?? null
              }))
            }
          : undefined
      },
      include: { actions: { orderBy: { position: "asc" } } }
    });

    return campaign;
  }

  // ── Artist: list my campaigns ──────────────────────────────────────────────

  @Get("me/campaigns")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async myCampaigns(@Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) return [];

    return this.prisma.engageCampaign.findMany({
      where: { artistId: artist.id },
      include: {
        actions: { orderBy: { position: "asc" } },
        _count: { select: { sessions: true, subscribers: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  // ── Artist: update campaign ────────────────────────────────────────────────

  @Patch("me/campaigns/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async updateCampaign(
    @Param("id") id: string,
    @Body() dto: Partial<CreateCampaignDto> & { status?: EngageCampaignStatus },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) throw new UnauthorizedException("Artist profile required");

    const campaign = await this.prisma.engageCampaign.findFirst({
      where: { id, artistId: artist.id }
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    const updated = await this.prisma.engageCampaign.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        status: dto.status ?? undefined,
        downloadPath: dto.downloadPath ?? undefined,
        soundcloudArtistId: dto.soundcloudArtistId ?? undefined,
        soundcloudTrackId: dto.soundcloudTrackId ?? undefined,
        instagramHandle: dto.instagramHandle ?? undefined,
        discordServerId: dto.discordServerId ?? undefined,
        discordInviteUrl: dto.discordInviteUrl ?? undefined,
        newsletterTag: dto.newsletterTag ?? undefined,
        releaseCountdown: dto.releaseCountdown ? new Date(dto.releaseCountdown) : undefined,
        pixelFacebookId: dto.pixelFacebookId ?? undefined,
        pixelGoogleId: dto.pixelGoogleId ?? undefined
      },
      include: { actions: { orderBy: { position: "asc" } } }
    });

    return updated;
  }

  // ── Artist: delete campaign ────────────────────────────────────────────────

  @Delete("me/campaigns/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async deleteCampaign(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) throw new UnauthorizedException("Artist profile required");

    const campaign = await this.prisma.engageCampaign.findFirst({
      where: { id, artistId: artist.id }
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    await this.prisma.engageCampaign.delete({ where: { id } });
    return { success: true };
  }

  // ── Artist: analytics ─────────────────────────────────────────────────────

  @Get("me/campaigns/:id/analytics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async analytics(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) throw new UnauthorizedException("Artist profile required");

    const campaign = await this.prisma.engageCampaign.findFirst({
      where: { id, artistId: artist.id },
      include: { actions: true }
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    const [totalSessions, completedSessions, subscribers] = await Promise.all([
      this.prisma.engageSession.count({ where: { campaignId: id } }),
      this.prisma.engageSession.count({ where: { campaignId: id, completed: true } }),
      this.prisma.engageNewsletterSubscriber.count({ where: { campaignId: id } })
    ]);

    const actionCompletionCounts = await Promise.all(
      campaign.actions.map(async (action) => {
        const count = await this.prisma.engageActionCompletion.count({
          where: { actionId: action.id }
        });
        return { actionId: action.id, actionType: action.actionType, count };
      })
    );

    const conversionRate =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      campaignId: id,
      totalSessions,
      completedSessions,
      conversionRate,
      subscribers,
      actionBreakdown: actionCompletionCounts
    };
  }

  // ── Artist: export newsletter subscribers ─────────────────────────────────

  @Get("me/campaigns/:id/subscribers/export")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async exportSubscribers(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } },
    @Res() res: Response
  ) {
    const artist = await this.prisma.artist.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!artist) throw new UnauthorizedException("Artist profile required");

    const campaign = await this.prisma.engageCampaign.findFirst({
      where: { id, artistId: artist.id }
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    const subscribers = await this.prisma.engageNewsletterSubscriber.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "asc" }
    });

    const csv = [
      "email,firstName,createdAt",
      ...subscribers.map(
        (s) =>
          `"${s.email}","${s.firstName ?? ""}","${s.createdAt.toISOString()}"`
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="subscribers-${id}.csv"`
    );
    res.send(csv);
  }

  // ── Public: get campaign ───────────────────────────────────────────────────

  @Get(":id")
  async getCampaign(@Param("id") id: string) {
    const campaign = await this.prisma.engageCampaign.findUnique({
      where: { id },
      include: {
        actions: { orderBy: { position: "asc" } },
        release: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverPath: true,
            genre: true,
            previewClip: true,
            hlsPreviewPath: true
          }
        },
        artist: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            soundcloudUrl: true,
            instagramUrl: true,
            discordUrl: true,
            _count: { select: { followers: true } }
          }
        }
      }
    });

    if (!campaign || campaign.status === EngageCampaignStatus.ENDED) {
      throw new NotFoundException("Campaign not found or ended");
    }

    return campaign;
  }

  // ── Public: start a session ───────────────────────────────────────────────

  @Post(":id/session")
  async startSession(
    @Param("id") id: string,
    @Body() dto: StartSessionDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const campaign = await this.prisma.engageCampaign.findUnique({
      where: { id },
      select: { id: true, status: true }
    });
    if (!campaign || campaign.status === EngageCampaignStatus.ENDED) {
      throw new NotFoundException("Campaign not found or ended");
    }

    const xff = req.headers["x-forwarded-for"];
    const forwarded = Array.isArray(xff) ? xff[0] : xff;
    const ipAddress = forwarded?.split(",")[0]?.trim() || req.ip || null;
    const ua = req.headers["user-agent"];
    const userAgent = typeof ua === "string" ? ua : null;

    const session = await this.prisma.engageSession.create({
      data: {
        campaignId: id,
        userId: req.user?.userId ?? null,
        email: dto.email ?? null,
        ipAddress,
        userAgent
      }
    });

    return { sessionId: session.id };
  }

  // ── Public: complete an action ────────────────────────────────────────────

  @Post(":id/session/:sessionId/action")
  async completeAction(
    @Param("id") campaignId: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: CompleteActionDto
  ) {
    const session = await this.prisma.engageSession.findFirst({
      where: { id: sessionId, campaignId }
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.completed) return { alreadyCompleted: true };

    const action = await this.prisma.engageCampaignAction.findFirst({
      where: { id: dto.actionId, campaignId }
    });
    if (!action) throw new BadRequestException("Action not found");

    await this.prisma.engageActionCompletion.upsert({
      where: { sessionId_actionId: { sessionId, actionId: dto.actionId } },
      create: { sessionId, actionId: dto.actionId },
      update: { completedAt: new Date() }
    });

    // Check if all required actions are completed
    const allActions = await this.prisma.engageCampaignAction.findMany({
      where: { campaignId, required: true }
    });
    const completedRequired = await this.prisma.engageActionCompletion.count({
      where: {
        sessionId,
        actionId: { in: allActions.map((a) => a.id) }
      }
    });

    const allDone = completedRequired >= allActions.length;

    if (allDone && !session.completed) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await this.prisma.engageSession.update({
        where: { id: sessionId },
        data: { completed: true, downloadToken: token, tokenExpiresAt: expires }
      });

      // If session has email, save newsletter subscriber
      if (session.email) {
        const campaign = await this.prisma.engageCampaign.findUnique({
          where: { id: campaignId },
          select: { artistId: true }
        });
        if (campaign) {
          await this.prisma.engageNewsletterSubscriber.upsert({
            where: { campaignId_email: { campaignId, email: session.email } },
            create: { campaignId, artistId: campaign.artistId, email: session.email },
            update: {}
          });
        }
      }

      return { allDone: true, downloadToken: token };
    }

    return { allDone, completedRequired, total: allActions.length };
  }

  // ── Public: verify session & get download token ───────────────────────────

  @Get(":id/session/:sessionId/status")
  async sessionStatus(
    @Param("id") campaignId: string,
    @Param("sessionId") sessionId: string
  ) {
    const session = await this.prisma.engageSession.findFirst({
      where: { id: sessionId, campaignId },
      include: {
        completions: { include: { action: true } }
      }
    });
    if (!session) throw new NotFoundException("Session not found");

    return {
      completed: session.completed,
      downloadToken: session.completed ? session.downloadToken : null,
      tokenExpiresAt: session.tokenExpiresAt,
      completions: session.completions.map((c) => c.actionId)
    };
  }

  // ── Public: download with token ───────────────────────────────────────────

  @Get("download/:token")
  async downloadWithToken(
    @Param("token") token: string,
    @Res() res: Response
  ) {
    const session = await this.prisma.engageSession.findFirst({
      where: { downloadToken: token },
      include: {
        campaign: { select: { downloadPath: true, releaseId: true, title: true } }
      }
    });

    if (!session) throw new NotFoundException("Invalid download token");
    if (!session.tokenExpiresAt || session.tokenExpiresAt < new Date()) {
      throw new BadRequestException("Download token expired");
    }

    // Invalidate token after use
    await this.prisma.engageSession.update({
      where: { id: session.id },
      data: { downloadToken: null, tokenExpiresAt: null }
    });

    const downloadPath = session.campaign.downloadPath;
    if (!downloadPath) {
      throw new BadRequestException("No download file configured for this campaign");
    }

    // Redirect to the actual file
    res.redirect(`/uploads/${downloadPath.replace(/^\/?(uploads\/)?/, "")}`);
  }
}
