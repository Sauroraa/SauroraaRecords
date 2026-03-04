import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly prisma: PrismaService) {}

  private currentMonthKey() {
    return new Date().toISOString().slice(0, 7);
  }

  private monthBounds(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return { start, end };
  }

  private async buildLiveRankings(month: string) {
    const { start, end } = this.monthBounds(month);

    const [revenues, sessions] = await Promise.all([
      this.prisma.artistRevenue.findMany({
        where: { month },
        select: { artistId: true, totalSales: true, netDue: true }
      }),
      this.prisma.freeDownloadSession.findMany({
        where: {
          createdAt: { gte: start, lt: end }
        },
        select: {
          release: { select: { artistId: true } },
          dubpack: { select: { artistId: true } }
        }
      })
    ]);

    const byArtist = new Map<string, { totalRevenue: number; totalDownloads: number }>();

    for (const row of revenues) {
      const current = byArtist.get(row.artistId) ?? { totalRevenue: 0, totalDownloads: 0 };
      current.totalRevenue += Number(row.totalSales ?? row.netDue ?? 0);
      byArtist.set(row.artistId, current);
    }

    for (const session of sessions) {
      const artistId = session.release?.artistId ?? session.dubpack?.artistId ?? null;
      if (!artistId) continue;
      const current = byArtist.get(artistId) ?? { totalRevenue: 0, totalDownloads: 0 };
      current.totalDownloads += 1;
      byArtist.set(artistId, current);
    }

    const artistIds = [...byArtist.keys()];
    if (!artistIds.length) return [];

    const artists = await this.prisma.artist.findMany({
      where: { id: { in: artistIds } },
      include: { user: { select: { email: true } } }
    });
    const artistMap = new Map(artists.map((artist) => [artist.id, artist]));

    const rows = artistIds
      .map((artistId) => {
        const metrics = byArtist.get(artistId);
        const artist = artistMap.get(artistId);
        if (!metrics || !artist) return null;
        return {
          artistId,
          month,
          totalDownloads: metrics.totalDownloads,
          totalRevenue: metrics.totalRevenue,
          artist
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => {
        if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
        return b.totalDownloads - a.totalDownloads;
      })
      .map((row, index) => ({
        id: `${row.artistId}-${month}`,
        artistId: row.artistId,
        month,
        totalDownloads: row.totalDownloads,
        totalRevenue: row.totalRevenue,
        rank: index + 1,
        artist: row.artist
      }));

    // Persist monthly snapshot so the month can be reused/published consistently.
    await Promise.all(
      rows.map((row) =>
        this.prisma.artistRanking.upsert({
          where: { artistId_month: { artistId: row.artistId, month } },
          update: {
            totalDownloads: row.totalDownloads,
            totalRevenue: row.totalRevenue,
            rank: row.rank
          },
          create: {
            artistId: row.artistId,
            month,
            totalDownloads: row.totalDownloads,
            totalRevenue: row.totalRevenue,
            rank: row.rank
          }
        })
      )
    );

    return rows;
  }

  @Get()
  async getRankings(@Query("month") month?: string) {
    const targetMonth = month ?? this.currentMonthKey();
    const isCurrentMonth = targetMonth === this.currentMonthKey();

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

    if (rankings.length === 0 || isCurrentMonth) {
      return this.buildLiveRankings(targetMonth);
    }

    return rankings;
  }
}
