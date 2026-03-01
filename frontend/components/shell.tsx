"use client";

import Link from "next/link";
import { ReactNode } from "react";

const nav = [
  ["/", "Home"],
  ["/catalog", "Catalog"],
  ["/shop", "Shop"],
  ["/dashboard", "Dashboard"],
  ["/login", "Login"]
];

export function Shell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(168,85,247,0.28),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.2),transparent_30%),#090912] text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <span className="text-sm font-semibold tracking-[0.2em] text-purple-300">SAURORAA RECORDS</span>
          <nav className="flex gap-4 text-sm text-white/80">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="transition hover:text-cyan-300">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="mb-6 text-3xl font-bold text-purple-200">{title}</h1>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(168,85,247,0.12)]">{children}</div>
      </main>
    </div>
  );
}
