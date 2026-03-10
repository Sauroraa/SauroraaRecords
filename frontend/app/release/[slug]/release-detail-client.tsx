"use client";

import { motion } from "framer-motion";
import { Download, ShoppingCart, Play, Pause, Disc3, Heart, ArrowLeft, Clock, Lock, Users, Globe, Instagram, UserPlus, X, Mic2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/context/language-context";
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

// ─── Collaborators Section ────────────────────────────────────────────────────

type Collab = {
  artistId: string;
  role: string;
  artist: { id: string; displayName: string | null; avatar: string | null };
};

const ROLES = ["FEATURED", "PRODUCER", "REMIXER"] as const;
const ROLE_LABELS: Record<string, string> = {
  FEATURED: "feat.",
  PRODUCER: "Prod.",
  REMIXER: "Remix"
};

function CollaboratorsSection({
  releaseId,
  isOwner,
  artistId: ownerArtistId,
}: {
  releaseId: string;
  isOwner?: boolean;
  artistId?: string;
}) {
  const [collabs, setCollabs] = useState<Collab[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string | null; avatar: string | null }[]>([]);
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[number]>("FEATURED");
  const [adding, setAdding] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    void fetch(`${API}/releases/${releaseId}/collaborators`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Collab[]) => setCollabs(data))
      .catch(() => {});
  }, [releaseId]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(search)}&limit=5`);
      if (r.ok) {
        const d = await r.json() as { artists?: { id: string; displayName: string | null; avatar: string | null }[] };
        setSearchResults(d.artists ?? []);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const addCollab = async (artistId: string) => {
    setAdding(true);
    try {
      const res = await fetch(`${API}/releases/${releaseId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ artistId, role: selectedRole })
      });
      if (res.ok) {
        const newCollab = await res.json() as Collab;
        const found = searchResults.find(a => a.id === artistId);
        if (found) {
          setCollabs(prev => [...prev, { ...newCollab, artist: { id: found.id, displayName: found.displayName, avatar: found.avatar } }]);
        }
        setSearch(""); setSearchResults([]); setShowAdd(false);
        import("react-hot-toast").then(({ default: toast }) => toast.success("Collaborateur ajouté !"));
      }
    } finally { setAdding(false); }
  };

  const removeCollab = async (artistId: string) => {
    await fetch(`${API}/releases/${releaseId}/collaborators/${artistId}`, {
      method: "DELETE",
      credentials: "include"
    });
    setCollabs(prev => prev.filter(c => c.artistId !== artistId));
  };

  if (collabs.length === 0 && !isOwner) return null;

  return (
    <div className="border-t border-[rgba(255,255,255,0.06)] pt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-cream">
          <Mic2 className="h-4 w-4 text-violet-light" />
          Collaborateurs
          {collabs.length > 0 && <span className="text-cream/40 text-sm font-normal">({collabs.length})</span>}
        </h3>
        {isOwner && user?.role === "ARTIST" && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-xs text-cream/50 hover:text-cream hover:border-violet/30 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      {/* Add collaborator panel */}
      {showAdd && (
        <div className="rounded-[14px] border border-violet/20 bg-violet/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as typeof ROLES[number])}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-surface px-2 py-1.5 text-xs text-cream outline-none"
            >
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Recherche artiste par nom..."
              className="flex-1 rounded-lg border border-[rgba(255,255,255,0.1)] bg-surface px-3 py-1.5 text-sm text-cream placeholder-cream/25 outline-none focus:border-violet/40"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map(a => (
                <button
                  key={a.id}
                  onClick={() => void addCollab(a.id)}
                  disabled={adding}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-cream/70 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface2 flex items-center justify-center text-xs font-bold text-violet/40">
                    {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : (a.displayName ?? "?").slice(0,1).toUpperCase()}
                  </div>
                  <span>{a.displayName ?? a.id}</span>
                  <span className="ml-auto text-xs text-cream/30">{ROLE_LABELS[selectedRole]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collaborators list */}
      {collabs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collabs.map(c => (
            <div key={c.artistId} className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-surface px-3 py-1.5">
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-surface2 flex items-center justify-center text-[10px] font-bold text-violet/40">
                {c.artist.avatar ? <img src={c.artist.avatar} alt="" className="h-full w-full object-cover rounded-full" /> : (c.artist.displayName ?? "?").slice(0,1).toUpperCase()}
              </div>
              <span className="text-[11px] text-cream/50">{ROLE_LABELS[c.role] ?? c.role}</span>
              <Link href={`/artist/${c.artist.id}`} className="text-sm font-medium text-cream hover:text-violet-light transition-colors">
                {c.artist.displayName ?? c.artist.id}
              </Link>
              {isOwner && user?.role === "ARTIST" && (
                <button onClick={() => void removeCollab(c.artistId)} className="text-cream/20 hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {collabs.length === 0 && isOwner && (
        <p className="text-sm text-cream/30">Aucun collaborateur. Ajoutez des artistes (feat., prod., remix...).</p>
      )}
    </div>
  );
}

interface ReleaseDetailClientProps {
  release: ReleaseItem;
  initialComments: CommentItem[];
}

export function ReleaseDetailClient({ release, initialComments }: ReleaseDetailClientProps) {
  const { t, locale } = useLanguage();
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
    if (!user) { toast.error(t.auth.sign_in); return; }
    setPreordering(true);
    try {
      const res = await fetch(`${API}/preorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId: release.id })
      });
      if (!res.ok) throw new Error();
      toast.success(t.release.preorder);
    } catch {
      toast.error(t.common.error);
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
        {t.release.back}
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
                <p className="text-sm font-medium text-cream">{t.release.exclusive_title}</p>
                <p className="text-xs text-cream/60 mt-0.5">
                  {t.release.exclusive_sub}{" "}
                  {release.artist && (
                    <Link href={`/artist/${release.artist.id}`} className="text-violet-light hover:underline">
                      {t.release.view_artist}
                    </Link>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={release.type === "FREE" ? "green" : "violet"}>
                {release.type === "FREE" ? t.common.free : `€${Number(release.price).toFixed(2)}`}
              </Badge>
              {genreLabel && (
                <Badge variant="gray">{genreLabel}</Badge>
              )}
              {release.exclusiveFollowersOnly && (
                <Badge variant="exclusive">{t.release.exclusive_title}</Badge>
              )}
              {isPreorder && (
                <Badge variant="gray">{t.release.preorder}</Badge>
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
                  {preordering ? t.common.loading : `${t.release.preorder} — €${Number(release.price).toFixed(2)}`}
                </Button>
                <p className="w-full text-xs text-cream/40 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t.release.preorder_msg} {new Date(release.releaseDate!).toLocaleDateString(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </>
            ) : release.type === "FREE" ? (
              <Button onClick={() => setFreeDownloadOpen(true)} className="gap-2">
                <Download className="h-4 w-4" />
                {t.release.download_free}
              </Button>
            ) : (
              <Button onClick={handleBuy} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t.release.buy} — €{Number(release.price).toFixed(2)}
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Heart className="h-4 w-4" />
              {t.release.favorite}
            </Button>
          </div>

          {release.createdAt && (
            <p className="text-xs text-cream/30">
              {t.release.released_on} {new Date(release.createdAt).toLocaleDateString(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
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
                  <Button size="sm" variant="outline">{t.release.view_profile}</Button>
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

      {/* Collaborators */}
      <CollaboratorsSection releaseId={release.id} isOwner={user?.role === "ARTIST"} artistId={release.artist?.id} />

      {/* Heatmap */}
      {heatmap.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.06)] pt-10">
          <h3 className="text-lg font-semibold text-cream mb-4">{t.release.heatmap_title}</h3>
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
