import type { Metadata } from "next";
import { fetchReleases, fetchTrendingReleases, fetchArtists, fetchHomeOverviewStats } from "@/lib/api";
import { HomeHero } from "@/components/home-hero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  alternates: { canonical: "https://sauroraarecords.be" }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://sauroraarecords.be/#organization",
      name: "Sauroraa Records",
      url: "https://sauroraarecords.be",
      logo: {
        "@type": "ImageObject",
        url: "https://sauroraarecords.be/icon.png",
        width: 512,
        height: 512
      },
      sameAs: [
        "https://www.instagram.com/sauroraarecords",
        "https://soundcloud.com/sauroraarecords"
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "BE"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://sauroraarecords.be/#website",
      url: "https://sauroraarecords.be",
      name: "Sauroraa Records",
      publisher: { "@id": "https://sauroraarecords.be/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://sauroraarecords.be/catalog?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default async function HomePage() {
  const [releases, trending, artists, stats] = await Promise.all([
    fetchReleases(),
    fetchTrendingReleases(),
    fetchArtists(),
    fetchHomeOverviewStats()
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero releases={releases} trending={trending} artists={artists} stats={stats} />
    </>
  );
}
