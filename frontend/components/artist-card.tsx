"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ArtistProfile } from "@/lib/types";

interface ArtistCardProps {
  artist: ArtistProfile;
  followerCount?: number;
  index?: number;
}

export function ArtistCard({ artist, followerCount = 0, index = 0 }: ArtistCardProps) {
  const name = artist.displayName ?? artist.user?.email?.split("@")[0] ?? "Artist";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group shrink-0 w-40"
    >
      <Link href={`/artist/${artist.id}`}>
        <div className="relative h-40 w-40 overflow-hidden rounded-[16px] bg-surface2">
          {artist.avatar ? (
            <Image
              src={artist.avatar}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2 text-4xl font-bold text-violet/40">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-2.5 text-center">
          <p className="text-sm font-medium text-cream/90 group-hover:text-cream transition-colors truncate">
            {name}
          </p>
          <p className="flex items-center justify-center gap-1 text-xs text-cream/40 mt-0.5">
            <Users className="h-3 w-3" />
            {followerCount.toLocaleString()}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
