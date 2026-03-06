"use client";

import { create } from "zustand";

type PlayerState = {
  title: string;
  artist: string;
  coverPath: string | null;
  src: string | null;
  releaseId: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  pendingSeekPercent: number | null;
  setTrack: (payload: { title: string; artist: string; src: string; coverPath?: string | null; releaseId?: string | null }) => void;
  setPlaying: (value: boolean) => void;
  setPlayback: (payload: { currentTime: number; duration: number }) => void;
  requestSeekPercent: (value: number) => void;
  clearPendingSeek: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  title: "No track selected",
  artist: "Sauroraa Records",
  coverPath: null,
  src: null,
  releaseId: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  pendingSeekPercent: null,
  setTrack: ({ title, artist, src, coverPath, releaseId }) =>
    set({
      title,
      artist,
      coverPath: coverPath ?? null,
      src,
      releaseId: releaseId ?? null,
      playing: false,
      currentTime: 0,
      duration: 0,
      pendingSeekPercent: null
    }),
  setPlaying: (value) => set({ playing: value }),
  setPlayback: ({ currentTime, duration }) => set({ currentTime, duration }),
  requestSeekPercent: (value) =>
    set({ pendingSeekPercent: Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null }),
  clearPendingSeek: () => set({ pendingSeekPercent: null })
}));
