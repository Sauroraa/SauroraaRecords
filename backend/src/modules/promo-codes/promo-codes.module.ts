import { Module } from "@nestjs/common";
import { PromoCodesController } from "./promo-codes.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [PromoCodesController],
  providers: [PrismaService]
})
export class PromoCodesModule {}
