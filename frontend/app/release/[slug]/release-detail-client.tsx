"use client";

import { motion } from "framer-motion";
import { Download, ShoppingCart, Play, Disc3, Heart, ArrowLeft, Clock, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { usePlayerStore } from "@/store/player-store";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import type { ReleaseItem, CommentItem } from "@/lib/types";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { CommentThread } from "@/components/comment-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface ReleaseDetailClientProps {
  release: ReleaseItem;
  initialComments: CommentItem[];
}

export function ReleaseDetailClient({ release, initialComments }: ReleaseDetailClientProps) {
  const { setTrack, setPlaying, src, playing } = usePlayerStore();
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const [freeDownloadOpen, setFreeDownloadOpen] = useState(false);
  const [preordering, setPreordering] = useState(false);

  const artistName =
    release.artist?.displayName ?? release.artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";

  const isPreorder = release.releaseDate && new Date(release.releaseDate) > new Date();

  const handlePreorder = async () => {
    if (!user) { toast.error("Sign in to pre-order"); return; }
    setPreordering(true);
    try {
      const res = await fetch(`${API}/preorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId: release.id })
      });
      if (!res.ok) throw new Error();
      toast.success("Pre-order confirmed! You'll be notified on release day.");
    } catch {
      toast.error("Failed to pre-order");
    } finally {
      setPreordering(false);
    }
  };

  const isCurrentlyPlaying = src === release.audioPath && playing;

  const togglePlay = () => {
    if (isCurrentlyPlaying) {
      setPlaying(false);
    } else {
      setTrack({ title: release.title, artist: artistName, src: release.audioPath });
      setPlaying(true);
    }
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

  return (
    <div className="space-y-12">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-cream transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Releases
      </Link>

      <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square w-full max-w-md"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-surface2 shadow-violet-lg">
            {release.coverPath ? (
              <Image src={release.coverPath} alt={release.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2">
                <Disc3 className="h-24 w-24 text-violet/30" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Exclusive gate */}
          {release.exclusiveFollowersOnly && (
            <div className="rounded-[12px] border border-violet/30 bg-violet/10 p-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-violet-light shrink-0" />
              <div>
                <p className="text-sm font-medium text-cream">Exclusive Follower Drop</p>
                <p className="text-xs text-cream/60 mt-0.5">
                  Follow the artist to unlock this release.{" "}
                  {release.artist && (
                    <Link href={`/artist/${release.artist.id}`} className="text-violet-light hover:underline">
                      View artist
                    </Link>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={release.type === "FREE" ? "green" : "violet"}>
                {release.type === "FREE" ? "Free" : `€${Number(release.price).toFixed(2)}`}
              </Badge>
              {release.exclusiveFollowersOnly && (
                <Badge variant="exclusive">Exclusive Drop</Badge>
              )}
              {isPreorder && (
                <Badge variant="gray">Pre-order</Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-cream">{release.title}</h1>
            {release.artist && (
              <Link href={`/artist/${release.artist.id}`}>
                <p className="text-lg text-cream/60 hover:text-cream transition-colors">{artistName}</p>
              </Link>
            )}
          </div>

          {release.description && (
            <p className="text-sm text-cream/60 leading-relaxed max-w-lg">{release.description}</p>
          )}

          {/* Waveform / Play bar */}
          <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet text-white hover:bg-violet-hover transition-colors shadow-violet"
              >
                <Play className={`h-5 w-5 translate-x-px ${isCurrentlyPlaying ? "hidden" : ""}`} />
                {isCurrentlyPlaying && (
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-4 w-1 rounded-full bg-white animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream">{release.title}</p>
                <p className="text-xs text-cream/50 mt-0.5">{artistName}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {isPreorder ? (
              <>
                <Button onClick={() => void handlePreorder()} disabled={preordering} className="gap-2">
                  <Clock className="h-4 w-4" />
                  {preordering ? "Processing..." : `Pre-order — €${Number(release.price).toFixed(2)}`}
                </Button>
                <p className="w-full text-xs text-cream/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Releases {new Date(release.releaseDate!).toLocaleDateString("en-BE", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </>
            ) : release.type === "FREE" ? (
              <Button onClick={() => setFreeDownloadOpen(true)} className="gap-2">
                <Download className="h-4 w-4" />
                Download Free
              </Button>
            ) : (
              <Button onClick={handleBuy} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Buy — €{Number(release.price).toFixed(2)}
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorite
            </Button>
          </div>

          {release.createdAt && (
            <p className="text-xs text-cream/30">
              Released {new Date(release.createdAt).toLocaleDateString("en-BE", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </motion.div>
      </div>

      {/* Comments */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-10">
        <CommentThread
          releaseId={release.id}
          comments={initialComments}
        />
      </div>

      <FreeDownloadModal
        release={release}
        open={freeDownloadOpen}
        onClose={() => setFreeDownloadOpen(false)}
      />
    </div>
  );
}
