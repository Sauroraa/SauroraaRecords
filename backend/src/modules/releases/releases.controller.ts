import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ReleaseType, UserRole } from "@prisma/client";
import { IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";
import { z } from "zod";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { PrismaService } from "../../prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

class CreateReleaseDto {
  @IsString()
  artistId!: string;

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
}

@Controller("releases")
export class ReleasesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.release.findMany({
      orderBy: { createdAt: "desc" },
      include: { artist: { include: { user: { select: { email: true } } } } }
    });
  }

  @Get(":slug")
  one(@Param("slug") slug: string) {
    return this.prisma.release.findUnique({ where: { slug } });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  create(@Body() dto: CreateReleaseDto) {
    const parsed = z
      .object({
        slug: z.string().min(3),
        title: z.string().min(2),
        audioPath: z.string().min(3)
      })
      .parse(dto);

    return this.prisma.release.create({
      data: {
        artistId: dto.artistId,
        slug: parsed.slug,
        title: parsed.title,
        description: dto.description,
        price: dto.price,
        type: dto.type,
        audioPath: parsed.audioPath,
        coverPath: dto.coverPath
      }
    });
  }
}
