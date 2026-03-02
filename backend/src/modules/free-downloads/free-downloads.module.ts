import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { FreeDownloadsController } from "./free-downloads.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "change_me_jwt"
    })
  ],
  controllers: [FreeDownloadsController],
  providers: [PrismaService]
})
export class FreeDownloadsModule {}
