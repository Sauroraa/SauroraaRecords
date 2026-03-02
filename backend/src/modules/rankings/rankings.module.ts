import { Module } from "@nestjs/common";
import { RankingsController } from "./rankings.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [RankingsController],
  providers: [PrismaService]
})
export class RankingsModule {}
