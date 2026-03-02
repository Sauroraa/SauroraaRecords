"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Disc3, Package } from "lucide-react";
import { useState } from "react";
import type { ReleaseItem, ArtistProfile } from "@/lib/types";
import { ReleaseCard } from "./release-card";
import { ArtistCard } from "./artist-card";
import { FreeDownloadModal } from "./free-download-modal";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HomeHeroProps {
  releases: ReleaseItem[];
  artists: ArtistProfile[];
}

export function HomeHero({ releases, artists }: HomeHeroProps) {
  const [freeDownloadRelease, setFreeDownloadRelease] = useState<ReleaseItem | null>(null);
  const featured = releases[0];
  const latest = releases.slice(0, 8);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="flex min-h-[70vh] flex-col items-start justify-center gap-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="violet" className="mb-5">Sauroraa Records</Badge>
            <h1 className="text-5xl font-bold leading-[1.1] text-cream md:text-7xl">
              Pure Audio
              <span className="block text-violet-light">Experience</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-lg text-cream/60 leading-relaxed"
          >
            Releases, dubpacks & exclusive drops from Belgium&apos;s underground
            electronic scene.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Button asChild size="lg">
              <Link href="/catalog" className="gap-2">
                Explorer les sorties
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dubpacks" className="gap-2">
                <Package className="h-4 w-4" />
                Dubpacks
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Featured release */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-xs"
          >
            <ReleaseCard
              release={featured}
              onDownloadFree={setFreeDownloadRelease}
            />
          </motion.div>
        )}
      </section>

      {/* Latest Releases */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-cream">Latest Releases</h2>
          <Link
            href="/catalog"
            className="flex items-center gap-1.5 text-sm text-cream/50 hover:text-cream transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {latest.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {latest.map((release, i) => (
              <ReleaseCard
                key={release.id}
                release={release}
                onDownloadFree={setFreeDownloadRelease}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
            <div className="text-center">
              <Disc3 className="mx-auto mb-2 h-8 w-8 text-cream/20" />
              <p className="text-sm text-cream/30">No releases yet</p>
            </div>
          </div>
        )}
      </section>

      {/* Featured Artists */}
      {artists.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-cream">Artists</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {artists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] pb-4 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cream/50">
              Sauroraa Records
            </p>
            <p className="mt-1 text-xs text-cream/30">BE1031.598.463 — Belgium</p>
          </div>
          <div className="flex gap-6 text-xs text-cream/30">
            <Link href="/catalog" className="transition-colors hover:text-cream/60">Releases</Link>
            <Link href="/dubpacks" className="transition-colors hover:text-cream/60">Dubpacks</Link>
            <Link href="/shop" className="transition-colors hover:text-cream/60">Shop</Link>
            <Link href="/rankings" className="transition-colors hover:text-cream/60">Rankings</Link>
          </div>
        </div>
      </footer>

      {/* Free Download Modal */}
      <FreeDownloadModal
        release={freeDownloadRelease ?? undefined}
        open={!!freeDownloadRelease}
        onClose={() => setFreeDownloadRelease(null)}
      />
    </div>
  );
}
