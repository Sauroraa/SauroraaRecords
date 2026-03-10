import { Module } from "@nestjs/common";
import { FollowsController } from "./follows.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaService } from "../../prisma.service";

@Module({
  imports: [NotificationsModule],
  controllers: [FollowsController],
  providers: [PrismaService]
})
export class FollowsModule {}
