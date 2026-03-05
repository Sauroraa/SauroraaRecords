import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { EngagementController } from "./engagement.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "change_me_jwt"
    })
  ],
  controllers: [EngagementController],
  providers: [PrismaService]
})
export class EngagementModule {}
