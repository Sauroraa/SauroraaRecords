import { Controller, Get, Query } from "@nestjs/common";
import { FreeDownloadActionType } from "@prisma/client";
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

    const [artists, sessions, shares] = await Promise.all([
      this.prisma.artist.findMany({
        include: { user: { select: { email: true } } }
      }),
      this.prisma.freeDownloadSession.findMany({
        where: {
          createdAt: { gte: start, lt: end }
        },
        select: {
          release: { select: { artistId: true } },
          dubpack: { select: { artistId: true } }
        }
      }),
      this.prisma.freeDownloadAction.findMany({
        where: {
          action: FreeDownloadActionType.SHARE_LINK,
          completedAt: { not: null },
          session: {
            createdAt: { gte: start, lt: end }
          }
        },
        select: {
          session: {
            select: {
              release: { select: { artistId: true } },
              dubpack: { select: { artistId: true } }
            }
          }
        }
      })
    ]);

    const byArtist = new Map<string, { totalViews: number; totalDownloads: number; totalShares: number }>();
    for (const artist of artists) {
      byArtist.set(artist.id, { totalViews: 0, totalDownloads: 0, totalShares: 0 });
    }

    for (const session of sessions) {
      const artistId = session.release?.artistId ?? session.dubpack?.artistId ?? null;
      if (!artistId) continue;
      const current = byArtist.get(artistId) ?? { totalViews: 0, totalDownloads: 0, totalShares: 0 };
      current.totalViews += 1;
      current.totalDownloads += 1;
      byArtist.set(artistId, current);
    }

    for (const share of shares) {
      const artistId = share.session.release?.artistId ?? share.session.dubpack?.artistId ?? null;
      if (!artistId) continue;
      const current = byArtist.get(artistId) ?? { totalViews: 0, totalDownloads: 0, totalShares: 0 };
      current.totalShares += 1;
      byArtist.set(artistId, current);
    }

    const rows = artists
      .map((artistId) => {
        const artist = artistId;
        const metrics = byArtist.get(artist.id);
        if (!metrics || !artist) return null;
        const score = metrics.totalViews + metrics.totalDownloads * 2 + metrics.totalShares * 3;
        return {
          artistId: artist.id,
          month,
          totalViews: metrics.totalViews,
          totalDownloads: metrics.totalDownloads,
          totalShares: metrics.totalShares,
          score,
          artist
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
        if (b.totalDownloads !== a.totalDownloads) return b.totalDownloads - a.totalDownloads;
        return b.totalShares - a.totalShares;
      })
      .map((row, index) => ({
        id: `${row.artistId}-${month}`,
        artistId: row.artistId,
        month,
        totalViews: row.totalViews,
        totalDownloads: row.totalDownloads,
        totalShares: row.totalShares,
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
            // keep compatibility with existing schema; store engagement score.
            totalRevenue: row.totalViews + row.totalDownloads * 2 + row.totalShares * 3,
            rank: row.rank
          },
          create: {
            artistId: row.artistId,
            month,
            totalDownloads: row.totalDownloads,
            totalRevenue: row.totalViews + row.totalDownloads * 2 + row.totalShares * 3,
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

    return rankings.map((row) => ({
      ...row,
      totalViews: row.totalDownloads,
      totalShares: 0
    }));
  }
}
