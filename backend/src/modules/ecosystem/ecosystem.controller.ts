import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import {
  ExportFormat,
  ModerationActionType,
  PayoutProvider,
  PrivateLinkScope,
  ReportTargetType,
  UserRole
} from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class DmcaDto {
  @IsString()
  releaseId!: string;
  @IsString()
  claimantName!: string;
  @IsString()
  claimantEmail!: string;
  @IsString()
  description!: string;
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

class ReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;
  @IsOptional()
  @IsString()
  releaseId?: string;
  @IsOptional()
  @IsString()
  commentId?: string;
  @IsOptional()
  @IsString()
  reportedUserId?: string;
  @IsString()
  reason!: string;
  @IsOptional()
  @IsString()
  details?: string;
}

class ModerationActionDto {
  @IsEnum(ModerationActionType)
  actionType!: ModerationActionType;
  @IsOptional()
  @IsString()
  note?: string;
}

class PremiereDto {
  @IsString()
  releaseId!: string;
  @IsDateString()
  startsAt!: string;
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

class BroadcastDto {
  @IsString()
  title!: string;
  @IsString()
  body!: string;
}

class PayoutAccountDto {
  @IsEnum(PayoutProvider)
  provider!: PayoutProvider;
  @IsString()
  accountRef!: string;
}

class ExportDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;
  @IsDateString()
  periodFrom!: string;
  @IsDateString()
  periodTo!: string;
}

class HeatmapEventDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  secondMark!: number;
}

class PackDto {
  @IsString()
  releaseId!: string;
  @IsString()
  filePath!: string;
  @IsString()
  assetType!: "STEM" | "SAMPLE_PACK" | "PRESET_PACK";
  @IsOptional()
  @IsString()
  label?: string;
}

class VersionDto {
  @IsString()
  versionLabel!: string;
  @IsString()
  audioPath!: string;
  @IsOptional()
  @IsString()
  changelog?: string;
}

class PushDto {
  @IsString()
  endpoint!: string;
  @IsString()
  p256dh!: string;
  @IsString()
  auth!: string;
  @IsOptional()
  @IsString()
  platform?: string;
  @IsOptional()
  @IsString()
  locale?: string;
}

@Controller("ecosystem")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EcosystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("dmca/claims")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async createDmca(@Body() dto: DmcaDto, @Req() req: Request & { user?: { userId: string } }) {
    const claim = await this.prisma.dmcaClaim.create({
      data: {
        releaseId: dto.releaseId,
        reporterId: req.user!.userId,
        claimantName: dto.claimantName,
        claimantEmail: dto.claimantEmail,
        description: dto.description,
        evidenceUrl: dto.evidenceUrl
      }
    });

    await this.prisma.release.update({
      where: { id: dto.releaseId },
      data: { published: false, processingStatus: "DMCA_HOLD" }
    });

    return claim;
  }

  @Post("reports")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async createReport(@Body() dto: ReportDto, @Req() req: Request & { user?: { userId: string } }) {
    const botScore = this.computeBotScore(dto.reason, dto.details);
    return this.prisma.contentReport.create({
      data: {
        reporterId: req.user!.userId,
        targetType: dto.targetType,
        releaseId: dto.releaseId,
        commentId: dto.commentId,
        reportedUserId: dto.reportedUserId,
        reason: dto.reason,
        details: dto.details,
        botScore,
        status: botScore >= 70 ? "STAFF_REVIEW" : "BOT_REVIEWED"
      }
    });
  }

  @Get("moderation/reports")
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  async listReports(@Query("status") status?: string) {
    return this.prisma.contentReport.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: [{ botScore: "desc" }, { createdAt: "desc" }],
      include: {
        reporter: { select: { id: true, email: true } },
        release: { select: { id: true, slug: true, title: true } },
        comment: { select: { id: true, body: true } },
        reportedUser: { select: { id: true, email: true } },
        flags: true
      }
    });
  }

  @Post("moderation/reports/:id/action")
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  async moderationAction(
    @Param("id") id: string,
    @Body() dto: ModerationActionDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const report = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw new BadRequestException("Report not found");

    await this.prisma.moderationAction.create({
      data: {
        reportId: id,
        staffId: req.user!.userId,
        actionType: dto.actionType,
        note: dto.note
      }
    });

    if (dto.actionType === "REMOVE_CONTENT" && report.releaseId) {
      await this.prisma.release.update({
        where: { id: report.releaseId },
        data: { published: false, processingStatus: "MODERATION_REMOVED" }
      });
    }

    if (dto.actionType === "SUSPEND_USER" && report.reportedUserId) {
      await this.prisma.user.update({
        where: { id: report.reportedUserId },
        data: { role: UserRole.CLIENT }
      });
    }

    return this.prisma.contentReport.update({
      where: { id },
      data: { status: "ACTION_TAKEN" }
    });
  }

  @Post("duplicate/scan/:releaseId")
  @Roles(UserRole.STAFF, UserRole.ADMIN, UserRole.ARTIST)
  async duplicateScan(@Param("releaseId") releaseId: string) {
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      select: { id: true, audioPath: true }
    });
    if (!release) throw new BadRequestException("Release not found");

    const hash = this.hashAudioFile(release.audioPath);
    const otherReleases = await this.prisma.release.findMany({
      where: { id: { not: releaseId } },
      select: { id: true, audioPath: true }
    });

    let matchedReleaseId: string | null = null;
    let similarityScore = 0;
    for (const candidate of otherReleases) {
      const candidateHash = this.hashAudioFile(candidate.audioPath);
      const score = this.similarityFromHashes(hash, candidateHash);
      if (score > similarityScore) {
        similarityScore = score;
        matchedReleaseId = candidate.id;
      }
    }

    return this.prisma.duplicateAudioAlert.create({
      data: {
        releaseId,
        matchedReleaseId,
        audioHash: hash,
        similarityScore,
        status: similarityScore >= 95 ? "CONFIRMED" : "NEW"
      }
    });
  }

  @Post("ai/moderate-text")
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  async aiModerate(@Body() body: { text: string; releaseId?: string; reportId?: string }) {
    const text = body.text || "";
    const lowered = text.toLowerCase();
    const spam = /(buy now|free money|click here|discord\.gg)/.test(lowered);
    const abuse = /(hate|racist|kill|terror)/.test(lowered);
    const label = abuse ? "abuse" : spam ? "spam" : "clean";
    const score = abuse ? 95 : spam ? 75 : 10;

    return this.prisma.aiModerationFlag.create({
      data: {
        reportId: body.reportId,
        releaseId: body.releaseId,
        targetType: body.releaseId ? ReportTargetType.RELEASE : ReportTargetType.COMMENT,
        label,
        score,
        textSnippet: text.slice(0, 400)
      }
    });
  }

  @Post("share-cards/:releaseId")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createShareCard(@Param("releaseId") releaseId: string) {
    const cardPath = `/uploads/share-cards/${releaseId}-${Date.now()}.png`;
    return this.prisma.viralShareCard.create({
      data: {
        releaseId,
        imagePath: cardPath
      }
    });
  }

  @Post("premieres")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createPremiere(@Body() dto: PremiereDto, @Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new BadRequestException("Artist profile required");
    return this.prisma.premiereEvent.upsert({
      where: { releaseId: dto.releaseId },
      create: {
        releaseId: dto.releaseId,
        artistId: artist.id,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null
      },
      update: {
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null
      }
    });
  }

  @Post("premieres/:id/chat")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async postPremiereChat(
    @Param("id") id: string,
    @Body() body: { message: string },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    return this.prisma.premiereChatMessage.create({
      data: {
        premiereId: id,
        userId: req.user!.userId,
        body: body.message
      }
    });
  }

  @Post("broadcasts")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createBroadcast(@Body() dto: BroadcastDto, @Req() req: Request & { user?: { userId: string } }) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new BadRequestException("Artist profile required");

    const followers = await this.prisma.follow.findMany({
      where: { artistId: artist.id },
      select: { followerId: true }
    });

    const broadcast = await this.prisma.artistBroadcast.create({
      data: {
        artistId: artist.id,
        title: dto.title,
        body: dto.body
      }
    });

    if (followers.length > 0) {
      await this.prisma.artistBroadcastRecipient.createMany({
        data: followers.map((f) => ({
          broadcastId: broadcast.id,
          userId: f.followerId
        }))
      });
    }
    return broadcast;
  }

  @Get("broadcasts/me")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async myBroadcasts(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.artistBroadcastRecipient.findMany({
      where: { userId: req.user!.userId },
      include: { broadcast: true },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("payout/accounts")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createPayoutAccount(
    @Body() dto: PayoutAccountDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
    if (!artist) throw new BadRequestException("Artist profile required");
    return this.prisma.payoutAccount.upsert({
      where: { artistId: artist.id },
      create: { artistId: artist.id, provider: dto.provider, accountRef: dto.accountRef },
      update: { provider: dto.provider, accountRef: dto.accountRef }
    });
  }

  @Post("payout/run/:invoiceId")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async runPayout(@Param("invoiceId") invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new BadRequestException("Invoice not found");
    const account = await this.prisma.payoutAccount.findUnique({ where: { artistId: invoice.artistId } });
    if (!account) throw new BadRequestException("Payout account missing");

    return this.prisma.payoutTransaction.create({
      data: {
        artistId: invoice.artistId,
        invoiceId: invoice.id,
        provider: account.provider,
        amount: invoice.netAmount,
        currency: invoice.currency,
        status: "PROCESSING",
        providerRef: `payout_${Date.now()}`
      }
    });
  }

  @Post("exports/accounting")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async requestExport(@Body() dto: ExportDto, @Req() req: Request & { user?: { userId: string } }) {
    const exportJob = await this.prisma.accountingExport.create({
      data: {
        requestedBy: req.user!.userId,
        format: dto.format,
        periodFrom: new Date(dto.periodFrom),
        periodTo: new Date(dto.periodTo),
        status: "DONE",
        filePath: `/exports/accounting-${Date.now()}.${dto.format.toLowerCase()}`
      }
    });
    return exportJob;
  }

  @Post("heatmap/:releaseId/events")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async addHeatmapEvent(@Param("releaseId") releaseId: string, @Body() dto: HeatmapEventDto) {
    return this.prisma.listeningHeatmap.upsert({
      where: {
        releaseId_secondMark: {
          releaseId,
          secondMark: dto.secondMark
        }
      },
      create: {
        releaseId,
        secondMark: dto.secondMark,
        listeners: 1
      },
      update: {
        listeners: { increment: 1 }
      }
    });
  }

  @Get("heatmap/:releaseId")
  async getHeatmap(@Param("releaseId") releaseId: string) {
    return this.prisma.listeningHeatmap.findMany({
      where: { releaseId },
      orderBy: { secondMark: "asc" }
    });
  }

  @Post("asset-packs")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createAssetPack(@Body() dto: PackDto) {
    return this.prisma.releaseAssetPack.create({
      data: {
        releaseId: dto.releaseId,
        assetType: dto.assetType,
        filePath: dto.filePath,
        label: dto.label
      }
    });
  }

  @Post("embed/:releaseId")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async createEmbed(
    @Param("releaseId") releaseId: string,
    @Body() body: { theme?: string; allowDownload?: boolean },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const token = randomBytes(24).toString("base64url");
    return this.prisma.embedWidget.create({
      data: {
        releaseId,
        token,
        theme: body.theme,
        allowDownload: Boolean(body.allowDownload),
        createdBy: req.user!.userId
      }
    });
  }

  @Get("embed/:token")
  async resolveEmbed(@Param("token") token: string) {
    const widget = await this.prisma.embedWidget.findUnique({
      where: { token },
      include: { release: { select: { id: true, slug: true, title: true, coverPath: true } } }
    });
    if (!widget) throw new BadRequestException("Invalid embed");
    return widget;
  }

  @Post("versioning/:releaseId")
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async addVersion(@Param("releaseId") releaseId: string, @Body() dto: VersionDto) {
    await this.prisma.trackVersion.updateMany({
      where: { releaseId },
      data: { isActive: false }
    });
    return this.prisma.trackVersion.create({
      data: {
        releaseId,
        versionLabel: dto.versionLabel,
        audioPath: dto.audioPath,
        changelog: dto.changelog,
        isActive: true
      }
    });
  }

  @Post("security/2fa/setup")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async setup2fa(@Req() req: Request & { user?: { userId: string } }) {
    const secret = randomBytes(20).toString("hex");
    const recoveryCodes = Array.from({ length: 8 }).map(() => randomBytes(4).toString("hex"));
    return this.prisma.userTwoFactor.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        secret,
        enabled: false,
        recoveryCodes
      },
      update: {
        secret,
        recoveryCodes
      }
    });
  }

  @Post("security/recovery/request")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async requestRecovery(@Req() req: Request & { user?: { userId: string } }) {
    const raw = randomBytes(24).toString("base64url");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await this.prisma.securityRecoveryToken.create({
      data: {
        userId: req.user!.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30)
      }
    });
    return { token: raw, expiresInSec: 1800 };
  }

  @Post("security/login-alert")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async createLoginAlert(
    @Req() req: Request & { user?: { userId: string } },
    @Headers("user-agent") userAgent?: string
  ) {
    return this.prisma.loginAlert.create({
      data: {
        userId: req.user!.userId,
        ip: req.ip,
        userAgent
      }
    });
  }

  @Post("push/register")
  @Roles(UserRole.CLIENT, UserRole.ARTIST, UserRole.ADMIN)
  async registerPush(@Body() dto: PushDto, @Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.pushDevice.upsert({
      where: {
        userId_endpoint: {
          userId: req.user!.userId,
          endpoint: dto.endpoint
        }
      },
      create: {
        userId: req.user!.userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        platform: dto.platform,
        locale: dto.locale
      },
      update: {
        p256dh: dto.p256dh,
        auth: dto.auth,
        platform: dto.platform,
        locale: dto.locale,
        lastSeenAt: new Date()
      }
    });
  }

  @Post("public-api/clients")
  @Roles(UserRole.ADMIN)
  async createApiClient(
    @Body() body: { name: string; scopes?: string[]; rateLimit?: number },
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const rawKey = `saur_${randomBytes(24).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const client = await this.prisma.publicApiClient.create({
      data: {
        name: body.name,
        keyHash,
        scopes: body.scopes ?? ["public:read"],
        rateLimit: body.rateLimit ?? 120,
        createdBy: req.user!.userId
      }
    });
    return { id: client.id, apiKey: rawKey };
  }

  @Get("public-api/releases")
  async publicReleases(
    @Headers("x-api-key") apiKey?: string,
    @Query("q") q = "",
    @Query("take") take = "20"
  ) {
    if (!apiKey) throw new UnauthorizedException("Missing API key");
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const client = await this.prisma.publicApiClient.findUnique({ where: { keyHash } });
    if (!client || !client.active) throw new UnauthorizedException("Invalid API key");

    const limit = Math.min(Math.max(Number(take) || 20, 1), 100);
    return this.prisma.release.findMany({
      where: {
        published: true,
        ...(q.trim()
          ? {
              OR: [
                { title: { contains: q } },
                { genre: { contains: q } },
                { artist: { displayName: { contains: q } } }
              ]
            }
          : {})
      },
      take: limit,
      include: {
        artist: { select: { id: true, displayName: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Get("admin/analytics/global")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async adminAnalytics() {
    const [users, artists, releases, orders, reports, dmca, streams] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.artist.count(),
      this.prisma.release.count(),
      this.prisma.order.count(),
      this.prisma.contentReport.count(),
      this.prisma.dmcaClaim.count(),
      this.prisma.streamEvent.count()
    ]);

    const revenues = await this.prisma.order.aggregate({ _sum: { total: true } });
    return {
      users,
      artists,
      releases,
      orders,
      reports,
      dmcaClaims: dmca,
      streams,
      grossRevenue: Number(revenues._sum.total ?? 0)
    };
  }

  private computeBotScore(reason: string, details?: string) {
    const text = `${reason} ${details ?? ""}`.toLowerCase();
    let score = 20;
    if (/(copyright|dmca|stolen)/.test(text)) score += 30;
    if (/(spam|bot|fake)/.test(text)) score += 20;
    if (/(hate|illegal|offensive)/.test(text)) score += 25;
    return Math.min(score, 100);
  }

  private hashAudioFile(audioPath: string) {
    try {
      const safePath = audioPath.startsWith("/uploads/")
        ? `/data${audioPath}`
        : audioPath.startsWith("/data/")
          ? audioPath
          : "";
      if (!safePath) return createHash("sha256").update(audioPath).digest("hex");
      const data = readFileSync(safePath);
      return createHash("sha256").update(data).digest("hex");
    } catch {
      return createHash("sha256").update(audioPath).digest("hex");
    }
  }

  private similarityFromHashes(a: string, b: string) {
    if (a.length !== b.length) return 0;
    let equal = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] === b[i]) equal += 1;
    }
    return Math.round((equal / a.length) * 100);
  }
}
