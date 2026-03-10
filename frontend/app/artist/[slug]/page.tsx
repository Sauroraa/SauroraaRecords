"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Disc3, Eye, Globe, Heart, Instagram, MessageCircle, Music, Play, Pause, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetchArtist, fetchArtistStats, fetchDubpacks, fetchReleases } from "@/lib/api";
import type { ReleaseItem } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { useAuthStore } from "@/store/auth-store";
import { usePlayerStore } from "@/store/player-store";
import { ArtistBadges } from "@/components/artist-badges";
import { FollowButton } from "@/components/follow-button";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { RealWaveform } from "@/components/release-waveform-real";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
const TIP_AMOUNTS = [1, 3, 5, 10, 20];

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

type FollowerEntry = {
  userId: string;
  displayName: string;
  avatar: string | null;
  artistId: string | null;
  followedAt: string;
};

function FollowersTab({ artistId }: { artistId: string }) {
  const { t, locale } = useLanguage();
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`${API}/follows/artist/${artistId}/followers`)
      .then(r => r.ok ? r.json() : [])
      .then((data: FollowerEntry[]) => { setFollowers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [artistId]);

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}
    </div>
  );

  if (followers.length === 0) return (
    <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-surface">
      <p className="text-sm text-cream/30">{t.artist.no_followers}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {followers.map((f) => (
        <div key={f.userId} className="flex items-center gap-3 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-surface px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface2">
            {f.avatar
              ? <Image src={f.avatar} alt={f.displayName} fill className="object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet/40">{f.displayName.slice(0,1).toUpperCase()}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            {f.artistId
              ? <Link href={`/artist/${f.artistId}`} className="text-sm font-medium text-cream hover:text-violet-light transition-colors">{f.displayName}</Link>
              : <p className="text-sm font-medium text-cream">{f.displayName}</p>
            }
            <p className="text-xs text-cream/30">{new Date(f.followedAt).toLocaleDateString(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type FollowingEntry = {
  artistId: string;
  slug?: string | null;
  displayName: string | null;
  avatar: string | null;
  followersCount: number;
  followedAt: string;
};

function FollowingTab({ artistId }: { artistId: string }) {
  const { t } = useLanguage();
  const [following, setFollowing] = useState<FollowingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`${API}/follows/artist/${artistId}/following`)
      .then(r => r.ok ? r.json() : [])
      .then((data: FollowingEntry[]) => { setFollowing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [artistId]);

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}
    </div>
  );

  if (following.length === 0) return (
    <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-surface">
      <p className="text-sm text-cream/30">{t.artist.not_following_anyone}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {following.map((f) => (
        <div key={f.artistId} className="flex items-center gap-3 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-surface px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface2">
            {f.avatar
              ? <Image src={f.avatar} alt={f.displayName ?? ""} fill className="object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-violet/40">{(f.displayName ?? "?").slice(0,1).toUpperCase()}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/artist/${f.slug ?? f.artistId}`} className="text-sm font-medium text-cream hover:text-violet-light transition-colors">
              {f.displayName ?? f.artistId}
            </Link>
            <p className="text-xs text-cream/30">{f.followersCount} {t.common.followers}</p>
          </div>
        </div>
      ))}
    </div>
  );
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
  const { t } = useLanguage();
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    if (!user) {
      toast.error(t.follow_button.signin_required);
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
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${t.artist.tip} ${artistName}`} size="sm">
      <div className="space-y-5">
        <p className="text-sm text-cream/60">{t.artist.tip_support}</p>
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
          {loading ? t.cart.redirecting : `${t.artist.send_tip} EUR ${amount}`}
        </Button>
      </div>
    </Modal>
  );
}

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const { t, locale } = useLanguage();
  const artistSlug = params.slug;
  const [tab, setTab] = useState<"all" | "tracks" | "dubpacks" | "followers" | "following">("all");
  const [tipOpen, setTipOpen] = useState(false);
  const [freeDownload, setFreeDownload] = useState<ReleaseItem | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthStore();
  const { setTrack, setPlaying, releaseId: activeReleaseId, playing, currentTime, duration, requestSeekPercent } = usePlayerStore();

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ["artist", artistSlug],
    queryFn: () => fetchArtist(artistSlug)
  });

  const resolvedArtistId = artist?.id ?? artistSlug;

  const { data: releases = [], isLoading: releasesLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const { data: artistStats } = useQuery({
    queryKey: ["artist-stats", resolvedArtistId],
    queryFn: () => fetchArtistStats(resolvedArtistId),
    enabled: Boolean(artist?.id)
  });

  const { data: liveFollowData } = useQuery({
    queryKey: ["follow-status", resolvedArtistId],
    queryFn: async () => {
      const res = await fetch(`${API}/follows/artist/${resolvedArtistId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json() as Promise<{ count: number; isFollowing: boolean }>;
    },
    refetchInterval: 30000,
    enabled: Boolean(artist?.id)
  });

  const { data: dubpacks = [], isLoading: dubpacksLoading } = useQuery({
    queryKey: ["dubpacks"],
    queryFn: fetchDubpacks
  });

  const artistReleases = useMemo(
    () =>
      releases
        .filter((release) => release.artist?.id === resolvedArtistId)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [releases, resolvedArtistId]
  );

  const artistDubpacks = useMemo(
    () =>
      dubpacks
        .filter((dubpack) => dubpack.artist?.id === resolvedArtistId)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [dubpacks, resolvedArtistId]
  );

  if (artistLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-cream/40">{t.artist.loading}</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-cream/40">{t.artist.not_found}</p>
      </div>
    );
  }

  const isOwnProfile = user?.role === "ARTIST" && (artist as { userId?: string }).userId === user?.id;

  const handleBannerUpload = async (file: File) => {
    setBannerUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch(`${API}/upload/cover`, { method: "POST", credentials: "include", body: fd });
      if (!uploadRes.ok) throw new Error();
      const { path } = (await uploadRes.json()) as { path: string };
      await fetch(`${API}/artists/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bannerUrl: path })
      });
      toast.success(t.common.save);
      window.location.reload();
    } catch {
      toast.error(t.common.error);
    } finally {
      setBannerUploading(false);
    }
  };

  const artistName = artist.displayName ?? artist.user?.email?.split("@")[0] ?? "Sauroraa Artist";
  const coverImage = artist.bannerUrl ?? artistReleases[0]?.coverPath ?? artist.avatar;
  const followersCount = liveFollowData?.count ?? artist._count?.followers ?? 0;
  const releasesCount = artistReleases.length;
  const dubpacksCount = artistDubpacks.length;
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

          {isOwnProfile && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && void handleBannerUpload(e.target.files[0])}
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[8px] bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {bannerUploading ? t.artist.updating_banner : t.artist.edit_banner}
              </button>
            </>
          )}

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
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold text-white md:text-4xl">{artistName}</h1>
                    <ArtistBadges artist={artist} />
                  </div>
                  <p className="text-sm text-white/50">Sauroraa Records</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FollowButton artistId={resolvedArtistId} />
                <Button variant="outline" size="sm" onClick={() => setTipOpen(true)} className="gap-1.5">
                  <Heart className="h-4 w-4" />
                  {t.artist.tip}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: t.artist.all },
            { key: "tracks", label: `${t.artist.tracks} (${releasesCount})` },
            { key: "dubpacks", label: `${t.artist.dubpacks} (${dubpacksCount})` },
            { key: "followers", label: `${t.artist.followers_label} (${followersCount})` },
            { key: "following", label: t.artist.following },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as "all" | "tracks" | "dubpacks" | "followers" | "following")}
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
        <div className="flex flex-wrap items-center gap-3 text-xs text-cream/45 sm:gap-5">
          <span>{formatCompact(followersCount)} {t.artist.followers}</span>
          <span>{releasesCount} {t.artist.releases_count}</span>
          <span>{dubpacksCount} {t.artist.dubpacks_count}</span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2.3fr_1fr]">
        <div className="space-y-4">
          {(tab === "all" || tab === "tracks") && (
            <div className="space-y-4">
              {releasesLoading && <p className="text-sm text-cream/35">{t.artist.loading_tracks}</p>}
              {!releasesLoading && visibleReleases.length === 0 && (
                <p className="text-sm text-cream/35">{t.artist.no_tracks}</p>
              )}

              {visibleReleases.map((release) => {
                const isActive = activeReleaseId === release.id;
                const isPlayingNow = isActive && playing;
                const progress = isActive && duration > 0 ? (currentTime / duration) * 100 : 0;

                const handlePlay = () => {
                  if (isActive) { setPlaying(!playing); return; }
                  setTrack({ title: release.title, artist: artistName, src: release.audioPath, coverPath: release.coverPath ?? null, releaseId: release.id, releaseSlug: release.slug });
                  setPlaying(true);
                };

                return (
                  <article key={release.id} className="group overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface">
                    {/* SoundCloud-style: full-width cover banner */}
                    <div className="relative h-44 w-full bg-surface2">
                      {release.coverPath ? (
                        <Image src={release.coverPath} alt={release.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2">
                          <Disc3 className="h-16 w-16 text-violet/20" />
                        </div>
                      )}
                      {/* Gradient overlay — stronger at bottom for waveform readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                      {/* Title + date overlay (top-left) */}
                      <div className="absolute left-4 right-16 top-3">
                        <Link href={`/release/${release.slug}`} className="text-sm font-bold text-white hover:text-violet-light transition-colors line-clamp-1">
                          {release.title}
                        </Link>
                        <p className="text-[11px] text-white/50 mt-0.5">{formatDate(release.createdAt, locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB")}</p>
                      </div>

                      {/* Price badge (top-right) */}
                      <div className="absolute right-3 top-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          release.type === "FREE"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-violet/20 text-violet-light border border-violet/30"
                        }`}>
                          {release.type === "FREE" ? t.common.free : `€${Number(release.price).toFixed(2)}`}
                        </span>
                      </div>

                      {/* Play button (center-left) */}
                      <button
                        onClick={handlePlay}
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-violet shadow-[0_0_20px_rgba(123,76,255,0.5)] text-white hover:scale-105 transition-transform"
                      >
                        {isPlayingNow ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
                      </button>

                      {/* Waveform overlaid at bottom of cover */}
                      <div className="absolute bottom-0 left-0 right-0 px-2 pb-1">
                        <RealWaveform
                          releaseId={release.id}
                          fallbackSeed={`${release.id}:${release.title}`}
                          progressPercent={progress}
                          height="h-14"
                          bars={150}
                          onSeekPercent={(pct) => {
                            if (!isActive) {
                              setTrack({ title: release.title, artist: artistName, src: release.audioPath, coverPath: release.coverPath ?? null, releaseId: release.id, releaseSlug: release.slug });
                              setPlaying(true);
                            }
                            requestSeekPercent(pct);
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-cream/40">
                      <span>
                        {release._count?.comments ?? 0} {t.comments.title.toLowerCase()} · {viewsByTrack.get(release.id) ?? 0} {t.artist.views.toLowerCase()}
                      </span>
                      {release.type === "FREE" ? (
                        <button onClick={() => setFreeDownload(release)} className="text-violet-light hover:text-violet hover:underline transition-colors">
                          {t.common.download}
                        </button>
                      ) : (
                        <Link href={`/release/${release.slug}`} className="text-violet-light hover:text-violet hover:underline transition-colors">
                          {t.common.buy}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "dubpacks" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dubpacksLoading && <p className="text-sm text-cream/35">{t.artist.loading_dubpacks}</p>}
              {!dubpacksLoading && artistDubpacks.length === 0 && (
                <p className="text-sm text-cream/35">{t.artist.no_dubpacks}</p>
              )}
              {artistDubpacks.map((dubpack) => (
                <Link
                  key={dubpack.id}
                  href={`/dubpack/${dubpack.slug}`}
                  className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface2 p-4 hover:border-violet/35 transition-colors"
                >
                  <p className="text-sm font-semibold text-cream">{dubpack.title}</p>
                  <p className="mt-1 text-xs text-cream/45">
                    {dubpack.type === "FREE" ? t.common.free : `EUR ${Number(dubpack.price).toFixed(2)}`}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Followers tab */}
          {tab === "followers" && (
            <FollowersTab artistId={resolvedArtistId} />
          )}

          {/* Following tab */}
          {tab === "following" && (
            <FollowingTab artistId={resolvedArtistId} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <h3 className="text-sm font-semibold text-cream">{t.artist.stats_title}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{formatCompact(followersCount)}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">{t.artist.followers_label}</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{releasesCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">{t.artist.tracks_label}</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{dubpacksCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">{t.artist.dubpacks_label}</p>
              </div>
              <div className="rounded-[10px] bg-black/20 py-2">
                <p className="text-lg font-bold text-cream">{formatCompact(totalTrackViews)}</p>
                <p className="text-[10px] uppercase tracking-wide text-cream/40">{t.artist.views}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <h3 className="text-sm font-semibold text-cream">{t.artist.bio_title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/60">
              {artist.bio?.trim() || t.artist.no_bio}
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
            <h3 className="text-sm font-semibold text-cream">{t.artist.top_tracks}</h3>
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
                <p className="text-xs text-cream/40">{t.artist.no_tracks}</p>
              )}
            </div>
          </div>

          <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <div className="flex items-center gap-2 text-cream/70">
              <Users className="h-4 w-4 text-violet-light" />
              <p className="text-sm">{t.artist.discover}</p>
            </div>
            <Link href="/catalog" className="mt-3 inline-block text-sm text-violet-light hover:text-violet-300 transition-colors">
              {t.artist.explore_catalog}
            </Link>
          </div>
        </aside>
      </section>

      <FreeDownloadModal
        release={freeDownload ?? undefined}
        open={!!freeDownload}
        onClose={() => setFreeDownload(null)}
      />

      <TipModal artistId={resolvedArtistId} artistName={artistName} open={tipOpen} onClose={() => setTipOpen(false)} />
    </div>
  );
}
