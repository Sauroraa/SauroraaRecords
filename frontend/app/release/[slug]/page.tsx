import type { Metadata } from "next";
import type { CommentItem, ReleaseItem } from "@/lib/types";
import { notFound } from "next/navigation";
import { ReleaseDetailClient } from "./release-detail-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";
const INTERNAL_API_BASE = process.env.INTERNAL_API_BASE ?? process.env.API_BASE ?? "http://backend:4000/api";
const PUBLIC_API_BASE = `${BASE_URL}/api`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

async function getReleaseBySlug(slug: string): Promise<ReleaseItem | null> {
  const targets = [INTERNAL_API_BASE, PUBLIC_API_BASE];
  for (const api of targets) {
    try {
      const res = await fetch(`${api}/releases/${encodeURIComponent(slug)}`, {
        cache: "no-store"
      });
      if (!res.ok) continue;
      return (await res.json()) as ReleaseItem;
    } catch {
      continue;
    }
  }
  return null;
}

async function getReleaseComments(releaseId: string): Promise<CommentItem[]> {
  const targets = [INTERNAL_API_BASE, PUBLIC_API_BASE];
  for (const api of targets) {
    try {
      const res = await fetch(`${api}/comments?releaseId=${encodeURIComponent(releaseId)}`, {
        cache: "no-store"
      });
      if (!res.ok) continue;
      return (await res.json()) as CommentItem[];
    } catch {
      continue;
    }
  }
  return [];
}

function getArtistName(release: ReleaseItem | null) {
  return (
    release?.artist?.displayName ??
    release?.artist?.user?.firstName ??
    release?.artist?.user?.email?.split("@")[0] ??
    "Sauroraa Artist"
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const release = await getReleaseBySlug(params.slug);
  if (!release) {
    return {
      title: "Release introuvable",
      robots: { index: false, follow: false }
    };
  }

  const artistName = getArtistName(release);
  const title = `${release.title} — ${artistName}`;
  const description =
    release.description?.trim() ||
    `Ecoute "${release.title}" de ${artistName} sur Sauroraa Records.`;
  const canonical = `/release/${release.slug}`;
  const coverUrl = toAbsoluteUrl(release.coverPath) ?? `${BASE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "music.song",
      url: canonical,
      title,
      description,
      siteName: "Sauroraa Records",
      images: [
        {
          url: coverUrl,
          alt: `${release.title} cover`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverUrl]
    }
  };
}

export default async function ReleasePage({ params }: { params: { slug: string } }) {
  const release = await getReleaseBySlug(params.slug);

  if (!release) notFound();

  const comments = await getReleaseComments(release.id);

  const artistName = getArtistName(release);
  const releaseUrl = `${BASE_URL}/release/${release.slug}`;
  const coverUrl = toAbsoluteUrl(release.coverPath);
  const audioUrl = toAbsoluteUrl(release.audioPath);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: release.title,
    url: releaseUrl,
    description: release.description ?? undefined,
    image: coverUrl ?? undefined,
    byArtist: {
      "@type": "MusicGroup",
      name: artistName
    },
    inAlbum: {
      "@type": "MusicAlbum",
      name: release.title
    },
    audio: audioUrl
      ? {
          "@type": "AudioObject",
          contentUrl: audioUrl
        }
      : undefined,
    datePublished: release.releaseDate ?? release.createdAt ?? undefined
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReleaseDetailClient release={release} initialComments={comments} />
    </>
  );
}
