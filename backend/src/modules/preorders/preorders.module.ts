import { Module } from "@nestjs/common";
import { PreordersController } from "./preorders.controller";
import { PrismaService } from "../../prisma.service";

@Module({
  controllers: [PreordersController],
  providers: [PrismaService]
})
export class PreordersModule {}
