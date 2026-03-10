import {
  createComment,
  fetchArtist,
  fetchArtists,
  fetchComments,
  fetchEngagementSummary,
  fetchFavoriteStatus,
  fetchRelease,
  fetchReleases,
  fetchTrendingReleases,
  normalizeAssetPath
} from "./api";
import {
  MobileArtist,
  MobileNotification,
  MobileRelease,
  mobileArtists,
  mobileNotifications,
  mobileReleases
} from "./mock-data";

type ApiArtist = {
  id: string;
  slug?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  _count?: { followers?: number; releases?: number };
  user?: { firstName?: string | null; email?: string | null };
};

type ApiRelease = {
  id: string;
  slug: string;
  title: string;
  genre?: string | null;
  description?: string | null;
  type?: "FREE" | "PAID";
  audioPath?: string;
  previewClip?: string | null;
  coverPath?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  mood?: string | null;
  energy?: number | null;
  previewDuration?: number | null;
  exclusiveFollowersOnly?: boolean;
  gateEnabled?: boolean;
  releaseDate?: string | null;
  createdAt?: string;
  trendScore?: number;
  _count?: { downloadSessions?: number; comments?: number };
  artist?: ApiArtist | null;
};

type ApiComment = {
  id: string;
  body: string;
  createdAt: string;
  likesCount?: number;
  isVerifiedPurchase?: boolean;
  user?: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    artist?: { displayName?: string | null; avatar?: string | null } | null;
  } | null;
};

export type MobileComment = {
  id: string;
  author: string;
  body: string;
  time: string;
  likesCount: number;
  verified: boolean;
};

export type MobileEngagement = {
  views: number;
  comments: number;
  shares: number;
  uniqueListeners: number;
  liked: boolean;
};

export type MobileReleaseDetail = {
  release: MobileRelease;
  artist: MobileArtist;
  comments: MobileComment[];
  related: MobileRelease[];
  engagement: MobileEngagement;
};

export type MobileCatalog = {
  releases: MobileRelease[];
  trending: MobileRelease[];
  artists: MobileArtist[];
  notifications: MobileNotification[];
  featuredTrack: MobileRelease;
  source: "api" | "fallback";
};

const releasePalettes: Array<[string, string]> = [
  ["#7c3aed", "#312e81"],
  ["#ec4899", "#7c2d12"],
  ["#06b6d4", "#1e293b"],
  ["#4f46e5", "#111827"],
  ["#f97316", "#431407"],
  ["#14b8a6", "#0f172a"]
];

function stringHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function pickPalette(seed: string): [string, string] {
  return releasePalettes[stringHash(seed) % releasePalettes.length];
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("") || "SR";
}

function formatCompactCount(value?: number | null): string {
  const safeValue = Number(value ?? 0);
  if (safeValue >= 1000000) return `${(safeValue / 1000000).toFixed(1)}M`;
  if (safeValue >= 1000) return `${(safeValue / 1000).toFixed(1)}k`;
  return `${safeValue}`;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 1) return "Preview";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${`${remainingSeconds}`.padStart(2, "0")}`;
}

function formatGenre(value?: string | null): string {
  if (!value) return "Electronic";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRelativeDate(value?: string | null): string {
  if (!value) return "Now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Now";
  const delta = Date.now() - parsed.getTime();
  const hours = Math.floor(delta / 3600000);
  if (hours < 1) return "Now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return parsed.toLocaleDateString("fr-BE", { day: "2-digit", month: "short" });
}

function buildArtistName(artist?: ApiArtist | null): string {
  return artist?.displayName ?? artist?.user?.firstName ?? artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";
}

function buildPriceLabel(release: ApiRelease): string {
  if (release.gateEnabled) return "Fan gate";
  if (release.exclusiveFollowersOnly) return "Followers only";
  if (release.type === "PAID") return "Premium access";
  return "Full stream";
}

function mapArtist(artist: ApiArtist): MobileArtist {
  const name = buildArtistName(artist);
  return {
    id: artist.id,
    slug: artist.slug ?? artist.id,
    name,
    initials: toInitials(name),
    genre: "Sauroraa Artist",
    followers: formatCompactCount(artist._count?.followers),
    verified: false,
    avatarUrl: normalizeAssetPath(artist.avatar) ?? null,
    bannerUrl: normalizeAssetPath(artist.bannerUrl) ?? null,
    bio: artist.bio ?? null
  };
}

function mapRelease(release: ApiRelease): MobileRelease {
  const [colorA, colorB] = pickPalette(release.slug || release.id);
  const artistName = buildArtistName(release.artist);
  return {
    id: release.id,
    slug: release.slug,
    title: release.title,
    artistId: release.artist?.id ?? "unknown",
    artist: artistName,
    genre: formatGenre(release.genre),
    bpm: release.bpm ?? 128,
    key: release.musicalKey ?? "N/A",
    duration: formatDuration(release.previewDuration),
    priceLabel: buildPriceLabel(release),
    trendScore: release.trendScore ?? Math.max(42, (release._count?.downloadSessions ?? 0) + (release._count?.comments ?? 0) * 2),
    likes: formatCompactCount(release._count?.downloadSessions),
    comments: release._count?.comments ?? 0,
    colorA,
    colorB,
    description: release.description ?? release.mood ?? "Release issuee du catalogue SauroraaRecords, adaptee a une experience mobile plus directe.",
    coverUrl: normalizeAssetPath(release.coverPath) ?? null,
    audioUrl: normalizeAssetPath(release.previewClip) ?? normalizeAssetPath(release.audioPath) ?? null,
    releaseDate: release.releaseDate ?? release.createdAt ?? null
  };
}

function mapComment(comment: ApiComment): MobileComment {
  const author =
    comment.user?.artist?.displayName ??
    comment.user?.firstName ??
    comment.user?.email?.split("@")[0] ??
    "Listener";

  return {
    id: comment.id,
    author,
    body: comment.body,
    time: formatRelativeDate(comment.createdAt),
    likesCount: comment.likesCount ?? 0,
    verified: Boolean(comment.isVerifiedPurchase)
  };
}

export async function loadMobileCatalog(): Promise<MobileCatalog> {
  try {
    const [releasesRaw, trendingRaw, artistsRaw] = await Promise.all([
      fetchReleases() as Promise<ApiRelease[]>,
      fetchTrendingReleases() as Promise<ApiRelease[]>,
      fetchArtists() as Promise<ApiArtist[]>
    ]);

    const releases = releasesRaw.map(mapRelease);
    const trending = (trendingRaw.length ? trendingRaw : releasesRaw.slice(0, 8)).map(mapRelease);
    const artists = artistsRaw.map(mapArtist);

    if (!releases.length) throw new Error("No releases available");

    return {
      releases,
      trending: trending.length ? trending : releases.slice(0, 8),
      artists: artists.length ? artists : mobileArtists,
      notifications: mobileNotifications,
      featuredTrack: trending[0] ?? releases[0],
      source: "api"
    };
  } catch {
    return {
      releases: mobileReleases,
      trending: mobileReleases,
      artists: mobileArtists,
      notifications: mobileNotifications,
      featuredTrack: mobileReleases[0],
      source: "fallback"
    };
  }
}

export async function loadMobileReleaseDetail(slug: string): Promise<MobileReleaseDetail> {
  try {
    const releaseRaw = (await fetchRelease(slug)) as ApiRelease;
    const release = mapRelease(releaseRaw);
    const artistRaw = releaseRaw.artist?.id
      ? ((await fetchArtist(releaseRaw.artist.id)) as ApiArtist)
      : releaseRaw.artist ?? null;
    const artist = artistRaw ? mapArtist(artistRaw) : mobileArtists[0];

    const [commentsRaw, releasesRaw, summaryRaw] = await Promise.all([
      fetchComments({ releaseId: releaseRaw.id }) as Promise<ApiComment[]>,
      fetchReleases() as Promise<ApiRelease[]>,
      fetchEngagementSummary(releaseRaw.id)
    ]);

    let liked = false;
    try {
      // Requires auth; if not logged, we silently keep false.
      liked = false;
    } catch {
      liked = false;
    }

    return {
      release,
      artist,
      comments: commentsRaw.slice(0, 4).map(mapComment),
      related: releasesRaw
        .filter((item) => item.id !== releaseRaw.id)
        .slice(0, 4)
        .map(mapRelease),
      engagement: {
        views: Number(summaryRaw.views ?? 0),
        comments: Number(summaryRaw.comments ?? commentsRaw.length),
        shares: Number(summaryRaw.shares ?? 0),
        uniqueListeners: Number(summaryRaw.uniqueListeners ?? 0),
        liked
      }
    };
  } catch {
    const release = mobileReleases.find((item) => item.slug === slug) ?? mobileReleases[0];
    const artist = mobileArtists.find((item) => item.id === release.artistId) ?? mobileArtists[0];
    return {
      release,
      artist,
      comments: mobileNotifications.slice(0, 3).map((item) => ({
        id: item.id,
        author: item.title,
        body: item.body,
        time: item.time,
        likesCount: 0,
        verified: false
      })),
      related: mobileReleases.filter((item) => item.id !== release.id).slice(0, 4),
      engagement: {
        views: release.trendScore * 10,
        comments: release.comments,
        shares: 0,
        uniqueListeners: Math.max(1, Math.floor(release.trendScore / 2)),
        liked: false
      }
    };
  }
}
