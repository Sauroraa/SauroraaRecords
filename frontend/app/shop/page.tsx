"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReleases, fetchDubpacks } from "@/lib/api";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Disc3, Package, ArrowUpDown, ShoppingCart, Layers
} from "lucide-react";
import type { ReleaseItem } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { FreeDownloadModal } from "@/components/free-download-modal";
import toast from "react-hot-toast";

type Filter = "all" | "releases" | "dubpacks";
type Sort = "latest" | "price_asc" | "price_desc";

type ShopItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  kind: "release" | "dubpack";
  coverPath?: string | null;
  artist?: { displayName?: string | null };
  createdAt?: string;
};

export default function ShopPage() {
  const { t } = useLanguage();
  const { addItem } = useCartStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [freeRelease, setFreeRelease] = useState<ReleaseItem | null>(null);

  const { data: releases = [], isLoading: loadingR } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const { data: dubpacks = [], isLoading: loadingD } = useQuery({
    queryKey: ["dubpacks"],
    queryFn: fetchDubpacks
  });

  const loading = loadingR || loadingD;

  const items = useMemo<ShopItem[]>(() => {
    const r: ShopItem[] = releases
      .filter((x) => x.type === "PAID")
      .map((x) => ({
        id: x.id, slug: x.slug, title: x.title,
        price: Number(x.price), kind: "release" as const,
        coverPath: x.coverPath, artist: x.artist, createdAt: x.createdAt ?? undefined
      }));

    const d: ShopItem[] = dubpacks
      .filter((x) => x.type === "PAID")
      .map((x) => ({
        id: x.id, slug: x.slug, title: x.title,
        price: Number(x.price), kind: "dubpack" as const,
        coverPath: x.coverPath, artist: x.artist, createdAt: x.createdAt ?? undefined
      }));

    let merged = filter === "releases" ? r : filter === "dubpacks" ? d : [...r, ...d];
    if (sort === "price_asc") merged = [...merged].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") merged = [...merged].sort((a, b) => b.price - a.price);
    return merged;
  }, [releases, dubpacks, filter, sort]);

  const handleBuy = (item: ShopItem) => {
    if (item.kind === "release") {
      const release = releases.find((r) => r.id === item.id);
      if (!release) return;
      if (release.type === "FREE") { setFreeRelease(release); return; }
    }
    addItem({ id: item.id, type: item.kind, title: item.title, price: item.price, artist: item.artist?.displayName ?? "Artist", coverPath: item.coverPath ?? null });
    toast.success("Ajouté au panier");
  };

  const filters: { key: Filter; label: string; icon: React.ElementType }[] = [
    { key: "all", label: t.shop.filter_all, icon: Layers },
    { key: "releases", label: t.shop.filter_releases, icon: Disc3 },
    { key: "dubpacks", label: t.shop.filter_dubpacks, icon: Package }
  ];

  const sorts: { key: Sort; label: string }[] = [
    { key: "latest", label: t.shop.sort_latest },
    { key: "price_asc", label: t.shop.sort_price_asc },
    { key: "price_desc", label: t.shop.sort_price_desc }
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-1">
          <ShoppingBag className="h-6 w-6 text-violet-light" />
          <h1 className="text-3xl font-bold text-cream">{t.shop.title}</h1>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-cream/50">
          {t.shop.sub}
        </motion.p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="relative flex items-center gap-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors z-10 ${
                filter === f.key ? "text-white" : "text-cream/50 hover:text-cream/80"
              }`}
            >
              {filter === f.key && (
                <motion.div
                  layoutId="shop-filter-bg"
                  className="absolute inset-0 rounded-lg bg-violet"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <f.icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-cream/30" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-surface border border-[rgba(255,255,255,0.08)] text-cream/70 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet/40 transition-colors"
          >
            {sorts.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-surface animate-pulse" />
            ))}
          </motion.div>
        ) : items.length > 0 ? (
          <motion.div key={filter + sort} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <ShopCard item={item} onBuy={() => handleBuy(item)} badgeRelease={t.shop.badge_release} badgeDubpack={t.shop.badge_dubpack} addLabel={t.shop.add_cart} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex h-52 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface">
            <div className="text-center">
              <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-cream/10" />
              <p className="text-sm text-cream/30">{t.shop.empty}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FreeDownloadModal release={freeRelease ?? undefined} open={!!freeRelease} onClose={() => setFreeRelease(null)} />
    </div>
  );
}

function ShopCard({ item, onBuy, badgeRelease, badgeDubpack, addLabel }: {
  item: ShopItem; onBuy: () => void;
  badgeRelease: string; badgeDubpack: string; addLabel: string;
}) {
  const href = item.kind === "release" ? `/release/${item.slug}` : `/dubpack/${item.slug}`;

  return (
    <div className="group flex flex-col rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface overflow-hidden hover:border-violet/30 transition-all duration-300">
      <Link href={href} className="relative aspect-square block overflow-hidden bg-surface2">
        {item.coverPath ? (
          <Image src={item.coverPath} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {item.kind === "release" ? <Disc3 className="h-10 w-10 text-violet/20" /> : <Package className="h-10 w-10 text-violet/20" />}
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            item.kind === "dubpack"
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-violet/20 text-violet-light border border-violet/30"
          }`}>
            {item.kind === "release" ? badgeRelease : badgeDubpack}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-cream">
            €{item.price.toFixed(2)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <Link href={href}>
            <p className="text-sm font-semibold text-cream truncate hover:text-violet-light transition-colors">{item.title}</p>
          </Link>
          <p className="text-xs text-cream/40 truncate mt-0.5">{item.artist?.displayName ?? "Sauroraa Artist"}</p>
        </div>
        <Button size="sm" onClick={onBuy} className="w-full gap-1.5 text-xs mt-1">
          <ShoppingCart className="h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
