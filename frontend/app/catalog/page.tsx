"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchReleases } from "@/lib/api";
import { ReleaseCard } from "@/components/release-card";
import { FreeDownloadModal } from "@/components/free-download-modal";
import type { ReleaseItem } from "@/lib/types";

type Filter = "ALL" | "FREE" | "PAID";

export default function CatalogPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [freeDownloadRelease, setFreeDownloadRelease] = useState<ReleaseItem | null>(null);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const filtered = releases.filter((r) => {
    if (filter === "FREE") return r.type === "FREE";
    if (filter === "PAID") return r.type === "PAID";
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-cream">Releases</h1>
        <p className="mt-1 text-sm text-cream/50">All releases from Sauroraa artists</p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 rounded-sm border border-[rgba(255,255,255,0.08)] bg-surface p-1 w-fit">
        {(["ALL", "FREE", "PAID"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-sm px-4 py-1.5 text-sm transition-colors ${
              filter === f
                ? "bg-violet text-white"
                : "text-cream/50 hover:text-cream"
            }`}
          >
            {f === "ALL" ? "All" : f === "FREE" ? "Free" : "Paid"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-[16px] bg-surface2 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((release, i) => (
            <ReleaseCard
              key={release.id}
              release={release}
              onDownloadFree={setFreeDownloadRelease}
              index={i}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-cream/40">No releases found.</p>
      )}

      <FreeDownloadModal
        release={freeDownloadRelease ?? undefined}
        open={!!freeDownloadRelease}
        onClose={() => setFreeDownloadRelease(null)}
      />
    </div>
  );
}
