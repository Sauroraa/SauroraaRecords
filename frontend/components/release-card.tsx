"use client";

import { motion } from "framer-motion";
import { Play, ShoppingCart, Download, Disc3, ListPlus, Maximize2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ReleaseItem } from "@/lib/types";
import { usePlayerStore } from "@/store/player-store";
import { useCartStore } from "@/store/cart-store";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/language-context";

interface ReleaseCardProps {
  release: ReleaseItem;
  onDownloadFree?: (release: ReleaseItem) => void;
  index?: number;
}

function isSauroraaAgency(name?: string | null) {
  if (!name) return false;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized === "sauroraaagency" || normalized.includes("sauroraaagency");
}

export function ReleaseCard({ release, onDownloadFree, index = 0 }: ReleaseCardProps) {
  const { t } = useLanguage();
  const [hovering, setHovering] = useState(false);
  const { setTrack, setPlaying, addToQueue, openDetailPanel } = usePlayerStore();
  const { addItem, openCart } = useCartStore();
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artistName =
    release.artist?.displayName ?? release.artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";

  const trackPayload = {
    title: release.title,
    artist: artistName,
    src: release.previewClip ?? release.audioPath,
    coverPath: release.coverPath ?? null,
    releaseId: release.id,
    releaseSlug: release.slug,
  };

  const handleMouseEnter = () => {
    setHovering(true);
    previewTimeoutRef.current = setTimeout(() => {
      setTrack(trackPayload);
      setPlaying(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    setPlaying(false);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToQueue({
      title: release.title,
      artist: artistName,
      src: release.audioPath,
      coverPath: release.coverPath ?? null,
      releaseId: release.id,
      releaseSlug: release.slug,
    });
    toast.success(`"${release.title}" added to queue`, { duration: 2000 });
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDetailPanel(release.slug);
  };

  const handleBuy = () => {
    addItem({
      id: release.id,
      type: "release",
      title: release.title,
      artist: artistName,
      price: Number(release.price),
      coverPath: release.coverPath ?? null,
    });
    openCart();
  };

  const genreLabel = release.genre ? release.genre.replace(/_/g, " ") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative"
    >
      <Link href={`/release/${release.slug}`}>
        <div className="relative aspect-square w-full overflow-hidden rounded-[16px] bg-surface2">
          {release.coverPath ? (
            <Image
              src={release.coverPath}
              alt={release.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2">
              <Disc3 className="h-16 w-16 text-violet/30" />
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity duration-300 ${
              hovering ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet shadow-violet">
              <Play className="h-6 w-6 translate-x-px text-white" />
            </div>
          </div>

          {/* Quick actions (top-right on hover) */}
          <div
            className={`absolute right-2 top-2 flex flex-col gap-1.5 transition-all duration-200 ${
              hovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <button
              onClick={handleOpenDetail}
              title="Track details"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-cream/80 hover:text-violet-light transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleAddToQueue}
              title="Add to queue"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-cream/80 hover:text-violet-light transition-colors"
            >
              <ListPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute left-2 top-2 flex gap-1 flex-wrap">
            <Badge variant={release.type === "FREE" ? "green" : "violet"}>
              {release.type === "FREE" ? "Free" : `€${Number(release.price).toFixed(2)}`}
            </Badge>
            {genreLabel && <Badge variant="gray">{genreLabel}</Badge>}
            {release.artist?.agencyLinks && release.artist.agencyLinks.length > 0 && (
              <Badge variant="gray" className="!bg-amber-500/20 !text-amber-300 !border-amber-500/30">
                {release.artist.agencyLinks.some((link) => isSauroraaAgency(link.agency?.displayName)) ? "SauroraaAgency" : "Agency"}
              </Badge>
            )}
            {release.exclusiveFollowersOnly && <Badge variant="exclusive">Exclusive</Badge>}
          </div>
        </div>
      </Link>

      <div className="mt-3 space-y-1">
        <Link href={`/release/${release.slug}`}>
          <h3 className="text-sm font-semibold text-cream hover:text-violet-light transition-colors truncate">
            {release.title}
          </h3>
        </Link>
        {release.artist && (
          <Link href={`/artist/${release.artist.slug ?? release.artist.id}`}>
            <p className="text-xs text-cream/50 hover:text-cream/70 transition-colors">{artistName}</p>
          </Link>
        )}
        {(release.bpm || release.musicalKey) && (
          <p className="text-[10px] text-cream/30 font-mono">
            {[release.bpm && `${release.bpm} BPM`, release.musicalKey].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {release.type === "FREE" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadFree?.(release)}
              className="flex-1 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {t.common.download}
            </Button>
          ) : (
            <Button size="sm" onClick={handleBuy} className="flex-1 gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              {t.common.buy}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
