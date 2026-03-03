import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { UserRole } from "@prisma/client";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UploadService } from "./upload.service";

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
}
