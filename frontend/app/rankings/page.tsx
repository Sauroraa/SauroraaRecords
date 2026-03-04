"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRankings } from "@/lib/api";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Eye, Share2, Trophy, Download, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { RankingItem } from "@/lib/types";

export default function RankingsPage() {
  const { t } = useLanguage();
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const { data: rankings = [], isLoading } = useQuery<RankingItem[]>({
    queryKey: ["rankings", selectedMonth],
    queryFn: () => fetchRankings(selectedMonth),
    refetchInterval: selectedMonth === currentMonth ? 15000 : false
  });

  const monthLabel = useMemo(
    () =>
      new Date(`${selectedMonth}-01T00:00:00.000Z`).toLocaleString("fr-BE", {
        month: "long",
        year: "numeric"
      }),
    [selectedMonth]
  );
  const top3 = rankings.slice(0, 3);
  const maxScore = rankings[0]
    ? (rankings[0].totalViews ?? rankings[0].totalDownloads) +
      rankings[0].totalDownloads * 2 +
      (rankings[0].totalShares ?? 0) * 3
    : 1;

  // Podium order: 2nd | 1st | 3rd
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;
  const podiumHeights = [140, 200, 110];
  const podiumColors = ["text-slate-300", "text-yellow-400", "text-orange-400"];
  const podiumBg = ["border-slate-400/30", "border-yellow-400/40", "border-orange-400/30"];
  const podiumGlow = ["", "shadow-[0_0_40px_rgba(250,204,21,0.12)]", ""];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="space-y-16">
      {/* Header */}
      <div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-1">
          <Trophy className="h-6 w-6 text-violet-light" />
          <h1 className="text-3xl font-bold text-cream">{t.rankings.title}</h1>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-cream/50 capitalize">
            {t.rankings.sub_prefix} {monthLabel}
          </motion.p>
          <input
            type="month"
            value={selectedMonth}
            max={currentMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface px-3 py-1.5 text-xs text-cream/85 outline-none transition-colors focus:border-violet/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-52 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface"
        >
          <div className="text-center">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-cream/10" />
            <p className="text-sm text-cream/30">{t.rankings.empty}</p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── PODIUM (top 3) ── */}
          {top3.length >= 2 && (
            <section>
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map((item, idx) => {
                  if (!item) return null;
                  const name = item.artist?.displayName ?? "Artist";
                  const views = item.totalViews ?? item.totalDownloads;
                  const shares = item.totalShares ?? 0;
                  const score = views + item.totalDownloads * 2 + shares * 3;
                  const height = podiumHeights[idx];
                  const isFirst = idx === 1; // center = #1

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col items-center gap-3"
                    >
                      {/* Avatar */}
                      <div className={`relative h-16 w-16 overflow-hidden rounded-full border-2 ${podiumBg[idx]} ${podiumGlow[idx]} ${isFirst ? "h-20 w-20" : ""}`}>
                        {item.artist?.avatar ? (
                          <Image src={item.artist.avatar} alt={name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface2 text-xl font-bold text-violet/40">
                            {name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-base leading-none`}>
                          {medals[idx]}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <Link href={`/artist/${item.artist?.id ?? ""}`}>
                          <p className={`text-sm font-bold ${isFirst ? "text-cream" : "text-cream/70"} hover:text-violet-light transition-colors`}>
                            {name}
                          </p>
                        </Link>
                        <p className={`text-xs font-semibold mt-0.5 ${podiumColors[idx]}`}>
                          {score.toLocaleString()} pts
                        </p>
                      </div>

                      {/* Bar */}
                      <div className={`relative w-28 overflow-hidden rounded-t-xl border-t border-x ${podiumBg[idx]} bg-surface ${podiumGlow[idx]}`} style={{ height }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.9, delay: 0.2 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className={`absolute bottom-0 left-0 right-0 ${
                            isFirst
                              ? "bg-gradient-to-t from-yellow-500/20 to-yellow-400/5"
                              : idx === 0
                              ? "bg-gradient-to-t from-slate-400/15 to-transparent"
                              : "bg-gradient-to-t from-orange-400/15 to-transparent"
                          }`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className={`text-2xl font-black ${isFirst ? "text-yellow-400/30" : "text-cream/10"}`}>
                            #{idx === 1 ? 1 : idx === 0 ? 2 : 3}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── LEADERBOARD (all ranks) ── */}
          <section className="space-y-3">
            {rankings.map((item, i) => {
              const name = item.artist?.displayName ?? "Artist";
              const views = item.totalViews ?? item.totalDownloads;
              const shares = item.totalShares ?? 0;
              const score = views + item.totalDownloads * 2 + shares * 3;
              const barWidth = maxScore > 0 ? (score / maxScore) * 100 : 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/artist/${item.artist?.id ?? ""}`}
                    className="group flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface p-4 hover:border-violet/30 transition-all duration-300"
                  >
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {i === 0 ? <span className="text-xl">🥇</span>
                       : i === 1 ? <span className="text-xl">🥈</span>
                       : i === 2 ? <span className="text-xl">🥉</span>
                       : <span className="text-sm font-bold text-cream/35">#{item.rank || i + 1}</span>}
                    </div>

                    {/* Avatar */}
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface2 border border-[rgba(255,255,255,0.06)]">
                      {item.artist?.avatar ? (
                        <Image src={item.artist.avatar} alt={name} width={44} height={44} className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-base font-bold text-violet/40">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cream group-hover:text-violet-light transition-colors">
                        {name}
                      </p>
                      <div className="mt-1.5 relative h-1 rounded-full bg-surface2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet to-violet-light"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right hidden md:block">
                        <div className="flex items-center gap-1 text-xs text-cream/40">
                          <Eye className="h-3 w-3" />
                          <span>{views.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-cream/40">
                          <Download className="h-3 w-3" />
                          <span>{item.totalDownloads.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1 text-xs text-cream/40">
                          <Share2 className="h-3 w-3" />
                          <span>{shares.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-violet-light" />
                          <span className="text-sm font-bold text-cream">{score.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-end gap-0.5 text-[10px] text-violet-light mt-0.5">
                          <span>Score</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
