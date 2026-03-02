"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/player-store";

export function GlobalPlayer() {
  const { title, artist, src, playing, setPlaying } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [src, playing, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setPlaying]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio?.duration) return;
    const pct = Number(e.target.value);
    audio.currentTime = (pct / 100) * audio.duration;
    setProgress(pct);
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.08)] bg-bg/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0 w-48 shrink-0">
          <div className="h-10 w-10 rounded-sm shrink-0 bg-gradient-to-br from-violet/30 to-violet/5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{title}</p>
            <p className="text-xs text-cream/50 truncate">{artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
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

        {/* Volume */}
        <div className="flex w-32 shrink-0 items-center gap-2">
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
        </div>
      </div>
    </div>
  );
}
