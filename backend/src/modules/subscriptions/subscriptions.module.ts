import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { SubscriptionsController } from "./subscriptions.controller";

@Module({
  controllers: [SubscriptionsController],
  providers: [PrismaService]
})
export class SubscriptionsModule {}
