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
  Req,
  UseGuards
} from "@nestjs/common";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EmailService } from "../email/email.service";
import { Request } from "express";

class AddArtistDto {
  @IsString()
  email!: string;
}

class InviteDto {
  @IsEmail()
  email!: string;
}

class AcceptInviteDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

class UpdateAgencyDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  logoPath?: string;
}

class AgencyRequestDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

@Controller("agency")
export class AgencyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /** Ensures an Agency row exists for this user (auto-create on first access). */
  private async ensureAgency(userId: string) {
    return this.prisma.agency.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });
  }

  // ─── Agency profile ────────────────────────────────────────────────────────

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user?: { userId: string } }) {
    await this.ensureAgency(req.user!.userId);

    const agency = await this.prisma.agency.findUnique({
      where: { userId: req.user!.userId },
      include: {
        artists: {
          include: {
            artist: {
              include: {
                user: { select: { email: true, firstName: true, lastName: true } },
                _count: { select: { releases: true, dubpacks: true, followers: true } }
              }
            }
          }
        },
        _count: { select: { invitations: true } }
      }
    });
    if (!agency) throw new BadRequestException("Agency not found");

    return {
      id: agency.id,
      displayName: agency.displayName,
      logoPath: agency.logoPath,
      pendingInvitations: agency._count.invitations,
      artists: agency.artists.map((link) => ({
        id: link.artist.id,
        displayName: link.artist.displayName,
        bio: link.artist.bio,
        avatar: link.artist.avatar,
        user: {
          email: link.artist.user?.email,
          firstName: link.artist.user?.firstName,
          lastName: link.artist.user?.lastName
        },
        _count: link.artist._count
      }))
    };
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Body() dto: UpdateAgencyDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.ensureAgency(req.user!.userId);

    return this.prisma.agency.update({
      where: { id: agency.id },
      data: { displayName: dto.displayName, logoPath: dto.logoPath }
    });
  }

  // ─── Invitations ───────────────────────────────────────────────────────────

  @Get("invitations")
  @UseGuards(JwtAuthGuard)
  async getInvitations(@Req() req: Request & { user?: { userId: string } }) {
    const agency = await this.ensureAgency(req.user!.userId);

    return this.prisma.agencyInvitation.findMany({
      where: { agencyId: agency.id, accepted: false },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("invite")
  @UseGuards(JwtAuthGuard)
  async sendInvite(
    @Body() dto: InviteDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.ensureAgency(req.user!.userId);

    // Check not already linked
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        artist: { include: { agencyLinks: { where: { agencyId: agency.id } } } }
      }
    });
    if (existing?.artist?.agencyLinks?.length) {
      throw new BadRequestException("Cet artiste est déjà dans votre agence");
    }

    // Check no pending invite
    const pending = await this.prisma.agencyInvitation.findFirst({
      where: { agencyId: agency.id, email: dto.email, accepted: false }
    });
    if (pending) {
      throw new BadRequestException("Une invitation est déjà en attente pour cet email");
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.prisma.agencyInvitation.create({
      data: { agencyId: agency.id, email: dto.email, expiresAt }
    });

    void this.emailService.sendInvitation(
      dto.email,
      agency.displayName || "Sauroraa Agency",
      invitation.token
    );

    return { success: true, id: invitation.id, email: dto.email };
  }

  @Delete("invitations/:id")
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.prisma.agency.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!agency) throw new BadRequestException("Agency not found");

    const inv = await this.prisma.agencyInvitation.findUnique({ where: { id } });
    if (!inv || inv.agencyId !== agency.id) throw new NotFoundException("Invitation not found");

    await this.prisma.agencyInvitation.delete({ where: { id } });
    return { success: true };
  }

  // ─── Public: accept invite ─────────────────────────────────────────────────

  @Get("invite/:token")
  async getInviteDetails(@Param("token") token: string) {
    const inv = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: { agency: true }
    });
    if (!inv || inv.accepted || inv.expiresAt < new Date()) {
      throw new NotFoundException("Invitation invalide ou expirée");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: inv.email } });
    return {
      agencyName: inv.agency.displayName || "Sauroraa Agency",
      email: inv.email,
      isNewUser: !existing
    };
  }

  @Post("invite/:token")
  async acceptInvite(
    @Param("token") token: string,
    @Body() dto: AcceptInviteDto
  ) {
    const inv = await this.prisma.agencyInvitation.findUnique({
      where: { token },
      include: { agency: true }
    });
    if (!inv || inv.accepted || inv.expiresAt < new Date()) {
      throw new BadRequestException("Invitation invalide ou expirée");
    }

    let artistId: string;
    const existingUser = await this.prisma.user.findUnique({
      where: { email: inv.email },
      include: { artist: true }
    });

    if (existingUser) {
      if (!existingUser.artist) {
        const artist = await this.prisma.artist.create({ data: { userId: existingUser.id } });
        artistId = artist.id;
      } else {
        artistId = existingUser.artist.id;
      }
    } else {
      if (!dto.password || dto.password.length < 8) {
        throw new BadRequestException("Un mot de passe de 8 caractères minimum est requis");
      }
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const newUser = await this.prisma.user.create({
        data: {
          email: inv.email,
          passwordHash,
          role: "ARTIST",
          firstName: dto.firstName,
          lastName: dto.lastName,
          artist: { create: {} }
        },
        include: { artist: true }
      });
      artistId = newUser.artist!.id;
      void this.emailService.sendWelcome(inv.email, dto.firstName);
    }

    // Link artist to agency (upsert for safety)
    await this.prisma.agencyArtist.upsert({
      where: { agencyId_artistId: { agencyId: inv.agencyId, artistId } },
      update: {},
      create: { agencyId: inv.agencyId, artistId }
    });

    await this.prisma.agencyInvitation.update({
      where: { id: inv.id },
      data: { accepted: true }
    });

    return {
      success: true,
      isNewUser: !existingUser,
      agencyName: inv.agency.displayName || "Sauroraa Agency"
    };
  }

  // ─── Artists management ────────────────────────────────────────────────────

  @Post("artist")
  @UseGuards(JwtAuthGuard)
  async addArtist(
    @Body() dto: AddArtistDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.ensureAgency(req.user!.userId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { artist: true }
    });
    if (!targetUser) throw new BadRequestException("Utilisateur introuvable");
    if (!targetUser.artist) throw new BadRequestException("Cet utilisateur n'est pas un artiste");

    await this.prisma.agencyArtist.create({
      data: { agencyId: agency.id, artistId: targetUser.artist.id }
    });

    return {
      id: targetUser.artist.id,
      displayName: targetUser.artist.displayName,
      bio: targetUser.artist.bio,
      avatar: targetUser.artist.avatar,
      user: { email: targetUser.email }
    };
  }

  @Delete("artist/:artistId")
  @UseGuards(JwtAuthGuard)
  async removeArtist(
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.ensureAgency(req.user!.userId);

    return this.prisma.agencyArtist.deleteMany({
      where: { agencyId: agency.id, artistId }
    });
  }

  // ─── Public request ────────────────────────────────────────────────────────

  @Post("request")
  async submitRequest(@Body() dto: AgencyRequestDto) {
    const request = await this.prisma.agencyRequest.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        message: dto.message
      }
    });
    return { success: true, id: request.id };
  }
}
