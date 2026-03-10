"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Download, ShoppingCart, Disc3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchDubpacks } from "@/lib/api";
import { useCartStore } from "@/store/cart-store";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import type { DubpackItem } from "@/lib/types";

export default function DubpacksPage() {
  const { t } = useLanguage();
  const [freeDownloadDubpack, setFreeDownloadDubpack] = useState<DubpackItem | null>(null);
  const { addItem, openCart } = useCartStore();

  const { data: dubpacks = [], isLoading } = useQuery({
    queryKey: ["dubpacks"],
    queryFn: fetchDubpacks
  });

  const handleBuy = (dp: DubpackItem) => {
    addItem({
      id: dp.id,
      type: "dubpack",
      title: dp.title,
      artist: dp.artist?.displayName ?? dp.artist?.user?.email?.split("@")[0] ?? t.common.artist,
      price: Number(dp.price),
      coverPath: dp.coverPath ?? null
    });
    openCart();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-6 w-6 text-violet-light" />
          <h1 className="text-3xl font-bold text-cream">{t.dubpacks.title}</h1>
        </div>
        <p className="text-sm text-cream/50">{t.dubpacks.sub}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-[16px] bg-surface2 animate-pulse" />
          ))}
        </div>
      ) : dubpacks.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {dubpacks.map((dp, i) => {
            const artistName = dp.artist?.displayName ?? dp.artist?.user?.email?.split("@")[0] ?? t.common.artist;
            return (
              <motion.div
                key={dp.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group"
              >
                <Link href={`/dubpack/${dp.slug}`}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-[16px] bg-surface2">
                    {dp.coverPath ? (
                      <Image
                        src={dp.coverPath}
                        alt={dp.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2">
                        <Package className="h-16 w-16 text-violet/30" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Badge variant="violet">{t.dubpacks.badge}</Badge>
                      {dp.genre && <Badge variant="gray">{dp.genre.replace(/_/g, " ")}</Badge>}
                      {dp.isExclusive && <Badge variant="exclusive">{t.common.exclusive}</Badge>}
                    </div>
                  </div>
                </Link>

                <div className="mt-3 space-y-1">
                  <Link href={`/dubpack/${dp.slug}`}>
                    <h3 className="text-sm font-semibold text-cream hover:text-violet-light transition-colors">
                      {dp.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-cream/50">{artistName}</p>

                  <div className="pt-1">
                    {dp.type === "FREE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFreeDownloadDubpack(dp)}
                        className="w-full gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t.common.download}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleBuy(dp)}
                        className="w-full gap-1.5"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        €{Number(dp.price).toFixed(2)}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
          <div className="text-center">
            <Package className="mx-auto mb-2 h-10 w-10 text-cream/20" />
            <p className="text-sm text-cream/30">{t.dubpacks.empty}</p>
          </div>
        </div>
      )}

      <FreeDownloadModal
        dubpack={freeDownloadDubpack ?? undefined}
        open={!!freeDownloadDubpack}
        onClose={() => setFreeDownloadDubpack(null)}
      />
    </div>
  );
}
