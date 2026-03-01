import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { ArtistsController } from "./artists.controller";

@Module({
  controllers: [ArtistsController],
  providers: [PrismaService]
})
export class ArtistsModule {}
