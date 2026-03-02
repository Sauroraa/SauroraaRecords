import { fetchRankings } from "@/lib/api";
import { Trophy, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function RankingsPage() {
  const rankings = await fetchRankings();
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-violet-light" />
          <h1 className="text-3xl font-bold text-cream">Rankings</h1>
        </div>
        <p className="text-sm text-cream/50">{month} — Top artists by revenue & downloads</p>
      </div>

      {rankings.length > 0 ? (
        <div className="space-y-3">
          {rankings.map((item, i) => {
            const name = item.artist?.displayName ?? item.artist?.user?.email?.split("@")[0] ?? "Artist";
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <Link
                key={item.id}
                href={`/artist/${item.artist.id}`}
                className="flex items-center gap-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 transition-colors hover:border-violet-border"
              >
                <div className="w-10 text-center">
                  {i < 3 ? (
                    <span className="text-2xl">{medals[i]}</span>
                  ) : (
                    <span className="text-lg font-bold text-cream/40">#{item.rank}</span>
                  )}
                </div>

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface2">
                  {item.artist?.avatar ? (
                    <Image src={item.artist.avatar} alt={name} width={48} height={48} className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-violet/40">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cream">{name}</p>
                  <p className="text-xs text-cream/50">{item.totalDownloads} downloads</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-cream">€{Number(item.totalRevenue).toFixed(2)}</p>
                  <div className="flex items-center justify-end gap-1 text-xs text-violet-light">
                    <TrendingUp className="h-3 w-3" />
                    Revenue
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
          <div className="text-center">
            <Trophy className="mx-auto mb-2 h-10 w-10 text-cream/20" />
            <p className="text-sm text-cream/30">Rankings will appear at the end of each month</p>
          </div>
        </div>
      )}
    </div>
  );
}
