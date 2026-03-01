"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const ImmersiveScene = dynamic(() => import("./immersive-scene").then((m) => m.ImmersiveScene), { ssr: false });

export function HomeHero() {
  return (
    <section className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-5">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs tracking-[0.3em] text-[#c2ff2a]">
          OFFICIAL LABEL OF SAURORAA.BE - BE1031.598.463
        </motion.p>
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">
          Immersive Music Platform
          <span className="block text-[#5de4ff]">Built For Sauroraa Artists</span>
        </h1>
        <p className="max-w-xl text-white/75">
          Dynamic artist universes, premium storefront, secure payouts, automatic monthly invoices, and real-time revenue analytics.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/catalog">Explore Catalog</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/artist">Artist Dashboard</Link>
          </Button>
        </div>
      </div>
      <ImmersiveScene />
      <Card className="lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/60">Artists Onboard</p>
            <p className="text-2xl font-semibold text-[#c2ff2a]">18</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/60">Monthly Gross</p>
            <p className="text-2xl font-semibold text-[#5de4ff]">€4,600</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/60">Platform Uptime</p>
            <p className="text-2xl font-semibold text-white">99.96%</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
