import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationsService } from "../notifications/notifications.service";
import { Request } from "express";

class CreateCommentDto {
  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  dubpackId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  body!: string;
}

@Controller("comments")
export class CommentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  @Get()
  async list(
    @Query("releaseId") releaseId?: string,
    @Query("dubpackId") dubpackId?: string
  ) {
    const where: Record<string, unknown> = { parentId: null };
    if (releaseId) where.releaseId = releaseId;
    if (dubpackId) where.dubpackId = dubpackId;

    return this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, firstName: true, artist: { select: { displayName: true, avatar: true } } } },
        replies: {
          include: { user: { select: { id: true, email: true, firstName: true, artist: { select: { displayName: true, avatar: true } } } } },
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateCommentDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;

    // Check if user has purchased the release/dubpack for verified badge
    let isVerifiedPurchase = false;
    if (dto.releaseId) {
      const purchase = await this.prisma.orderItem.findFirst({
        where: { releaseId: dto.releaseId, order: { userId } }
      });
      isVerifiedPurchase = !!purchase;
    }
    if (dto.dubpackId) {
      const purchase = await this.prisma.orderItem.findFirst({
        where: { dubpackId: dto.dubpackId, order: { userId } }
      });
      isVerifiedPurchase = !!purchase;
    }

    const created = await this.prisma.comment.create({
      data: {
        userId,
        releaseId: dto.releaseId,
        dubpackId: dto.dubpackId,
        parentId: dto.parentId,
        body: dto.body,
        isVerifiedPurchase
      },
      include: { user: { select: { id: true, email: true, firstName: true, artist: { select: { displayName: true, avatar: true } } } } }
    });

    if (dto.releaseId) {
      const release = await this.prisma.release.findUnique({
        where: { id: dto.releaseId },
        select: {
          title: true,
          artist: { select: { userId: true } }
        }
      });

      if (release?.artist.userId && release.artist.userId !== userId) {
        const authorName =
          created.user.artist?.displayName ??
          created.user.firstName ??
          created.user.email.split("@")[0];

        await this.notifications.create({
          userId: release.artist.userId,
          type: "NEW_COMMENT",
          body: `${authorName} commented on ${release.title}.`,
          releaseId: dto.releaseId
        });
      }
    }

    return created;
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;
    const existing = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: id, userId } }
    });

    if (existing) {
      await this.prisma.commentLike.delete({
        where: { commentId_userId: { commentId: id, userId } }
      });
      await this.prisma.comment.update({
        where: { id },
        data: { likesCount: { decrement: 1 } }
      });
      return { liked: false };
    }

    await this.prisma.commentLike.create({ data: { commentId: id, userId } });
    await this.prisma.comment.update({
      where: { id },
      data: { likesCount: { increment: 1 } }
    });
    return { liked: true };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException("Comment not found");

    if (comment.userId !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not authorized");
    }

    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }
}
