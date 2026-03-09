"use client";

import { Search, X, Disc3, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type SearchRelease = {
  id: string;
  slug: string;
  title: string;
  coverPath?: string | null;
  artist?: { id: string; displayName: string | null } | null;
};

type SearchArtist = {
  id: string;
  displayName: string | null;
  avatar?: string | null;
};

type SearchResults = {
  releases: SearchRelease[];
  artists: SearchArtist[];
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function SearchBar({ className = "relative hidden md:block w-56 lg:w-72" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}&limit=8`);
        if (res.ok) {
          const data = (await res.json()) as SearchResults;
          setResults(data);
        }
      } catch {}
      setLoading(false);
    }, 280);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard: Escape closes, Enter navigates to search page
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && query.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const clear = () => {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  };

  const hasResults =
    results && (results.releases.length > 0 || results.artists.length > 0);
  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={className}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-cream/35" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Recherche..."
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface/80 py-2 pl-8 pr-8 text-sm text-cream/80 placeholder-cream/25 outline-none transition-all focus:border-violet/40 focus:bg-surface"
        />
        {query && (
          <button onClick={clear} className="absolute right-2.5 text-cream/30 hover:text-cream/60 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0d0d12] shadow-2xl">
          {loading && !hasResults && (
            <div className="px-4 py-3 text-xs text-cream/30">Searching...</div>
          )}

          {!loading && !hasResults && query.trim() && (
            <div className="px-4 py-3 text-xs text-cream/30">No results for &ldquo;{query}&rdquo;</div>
          )}

          {/* Artists */}
          {results && results.artists.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-cream/25">
                Artists
              </p>
              {results.artists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface2">
                    {artist.avatar ? (
                      <Image src={artist.avatar} alt={artist.displayName ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-violet/40">
                        {(artist.displayName ?? "A").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-cream/80">{artist.displayName}</span>
                  <Music className="ml-auto h-3 w-3 text-cream/20" />
                </Link>
              ))}
            </div>
          )}

          {/* Releases */}
          {results && results.releases.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-cream/25">
                Releases
              </p>
              {results.releases.slice(0, 6).map((release) => (
                <Link
                  key={release.id}
                  href={`/release/${release.slug}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-surface2">
                    {release.coverPath ? (
                      <Image src={release.coverPath} alt={release.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Disc3 className="h-4 w-4 text-violet/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-cream/80">{release.title}</p>
                    {release.artist?.displayName && (
                      <p className="truncate text-xs text-cream/35">{release.artist.displayName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer: see all */}
          {hasResults && (
            <Link
              href={`/catalog?q=${encodeURIComponent(query)}`}
              onClick={() => { setOpen(false); }}
              className="flex items-center justify-center border-t border-[rgba(255,255,255,0.06)] px-4 py-2.5 text-xs text-violet-light hover:text-violet hover:bg-violet/5 transition-colors"
            >
              See all results for &ldquo;{query}&rdquo;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
