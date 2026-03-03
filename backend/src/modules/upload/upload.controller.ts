import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { UserRole } from "@prisma/client";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UploadService } from "./upload.service";
import { Request } from "express";

type ResumableKind = "audio" | "cover" | "zip";

class InitResumableDto {
  @IsIn(["audio", "cover", "zip"])
  kind!: ResumableKind;

  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalSize!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(256 * 1024)
  @Max(25 * 1024 * 1024)
  chunkSize?: number;

  @IsOptional()
  @IsString()
  fingerprint?: string;
}

class UploadChunkDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  chunkIndex!: number;
}

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("audio")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith("audio/")) cb(null, true);
        else cb(new Error("Only audio files allowed"), false);
      }
    })
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    const filePath = await this.uploadService.saveFile(file, "audio");
    return { path: filePath };
  }

  @Post("cover")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files allowed"), false);
      }
    })
  )
  async uploadCover(@UploadedFile() file: Express.Multer.File) {
    const filePath = await this.uploadService.saveFile(file, "covers");
    return { path: filePath };
  }

  @Post("zip")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ARTIST, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (
          file.mimetype === "application/zip" ||
          file.mimetype === "application/x-zip-compressed" ||
          file.originalname.endsWith(".zip")
        ) {
          cb(null, true);
        } else {
          cb(new Error("Only ZIP files allowed"), false);
        }
      }
    })
  )
  async uploadZip(@UploadedFile() file: Express.Multer.File) {
    const filePath = await this.uploadService.saveFile(file, "dubpacks");
    return { path: filePath };
  }

  @Post("resumable/init")
  async initResumable(
    @Body() dto: InitResumableDto,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const chunkSize = dto.chunkSize ?? 5 * 1024 * 1024;
    return this.uploadService.initResumable({
      userId: req.user!.userId,
      kind: dto.kind,
      filename: dto.filename,
      mimeType: dto.mimeType,
      totalSize: dto.totalSize,
      chunkSize,
      fingerprint: dto.fingerprint
    });
  }

  @Get("resumable/:uploadId/status")
  async resumableStatus(
    @Param("uploadId") uploadId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const status = await this.uploadService.getResumableStatus(uploadId, req.user!.userId);
    if (!status) throw new BadRequestException("Upload session not found");
    return status;
  }

  @Post("resumable/:uploadId/chunk")
  @UseInterceptors(
    FileInterceptor("chunk", {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 }
    })
  )
  async uploadChunk(
    @Param("uploadId") uploadId: string,
    @Body() dto: UploadChunkDto,
    @UploadedFile() chunk: Express.Multer.File,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    if (!chunk?.buffer) throw new BadRequestException("Chunk file is required");
    const status = await this.uploadService.appendResumableChunk(
      uploadId,
      req.user!.userId,
      dto.chunkIndex,
      chunk.buffer
    );
    if (!status) throw new BadRequestException("Upload session not found");
    return status;
  }

  @Post("resumable/:uploadId/complete")
  async completeResumable(
    @Param("uploadId") uploadId: string,
    @Req() req: Request & { user?: { userId: string } }
  ) {
    const result = await this.uploadService.completeResumable(uploadId, req.user!.userId);
    if (!result) throw new BadRequestException("Upload session not found");
    return result;
  }
}
