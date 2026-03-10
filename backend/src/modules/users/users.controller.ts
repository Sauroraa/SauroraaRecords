import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EmailService } from "../email/email.service";
import { Request } from "express";

class ArtistProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsString() soundcloudUrl?: string;
  @IsOptional() @IsString() discordUrl?: string;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @IsString() payoutIban?: string;
}

class AgencyProfileDto {
  @IsOptional() @IsString() displayName?: string;
}

class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsBoolean() hasSociete?: boolean;
  @IsOptional() @IsString() societeName?: string;
  @IsOptional() @IsString() vatNumber?: string;
  @IsOptional() @IsString() billingAddress?: string;
  @IsOptional() @ValidateNested() @Type(() => ArtistProfileDto) artist?: ArtistProfileDto;
  @IsOptional() @ValidateNested() @Type(() => AgencyProfileDto) agency?: AgencyProfileDto;
}

class ChangePasswordDto {
  @IsString() @MinLength(8) newPassword!: string;
}

class ModerationMessageDto {
  @IsString()
  @MinLength(3)
  message!: string;
}

class SuspensionDto {
  @IsBoolean()
  suspended!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller("users")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  // ── Admin: list all users ─────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
  }

  @Get("search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async searchUsers(@Query("q") q?: string) {
    const search = q?.trim();
    return this.prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } }
            ]
          }
        : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        warningCount: true,
        strikeCount: true,
        suspended: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  // ── My profile ────────────────────────────────────────────────────────────
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request & { user?: { userId: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        artist: true,
        agency: {
          include: {
            artists: {
              include: { artist: { include: { user: { select: { email: true } } } } }
            }
          }
        },
        subscription: true
      }
    });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash, ...rest } = user;
    return rest;
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const userId = req.user!.userId;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country,
        hasSociete: dto.hasSociete,
        societeName: dto.societeName,
        vatNumber: dto.vatNumber,
        billingAddress: dto.billingAddress
      },
      include: { artist: true, agency: true }
    });

    if (dto.artist && updated.artist) {
      await this.prisma.artist.update({
        where: { userId },
        data: {
          displayName: dto.artist.displayName,
          slug: dto.artist.slug,
          bio: dto.artist.bio,
          instagramUrl: dto.artist.instagramUrl,
          soundcloudUrl: dto.artist.soundcloudUrl,
          discordUrl: dto.artist.discordUrl,
          websiteUrl: dto.artist.websiteUrl,
          payoutIban: dto.artist.payoutIban
        }
      });
    }

    if (dto.agency && updated.agency) {
      await this.prisma.agency.update({
        where: { userId },
        data: { displayName: dto.agency.displayName }
      });
    }

    const { passwordHash, ...rest } = updated;
    return rest;
  }

  @Patch("me/password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash(dto.newPassword, 10);
    const user = await this.prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash: hash }
    });
    void this.emailService.sendPasswordChanged(user.email, user.firstName ?? undefined);
    return { success: true };
  }

  @Post(":id/warn")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async warnUser(
    @Param("id") id: string,
    @Body() dto: ModerationMessageDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) throw new ForbiddenException("Cannot warn admin");

    const updated = await this.prisma.user.update({
      where: { id },
      data: { warningCount: { increment: 1 } },
      select: { id: true, email: true, warningCount: true, strikeCount: true, suspended: true }
    });

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: "WARNING",
        body: dto.message.trim()
      }
    });

    return {
      ...updated,
      message: "Warning recorded",
      moderatorId: req.user!.userId
    };
  }

  @Post(":id/strike")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async strikeUser(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) throw new ForbiddenException("Cannot strike admin");

    const nextCount = user.strikeCount + 1;
    const suspended = nextCount >= 3;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        strikeCount: { increment: 1 },
        suspended,
        suspensionReason: suspended ? "Automatic suspension after 3 strikes" : user.suspensionReason
      },
      select: { id: true, email: true, strikeCount: true, warningCount: true, suspended: true, suspensionReason: true }
    });

    await this.prisma.notification.create({
      data: {
        userId: id,
        type: "STRIKE",
        body: suspended
          ? "A strike has been applied and your account has been suspended after reaching 3 strikes."
          : `A strike has been applied to your account (${updated.strikeCount}/3).`
      }
    });

    return updated;
  }

  @Delete(":id/strike")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async revokeStrike(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    const nextCount = Math.max(0, user.strikeCount - 1);
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        strikeCount: nextCount,
        suspended: nextCount >= 3 ? user.suspended : false,
        suspensionReason: nextCount >= 3 ? user.suspensionReason : null
      },
      select: { id: true, email: true, strikeCount: true, warningCount: true, suspended: true, suspensionReason: true }
    });

    return updated;
  }

  @Patch(":id/suspension")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async setSuspension(@Param("id") id: string, @Body() dto: SuspensionDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.ADMIN) throw new ForbiddenException("Cannot suspend admin");

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        suspended: dto.suspended,
        suspensionReason: dto.suspended ? dto.reason?.trim() || "Suspended by staff" : null
      },
      select: { id: true, email: true, strikeCount: true, warningCount: true, suspended: true, suspensionReason: true }
    });

    return updated;
  }
}
