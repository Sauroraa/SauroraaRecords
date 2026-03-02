"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReleases, fetchDubpacks } from "@/lib/api";
import { ReleaseCard } from "@/components/release-card";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { useState } from "react";
import type { ReleaseItem } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

export default function ShopPage() {
  const [freeDownload, setFreeDownload] = useState<ReleaseItem | null>(null);

  const { data: releases = [] } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const paidReleases = releases.filter((r) => r.type === "PAID");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="h-6 w-6 text-violet-light" />
          <h1 className="text-3xl font-bold text-cream">Shop</h1>
        </div>
        <p className="text-sm text-cream/50">Purchase releases and dubpacks securely via Stripe</p>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {paidReleases.map((r, i) => (
          <ReleaseCard key={r.id} release={r} index={i} />
        ))}
        {paidReleases.length === 0 && (
          <div className="col-span-4 flex h-48 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
            <p className="text-sm text-cream/30">No paid releases available yet</p>
          </div>
        )}
      </div>

      <FreeDownloadModal
        release={freeDownload ?? undefined}
        open={!!freeDownload}
        onClose={() => setFreeDownload(null)}
      />
    </div>
  );
}
