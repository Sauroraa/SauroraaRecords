"use client";

import { BadgeCheck, Star, Building2 } from "lucide-react";
import type { ArtistProfile } from "@/lib/types";

interface ArtistBadgesProps {
  artist: ArtistProfile;
  size?: "sm" | "md";
}

export function ArtistBadges({ artist, size = "md" }: ArtistBadgesProps) {
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const px = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";

  const plan = artist.subscription?.plan ?? null;
  const agencyName = artist.agencyLinks?.[0]?.agency?.displayName ?? null;

  const badges: { label: string; icon: React.ReactNode; className: string }[] = [];

  if (artist.isVerified) {
    badges.push({
      label: "Vérifié",
      icon: <BadgeCheck size={iconSize} />,
      className: "bg-blue-600/20 text-blue-400 border border-blue-500/30"
    });
  }

  if (plan === "ARTIST_PRO") {
    badges.push({
      label: "Pro",
      icon: <Star size={iconSize} />,
      className: "bg-violet-600/20 text-violet-300 border border-violet-500/30"
    });
  } else if (plan === "ARTIST_BASIC") {
    badges.push({
      label: "Basic",
      icon: <Star size={iconSize} />,
      className: "bg-zinc-700/40 text-zinc-300 border border-zinc-600/30"
    });
  } else if (plan === "AGENCY_PRO" || plan === "AGENCY_START") {
    badges.push({
      label: "Agency",
      icon: <Building2 size={iconSize} />,
      className: "bg-amber-600/20 text-amber-300 border border-amber-500/30"
    });
  }

  if (agencyName) {
    badges.push({
      label: agencyName,
      icon: <Building2 size={iconSize} />,
      className: "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center gap-1 rounded-full font-medium ${textSize} ${px} ${b.className}`}
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  );
}
