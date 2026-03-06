import type {
  ReleaseItem,
  DubpackItem,
  ArtistProfile,
  CommentItem,
  RankingItem,
  SubscriptionItem,
  SupportTicketItem,
  SupportTicketDetail,
  SupportTicketPriority,
  HomeOverviewStats,
  ArtistPublicStats
} from "./types";

function resolveApiBase(): string {
  const publicBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
  if (typeof window !== "undefined") return publicBase;
  return process.env.INTERNAL_API_BASE ?? process.env.API_BASE ?? "http://backend:4000/api";
}

const API = resolveApiBase();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";
const PUBLIC_FALLBACK_API = `${SITE_URL.replace(/\/$/, "")}/api`;

function normalizeAssetPath(path?: string | null): string | null | undefined {
  if (path == null) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

function normalizeArtist(artist?: ArtistProfile | null): ArtistProfile | undefined {
  if (!artist) return undefined;
  const userWithSub = artist.user as (typeof artist.user & { subscription?: { plan: string; status: string } | null }) | undefined;
  return {
    ...artist,
    avatar: normalizeAssetPath(artist.avatar) ?? null,
    subscription: artist.subscription ?? userWithSub?.subscription ?? null
  };
}

function normalizeRelease(release: ReleaseItem): ReleaseItem {
  return {
    ...release,
    coverPath: normalizeAssetPath(release.coverPath) ?? null,
    audioPath: normalizeAssetPath(release.audioPath) ?? release.audioPath,
    previewClip: normalizeAssetPath(release.previewClip) ?? null,
    artist: release.artist
      ? ({
          ...release.artist,
          avatar: normalizeAssetPath(release.artist.avatar) ?? null
        } as ReleaseItem["artist"])
      : release.artist
  };
}

function normalizeReleases(items: ReleaseItem[]): ReleaseItem[] {
  return items.map(normalizeRelease);
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const targets =
    typeof window !== "undefined"
      ? [`${API}${path}`]
      : Array.from(new Set([`${API}${path}`, `${PUBLIC_FALLBACK_API}${path}`]));

  for (const target of targets) {
    try {
      const res = await fetch(target, init);
      if (res.ok) return res;
    } catch {
      continue;
    }
  }

  return null;
}

// ─── Releases ─────────────────────────────────────────────────────────────────

export async function fetchReleases(): Promise<ReleaseItem[]> {
  const res = await apiFetch("/releases", { cache: "no-store" });
  try {
    if (!res) return [];
    const data = (await res.json()) as ReleaseItem[];
    return normalizeReleases(data);
  } catch {
    return [];
  }
}

export async function fetchTrendingReleases(): Promise<ReleaseItem[]> {
  const res = await apiFetch("/releases/trending", { cache: "no-store" });
  try {
    if (!res) return [];
    const data = (await res.json()) as ReleaseItem[];
    return normalizeReleases(data);
  } catch {
    return [];
  }
}

export async function fetchHomeOverviewStats(): Promise<HomeOverviewStats> {
  const res = await apiFetch("/releases/stats/overview", { cache: "no-store" });
  try {
    if (!res) return { artists: 0, releases: 0, maxCommissionPercent: 30 };
    return (await res.json()) as HomeOverviewStats;
  } catch {
    return { artists: 0, releases: 0, maxCommissionPercent: 30 };
  }
}

export async function fetchRelease(slug: string): Promise<ReleaseItem | null> {
  const res = await apiFetch(`/releases/${slug}`, { cache: "no-store" });
  try {
    if (!res) return null;
    const data = (await res.json()) as ReleaseItem;
    return normalizeRelease(data);
  } catch {
    return null;
  }
}

// ─── Dubpacks ─────────────────────────────────────────────────────────────────

export async function fetchDubpacks(): Promise<DubpackItem[]> {
  const res = await apiFetch("/dubpacks", { cache: "no-store" });
  try {
    if (!res) throw new Error("API unavailable");
    return (await res.json()) as DubpackItem[];
  } catch {
    return [];
  }
}

export async function fetchDubpack(slug: string): Promise<DubpackItem | null> {
  const res = await apiFetch(`/dubpacks/${slug}`, { cache: "no-store" });
  try {
    if (!res) return null;
    return (await res.json()) as DubpackItem;
  } catch {
    return null;
  }
}

// ─── Artists ──────────────────────────────────────────────────────────────────

export async function fetchArtists(): Promise<ArtistProfile[]> {
  const res = await apiFetch("/artists", { cache: "no-store" });
  try {
    if (!res) return [];
    const data = (await res.json()) as ArtistProfile[];
    return data.map((artist) => normalizeArtist(artist) as ArtistProfile);
  } catch {
    return [];
  }
}

export async function fetchArtist(id: string): Promise<ArtistProfile | null> {
  const res = await apiFetch(`/artists/${id}`, { cache: "no-store" });
  try {
    if (!res) return null;
    const data = (await res.json()) as ArtistProfile;
    return normalizeArtist(data) ?? null;
  } catch {
    return null;
  }
}

export async function fetchArtistStats(id: string): Promise<ArtistPublicStats | null> {
  const res = await apiFetch(`/artists/${id}/stats`, { cache: "no-store" });
  try {
    if (!res) return null;
    return (await res.json()) as ArtistPublicStats;
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
  const res = await apiFetch(`/comments?${query.toString()}`, { cache: "no-store" });
  try {
    if (!res) return [];
    return (await res.json()) as CommentItem[];
  } catch {
    return [];
  }
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

export async function fetchRankings(month?: string): Promise<RankingItem[]> {
  const path = month ? `/rankings?month=${month}` : "/rankings";
  const res = await apiFetch(path, { cache: "no-store" });
  try {
    if (!res) return [];
    return (await res.json()) as RankingItem[];
  } catch {
    return [];
  }
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export async function fetchMySubscription(): Promise<SubscriptionItem | null> {
  const res = await apiFetch("/subscriptions/me", { cache: "no-store", credentials: "include" });
  try {
    if (!res) return null;
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

// ─── Support ──────────────────────────────────────────────────────────────────

export async function fetchMySupportTickets(): Promise<SupportTicketItem[]> {
  const res = await apiFetch("/support/tickets/mine", { cache: "no-store", credentials: "include" });
  try {
    if (!res) return [];
    return (await res.json()) as SupportTicketItem[];
  } catch {
    return [];
  }
}

export async function fetchSupportTicket(id: string): Promise<SupportTicketDetail | null> {
  const res = await apiFetch(`/support/tickets/${id}`, { cache: "no-store", credentials: "include" });
  try {
    if (!res) return null;
    return (await res.json()) as SupportTicketDetail;
  } catch {
    return null;
  }
}

export async function createSupportTicket(input: {
  subject: string;
  message: string;
  category?: string;
  priority?: SupportTicketPriority;
}): Promise<SupportTicketDetail | null> {
  try {
    const res = await fetch(`${API}/support/tickets`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!res.ok) return null;
    return (await res.json()) as SupportTicketDetail;
  } catch {
    return null;
  }
}

export async function sendSupportMessage(ticketId: string, body: string): Promise<SupportTicketDetail | null> {
  try {
    const res = await fetch(`${API}/support/tickets/${ticketId}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (!res.ok) return null;
    return (await res.json()) as SupportTicketDetail;
  } catch {
    return null;
  }
}
