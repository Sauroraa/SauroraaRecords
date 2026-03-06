import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { EngageController } from "./engage.controller";

@Module({
  controllers: [EngageController],
  providers: [PrismaService]
})
export class EngageModule {}
