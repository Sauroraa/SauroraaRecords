import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
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
}
