import { fetchReleases, fetchTrendingReleases, fetchArtists } from "@/lib/api";
import { HomeHero } from "@/components/home-hero";

export default async function HomePage() {
  const [releases, trending, artists] = await Promise.all([
    fetchReleases(),
    fetchTrendingReleases(),
    fetchArtists()
  ]);

  return (
    <HomeHero releases={releases} trending={trending} artists={artists} />
  );
}
