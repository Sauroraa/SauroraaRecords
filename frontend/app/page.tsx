import { fetchReleases, fetchArtists } from "@/lib/api";
import { HomeHero } from "@/components/home-hero";

export default async function HomePage() {
  const [releases, artists] = await Promise.all([fetchReleases(), fetchArtists()]);

  return (
    <HomeHero releases={releases} artists={artists} />
  );
}
