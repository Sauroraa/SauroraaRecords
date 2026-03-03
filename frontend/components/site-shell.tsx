"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useLanguage, type Locale } from "@/context/language-context";
import { GlobalPlayer } from "./global-player";
import { CartDrawer } from "./cart-drawer";

const LOCALES: Locale[] = ["fr", "en", "nl"];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, fetchMe } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { unreadCount, fetchUnread } = useNotificationsStore();
  const { locale, setLocale, t } = useLanguage();
  const [meLoaded, setMeLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      await fetchMe();
      setMeLoaded(true);
    })();
  }, [fetchMe]);

  useEffect(() => {
    if (meLoaded && user) void fetchUnread();
  }, [meLoaded, user, fetchUnread]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/catalog", label: t.nav.releases },
    { href: "/dubpacks", label: t.nav.dubpacks },
    { href: "/shop", label: t.nav.shop },
    { href: "/rankings", label: t.nav.rankings },
    { href: "/pricing", label: t.nav.pricing }
  ];

  const cartCount = items.length;

  const dashboardHref =
    user?.role === "ARTIST" ? "/dashboard/artist" :
    user?.role === "ADMIN" ? "/dashboard/admin" :
    user?.role === "AGENCY" ? "/dashboard/agency" :
    user?.role === "STAFF" ? "/dashboard/staff" :
    "/dashboard";

  return (
    <div className="min-h-screen bg-bg text-cream">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-violet-radial" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] text-cream/80 uppercase hover:text-cream transition-colors font-space"
          >
            Sauroraa Records
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm transition-colors ${
                    isActive ? "text-cream" : "text-cream/50 hover:text-cream/80"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-px bg-violet"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-surface px-1 py-0.5">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider transition-all ${
                    locale === l
                      ? "bg-violet text-white"
                      : "text-cream/40 hover:text-cream/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-cream/50 hover:text-cream/80 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] font-bold text-white"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="relative p-2 text-cream/50 hover:text-cream/80 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] font-bold text-white"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                <div className="flex items-center gap-1 pl-2 border-l border-[rgba(255,255,255,0.08)]">
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{user.email.split("@")[0]}</span>
                  </Link>
                  <button
                    onClick={() => void handleLogout()}
                    className="p-2 text-cream/40 hover:text-cream/70 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-[rgba(255,255,255,0.08)]">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm text-cream/55 hover:text-cream/85 transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="rounded-sm bg-violet px-4 py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main — full width on home, padded elsewhere */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={pathname === "/" ? "w-full" : "mx-auto w-full max-w-7xl px-6 pb-32 pt-8"}
      >
        {children}
      </motion.main>

      <CartDrawer />
      <GlobalPlayer />

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] bg-bg/60 py-6 pb-28">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/25">
            © {new Date().getFullYear()} Sauroraa Records — BE1031.598.463
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { href: "/legal/mentions-legales", label: "Mentions légales" },
              { href: "/legal/cgu", label: "CGU" },
              { href: "/legal/cgv", label: "CGV" },
              { href: "/legal/rgpd", label: "Confidentialité" },
              { href: "/legal/cookies", label: "Cookies" },
              { href: "/pricing", label: t.nav.pricing },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-xs text-cream/30 hover:text-cream/60 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
