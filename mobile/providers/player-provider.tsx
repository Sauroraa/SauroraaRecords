import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { recordHeatmap, trackEngagementView } from "@/lib/api";
import { useAppState } from "./app-provider";

export type PlayerTrack = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  audioUrl: string | null;
  coverUrl?: string | null;
  colors?: [string, string];
};

type PlayerContextValue = {
  currentTrack: PlayerTrack | null;
  playing: boolean;
  progress: number;
  progressLabel: string;
  playTrack: (track: PlayerTrack) => void;
  togglePlayback: () => void;
  stopPlayback: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);
const VIEW_THRESHOLD_SECONDS = 3;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${`${remainder}`.padStart(2, "0")}`;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { session } = useAppState();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heatmapBucketRef = useRef(-1);
  const trackedViewRef = useRef<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("0:00 / 0:00");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const audio = new window.Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!audio.duration) return;
      const current = audio.currentTime;
      setProgress(current / audio.duration);
      setProgressLabel(`${formatTime(current)} / ${formatTime(audio.duration)}`);

      if (currentTrack?.id && current >= VIEW_THRESHOLD_SECONDS && trackedViewRef.current !== currentTrack.id) {
        trackedViewRef.current = currentTrack.id;
        void trackEngagementView(
          { releaseId: currentTrack.id, scope: "FULL", playlistPath: `/releases/${currentTrack.slug}` },
          session.accessToken
        ).catch(() => {});
      }

      if (currentTrack?.id) {
        const bucket = Math.floor(current / 5);
        if (bucket !== heatmapBucketRef.current) {
          heatmapBucketRef.current = bucket;
          void recordHeatmap(currentTrack.id, Math.floor(current), session.accessToken).catch(() => {});
        }
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setProgress(1);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack?.id, currentTrack?.slug, session.accessToken]);

  const value = useMemo<PlayerContextValue>(() => ({
    currentTrack,
    playing,
    progress,
    progressLabel,
    playTrack: (track) => {
      setCurrentTrack(track);
      trackedViewRef.current = null;
      heatmapBucketRef.current = -1;
      setProgress(0);
      setProgressLabel("0:00 / 0:00");

      if (audioRef.current && track.audioUrl) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        void audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    },
    togglePlayback: () => {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        void audioRef.current.play().catch(() => {});
        setPlaying(true);
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    },
    stopPlayback: () => {
      audioRef.current?.pause();
      setPlaying(false);
      setProgress(0);
    }
  }), [currentTrack, playing, progress, progressLabel]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}
