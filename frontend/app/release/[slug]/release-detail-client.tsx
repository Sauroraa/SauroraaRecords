"use client";

import { motion } from "framer-motion";
import { Download, ShoppingCart, Play, Pause, Disc3, Heart, ArrowLeft, Clock, Lock, Users, Globe, Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { usePlayerStore } from "@/store/player-store";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import type { ReleaseItem, CommentItem } from "@/lib/types";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { CommentThread } from "@/components/comment-thread";
import { ReleaseWaveform } from "@/components/release-waveform";
import { ArtistBadges } from "@/components/artist-badges";
import { FollowButton } from "@/components/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface ReleaseDetailClientProps {
  release: ReleaseItem;
  initialComments: CommentItem[];
}

export function ReleaseDetailClient({ release, initialComments }: ReleaseDetailClientProps) {
  const {
    setTrack,
    setPlaying,
    requestSeekPercent,
    releaseId: activeReleaseId,
    playing,
    currentTime,
    duration
  } = usePlayerStore();
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const [freeDownloadOpen, setFreeDownloadOpen] = useState(false);
  const [preordering, setPreordering] = useState(false);
  const [heatmap, setHeatmap] = useState<{ secondMark: number; count: number }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/engagement/heatmap/${release.id}`);
        if (res.ok) {
          const data = await res.json();
          setHeatmap(data);
        }
      } catch {}
    })();
  }, [release.id]);

  const artistName =
    release.artist?.displayName ?? release.artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";

  const isPreorder = release.releaseDate && new Date(release.releaseDate) > new Date();
  const genreLabel = release.genre ? release.genre.replace(/_/g, " ") : null;

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

  const isActiveTrack = activeReleaseId === release.id;
  const isCurrentlyPlaying = isActiveTrack && playing;
  const localProgress = isActiveTrack && duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (isActiveTrack) {
      setPlaying(!playing);
      return;
    }
    setTrack({ title: release.title, artist: artistName, src: release.audioPath, coverPath: release.coverPath ?? null, releaseId: release.id, releaseSlug: release.slug });
    setPlaying(true);
  };

  const handleSeek = (percent: number) => {
    if (!isActiveTrack) {
      setTrack({ title: release.title, artist: artistName, src: release.audioPath, coverPath: release.coverPath ?? null, releaseId: release.id, releaseSlug: release.slug });
      setPlaying(true);
    }
    requestSeekPercent(percent);
  };

  const handlePlayOrPause = () => {
    if (isCurrentlyPlaying) {
      setPlaying(false);
    } else {
      togglePlay();
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
              {genreLabel && (
                <Badge variant="gray">{genreLabel}</Badge>
              )}
              {release.exclusiveFollowersOnly && (
                <Badge variant="exclusive">Exclusive Drop</Badge>
              )}
              {isPreorder && (
                <Badge variant="gray">Pre-order</Badge>
              )}
              {release.bpm && (
                <Badge variant="gray">{release.bpm} BPM</Badge>
              )}
              {release.musicalKey && (
                <Badge variant="gray">{release.musicalKey}</Badge>
              )}
              {release.previewDuration && release.previewDuration !== 30 && (
                <Badge variant="gray">{release.previewDuration}s preview</Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-cream">{release.title}</h1>
            {release.artist && (
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/artist/${release.artist.id}`}>
                  <p className="text-lg text-cream/60 hover:text-cream transition-colors">{artistName}</p>
                </Link>
                <ArtistBadges artist={release.artist} size="sm" />
              </div>
            )}
          </div>

          {release.description && (
            <p className="text-sm text-cream/60 leading-relaxed max-w-lg">{release.description}</p>
          )}

          {/* Waveform / Play bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayOrPause}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet text-white hover:bg-violet-hover transition-colors shadow-violet"
              >
                {isCurrentlyPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream">{release.title}</p>
                <p className="text-xs text-cream/50 mt-0.5">{artistName}</p>
              </div>
            </div>
            <ReleaseWaveform
              src={release.audioPath}
              title={release.title}
              progressPercent={localProgress}
              currentTime={isActiveTrack ? currentTime : 0}
              duration={isActiveTrack ? duration : 0}
              onSeekPercent={handleSeek}
            />
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

          {/* Artist profile card */}
          {release.artist && (
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface2 shrink-0">
                  {release.artist.avatar ? (
                    <Image src={release.artist.avatar} alt={artistName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet/40">
                      {artistName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cream truncate">{artistName}</p>
                  <div className="mt-1">
                    <FollowButton artistId={release.artist.id} />
                  </div>
                </div>
                <Link href={`/artist/${release.artist.id}`} className="ml-auto">
                  <Button size="sm" variant="outline">View profile</Button>
                </Link>
              </div>

              {release.artist.bio && (
                <p className="text-sm text-cream/60 leading-relaxed">{release.artist.bio}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {release.artist.instagramUrl && (
                  <a href={release.artist.instagramUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="gap-1.5">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Button>
                  </a>
                )}
                {release.artist.websiteUrl && (
                  <a href={release.artist.websiteUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="gap-1.5">
                      <Globe className="h-4 w-4" />
                      Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Heatmap */}
      {heatmap.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.06)] pt-10">
          <h3 className="text-lg font-semibold text-cream mb-4">Listening Heatmap</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={heatmap}>
              <XAxis dataKey="secondMark" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
