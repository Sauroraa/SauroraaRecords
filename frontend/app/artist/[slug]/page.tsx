"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe, Instagram, Music, MessageCircle, Heart, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { fetchReleases, fetchDubpacks } from "@/lib/api";
import { FollowButton } from "@/components/follow-button";
import { ReleaseCard } from "@/components/release-card";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { ReleaseItem } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

const TIP_AMOUNTS = [1, 3, 5, 10, 20];

function TipModal({ artistId, artistName, open, onClose }: { artistId: string; artistName: string; open: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    if (!user) { toast.error("Sign in to tip"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/stripe/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ artistId, amount })
      });
      if (!res.ok) throw new Error();
      const { sessionUrl } = (await res.json()) as { sessionUrl: string };
      window.location.href = sessionUrl;
    } catch {
      toast.error("Failed to process tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tip ${artistName}`} size="sm">
      <div className="space-y-5">
        <p className="text-sm text-cream/60">Show your appreciation with a one-time tip.</p>
        <div className="flex gap-2 flex-wrap">
          {TIP_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`px-4 py-2 rounded-[10px] border text-sm font-medium transition-colors ${
                amount === a ? "border-violet bg-violet/20 text-cream" : "border-[rgba(255,255,255,0.12)] text-cream/60 hover:text-cream"
              }`}
            >
              €{a}
            </button>
          ))}
        </div>
        <Button onClick={() => void handleTip()} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          Send €{amount} tip
        </Button>
      </div>
    </Modal>
  );
}

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const artistId = params.slug;
  const [tab, setTab] = useState<"releases" | "dubpacks">("releases");
  const [freeDownload, setFreeDownload] = useState<ReleaseItem | null>(null);
  const [tipOpen, setTipOpen] = useState(false);

  const { data: artist } = useQuery({
    queryKey: ["artist", artistId],
    queryFn: async () => {
      const res = await fetch(`${API}/artists/${artistId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const { data: releases = [] } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  const { data: dubpacks = [] } = useQuery({
    queryKey: ["dubpacks"],
    queryFn: fetchDubpacks
  });

  const artistReleases = releases.filter((r) => r.artist?.id === artistId);
  const artistDubpacks = dubpacks.filter((d) => d.artist?.id === artistId);

  const name = artist?.displayName ?? artist?.user?.email?.split("@")[0] ?? "Artist";

  if (!artist) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-cream/40">Loading artist profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-surface2 ring-2 ring-violet/30">
          {artist.avatar ? (
            <Image src={artist.avatar} alt={name} width={96} height={96} className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-violet/40">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-3xl font-bold text-cream">{name}</h1>
          {artist.bio && (
            <p className="max-w-xl text-sm text-cream/60 leading-relaxed">{artist.bio}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <FollowButton artistId={artistId} />
            <Button variant="outline" size="sm" onClick={() => setTipOpen(true)} className="gap-1.5">
              <Heart className="h-4 w-4" /> Tip
            </Button>

            <div className="flex items-center gap-3">
              {artist.instagramUrl && (
                <Link href={artist.instagramUrl} target="_blank" className="text-cream/40 hover:text-cream/70 transition-colors">
                  <Instagram className="h-4 w-4" />
                </Link>
              )}
              {artist.soundcloudUrl && (
                <Link href={artist.soundcloudUrl} target="_blank" className="text-cream/40 hover:text-cream/70 transition-colors">
                  <Music className="h-4 w-4" />
                </Link>
              )}
              {artist.discordUrl && (
                <Link href={artist.discordUrl} target="_blank" className="text-cream/40 hover:text-cream/70 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              )}
              {artist.websiteUrl && (
                <Link href={artist.websiteUrl} target="_blank" className="text-cream/40 hover:text-cream/70 transition-colors">
                  <Globe className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => setTab("releases")}
          className={`px-5 pb-3 text-sm font-medium transition-colors ${
            tab === "releases"
              ? "border-b-2 border-violet text-cream"
              : "text-cream/50 hover:text-cream"
          }`}
        >
          Releases ({artistReleases.length})
        </button>
        <button
          onClick={() => setTab("dubpacks")}
          className={`px-5 pb-3 text-sm font-medium transition-colors ${
            tab === "dubpacks"
              ? "border-b-2 border-violet text-cream"
              : "text-cream/50 hover:text-cream"
          }`}
        >
          Dubpacks ({artistDubpacks.length})
        </button>
      </div>

      {/* Content */}
      {tab === "releases" && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {artistReleases.map((r, i) => (
            <ReleaseCard key={r.id} release={r} onDownloadFree={setFreeDownload} index={i} />
          ))}
          {artistReleases.length === 0 && (
            <p className="col-span-4 text-sm text-cream/30">No releases yet.</p>
          )}
        </div>
      )}

      {tab === "dubpacks" && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {artistDubpacks.map((d, i) => (
            <div key={d.id} className="text-sm text-cream/70">{d.title}</div>
          ))}
          {artistDubpacks.length === 0 && (
            <p className="col-span-4 text-sm text-cream/30">No dubpacks yet.</p>
          )}
        </div>
      )}

      <FreeDownloadModal
        release={freeDownload ?? undefined}
        open={!!freeDownload}
        onClose={() => setFreeDownload(null)}
      />

      <TipModal
        artistId={artistId}
        artistName={name}
        open={tipOpen}
        onClose={() => setTipOpen(false)}
      />
    </div>
  );
}
