"use client";

import { motion } from "framer-motion";
import { Play, ShoppingCart, Download, Disc3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ReleaseItem } from "@/lib/types";
import { usePlayerStore } from "@/store/player-store";
import { useCartStore } from "@/store/cart-store";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ReleaseCardProps {
  release: ReleaseItem;
  onDownloadFree?: (release: ReleaseItem) => void;
  index?: number;
}

export function ReleaseCard({ release, onDownloadFree, index = 0 }: ReleaseCardProps) {
  const [hovering, setHovering] = useState(false);
  const { setTrack, setPlaying } = usePlayerStore();
  const { addItem, openCart } = useCartStore();
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const artistName =
    release.artist?.displayName ?? release.artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";

  const handleMouseEnter = () => {
    setHovering(true);
    const src = release.previewClip ?? release.audioPath;
    previewTimeoutRef.current = setTimeout(() => {
      setTrack({ title: release.title, artist: artistName, src, coverPath: release.coverPath ?? null, releaseId: release.id });
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

  const handleBuy = () => {
    addItem({
      id: release.id,
      type: "release",
      title: release.title,
      artist: artistName,
      price: Number(release.price),
      coverPath: release.coverPath ?? null
    });
    openCart();
  };

  const genreLabel = release.genre ? release.genre.replace(/_/g, " ") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
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
          <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${hovering ? "opacity-100" : "opacity-0"}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet shadow-violet">
              <Play className="h-6 w-6 translate-x-px text-white" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge variant={release.type === "FREE" ? "green" : "violet"}>
              {release.type === "FREE" ? "Free" : `€${Number(release.price).toFixed(2)}`}
            </Badge>
            {genreLabel && (
              <Badge variant="gray">{genreLabel}</Badge>
            )}
            {release.exclusiveFollowersOnly && (
              <Badge variant="exclusive">Exclusive</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 space-y-1">
        <Link href={`/release/${release.slug}`}>
          <h3 className="text-sm font-semibold text-cream hover:text-violet-light transition-colors">
            {release.title}
          </h3>
        </Link>
        {release.artist && (
          <Link href={`/artist/${release.artist.id}`}>
            <p className="text-xs text-cream/50 hover:text-cream/70 transition-colors">{artistName}</p>
          </Link>
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
              Download
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleBuy}
              className="flex-1 gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
