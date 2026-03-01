"use client";

import { create } from "zustand";

type PlayerState = {
  title: string;
  artist: string;
  src: string | null;
  playing: boolean;
  setTrack: (payload: { title: string; artist: string; src: string }) => void;
  setPlaying: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  title: "No track selected",
  artist: "Sauroraa Records",
  src: null,
  playing: false,
  setTrack: ({ title, artist, src }) => set({ title, artist, src, playing: false }),
  setPlaying: (value) => set({ playing: value })
}));
