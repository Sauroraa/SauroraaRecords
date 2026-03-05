import { Module } from "@nestjs/common";
import { EcosystemController } from "./ecosystem.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [EcosystemController],
  providers: [PrismaService]
})
export class EcosystemModule {}
