"use client";

import {
  X, Play, Pause, Heart, Repeat2, Share2, Flag, ShoppingCart,
  Download, ExternalLink, Disc3, Instagram, Globe,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayerStore } from "@/store/player-store";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { fetchRelease } from "@/lib/api";
import { ReleaseWaveform } from "./release-waveform";
import { CommentThread } from "./comment-thread";
import { ShareModal } from "./share-modal";
import { ReportModal } from "./report-modal";
import { FollowButton } from "./follow-button";
import { ArtistBadges } from "./artist-badges";
import { Badge } from "./ui/badge";
import { FreeDownloadModal } from "./free-download-modal";
import type { ReleaseItem, CommentItem } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export function TrackDetailPanel() {
  const {
    detailPanelOpen, detailPanelReleaseSlug, closeDetailPanel,
    src, playing, setTrack, setPlaying, requestSeekPercent, currentTime, duration,
  } = usePlayerStore();
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();

  const [release, setRelease] = useState<ReleaseItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [freeDownloadOpen, setFreeDownloadOpen] = useState(false);

  useEffect(() => {
    if (!detailPanelOpen || !detailPanelReleaseSlug) {
      setRelease(null);
      return;
    }

    setLoading(true);
    setComments([]);
    void (async () => {
      const rel = await fetchRelease(detailPanelReleaseSlug);
      setRelease(rel);
      if (rel) {
        try {
          const res = await fetch(`${API}/comments?releaseId=${rel.id}`, {
            credentials: "include",
          });
          if (res.ok) setComments((await res.json()) as CommentItem[]);
        } catch {}
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailPanelOpen, detailPanelReleaseSlug]);

  if (!detailPanelOpen) return null;

  const artistName =
    release?.artist?.displayName ??
    release?.artist?.user?.email?.split("@")[0] ??
    "Sauroraa Artist";

  const isActiveTrack = !!release && src === release.audioPath;
  const isCurrentlyPlaying = isActiveTrack && playing;
  const localProgress =
    isActiveTrack && duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    if (!release) return;
    if (isActiveTrack) {
      setPlaying(!playing);
    } else {
      setTrack({
        title: release.title,
        artist: artistName,
        src: release.audioPath,
        coverPath: release.coverPath ?? null,
        releaseId: release.id,
        releaseSlug: release.slug,
      });
      setPlaying(true);
    }
  };

  const handleSeek = (pct: number) => {
    if (!release) return;
    if (!isActiveTrack) {
      setTrack({
        title: release.title,
        artist: artistName,
        src: release.audioPath,
        coverPath: release.coverPath ?? null,
        releaseId: release.id,
        releaseSlug: release.slug,
      });
      setPlaying(true);
    }
    requestSeekPercent(pct);
  };

  const handleRepost = async () => {
    if (!release || !user) return;
    try {
      await fetch(`${API}/ecosystem/reposts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId: release.id }),
      });
    } catch {}
  };

  const genreLabel = release?.genre?.replace(/_/g, " ");

  return (
    <AnimatePresence>
      {detailPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeDetailPanel}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[480px] flex-col overflow-hidden border-l border-[rgba(255,255,255,0.08)] bg-[#07070b] shadow-2xl"
            style={{ paddingBottom: "80px" }} /* clear global player */
          >
            {/* Banner */}
            <div className="relative h-52 shrink-0 overflow-hidden">
              {/* Blurred background */}
              {release?.coverPath && (
                <Image
                  src={release.coverPath}
                  alt=""
                  fill
                  className="object-cover scale-110 blur-xl opacity-40"
                  aria-hidden
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#07070b]" />

              {/* Cover + play */}
              <div className="absolute inset-0 flex items-center justify-center gap-6 p-6">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[14px] shadow-2xl">
                  {release?.coverPath ? (
                    <Image src={release.coverPath} alt={release.title ?? ""} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/30 to-surface2">
                      <Disc3 className="h-10 w-10 text-violet/40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-40 rounded-md bg-white/10 animate-pulse" />
                      <div className="h-4 w-28 rounded-md bg-white/10 animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold text-cream leading-tight line-clamp-2">
                        {release?.title ?? "Loading..."}
                      </h2>
                      {release?.artist && (
                        <Link href={`/artist/${release.artist.id}`} onClick={closeDetailPanel}>
                          <p className="text-sm text-cream/60 hover:text-cream transition-colors">
                            {artistName}
                          </p>
                        </Link>
                      )}
                    </>
                  )}

                  <button
                    onClick={togglePlay}
                    disabled={!release}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-violet shadow-violet text-white hover:bg-violet-hover transition-colors disabled:opacity-40"
                  >
                    {isCurrentlyPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 translate-x-px" />
                    )}
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={closeDetailPanel}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-cream/60 hover:text-cream transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Badges */}
              {release && (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={release.type === "FREE" ? "green" : "violet"}>
                    {release.type === "FREE" ? "Free" : `€${Number(release.price).toFixed(2)}`}
                  </Badge>
                  {genreLabel && <Badge variant="gray">{genreLabel}</Badge>}
                  {release.bpm && <Badge variant="gray">{release.bpm} BPM</Badge>}
                  {release.musicalKey && <Badge variant="gray">{release.musicalKey}</Badge>}
                  {release.exclusiveFollowersOnly && <Badge variant="exclusive">Exclusive</Badge>}
                </div>
              )}

              {/* Waveform */}
              {release && (
                <ReleaseWaveform
                  src={release.audioPath}
                  title={release.title}
                  progressPercent={localProgress}
                  currentTime={isActiveTrack ? currentTime : 0}
                  duration={isActiveTrack ? duration : 0}
                  onSeekPercent={handleSeek}
                />
              )}

              {/* Action buttons */}
              {release && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setLiked(!liked)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      liked
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : "border-[rgba(255,255,255,0.08)] text-cream/50 hover:text-cream"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                    Like
                  </button>

                  <button
                    onClick={() => void handleRepost()}
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-cream/50 hover:text-cream transition-colors"
                  >
                    <Repeat2 className="h-3.5 w-3.5" />
                    Repost
                  </button>

                  <button
                    onClick={() => setShareOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-cream/50 hover:text-cream transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>

                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-cream/50 hover:text-red-400 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report
                  </button>

                  {release.type === "FREE" ? (
                    <button
                      onClick={() => setFreeDownloadOpen(true)}
                      className="ml-auto flex items-center gap-1.5 rounded-full bg-violet/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        addItem({
                          id: release.id,
                          type: "release",
                          title: release.title,
                          artist: artistName,
                          price: Number(release.price),
                          coverPath: release.coverPath ?? null,
                        });
                        openCart();
                      }}
                      className="ml-auto flex items-center gap-1.5 rounded-full bg-violet/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet transition-colors"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      €{Number(release.price).toFixed(2)}
                    </button>
                  )}

                  <Link
                    href={`/release/${release.slug}`}
                    onClick={closeDetailPanel}
                    className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-cream/50 hover:text-cream transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Full page
                  </Link>
                </div>
              )}

              {/* Description */}
              {release?.description && (
                <p className="text-sm text-cream/50 leading-relaxed">{release.description}</p>
              )}

              {/* Artist card */}
              {release?.artist && (
                <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-white/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface2">
                      {release.artist.avatar ? (
                        <Image src={release.artist.avatar} alt={artistName} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet/40">
                          {artistName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cream truncate">{artistName}</p>
                      <ArtistBadges artist={release.artist} size="sm" />
                    </div>
                    <FollowButton artistId={release.artist.id} />
                  </div>

                  <div className="flex gap-2">
                    {release.artist.instagramUrl && (
                      <a href={release.artist.instagramUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-cream/40 hover:text-cream/70 transition-colors">
                        <Instagram className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {release.artist.websiteUrl && (
                      <a href={release.artist.websiteUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-cream/40 hover:text-cream/70 transition-colors">
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Link href={`/artist/${release.artist.id}`} onClick={closeDetailPanel}
                      className="ml-auto text-xs text-violet-light hover:underline">
                      View profile →
                    </Link>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
                {release ? (
                  <CommentThread
                    releaseId={release.id}
                    comments={comments}
                    onCommentPosted={() => {}}
                    seekToTimestamp={(seconds) => {
                      if (!isActiveTrack) {
                        setTrack({
                          title: release.title,
                          artist: artistName,
                          src: release.audioPath,
                          coverPath: release.coverPath ?? null,
                          releaseId: release.id,
                          releaseSlug: release.slug,
                        });
                        setPlaying(true);
                      }
                      if (duration > 0) {
                        requestSeekPercent((seconds / duration) * 100);
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
                          <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Modals */}
          {release && (
            <>
              <ShareModal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                releaseTitle={release.title}
                artistName={artistName}
                releaseSlug={release.slug}
              />
              <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                releaseId={release.id}
                releaseTitle={release.title}
              />
              <FreeDownloadModal
                release={release}
                open={freeDownloadOpen}
                onClose={() => setFreeDownloadOpen(false)}
              />
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
