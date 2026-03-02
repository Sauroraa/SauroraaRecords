import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { IsString } from "class-validator";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class AddArtistDto {
  @IsString()
  email!: string;
}

@Controller("agency")
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async me(@Req() req: Request & { user?: { userId: string } }) {
    const agency = await this.prisma.agency.findUnique({
      where: { userId: req.user!.userId },
      include: {
        artists: {
          include: { artist: { include: { user: { select: { email: true } } } } }
        }
      }
    });
    if (!agency) throw new BadRequestException("Agency not found");

    return {
      id: agency.id,
      displayName: agency.displayName,
      logoPath: agency.logoPath,
      artists: agency.artists.map((link) => ({
        id: link.artist.id,
        displayName: link.artist.displayName,
        bio: link.artist.bio,
        avatar: link.artist.avatar,
        user: { email: link.artist.user?.email }
      }))
    };
  }

  @Post("artist")
  async addArtist(
    @Body() dto: AddArtistDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.prisma.agency.findUnique({
      where: { userId: req.user!.userId },
      include: { _count: { select: { artists: true } } }
    });
    if (!agency) throw new BadRequestException("Agency not found");

    // Look up user by email, then find their artist profile
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { artist: true }
    });
    if (!targetUser) throw new BadRequestException("User not found");
    if (!targetUser.artist) throw new BadRequestException("This user is not an artist");

    const artist = targetUser.artist;

    await this.prisma.agencyArtist.create({
      data: { agencyId: agency.id, artistId: artist.id }
    });

    return {
      id: artist.id,
      displayName: artist.displayName,
      bio: artist.bio,
      avatar: artist.avatar,
      user: { email: targetUser.email }
    };
  }

  @Delete("artist/:artistId")
  async removeArtist(
    @Param("artistId") artistId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const agency = await this.prisma.agency.findUnique({
      where: { userId: req.user!.userId }
    });
    if (!agency) throw new BadRequestException("Agency not found");

    return this.prisma.agencyArtist.deleteMany({
      where: { agencyId: agency.id, artistId }
    });
  }
}
