import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";
const INTERNAL_API = process.env.INTERNAL_API_BASE ?? process.env.API_BASE ?? "http://backend:4000/api";
const PUBLIC_API = `${BASE}/api`;

async function apiFetch<T>(path: string): Promise<T[]> {
  const urls = [INTERNAL_API, PUBLIC_API];
  for (const base of urls) {
    try {
      const res = await fetch(`${base}${path}`, { next: { revalidate: 3600 } });
      if (res.ok) return (await res.json()) as T[];
    } catch {}
  }
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/rankings`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/patchnotes`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/legal/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/cgv`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/rgpd`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.2 }
  ];

  // Dynamic: releases
  const releases = await apiFetch<{ slug: string; createdAt?: string }>("/releases");
  const releaseRoutes: MetadataRoute.Sitemap = releases.map(r => ({
    url: `${BASE}/release/${r.slug}`,
    lastModified: r.createdAt ? new Date(r.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.85
  }));

  // Dynamic: artists
  const artists = await apiFetch<{ id: string; slug?: string | null; displayName?: string | null }>("/artists");
  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter(a => a.displayName)
    .map(a => ({
      url: `${BASE}/artist/${a.slug ?? a.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75
    }));

  // Dynamic: dubpacks
  const dubpacks = await apiFetch<{ slug: string; createdAt?: string }>("/dubpacks");
  const dubpackRoutes: MetadataRoute.Sitemap = dubpacks.map(d => ({
    url: `${BASE}/dubpack/${d.slug}`,
    lastModified: d.createdAt ? new Date(d.createdAt) : now,
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...staticRoutes, ...releaseRoutes, ...artistRoutes, ...dubpackRoutes];
}
