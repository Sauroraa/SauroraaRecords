export type ArtistProfile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  instagramUrl: string | null;
  soundcloudUrl: string | null;
  discordUrl: string | null;
  websiteUrl: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  user?: { email?: string; firstName?: string; lastName?: string };
  _count?: { followers?: number; releases?: number; dubpacks?: number };
  // Badge data from backend includes
  agencyLinks?: { agency: { displayName: string | null } }[];
  subscription?: { plan: string; status: string } | null;
};

export type ReleaseItem = {
  id: string;
  slug: string;
  title: string;
  genre?: string | null;
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
  // Gate / HypeEdit
  gateEnabled?: boolean;
  gateFollowArtist?: boolean;
  gateEmail?: boolean;
  gateInstagram?: boolean;
  gateSoundcloud?: boolean;
  gateDiscord?: boolean;
  // Trending score (computed by backend)
  trendScore?: number;
  _count?: { downloadSessions?: number; comments?: number };
};

export type DubpackItem = {
  id: string;
  slug: string;
  title: string;
  genre?: string | null;
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
  totalViews?: number;
  totalDownloads: number;
  totalShares?: number;
  totalRevenue?: number | string;
  artist: ArtistProfile;
};

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";
export type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type SupportMessageAuthorType = "USER" | "AGENT" | "BOT";

export type SupportMessageItem = {
  id: string;
  ticketId: string;
  authorType: SupportMessageAuthorType;
  authorId?: string | null;
  body: string;
  createdAt: string;
  author?: { id: string; email: string; role: string } | null;
};

export type SupportTicketItem = {
  id: string;
  subject: string;
  category?: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  assignedTo?: { id: string; email: string; role: string } | null;
  _count?: { messages?: number };
};

export type SupportTicketDetail = SupportTicketItem & {
  messages: SupportMessageItem[];
};

export type HomeOverviewStats = {
  artists: number;
  releases: number;
  maxCommissionPercent: number;
};

export type ArtistTrackViewsItem = {
  id: string;
  slug: string;
  title: string;
  coverPath?: string | null;
  createdAt: string;
  views: number;
  comments: number;
};

export type ArtistPublicStats = {
  artistId: string;
  totalViews: number;
  totalTracks: number;
  tracks: ArtistTrackViewsItem[];
};
