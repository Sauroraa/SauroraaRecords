"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReleases, fetchArtists, fetchHomeOverviewStats } from "@/lib/api";
import { HomeHero } from "@/components/home-hero";
import { LanguageChooserModal } from "@/components/language-chooser-modal";
import { useRankings } from "@/lib/hooks/use-rankings";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { jsonLd } from "./metadata";

export default function HomePage() {
  const { data: releases = [], isLoading: releasesLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases,
    refetchInterval: 60000, // 1 minute
  });

  const { data: artists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: fetchArtists,
    refetchInterval: 300000, // 5 minutes
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: fetchHomeOverviewStats,
    refetchInterval: 120000, // 2 minutes
  });

  const { trending, isLoading: rankingsLoading } = useRankings();

  if (releasesLoading || artistsLoading || rankingsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <LanguageChooserModal />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeHero releases={releases} trending={trending} artists={artists} stats={stats} />
    </>
  );
}
