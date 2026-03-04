"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Disc3, Eye, Globe, Heart, Instagram, MessageCircle, Music, Play, Pause, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetchArtistStats, fetchDubpacks, fetchReleases } from "@/lib/api";
import type { ReleaseItem } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { usePlayerStore } from "@/store/player-store";
import { FollowButton } from "@/components/follow-button";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
const TIP_AMOUNTS = [1, 3, 5, 10, 20];

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

function waveForTrack(seed: string, count = 90) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = (1664525 * hash + 1013904223) >>> 0;
    const random = (hash % 100) / 100;
    const sine = Math.sin((i / count) * Math.PI * 2) * 0.25;
    const height = Math.max(0.1, Math.min(1, random * 0.8 + 0.1 + sine));
    values.push(height);
  }
  return values;
}

function TipModal({
  artistId,
  artistName,
  open,
  onClose
}: {
  artistId: string;
  artistName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    if (!user) {
      toast.error("Connecte-toi pour laisser un tip");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/stripe/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ artistId, amount })
      });
      if (!res.ok) throw new Error("TIP_ERROR");
      const { sessionUrl } = (await res.json()) as { sessionUrl: string };
      window.location.href = sessionUrl;
    } catch {
      toast.error("Impossible d'envoyer le tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tip ${artistName}`} size="sm">
      <div className="space-y-5">
        <p className="text-sm text-cream/60">Soutiens l'artiste avec un tip unique.</p>
        <div className="flex flex-wrap gap-2">
          {TIP_AMOUNTS.map((amountOption) => (
            <button
              key={amountOption}
              onClick={() => setAmount(amountOption)}
              className={`rounded-[10px] border px-4 py-2 text-sm font-medium transition-colors ${
                amount === amountOption
                  ? "border-violet bg-violet/20 text-cream"
                  : "border-[rgba(255,255,255,0.12)] text-cream/60 hover:text-cream"
              }`}
            >
              EUR {amountOption}
            </button>
          ))}
        </div>
        <Button onClick={() => void handleTip()} disabled={loading} className="w-full gap-2">
          <Heart className="h-4 w-4" />
          {loading ? "Redirection..." : `Envoyer EUR ${amount}`}
        </Button>
      </div>
    </Modal>
  );
}

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const artistId = params.slug;
  const [tab, setTab] = useState<"all" | "tracks" | "dubpacks">("all");
  const [tipOpen, setTipOpen] = useState(false);
  const [freeDownload, setFreeDownload] = useState<ReleaseItem | null>(null);

  const { setTrack, setPlaying, src, playing, currentTime, duration, requestSeekPercent } = usePlayerStore();

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ["artist", artistId],
    queryFn: async () => {
      const res = await fetch(`${API}/artists/${artistId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const { data: releases = [], isLoading: releasesLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const { data: artistStats } = useQuery({
    queryKey: ["artist-stats", artistId],
    queryFn: () => fetchArtistStats(artistId)
  });

  const { data: dubpacks = [], isLoading: dubpacksLoading } = useQuery({
    queryKey: ["dubpacks"],
    queryFn: fetchDubpacks
  });

  const artistReleases = useMemo(
    () =>
      releases
        .filter((release) => release.artist?.id === artistId)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [releases, artistId]
  );

  const artistDubpacks = useMemo(
    () =>
      dubpacks
        .filter((dubpack) => dubpack.artist?.id === artistId)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [dubpacks, artistId]
  );

  if (artistLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-cream/40">Chargement du profil artiste...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-cream/40">Artiste introuvable.</p>
      </div>
    );
  }

  const artistName = artist.displayName ?? artist.user?.email?.split("@")[0] ?? "Sauroraa Artist";
  const coverImage = artistReleases[0]?.coverPath ?? artist.avatar;
  const followersCount = artist._count?.followers ?? 0;
  const releasesCount = artistReleases.length;
  const dubpacksCount = artistDubpacks.length;
  const agencies = (artist.agencyLinks ?? [])
    .map((link: { agency?: { displayName?: string | null } }) => link.agency?.displayName)
    .filter(Boolean) as string[];
  const viewsByTrack = new Map((artistStats?.tracks ?? []).map((track) => [track.id, track.views]));
  const totalTrackViews = artistStats?.totalViews ?? artistReleases.reduce((sum, track) => sum + (track._count?.downloadSessions ?? 0), 0);

  const visibleReleases =
    tab === "tracks" ? artistReleases : tab === "all" ? artistReleases.slice(0, 12) : [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.09)] bg-surface">
        <div className="relative h-60 md:h-72">
          {coverImage ? (
            <Image src={coverImage} alt={artistName} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-violet/40 via-violet/20 to-surface2" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />

          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/20 bg-surface2">
                  {artist.avatar ? (
                    <Image src={artist.avatar} alt={artistName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-violet-light">
                      {artistName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold text-white md:text-4xl">{artistName}</h1>
                  <p className="text-sm text-white/70">
                    {agencies.length > 0 ? `Agence: ${agencies.join(" · ")}` : "Sauroraa Artist Profile"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FollowButton artistId={artistId} />
                <Button variant="outline" size="sm" onClick={() => setTipOpen(true)} className="gap-1.5">
                  <Heart className="h-4 w-4" />
                  Tip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3">
        <div className="flex items-center gap-1">
          {[
            { key: "all", label: "Tout" },
            { key: "tracks", label: `Titres (${releasesCount})` },
            { key: "dubpacks", label: `Dubpacks (${dubpacksCount})` }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as "all" | "tracks" | "dubpacks")}
              className={`rounded-[10px] px-3 py-1.5 text-sm transition-colors ${
                tab === item.key
                  ? "bg-violet text-white"
                  : "text-cream/55 hover:bg-white/5 hover:text-cream"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 text-xs text-cream/45">
          <span>{formatCompact(followersCount)} followers</span>
          <span>{releasesCount} releases</span>
          <span>{dubpacksCount} dubpacks</span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2.3fr_1fr]">
        <div className="space-y-4">
          {(tab === "all" || tab === "tracks") && (
            <div className="space-y-4">
              {releasesLoading && <p className="text-sm text-cream/35">Chargement des titres...</p>}
              {!releasesLoading && visibleReleases.length === 0 && (
                <p className="text-sm text-cream/35">Aucun titre publié pour le moment.</p>
              )}

              {visibleReleases.map((release, index) => {
                const isActive = src === release.audioPath;
                const isPlayingNow = isActive && playing;
                const progress = isActive && duration > 0 ? (currentTime / duration) * 100 : 0;
                const waves = waveForTrack(`${release.id}:${release.title}`);
                const activeBars = Math.round((Math.max(0, Math.min(100, progress)) / 100) * waves.length);

                return (
                  <article
                    key={release.id}
                    className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-3 md:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => {
                          if (isActive) {
                            setPlaying(!playing);
                          } else {
                            setTrack({
                              title: release.title,
                              artist: artistName,
                              src: release.audioPath,
                              coverPath: release.coverPath ?? null
                            });
                            setPlaying(true);
                          }
                        }}
                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet text-white hover:bg-violet-hover transition-colors"
                      >
                        {isPlayingNow ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
                      </button>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/release/${release.slug}`} className="block truncate text-sm font-semibold text-cream hover:text-violet-light transition-colors">
                              {release.title}
                            </Link>
                            <p className="text-xs text-cream/45">{formatDate(release.createdAt)}</p>
                          </div>
                          <div className="text-xs text-cream/45">
                            {release.type === "FREE" ? "Free download" : `EUR ${Number(release.price).toFixed(2)}`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            const pct = ((event.clientX - rect.left) / rect.width) * 100;
                            if (!isActive) {
                              setTrack({
                                title: release.title,
                                artist: artistName,
                                src: release.audioPath,
                                coverPath: release.coverPath ?? null
                              });
                              setPlaying(true);
                            }
                            requestSeekPercent(pct);
                          }}
                          className="flex h-16 w-full items-end gap-[2px] rounded-[8px] bg-black/20 px-2 py-2"
                        >
                          {waves.map((height, waveIndex) => (
                            <span
                              key={`${release.id}-wave-${waveIndex}`}
                              className={`w-full rounded-[2px] ${
                                waveIndex <= activeBars ? "bg-violet-light" : "bg-cream/25"
                              }`}
                              style={{ height: `${Math.round(height * 100)}%` }}
                            />
                          ))}
                        </button>

                        <div className="flex items-center justify-between text-xs text-cream/40">
                          <span>
                            {release._count?.comments ?? 0} commentaires · {viewsByTrack.get(release.id) ?? release._count?.downloadSessions ?? 0} vues
                          </span>
                          {release.type === "FREE" ? (
                            <button
                              onClick={() => setFreeDownload(release)}
                              className="text-violet-light hover:text-violet-300 transition-colors"
                            >
                              Télécharger
                            </button>
                          ) : (
                            <button
                              className="text-violet-light hover:text-violet-300 transition-colors"
                              onClick={() => toast("Ajout panier sur page release")}
                            >
                              Acheter
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "dubpacks" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dubpacksLoading && <p className="text-sm text-cream/35">Chargement des dubpacks...</p>}
              {!dubpacksLoading && artistDubpacks.length === 0 && (
                <p className="text-sm text-cream/35">Aucun dubpack publié pour le moment.</p>
              )}
              {artistDubpacks.map((dubpack) => (
                <Link
                  key={dubpack.id}
                  href={`/dubpack/${dubpack.slug}`}
                  className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface2 p-4 hover:border-violet/35 transition-colors"
                >
                  <p className="text-sm font-semibold text-cream">{dubpack.title}</p>
                  <p className="mt-1 text-xs text-cream/45">
                    {dubpack.type === "FREE" ? "Free" : `EUR ${Number(dubpack.price).toFixed(2)}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <h3 className="text-sm font-semibold text-cream">Stats</h3>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{formatCompact(followersCount)}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">Followers</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{releasesCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">Tracks</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{dubpacksCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">Dubpacks</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{formatCompact(totalTrackViews)}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">Vues</p>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <h3 className="text-sm font-semibold text-cream">Bio & Contact</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">
              {artist.bio?.trim() || "Aucune bio renseignée pour le moment."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {artist.instagramUrl && (
                <Link href={artist.instagramUrl} target="_blank" className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-2 text-cream/55 hover:text-cream transition-colors">
                  <Instagram className="h-4 w-4" />
                </Link>
              )}
              {artist.soundcloudUrl && (
                <Link href={artist.soundcloudUrl} target="_blank" className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-2 text-cream/55 hover:text-cream transition-colors">
                  <Music className="h-4 w-4" />
                </Link>
              )}
              {artist.discordUrl && (
                <Link href={artist.discordUrl} target="_blank" className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-2 text-cream/55 hover:text-cream transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              )}
              {artist.websiteUrl && (
                <Link href={artist.websiteUrl} target="_blank" className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-2 text-cream/55 hover:text-cream transition-colors">
                  <Globe className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <h3 className="text-sm font-semibold text-cream">Top tracks</h3>
            <div className="mt-3 space-y-2">
              {artistReleases.slice(0, 5).map((release, index) => (
                <Link
                  key={release.id}
                  href={`/release/${release.slug}`}
                  className="flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-white/5 transition-colors"
                >
                  <span className="w-4 text-xs text-cream/40">{index + 1}</span>
                  {release.coverPath ? (
                    <Image src={release.coverPath} alt={release.title} width={32} height={32} className="rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-black/25">
                      <Disc3 className="h-4 w-4 text-violet/60" />
                    </div>
                  )}
                  <span className="truncate text-xs text-cream/70">{release.title}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-cream/45">
                    <Eye className="h-3 w-3" />
                    {formatCompact(viewsByTrack.get(release.id) ?? release._count?.downloadSessions ?? 0)}
                  </span>
                </Link>
              ))}
              {artistReleases.length === 0 && (
                <p className="text-xs text-cream/40">Aucun titre pour le moment.</p>
              )}
            </div>
          </div>

          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <div className="flex items-center gap-2 text-cream/70">
              <Users className="h-4 w-4 text-violet-light" />
              <p className="text-sm">Découvre les autres artistes Sauroraa</p>
            </div>
            <Link href="/catalog" className="mt-3 inline-block text-sm text-violet-light hover:text-violet-300 transition-colors">
              Explorer le catalogue →
            </Link>
          </div>
        </aside>
      </section>

      <FreeDownloadModal
        release={freeDownload ?? undefined}
        open={!!freeDownload}
        onClose={() => setFreeDownload(null)}
      />

      <TipModal artistId={artistId} artistName={artistName} open={tipOpen} onClose={() => setTipOpen(false)} />
    </div>
  );
}
