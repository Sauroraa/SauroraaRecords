import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ReleaseType, UserRole } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class CreateReleaseDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  price!: string;

  @IsEnum(ReleaseType)
  type!: ReleaseType;

  @IsString()
  audioPath!: string;

  @IsOptional()
  @IsString()
  coverPath?: string;

  @IsOptional()
  @IsString()
  previewClip?: string;

  @IsOptional()
  @IsBoolean()
  exclusiveFollowersOnly?: boolean;
}

class UpdateReleaseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  exclusiveFollowersOnly?: boolean;
}

@Controller("releases")
export class ReleasesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.release.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.prisma.release.findMany({
      orderBy: { createdAt: "desc" },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Get(":slug")
  async one(@Param("slug") slug: string) {
    const release = await this.prisma.release.findUnique({
      where: { slug },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
    if (!release) throw new NotFoundException("Release not found");
    return release;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async create(
    @Body() dto: CreateReleaseDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const userId = req.user!.userId;
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist && req.user!.role !== UserRole.ADMIN) {
      throw new NotFoundException("Artist profile not found");
    }

    return this.prisma.release.create({
      data: {
        artistId: artist!.id,
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        type: dto.type,
        audioPath: dto.audioPath,
        coverPath: dto.coverPath,
        previewClip: dto.previewClip,
        exclusiveFollowersOnly: dto.exclusiveFollowersOnly ?? false
      }
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateReleaseDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException("Release not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== release.artistId) {
        throw new NotFoundException("Not authorized");
      }
    }

    return this.prisma.release.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async remove(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException("Release not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== release.artistId) {
        throw new NotFoundException("Not authorized");
      }
    }

    await this.prisma.release.delete({ where: { id } });
    return { success: true };
  }
}
