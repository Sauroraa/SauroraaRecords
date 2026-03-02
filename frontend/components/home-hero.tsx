"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Upload, Sparkles, TrendingUp,
  Disc3, Package, Music2, Users, CheckCircle2
} from "lucide-react";
import { useRef, useState } from "react";
import type { ReleaseItem, ArtistProfile } from "@/lib/types";
import { ReleaseCard } from "./release-card";
import { FreeDownloadModal } from "./free-download-modal";
import { Button } from "./ui/button";
import { useLanguage } from "@/context/language-context";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }
});

interface HomeHeroProps {
  releases: ReleaseItem[];
  artists: ArtistProfile[];
}

export function HomeHero({ releases, artists }: HomeHeroProps) {
  const { t } = useLanguage();
  const [freeDownloadRelease, setFreeDownloadRelease] = useState<ReleaseItem | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const featured = releases.slice(0, 3);
  const latest = releases.slice(0, 8);

  const howSteps = [
    { icon: Upload, ...t.home.how_steps[0] },
    { icon: Sparkles, ...t.home.how_steps[1] },
    { icon: TrendingUp, ...t.home.how_steps[2] }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-violet/10 blur-[120px]" />
          <div className="absolute left-1/4 bottom-0 h-[400px] w-[400px] translate-y-1/3 rounded-full bg-violet/6 blur-[100px]" />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-16 py-24 lg:flex-row lg:items-center lg:justify-between">
          {/* Left — copy */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.p {...fade(0.05)} className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-light">
              {t.home.overline}
            </motion.p>

            <motion.h1 {...fade(0.1)} className="text-5xl font-bold leading-[1.08] tracking-tight text-cream md:text-7xl lg:text-[5.5rem]">
              {t.home.headline.split("\n").map((line, i) => (
                <span key={i} className={i === 1 ? "block text-violet-light" : "block"}>
                  {line}
                </span>
              ))}
            </motion.h1>

            <motion.p {...fade(0.2)} className="max-w-lg text-lg leading-relaxed text-cream/55 mx-auto lg:mx-0">
              {t.home.sub}
            </motion.p>

            <motion.div {...fade(0.3)} className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="gap-2 shadow-violet">
                <Link href="/catalog">
                  {t.home.cta_explore}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/shop">
                  <Package className="h-4 w-4" />
                  {t.home.cta_listen}
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fade(0.4)} className="flex gap-8 justify-center lg:justify-start pt-2">
              {[
                { value: artists.length || "0", label: "Artistes" },
                { value: releases.length || "0", label: "Releases" },
                { value: "90%", label: "Commission max" }
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-cream">{s.value}</p>
                  <p className="text-xs text-cream/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — stacked covers */}
          <div className="relative hidden lg:flex items-center justify-center w-[420px] h-[420px] shrink-0">
            {featured.map((r, i) => {
              const rotations = [-8, 4, -2];
              const offsets = [
                { x: -40, y: 20 },
                { x: 30, y: -10 },
                { x: 0, y: 0 }
              ];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.85, rotate: rotations[i] + 10, x: offsets[i].x - 20, y: offsets[i].y + 20 }}
                  animate={{ opacity: 1, scale: 1, rotate: rotations[i], x: offsets[i].x, y: offsets[i].y }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: i + 1 }}
                  className="absolute h-[260px] w-[260px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
                >
                  {r.coverPath ? (
                    <Image src={r.coverPath} alt={r.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface2">
                      <Disc3 className="h-16 w-16 text-violet/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs font-semibold text-cream/90 truncate">{r.title}</p>
                    <p className="text-[10px] text-cream/50 truncate">{r.artist?.displayName ?? "Sauroraa Artist"}</p>
                  </div>
                </motion.div>
              );
            })}
            {featured.length === 0 && (
              <div className="h-[260px] w-[260px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface2 flex items-center justify-center">
                <Music2 className="h-16 w-16 text-violet/20" />
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-cream/20" />
          <div className="h-1 w-1 rounded-full bg-cream/30" />
        </motion.div>
      </motion.section>

      {/* ── LATEST RELEASES ── */}
      <section className="mx-auto max-w-7xl px-6 py-24 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-violet-light mb-2">
              {t.home.latest_releases}
            </p>
            <h2 className="text-3xl font-bold text-cream">{t.home.latest_releases}</h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm text-cream/40 hover:text-cream/70 transition-colors flex items-center gap-1.5"
          >
            {t.home.view_all} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {latest.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {latest.map((release, i) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <ReleaseCard release={release} onDownloadFree={setFreeDownloadRelease} index={i} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Disc3} label="No releases yet" />
        )}
      </section>

      {/* ── FEATURED ARTISTS ── */}
      {artists.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 space-y-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-violet-light mb-2">Artists</p>
            <h2 className="text-3xl font-bold text-cream">{t.home.featured_artists}</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
            {artists.slice(0, 8).map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="shrink-0"
              >
                <Link href={`/artist/${artist.id}`} className="group flex flex-col items-center gap-3 w-28">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.08)] group-hover:border-violet/50 transition-all duration-300">
                    {artist.avatar ? (
                      <Image src={artist.avatar} alt={artist.displayName ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface2 text-2xl font-bold text-violet/40">
                        {(artist.displayName ?? "A").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-cream truncate w-full group-hover:text-violet-light transition-colors">
                      {artist.displayName ?? "Artist"}
                    </p>
                    <p className="text-[10px] text-cream/35 mt-0.5">
                      {artist._count?.followers ?? 0} {t.common.followers}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-light">Pour les artistes</p>
          <h2 className="text-3xl font-bold text-cream">{t.home.how_title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {howSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface p-8 hover:border-violet/30 transition-all duration-300 group"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10 group-hover:bg-violet/20 transition-colors">
                <step.icon className="h-6 w-6 text-violet-light" />
              </div>
              <div className="absolute top-6 right-6 text-5xl font-bold text-cream/[0.04] select-none">
                0{i + 1}
              </div>
              <h3 className="text-lg font-semibold text-cream mb-2">{step.title}</h3>
              <p className="text-sm text-cream/55 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-surface px-8 py-12 md:px-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-widest text-violet-light">Plans</p>
              <h2 className="text-3xl font-bold text-cream">{t.home.pricing_title}</h2>
              <div className="flex flex-col gap-2">
                {[
                  { plan: "Artist Free", price: "0€", commission: "70/30" },
                  { plan: "Artist Basic", price: "4,99€/mo", commission: "80/20" },
                  { plan: "Artist Pro", price: "9,99€/mo", commission: "90/10" }
                ].map((p) => (
                  <div key={p.plan} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-violet-light shrink-0" />
                    <span className="text-sm text-cream/70">
                      <strong className="text-cream">{p.plan}</strong> — {p.price} · commission {p.commission}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Button asChild size="lg" className="gap-2 shadow-violet">
                <Link href="/pricing">
                  {t.home.pricing_cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="relative overflow-hidden py-32 px-6">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/5 to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/8 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Users className="mx-auto mb-6 h-12 w-12 text-violet/60" />
            <h2 className="text-4xl font-bold text-cream md:text-5xl">{t.home.join_title}</h2>
            <p className="mt-4 text-lg text-cream/50">{t.home.join_sub}</p>
            <div className="mt-8">
              <Button asChild size="lg" className="gap-2 shadow-violet-lg px-8">
                <Link href="/register">
                  {t.home.join_cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <FreeDownloadModal
        release={freeDownloadRelease ?? undefined}
        open={!!freeDownloadRelease}
        onClose={() => setFreeDownloadRelease(null)}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface">
      <div className="text-center">
        <Icon className="mx-auto mb-2 h-8 w-8 text-cream/20" />
        <p className="text-sm text-cream/30">{label}</p>
      </div>
    </div>
  );
}
