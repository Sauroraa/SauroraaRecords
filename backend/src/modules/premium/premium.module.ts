import { Module } from "@nestjs/common";
import { PremiumController } from "./premium.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [PremiumController],
  providers: [PrismaService]
})
export class PremiumModule {}
