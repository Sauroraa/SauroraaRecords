import { Module } from "@nestjs/common";
import { DubpacksController } from "./dubpacks.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [DubpacksController],
  providers: [PrismaService]
})
export class DubpacksModule {}
