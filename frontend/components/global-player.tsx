"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/player-store";
import { Button } from "./ui/button";

export function GlobalPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { title, artist, src, playing, setPlaying } = usePlayerStore();

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      void audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [playing, setPlaying]);

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(920px,95vw)] -translate-x-1/2 rounded-2xl border border-white/15 bg-black/55 p-3 backdrop-blur-xl">
      <audio ref={audioRef} src={src ?? undefined} onEnded={() => setPlaying(false)} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/65">{artist}</p>
        </div>
        <Button variant="outline" size="icon" disabled={!src} onClick={() => setPlaying(!playing)}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
