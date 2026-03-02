import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getRankings(@Query("month") month?: string) {
    const targetMonth = month ?? new Date().toISOString().slice(0, 7);

    const rankings = await this.prisma.artistRanking.findMany({
      where: { month: targetMonth },
      orderBy: { rank: "asc" },
      include: {
        artist: {
          include: {
            user: { select: { email: true } }
          }
        }
      }
    });

    return rankings;
  }
}
