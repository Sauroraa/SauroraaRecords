import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class SearchService {
  private readonly meiliUrl = process.env.MEILISEARCH_URL;
  private readonly meiliKey = process.env.MEILISEARCH_API_KEY;
  private readonly meiliIndex = process.env.MEILISEARCH_RELEASES_INDEX || "releases";

  constructor(private readonly prisma: PrismaService) {}

  async searchAll(q: string, limit = 10) {
    if (!q.trim()) return { releases: [], artists: [] };
    const [releases, artists] = await Promise.all([
      this.searchReleases(q, limit),
      this.searchArtists(q, 5)
    ]);
    return { releases, artists };
  }

  private async searchArtists(q: string, limit: number) {
    return this.prisma.artist.findMany({
      where: {
        displayName: { not: null, contains: q },
        releases: { some: { published: true } }
      },
      select: { id: true, displayName: true, avatar: true },
      take: Math.min(limit, 8)
    });
  }

  async searchReleases(q: string, limit = 20) {
    if (!q.trim()) return [];

    if (this.meiliUrl) {
      const meiliResults = await this.searchMeilisearch(q, limit);
      if (meiliResults) return meiliResults;
    }

    return this.searchDatabase(q, limit);
  }

  private async searchMeilisearch(q: string, limit: number) {
    try {
      const response = await fetch(`${this.meiliUrl}/indexes/${this.meiliIndex}/search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.meiliKey ? { authorization: `Bearer ${this.meiliKey}` } : {})
        },
        body: JSON.stringify({ q, limit })
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { hits?: unknown[] };
      return data.hits ?? [];
    } catch {
      return null;
    }
  }

  private async searchDatabase(q: string, limit: number) {
    return this.prisma.release.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q } },
          { genre: { contains: q } },
          { artist: { displayName: { contains: q } } },
          { description: { contains: q } },
          { mood: { contains: q } }
        ]
      },
      include: {
        artist: {
          select: { id: true, displayName: true, avatar: true, slug: true } as never
        }
      },
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: { createdAt: "desc" }
    });
  }
}
