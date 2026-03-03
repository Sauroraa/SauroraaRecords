import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FreeDownloadActionType } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request, Response } from "express";
import * as crypto from "crypto";
import * as path from "path";

class InitSessionDto {
  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  dubpackId?: string;
}

class CompleteActionDto {
  @IsEnum(FreeDownloadActionType)
  action!: FreeDownloadActionType;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  commentBody?: string;
}

@Controller("free-downloads")
export class FreeDownloadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async myDownloads(@Req() req: Request & { user?: { userId: string } }) {
    return this.prisma.freeDownloadSession.findMany({
      where: { userId: req.user!.userId },
      include: {
        release: { select: { title: true, slug: true, coverPath: true } },
        dubpack: { select: { title: true, slug: true, coverPath: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("session")
  @UseGuards(JwtAuthGuard)
  async initSession(
    @Body() dto: InitSessionDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;

    // Resolve source item + artist
    let artistId: string | null = null;
    let releaseGateActions: FreeDownloadActionType[] | null = null;
    if (dto.releaseId) {
      const release = await this.prisma.release.findUnique({
        where: { id: dto.releaseId },
        select: {
          id: true,
          artistId: true,
          type: true,
          gateEnabled: true,
          gateFollowArtist: true,
          gateEmail: true,
          gateInstagram: true,
          gateSoundcloud: true,
          gateDiscord: true
        }
      });
      if (!release) throw new NotFoundException("Release not found");
      if (release.type !== "FREE") throw new BadRequestException("Not a free release");
      artistId = release.artistId;
      if (release.gateEnabled) {
        releaseGateActions = [];
        if (release.gateFollowArtist) releaseGateActions.push("FOLLOW_ARTIST");
        if (release.gateEmail) releaseGateActions.push("SUBSCRIBE_NEWSLETTER");
        if (release.gateInstagram) releaseGateActions.push("FOLLOW_INSTAGRAM");
        if (release.gateSoundcloud) releaseGateActions.push("FOLLOW_SOUNDCLOUD");
        if (release.gateDiscord) releaseGateActions.push("JOIN_DISCORD");
      }
    }
    if (dto.dubpackId) {
      const dubpack = await this.prisma.dubpack.findUnique({ where: { id: dto.dubpackId } });
      if (!dubpack) throw new NotFoundException("Dubpack not found");
      if (dubpack.type !== "FREE") throw new BadRequestException("Not a free dubpack");
      artistId = dubpack.artistId;
    }

    if (!artistId) throw new BadRequestException("Provide releaseId or dubpackId");

    // Check for existing session
    const existingSession = await this.prisma.freeDownloadSession.findFirst({
      where: {
        userId,
        releaseId: dto.releaseId,
        dubpackId: dto.dubpackId
      },
      include: { actions: true }
    });

    if (existingSession) {
      return this.formatSession(existingSession);
    }

    // Priority: release gate config > artist fallback config
    let requiredActions: FreeDownloadActionType[] = [];
    if (releaseGateActions) {
      requiredActions = releaseGateActions;
    } else {
      const config = await this.prisma.artistDownloadConfig.findUnique({ where: { artistId } });
      requiredActions =
        config?.enabled && config?.requiredActions
          ? (config.requiredActions as FreeDownloadActionType[])
          : ["FOLLOW_ARTIST"];
    }
    if (requiredActions.length === 0) requiredActions = ["FOLLOW_ARTIST"];

    // Create session + actions
    const session = await this.prisma.freeDownloadSession.create({
      data: {
        userId,
        releaseId: dto.releaseId,
        dubpackId: dto.dubpackId,
        actions: {
          create: requiredActions.map((action) => ({ action }))
        }
      },
      include: { actions: true }
    });

    return this.formatSession(session);
  }

  @Post("session/:sessionId/action")
  @UseGuards(JwtAuthGuard)
  async completeAction(
    @Param("sessionId") sessionId: string,
    @Body() dto: CompleteActionDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;
    const session = await this.prisma.freeDownloadSession.findUnique({
      where: { id: sessionId },
      include: { actions: true }
    });

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new UnauthorizedException();

    const actionRow = session.actions.find((a) => a.action === dto.action);
    if (!actionRow) throw new BadRequestException("Action not required for this session");
    if (actionRow.completedAt) return this.formatSession({ ...session, actions: session.actions });

    const release = session.releaseId
      ? await this.prisma.release.findUnique({ where: { id: session.releaseId } })
      : null;
    const dubpack = session.dubpackId
      ? await this.prisma.dubpack.findUnique({ where: { id: session.dubpackId } })
      : null;
    const artistId = release?.artistId ?? dubpack?.artistId;

    if (dto.action === "FOLLOW_ARTIST" && artistId) {
      await this.prisma.follow.upsert({
        where: { followerId_artistId: { followerId: userId, artistId } },
        create: { followerId: userId, artistId },
        update: {}
      });
    }

    if (dto.action === "SUBSCRIBE_NEWSLETTER") {
      if (!dto.email) throw new BadRequestException("Email required for newsletter action");
      if (session.releaseId && artistId) {
        await this.prisma.gateSubmission.create({
          data: {
            releaseId: session.releaseId,
            artistId,
            userId,
            email: dto.email
          }
        });
      }
    }

    if (dto.action === "LEAVE_COMMENT") {
      const body = dto.commentBody?.trim();
      if (!body || body.length < 3) {
        throw new BadRequestException("Comment is required for this action");
      }
      await this.prisma.comment.create({
        data: {
          userId,
          releaseId: session.releaseId ?? undefined,
          dubpackId: session.dubpackId ?? undefined,
          body
        }
      });
    }

    await this.prisma.freeDownloadAction.update({
      where: { id: actionRow.id },
      data: { completedAt: new Date() }
    });

    const updatedSession = await this.prisma.freeDownloadSession.findUnique({
      where: { id: sessionId },
      include: { actions: true }
    });

    return this.formatSession(updatedSession!);
  }

  @Get("session/:sessionId/link")
  @UseGuards(JwtAuthGuard)
  async getDownloadLink(
    @Param("sessionId") sessionId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;
    const session = await this.prisma.freeDownloadSession.findUnique({
      where: { id: sessionId },
      include: { actions: true }
    });

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new UnauthorizedException();

    const allDone = session.actions.every((a) => a.completedAt !== null);
    if (!allDone) throw new BadRequestException("Not all required actions completed");

    // Generate a signed token
    const token = await this.jwtService.signAsync(
      { sessionId, releaseId: session.releaseId, dubpackId: session.dubpackId, sub: userId },
      {
        secret: process.env.JWT_SECRET || "change_me_jwt",
        expiresIn: "10m"
      }
    );

    await this.prisma.freeDownloadSession.update({
      where: { id: sessionId },
      data: {
        downloadToken: crypto.createHash("sha256").update(token).digest("hex"),
        tokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    return { downloadUrl: `/api/free-downloads/file?token=${token}` };
  }

  @Get("file")
  async downloadFile(@Query("token") token: string, @Res() res: Response) {
    if (!token) throw new UnauthorizedException("No token");

    const payload = await this.jwtService
      .verifyAsync<{
        sessionId: string;
        releaseId?: string;
        dubpackId?: string;
        sub: string;
      }>(token, { secret: process.env.JWT_SECRET || "change_me_jwt" })
      .catch(() => {
        throw new UnauthorizedException("Invalid or expired token");
      });

    // Verify session token hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await this.prisma.freeDownloadSession.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.downloadToken !== tokenHash) {
      throw new UnauthorizedException("Invalid token");
    }
    if (session.tokenExpiresAt && session.tokenExpiresAt < new Date()) {
      throw new UnauthorizedException("Token expired");
    }

    // Get the file path
    let filePath: string | null = null;
    if (payload.releaseId) {
      const release = await this.prisma.release.findUnique({ where: { id: payload.releaseId } });
      filePath = release?.audioPath ?? null;
    }
    if (payload.dubpackId) {
      const dubpack = await this.prisma.dubpack.findUnique({ where: { id: payload.dubpackId } });
      filePath = dubpack?.zipPath ?? null;
    }

    if (!filePath) throw new NotFoundException("File not found");

    const storageMode = process.env.STORAGE_MODE || "local";
    if (storageMode === "s3") {
      // For S3, redirect to presigned URL
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || "",
          secretAccessKey: process.env.S3_SECRET_KEY || ""
        },
        forcePathStyle: true
      });
      const key = filePath.split(`/${process.env.S3_BUCKET}/`)[1];
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET || "sauroraa", Key: key }),
        { expiresIn: 300 }
      );
      return res.redirect(url);
    }

    // Local file
    const localBase = process.env.LOCAL_STORAGE_PATH || "/data/uploads";
    const fullPath = path.join(localBase, filePath.replace("/uploads/", ""));
    return res.sendFile(fullPath);
  }

  private formatSession(session: {
    id: string;
    actions: { action: FreeDownloadActionType; completedAt: Date | null }[];
  }) {
    const total = session.actions.length;
    const completed = session.actions.filter((a) => a.completedAt !== null).length;
    return {
      sessionId: session.id,
      progress: { completed, total },
      actions: session.actions.map((a) => ({
        action: a.action,
        completed: a.completedAt !== null
      })),
      allCompleted: completed === total
    };
  }
}
