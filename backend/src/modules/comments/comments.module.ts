import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [CommentsController],
  providers: [PrismaService]
})
export class CommentsModule {}
