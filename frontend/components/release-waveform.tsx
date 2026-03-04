"use client";

import { useMemo } from "react";

type ReleaseWaveformProps = {
  src: string;
  title: string;
  progressPercent: number;
  currentTime: number;
  duration: number;
  onSeekPercent: (value: number) => void;
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function buildWaveSeed(input: string, count: number) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = (1664525 * hash + 1013904223) >>> 0;
    const base = 24 + ((hash >>> 8) % 62);
    const smooth = Math.sin((i / count) * Math.PI * 3) * 8;
    values.push(Math.max(12, Math.min(86, base + smooth)));
  }
  return values;
}

export function ReleaseWaveform({
  src,
  title,
  progressPercent,
  currentTime,
  duration,
  onSeekPercent
}: ReleaseWaveformProps) {
  const bars = useMemo(() => buildWaveSeed(`${src}:${title}`, 96), [src, title]);
  const activeBars = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * bars.length);

  return (
    <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
      <button
        type="button"
        className="group relative flex h-20 w-full items-end justify-between gap-[2px] overflow-hidden rounded-[8px] bg-black/25 px-2 py-2"
        aria-label="Seek audio position"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const pct = ((event.clientX - rect.left) / rect.width) * 100;
          onSeekPercent(pct);
        }}
      >
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className={`w-[3px] shrink-0 rounded-sm transition-colors ${
              index <= activeBars ? "bg-violet-light" : "bg-cream/25 group-hover:bg-cream/35"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </button>

      <div className="mt-2 flex items-center justify-between text-[11px] text-cream/45">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
