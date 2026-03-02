import { Module } from "@nestjs/common";
import { StripeController } from "./stripe.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [StripeController],
  providers: [PrismaService]
})
export class StripeModule {}
