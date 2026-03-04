import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { SupportController } from "./support.controller";

@Module({
  controllers: [SupportController],
  providers: [PrismaService]
})
export class SupportModule {}

