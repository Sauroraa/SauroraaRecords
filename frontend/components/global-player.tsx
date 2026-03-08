"use client";

import {
  Pause, Play, Volume2, VolumeX, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, ListMusic, Maximize2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePlayerStore } from "@/store/player-store";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
const VIEW_THRESHOLD_SECONDS = 15;

export function GlobalPlayer() {
  const {
    title, artist, coverPath, src, releaseId, releaseSlug,
    playing, setPlaying, setPlayback, pendingSeekPercent, clearPendingSeek,
    shuffle, repeat, toggleShuffle, cycleRepeat, next, prev,
    openDetailPanel, queue,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  // View / heatmap tracking
  const viewTrackedRef = useRef<string | null>(null);
  const playSecondsRef = useRef(0);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fireViewEvent = (rId: string) => {
    void fetch(`${API}/engagement/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ releaseId: rId, scope: "FULL", playlistPath: `/release/${rId}` }),
    }).catch(() => {});
  };

  const fireHeatmapEvent = (rId: string, secondMark: number) => {
    void fetch(`${API}/engagement/heatmap/${rId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ secondMark }),
    }).catch(() => {});
  };

  // Init audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset view tracking when release changes
  useEffect(() => {
    playSecondsRef.current = 0;
    viewTrackedRef.current = null;
  }, [releaseId]);

  // Play/pause timer for view + heatmap
  useEffect(() => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    if (playing && releaseId) {
      playTimerRef.current = setInterval(() => {
        playSecondsRef.current += 1;

        if (
          playSecondsRef.current >= VIEW_THRESHOLD_SECONDS &&
          releaseId &&
          viewTrackedRef.current !== releaseId
        ) {
          viewTrackedRef.current = releaseId;
          fireViewEvent(releaseId);
        }

        if (
          playSecondsRef.current % 5 === 0 &&
          releaseId &&
          audioRef.current?.currentTime
        ) {
          fireHeatmapEvent(releaseId, Math.floor(audioRef.current.currentTime));
        }
      }, 1000);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, releaseId]);

  // Sync audio src + play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
      setProgress(0);
      setDuration(0);
      setPlayback({ currentTime: 0, duration: 0 });
    }
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [src, playing, setPlaying, setPlayback]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        setPlayback({ currentTime: audio.currentTime, duration: audio.duration });
      }
    };
    const onLoaded = () => {
      setDuration(audio.duration);
      setPlayback({ currentTime: audio.currentTime, duration: audio.duration });
    };
    const onEnded = () => {
      // Auto-advance to next in queue
      usePlayerStore.getState().next();
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setPlaying, setPlayback]);

  // Handle pending seek from store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio?.duration || pendingSeekPercent == null) return;
    const pct = Math.min(100, Math.max(0, pendingSeekPercent));
    audio.currentTime = (pct / 100) * audio.duration;
    setProgress(pct);
    setPlayback({ currentTime: audio.currentTime, duration: audio.duration });
    clearPendingSeek();
  }, [pendingSeekPercent, clearPendingSeek, setPlayback]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const pct = Number(e.target.value);
    audio.currentTime = (pct / 100) * audio.duration;
    setProgress(pct);
    setPlayback({ currentTime: audio.currentTime, duration: audio.duration });
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentTime = duration ? (progress / 100) * duration : 0;

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  if (!src) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.08)] bg-bg/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">

        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 w-52 shrink-0">
          <div className="relative h-10 w-10 rounded-sm shrink-0 overflow-hidden bg-gradient-to-br from-violet/30 to-violet/5">
            {coverPath && (
              <Image src={coverPath} alt={title} fill className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{title}</p>
            <p className="text-xs text-cream/50 truncate">{artist}</p>
          </div>
          {releaseSlug && (
            <button
              onClick={() => openDetailPanel(releaseSlug)}
              title="Track details"
              className="shrink-0 text-cream/30 hover:text-violet-light transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Controls + seek bar */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title="Shuffle"
              className={`transition-colors ${shuffle ? "text-violet-light" : "text-cream/30 hover:text-cream/60"}`}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>

            {/* Prev */}
            <button
              onClick={prev}
              disabled={!src}
              className="text-cream/50 hover:text-cream transition-colors disabled:opacity-30"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              disabled={!src}
              onClick={() => setPlaying(!playing)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-violet/80 text-white hover:bg-violet transition-colors disabled:opacity-30"
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-px" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={next}
              disabled={!src}
              className="text-cream/50 hover:text-cream transition-colors disabled:opacity-30"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
              className={`transition-colors ${repeat !== "none" ? "text-violet-light" : "text-cream/30 hover:text-cream/60"}`}
            >
              <RepeatIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Seek bar */}
          <div className="flex w-full items-center gap-2">
            <span className="w-8 text-right text-[10px] tabular-nums text-cream/40">
              {fmt(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={seek}
              disabled={!src}
              className="h-1 flex-1 cursor-pointer accent-violet disabled:cursor-default"
            />
            <span className="w-8 text-[10px] tabular-nums text-cream/40">{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume + queue */}
        <div className="flex w-36 shrink-0 items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-cream/40 transition-colors hover:text-cream/70"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolume}
            className="h-1 w-full cursor-pointer accent-violet"
          />
          {queue.length > 1 && (
            <div className="flex items-center gap-1 text-cream/30">
              <ListMusic className="h-3.5 w-3.5" />
              <span className="text-[10px]">{queue.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
