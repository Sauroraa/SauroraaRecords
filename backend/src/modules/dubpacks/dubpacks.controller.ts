import {
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
import { ReleaseType, UserRole } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";

class CreateDubpackDto {
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

  @IsOptional()
  @IsString()
  coverPath?: string;

  @IsString()
  zipPath!: string;

  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;
}

class UpdateDubpackDto {
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
  isExclusive?: boolean;

  @IsOptional()
  @IsBoolean()
  exclusiveFollowersOnly?: boolean;
}

@Controller("dubpacks")
export class DubpacksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: Request & { user?: { role?: UserRole } }) {
    const adminQuery = req.query.admin === "true";
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (adminQuery && isAdmin) {
      return this.listAll();
    }
    return this.prisma.dubpack.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.prisma.dubpack.findMany({
      orderBy: { createdAt: "desc" },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Get(":slug")
  async one(@Param("slug") slug: string) {
    const dubpack = await this.prisma.dubpack.findUnique({
      where: { slug },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
    if (!dubpack) throw new NotFoundException("Dubpack not found");
    return dubpack;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async create(
    @Body() dto: CreateDubpackDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const userId = req.user!.userId;
    const artist = await this.prisma.artist.findUnique({ where: { userId } });
    if (!artist && req.user!.role !== UserRole.ADMIN) {
      throw new NotFoundException("Artist profile not found");
    }

    return this.prisma.dubpack.create({
      data: {
        artistId: artist!.id,
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        type: dto.type,
        coverPath: dto.coverPath,
        zipPath: dto.zipPath,
        isExclusive: dto.isExclusive ?? false
      }
    });
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateDubpackDto,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const dubpack = await this.prisma.dubpack.findUnique({ where: { id } });
    if (!dubpack) throw new NotFoundException("Dubpack not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== dubpack.artistId) {
        throw new NotFoundException("Not authorized");
      }
    }

    return this.prisma.dubpack.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  async remove(
    @Param("id") id: string,
    @Req() req: Request & { user?: { userId: string; role: string } }
  ) {
    const dubpack = await this.prisma.dubpack.findUnique({ where: { id } });
    if (!dubpack) throw new NotFoundException("Dubpack not found");

    if (req.user!.role !== UserRole.ADMIN) {
      const artist = await this.prisma.artist.findUnique({ where: { userId: req.user!.userId } });
      if (!artist || artist.id !== dubpack.artistId) {
        throw new NotFoundException("Not authorized");
      }
    }

    await this.prisma.dubpack.delete({ where: { id } });
    return { success: true };
  }
}
