import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { RevenueController } from "./revenue.controller";

@Module({
  controllers: [RevenueController],
  providers: [PrismaService]
})
export class RevenueModule {}
