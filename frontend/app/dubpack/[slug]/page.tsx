import type { Metadata } from "next";
import { fetchDubpack, fetchComments } from "@/lib/api";
import { notFound } from "next/navigation";
import { DubpackDetailClient } from "./dubpack-detail-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";

interface Props {
  params: { slug: string };
}

function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return `${BASE_URL}/og-image.png`;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dubpack = await fetchDubpack(params.slug);
  if (!dubpack) {
    return {
      title: "Dubpack introuvable",
      robots: { index: false, follow: false }
    };
  }

  const artistName =
    dubpack.artist?.displayName ??
    dubpack.artist?.user?.firstName ??
    dubpack.artist?.user?.email?.split("@")[0] ??
    "Sauroraa Artist";
  const title = `${dubpack.title} — Dubpack ${artistName}`;
  const description =
    dubpack.description?.trim() ||
    `Téléchargez le dubpack ${dubpack.title} de ${artistName} sur Sauroraa Records.`;
  const canonical = `${BASE_URL}/dubpack/${dubpack.slug}`;
  const image = toAbsoluteUrl(dubpack.coverPath);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [{ url: image, alt: dubpack.title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export default async function DubpackPage({ params }: Props) {
  const dubpack = await fetchDubpack(params.slug);

  if (!dubpack) notFound();

  const comments = await fetchComments({ dubpackId: dubpack.id });

  const artistName =
    dubpack.artist?.displayName ??
    dubpack.artist?.user?.firstName ??
    dubpack.artist?.user?.email?.split("@")[0] ??
    "Sauroraa Artist";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dubpack.title,
    description: dubpack.description ?? undefined,
    image: toAbsoluteUrl(dubpack.coverPath),
    brand: {
      "@type": "Brand",
      name: "Sauroraa Records"
    },
    creator: {
      "@type": "MusicGroup",
      name: artistName
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: Number(dubpack.price),
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/dubpack/${dubpack.slug}`
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DubpackDetailClient dubpack={dubpack} initialComments={comments} />
    </>
  );
}
