import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { ReleasesController } from "./releases.controller";

@Module({
  controllers: [ReleasesController],
  providers: [PrismaService]
})
export class ReleasesModule {}
