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

    const [artists, downloads, shares, streamEvents, comments, reposts] = await Promise.all([
      this.prisma.artist.findMany({
        include: { user: { select: { email: true } } }
      }),
      // Free download sessions (counts as download)
      this.prisma.freeDownloadSession.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: {
          release: { select: { artistId: true } },
          dubpack: { select: { artistId: true } }
        }
      }),
      // Share link actions
      this.prisma.freeDownloadAction.findMany({
        where: {
          action: FreeDownloadActionType.SHARE_LINK,
          completedAt: { not: null },
          session: { createdAt: { gte: start, lt: end } }
        },
        select: {
          session: {
            select: {
              release: { select: { artistId: true } },
              dubpack: { select: { artistId: true } }
            }
          }
        }
      }),
      // Stream events (actual plays from GlobalPlayer)
      this.prisma.streamEvent.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { release: { select: { artistId: true } } }
      }),
      // Comments on releases
      this.prisma.comment.findMany({
        where: { createdAt: { gte: start, lt: end }, releaseId: { not: null } },
        select: { release: { select: { artistId: true } } }
      }),
      // Reposts
      this.prisma.repost.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { release: { select: { artistId: true } } }
      })
    ]);

    const byArtist = new Map<string, { totalStreams: number; totalDownloads: number; totalShares: number; totalComments: number; totalReposts: number }>();
    for (const artist of artists) {
      byArtist.set(artist.id, { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 });
    }

    for (const session of downloads) {
      const artistId = session.release?.artistId ?? session.dubpack?.artistId ?? null;
      if (!artistId) continue;
      const cur = byArtist.get(artistId) ?? { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 };
      cur.totalDownloads += 1;
      byArtist.set(artistId, cur);
    }

    for (const share of shares) {
      const artistId = share.session.release?.artistId ?? share.session.dubpack?.artistId ?? null;
      if (!artistId) continue;
      const cur = byArtist.get(artistId) ?? { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 };
      cur.totalShares += 1;
      byArtist.set(artistId, cur);
    }

    for (const event of streamEvents) {
      const artistId = event.release?.artistId ?? null;
      if (!artistId) continue;
      const cur = byArtist.get(artistId) ?? { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 };
      cur.totalStreams += 1;
      byArtist.set(artistId, cur);
    }

    for (const comment of comments) {
      const artistId = comment.release?.artistId ?? null;
      if (!artistId) continue;
      const cur = byArtist.get(artistId) ?? { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 };
      cur.totalComments += 1;
      byArtist.set(artistId, cur);
    }

    for (const repost of reposts) {
      const artistId = repost.release?.artistId ?? null;
      if (!artistId) continue;
      const cur = byArtist.get(artistId) ?? { totalStreams: 0, totalDownloads: 0, totalShares: 0, totalComments: 0, totalReposts: 0 };
      cur.totalReposts += 1;
      byArtist.set(artistId, cur);
    }

    const rows = artists
      .map((artist) => {
        const metrics = byArtist.get(artist.id);
        if (!metrics) return null;
        // Score: streams=1pt, downloads=3pt, shares=5pt, comments=2pt, reposts=4pt
        const score =
          metrics.totalStreams * 1 +
          metrics.totalDownloads * 3 +
          metrics.totalShares * 5 +
          metrics.totalComments * 2 +
          metrics.totalReposts * 4;
        return {
          artistId: artist.id,
          month,
          totalStreams: metrics.totalStreams,
          totalDownloads: metrics.totalDownloads,
          totalShares: metrics.totalShares,
          totalComments: metrics.totalComments,
          totalReposts: metrics.totalReposts,
          score,
          artist
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null && row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row, index) => ({
        id: `${row.artistId}-${month}`,
        artistId: row.artistId,
        month,
        totalViews: row.totalStreams + row.totalDownloads,
        totalDownloads: row.totalDownloads,
        totalShares: row.totalShares,
        totalComments: row.totalComments,
        totalReposts: row.totalReposts,
        rank: index + 1,
        artist: row.artist
      }));

    await Promise.all(
      rows.map((row) =>
        this.prisma.artistRanking.upsert({
          where: { artistId_month: { artistId: row.artistId, month } },
          update: {
            totalDownloads: row.totalDownloads,
            totalRevenue: row.totalViews + row.totalDownloads * 3 + row.totalShares * 5,
            rank: row.rank
          },
          create: {
            artistId: row.artistId,
            month,
            totalDownloads: row.totalDownloads,
            totalRevenue: row.totalViews + row.totalDownloads * 3 + row.totalShares * 5,
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
