import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaService } from "../../prisma.service";

@Module({
  imports: [NotificationsModule],
  controllers: [CommentsController],
  providers: [PrismaService]
})
export class CommentsModule {}
