import { Module } from "@nestjs/common";
import { FollowsController } from "./follows.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [FollowsController],
  providers: [PrismaService]
})
export class FollowsModule {}
