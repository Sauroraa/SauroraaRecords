"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";
import { GlobalPlayer } from "./global-player";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shop", label: "Shop" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" }
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07070c] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(128,0,255,0.22),transparent_38%),radial-gradient(circle_at_100%_10%,rgba(100,255,218,0.14),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(194,255,42,0.12),transparent_40%)]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-mono text-xs tracking-[0.35em] text-[#c2ff2a]">
            SAURORAA RECORDS
          </Link>
          <nav className="flex gap-4 text-sm text-white/80">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-28 pt-8"
      >
        {children}
      </motion.main>
      <GlobalPlayer />
    </div>
  );
}
