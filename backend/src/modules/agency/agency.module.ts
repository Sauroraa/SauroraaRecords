import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { AgencyController } from "./agency.controller";

@Module({
  controllers: [AgencyController],
  providers: [PrismaService]
})
export class AgencyModule {}
