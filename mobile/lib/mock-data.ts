export type MobileArtist = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  genre: string;
  followers: string;
  verified?: boolean;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
};

export type MobileRelease = {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  duration: string;
  priceLabel: string;
  trendScore: number;
  likes: string;
  comments: number;
  colorA: string;
  colorB: string;
  description: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  releaseDate?: string | null;
};

export type MobileNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
};

export const mobileArtists: MobileArtist[] = [
  { id: "art-1", slug: "sauroraa", name: "Sauroraa", initials: "SA", genre: "Future bass", followers: "18.4k", verified: true },
  { id: "art-2", slug: "aurix", name: "Aurix", initials: "AU", genre: "Techno noir", followers: "9.2k" },
  { id: "art-3", slug: "lyrah", name: "Lyrah", initials: "LY", genre: "Melodic trap", followers: "24.1k", verified: true },
  { id: "art-4", slug: "nova-rush", name: "Nova Rush", initials: "NR", genre: "Drum & Bass", followers: "13.7k" }
];

export const mobileReleases: MobileRelease[] = [
  {
    id: "rel-1",
    slug: "night-transit",
    title: "Night Transit",
    artistId: "art-1",
    artist: "Sauroraa",
    genre: "Future bass",
    bpm: 142,
    key: "F#m",
    duration: "3:41",
    priceLabel: "Preview unlocked",
    trendScore: 92,
    likes: "12.8k",
    comments: 128,
    colorA: "#7c3aed",
    colorB: "#312e81",
    description: "Une release cinematic avec un drop dense, pensée pour discovery, replay et playlists nocturnes."
  },
  {
    id: "rel-2",
    slug: "low-frequency-bloom",
    title: "Low Frequency Bloom",
    artistId: "art-2",
    artist: "Aurix",
    genre: "Techno noir",
    bpm: 128,
    key: "Am",
    duration: "5:12",
    priceLabel: "Full stream",
    trendScore: 84,
    likes: "8.1k",
    comments: 76,
    colorA: "#4f46e5",
    colorB: "#111827",
    description: "Texture industrielle, groove sec et arrangement club-first avec montée progressive."
  },
  {
    id: "rel-3",
    slug: "halo-season",
    title: "Halo Season",
    artistId: "art-3",
    artist: "Lyrah",
    genre: "Melodic trap",
    bpm: 150,
    key: "D#m",
    duration: "2:58",
    priceLabel: "Premium preview",
    trendScore: 88,
    likes: "16.3k",
    comments: 203,
    colorA: "#ec4899",
    colorB: "#7c2d12",
    description: "Voix flottantes, percussion coupante et signature visuelle taillée pour le mobile."
  },
  {
    id: "rel-4",
    slug: "afterglow-engine",
    title: "Afterglow Engine",
    artistId: "art-4",
    artist: "Nova Rush",
    genre: "Drum & Bass",
    bpm: 174,
    key: "C#m",
    duration: "4:03",
    priceLabel: "Fan gate",
    trendScore: 79,
    likes: "6.5k",
    comments: 54,
    colorA: "#06b6d4",
    colorB: "#1e293b",
    description: "Drum work nerveux, bassline mobile-friendly et section finale pensée pour loop court."
  }
];

export const mobileNotifications: MobileNotification[] = [
  { id: "n-1", title: "New drop from Sauroraa", body: "Night Transit is trending this week on SauroraaMusic.", time: "2m", unread: true },
  { id: "n-2", title: "Fan gate unlocked", body: "You completed the required actions for Afterglow Engine.", time: "28m", unread: true },
  { id: "n-3", title: "Broadcast from Lyrah", body: "Private listening room opens tonight at 22:30.", time: "1h" },
  { id: "n-4", title: "Weekly recap", body: "3 artists you follow published new releases this week.", time: "Yesterday" }
];
