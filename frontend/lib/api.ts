import type { ReleaseItem } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

const fallbackReleases: ReleaseItem[] = [
  {
    id: "demo-1",
    slug: "neon-pulse",
    title: "Neon Pulse",
    description: "Cinematic synthwave release.",
    price: 4.99,
    type: "PAID",
    audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverPath: null
  },
  {
    id: "demo-2",
    slug: "abyss-drift",
    title: "Abyss Drift",
    description: "Deep immersive ambient textures.",
    price: 0,
    type: "FREE",
    audioPath: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverPath: null
  }
];

export async function fetchReleases(): Promise<ReleaseItem[]> {
  try {
    const res = await fetch(`${API_BASE}/releases`, { cache: "no-store" });
    if (!res.ok) throw new Error("API unavailable");
    const data = (await res.json()) as ReleaseItem[];
    return data.length ? data : fallbackReleases;
  } catch {
    return fallbackReleases;
  }
}
