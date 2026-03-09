"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// Cache peaks in memory to avoid redundant fetches
const peaksCache = new Map<string, number[]>();

// Pseudo-random fallback (same as before)
function buildFallbackPeaks(seed: string, count: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (1664525 * hash + 1013904223) >>> 0;
    const base = 24 + ((hash >>> 8) % 62);
    const smooth = Math.sin((i / count) * Math.PI * 3) * 8;
    values.push(Math.max(12, Math.min(86, base + smooth)));
  }
  return values;
}

type Props = {
  releaseId: string;
  fallbackSeed: string;
  progressPercent: number;
  onSeekPercent: (pct: number) => void;
  bars?: number;
  height?: string;
};

export function RealWaveform({
  releaseId,
  fallbackSeed,
  progressPercent,
  onSeekPercent,
  bars = 120,
  height = "h-16"
}: Props) {
  const [realPeaks, setRealPeaks] = useState<number[] | null>(
    peaksCache.has(releaseId) ? peaksCache.get(releaseId)! : null
  );

  useEffect(() => {
    if (realPeaks !== null) return;
    void fetch(`${API}/releases/${releaseId}/waveform-data`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { peaks?: number[] } | null) => {
        if (data?.peaks && data.peaks.length > 0) {
          peaksCache.set(releaseId, data.peaks);
          setRealPeaks(data.peaks);
        } else {
          // Store empty to avoid refetch
          peaksCache.set(releaseId, []);
          setRealPeaks([]);
        }
      })
      .catch(() => setRealPeaks([]));
  }, [releaseId, realPeaks]);

  const bars_ = bars;

  // If real peaks available, resample to desired bar count
  const displayPeaks = useMemo(() => {
    if (realPeaks && realPeaks.length > 0) {
      // Resample real peaks to bar count
      const src = realPeaks;
      const result: number[] = [];
      for (let i = 0; i < bars_; i++) {
        const srcIdx = Math.floor((i / bars_) * src.length);
        // Normalize 0–1 to display range 12–88%
        result.push(12 + (src[Math.min(srcIdx, src.length - 1)] ?? 0) * 76);
      }
      return result;
    }
    return buildFallbackPeaks(fallbackSeed, bars_);
  }, [realPeaks, fallbackSeed, bars_]);

  const activeBars = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * displayPeaks.length);

  return (
    <button
      type="button"
      aria-label="Seek audio position"
      className={`group relative flex ${height} w-full items-end justify-between gap-[2px] overflow-hidden px-1`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeekPercent(((e.clientX - rect.left) / rect.width) * 100);
      }}
    >
      {displayPeaks.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] shrink-0 rounded-sm transition-colors ${
            i <= activeBars
              ? "bg-violet-light"
              : "bg-cream/30 group-hover:bg-cream/40"
          }`}
          style={{ height: `${h}%` }}
        />
      ))}
      {/* Loading shimmer if still fetching */}
      {realPeaks === null && (
        <span className="absolute inset-0 animate-pulse bg-white/5 rounded" />
      )}
    </button>
  );
}
