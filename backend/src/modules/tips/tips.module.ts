import { Module } from "@nestjs/common";
import { TipsController } from "./tips.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [TipsController],
  providers: [PrismaService]
})
export class TipsModule {}
