export type ArtistProfile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  instagramUrl: string | null;
  soundcloudUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  user?: { email?: string };
  _count?: { followers?: number; releases?: number; dubpacks?: number };
};

export type ReleaseItem = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number | string;
  type: "FREE" | "PAID";
  audioPath: string;
  previewClip?: string | null;
  coverPath?: string | null;
  published?: boolean;
  exclusiveFollowersOnly?: boolean;
  releaseDate?: string | null;
  createdAt?: string;
  artist?: ArtistProfile & { id: string };
};

export type DubpackItem = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number | string;
  type: "FREE" | "PAID";
  coverPath?: string | null;
  zipPath: string;
  isExclusive: boolean;
  published?: boolean;
  releaseDate?: string | null;
  createdAt?: string;
  artist?: ArtistProfile & { id: string };
};
 
export type SubscriptionItem = {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
};

export type CommentItem = {
  id: string;
  userId: string;
  body: string;
  likesCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  parentId: string | null;
  user: { id: string; email: string };
  replies?: CommentItem[];
};

export type RevenueSeries = {
  month: string;
  gross: number;
  net: number;
  label: number;
};

export type OrderItem = {
  id: string;
  total: number | string;
  createdAt: string;
  items: {
    id: string;
    price: number | string;
    release?: { title: string; slug: string } | null;
    dubpack?: { title: string; slug: string } | null;
  }[];
};

export type NotificationItem = {
  id: string;
  type: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type RankingItem = {
  id: string;
  rank: number;
  month: string;
  totalDownloads: number;
  totalRevenue: number | string;
  artist: ArtistProfile;
};
