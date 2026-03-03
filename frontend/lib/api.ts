import type { ReleaseItem, DubpackItem, ArtistProfile, CommentItem, RankingItem, SubscriptionItem } from "./types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// ─── Releases ─────────────────────────────────────────────────────────────────

export async function fetchReleases(): Promise<ReleaseItem[]> {
  try {
    const res = await fetch(`${API}/releases`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ReleaseItem[];
  } catch {
    return [];
  }
}

export async function fetchTrendingReleases(): Promise<ReleaseItem[]> {
  try {
    const res = await fetch(`${API}/releases/trending`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ReleaseItem[];
  } catch {
    return [];
  }
}

export async function fetchRelease(slug: string): Promise<ReleaseItem | null> {
  try {
    const res = await fetch(`${API}/releases/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ReleaseItem;
  } catch {
    return null;
  }
}

// ─── Dubpacks ─────────────────────────────────────────────────────────────────

export async function fetchDubpacks(): Promise<DubpackItem[]> {
  try {
    const res = await fetch(`${API}/dubpacks`, { cache: "no-store" });
    if (!res.ok) throw new Error("API unavailable");
    return (await res.json()) as DubpackItem[];
  } catch {
    return [];
  }
}

export async function fetchDubpack(slug: string): Promise<DubpackItem | null> {
  try {
    const res = await fetch(`${API}/dubpacks/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as DubpackItem;
  } catch {
    return null;
  }
}

// ─── Artists ──────────────────────────────────────────────────────────────────

export async function fetchArtists(): Promise<ArtistProfile[]> {
  try {
    const res = await fetch(`${API}/artists`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ArtistProfile[];
  } catch {
    return [];
  }
}

export async function fetchArtist(id: string): Promise<ArtistProfile | null> {
  try {
    const res = await fetch(`${API}/artists/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ArtistProfile;
  } catch {
    return null;
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(params: {
  releaseId?: string;
  dubpackId?: string;
}): Promise<CommentItem[]> {
  const query = new URLSearchParams();
  if (params.releaseId) query.set("releaseId", params.releaseId);
  if (params.dubpackId) query.set("dubpackId", params.dubpackId);
  try {
    const res = await fetch(`${API}/comments?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as CommentItem[];
  } catch {
    return [];
  }
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function fetchRankings(month?: string): Promise<RankingItem[]> {
  const url = month ? `${API}/rankings?month=${month}` : `${API}/rankings`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as RankingItem[];
  } catch {
    return [];
  }
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export async function fetchMySubscription(): Promise<SubscriptionItem | null> {
  try {
    const res = await fetch(`${API}/subscriptions/me`, { cache: "no-store", credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as SubscriptionItem;
  } catch {
    return null;
  }
}

export async function cancelSubscription(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/subscriptions/me`, {
      method: "DELETE",
      credentials: "include"
    });
    return res.ok;
  } catch {
    return false;
  }
}
