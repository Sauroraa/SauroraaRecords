import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";
const INTERNAL_API = process.env.INTERNAL_API_BASE ?? process.env.API_BASE ?? "http://backend:4000/api";
const PUBLIC_API = `${BASE_URL}/api`;

async function getArtist(idOrSlug: string) {
  for (const api of [INTERNAL_API, PUBLIC_API]) {
    try {
      const res = await fetch(`${api}/artists/${encodeURIComponent(idOrSlug)}`, { cache: "no-store" });
      if (res.ok) return await res.json() as { id: string; displayName?: string | null; bio?: string | null; avatar?: string | null; slug?: string | null };
    } catch {}
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const artist = await getArtist(params.slug);
  if (!artist?.displayName) {
    return { title: "Artiste", robots: { index: false, follow: false } };
  }

  const name = artist.displayName;
  const slug = artist.slug ?? artist.id;
  const url = `${BASE_URL}/artist/${slug}`;
  const description = artist.bio?.trim() ||
    `Découvrez ${name} sur Sauroraa Records — releases, streams et téléchargements.`;
  const coverUrl = artist.avatar ? `${BASE_URL}${artist.avatar.startsWith("/") ? "" : "/"}${artist.avatar}` : `${BASE_URL}/og-image.png`;

  return {
    title: `${name} — Sauroraa Records`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} · Sauroraa Records`,
      description,
      url,
      type: "profile",
      images: [{ url: coverUrl, alt: `${name} — Sauroraa Records` }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} · Sauroraa Records`,
      description,
      images: [coverUrl]
    }
  };
}

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
