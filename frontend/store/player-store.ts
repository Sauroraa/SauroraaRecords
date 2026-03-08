"use client";

import { create } from "zustand";

export type QueueTrack = {
  title: string;
  artist: string;
  src: string;
  coverPath?: string | null;
  releaseId?: string | null;
  releaseSlug?: string | null;
};

type RepeatMode = "none" | "one" | "all";

type PlayerState = {
  // Current track
  title: string;
  artist: string;
  coverPath: string | null;
  src: string | null;
  releaseId: string | null;
  releaseSlug: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  pendingSeekPercent: number | null;

  // Queue
  queue: QueueTrack[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;

  // Detail panel
  detailPanelOpen: boolean;
  detailPanelReleaseSlug: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setTrack: (payload: {
    title: string;
    artist: string;
    src: string;
    coverPath?: string | null;
    releaseId?: string | null;
    releaseSlug?: string | null;
  }) => void;
  setPlaying: (value: boolean) => void;
  setPlayback: (payload: { currentTime: number; duration: number }) => void;
  requestSeekPercent: (value: number) => void;
  clearPendingSeek: () => void;

  // Queue actions
  addToQueue: (track: QueueTrack) => void;
  playNow: (track: QueueTrack) => void;
  playQueue: (tracks: QueueTrack[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // Detail panel
  openDetailPanel: (slug: string) => void;
  closeDetailPanel: () => void;
};

function trackFromQueue(track: QueueTrack) {
  return {
    title: track.title,
    artist: track.artist,
    src: track.src,
    coverPath: track.coverPath ?? null,
    releaseId: track.releaseId ?? null,
    releaseSlug: track.releaseSlug ?? null,
    playing: true,
    currentTime: 0,
    duration: 0,
    pendingSeekPercent: null,
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  title: "No track selected",
  artist: "Sauroraa Records",
  coverPath: null,
  src: null,
  releaseId: null,
  releaseSlug: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  pendingSeekPercent: null,

  queue: [],
  queueIndex: 0,
  shuffle: false,
  repeat: "none",

  detailPanelOpen: false,
  detailPanelReleaseSlug: null,

  // ── Basic track control ────────────────────────────────────────────────────
  setTrack: ({ title, artist, src, coverPath, releaseId, releaseSlug }) => {
    const track: QueueTrack = { title, artist, src, coverPath, releaseId, releaseSlug };
    set({
      title,
      artist,
      coverPath: coverPath ?? null,
      src,
      releaseId: releaseId ?? null,
      releaseSlug: releaseSlug ?? null,
      playing: false,
      currentTime: 0,
      duration: 0,
      pendingSeekPercent: null,
      queue: [track],
      queueIndex: 0,
    });
  },

  setPlaying: (value) => set({ playing: value }),

  setPlayback: ({ currentTime, duration }) => set({ currentTime, duration }),

  requestSeekPercent: (value) =>
    set({ pendingSeekPercent: Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null }),

  clearPendingSeek: () => set({ pendingSeekPercent: null }),

  // ── Queue actions ──────────────────────────────────────────────────────────
  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),

  playNow: (track) => {
    set({ ...trackFromQueue(track), queue: [track], queueIndex: 0 });
  },

  playQueue: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    const idx = Math.min(startIndex, tracks.length - 1);
    set({ ...trackFromQueue(tracks[idx]), queue: tracks, queueIndex: idx });
  },

  next: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    if (repeat === "one") {
      set({ pendingSeekPercent: 0, playing: true });
      return;
    }

    let nextIndex: number;
    if (shuffle) {
      const available = queue.map((_, i) => i).filter((i) => i !== queueIndex);
      if (available.length === 0) {
        if (repeat === "all") nextIndex = queueIndex;
        else { set({ playing: false }); return; }
      } else {
        nextIndex = available[Math.floor(Math.random() * available.length)];
      }
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === "all") nextIndex = 0;
        else { set({ playing: false }); return; }
      }
    }

    set({ ...trackFromQueue(queue[nextIndex]), queueIndex: nextIndex });
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3s in → restart current track
    if (currentTime > 3) {
      set({ pendingSeekPercent: 0 });
      return;
    }

    const prevIndex = Math.max(0, queueIndex - 1);
    set({ ...trackFromQueue(queue[prevIndex]), queueIndex: prevIndex });
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeat:
        s.repeat === "none" ? "all" : s.repeat === "all" ? "one" : "none",
    })),

  // ── Detail panel ──────────────────────────────────────────────────────────
  openDetailPanel: (slug) => set({ detailPanelOpen: true, detailPanelReleaseSlug: slug }),
  closeDetailPanel: () => set({ detailPanelOpen: false, detailPanelReleaseSlug: null }),
}));
