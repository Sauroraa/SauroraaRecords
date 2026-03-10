"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, LogOut, LayoutDashboard, User, Settings, ChevronDown, Music, Trophy, CreditCard, Menu, X as XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useLanguage, type Locale } from "@/context/language-context";
import { GlobalPlayer } from "./global-player";
import { TrackDetailPanel } from "./track-detail-panel";
import { CartDrawer } from "./cart-drawer";
import { SupportWidget } from "./support-widget";
import { SearchBar } from "./search-bar";

const LOCALES: Locale[] = ["fr", "en", "nl"];

// ─── User Dropdown ────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

function UserDropdown({
  user,
  dashboardHref,
  unreadCount,
  onLogout,
}: {
  user: { email: string; role?: string };
  dashboardHref: string;
  unreadCount: number;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [artistProfile, setArtistProfile] = useState<{ id: string; displayName: string | null; avatar: string | null } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const username = user.email.split("@")[0];
  const isArtist = user.role === "ARTIST" || user.role === "STAFF";

  // Fetch artist profile for avatar + profile link
  useEffect(() => {
    if (!isArtist) return;
    void fetch(`${API_BASE}/artists/me`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setArtistProfile(data as typeof artistProfile); })
      .catch(() => {});
  }, [isArtist]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayName = artistProfile?.displayName ?? username;
  const profileHref = artistProfile ? `/artist/${artistProfile.id}` : dashboardHref;

  const menuItems = [
    ...(isArtist ? [{ href: profileHref, label: "Mon Profil", icon: <User className="h-4 w-4" /> }] : []),
    { href: dashboardHref, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/catalog", label: "Releases", icon: <Music className="h-4 w-4" /> },
    { href: "/rankings", label: "Charts", icon: <Trophy className="h-4 w-4" /> },
    { href: "/pricing", label: "Abonnement", icon: <CreditCard className="h-4 w-4" /> },
    { href: "/settings", label: "Paramètres", icon: <Settings className="h-4 w-4" /> },
    { href: "/notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`, icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div ref={ref} className="relative pl-2 border-l border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-1">
        {/* Avatar / name button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-cream/70 hover:bg-white/5 hover:text-cream transition-colors"
        >
          {/* Avatar */}
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-violet/30">
            {artistProfile?.avatar ? (
              <img src={artistProfile.avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-violet-light">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-xs font-medium">{displayName}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0d0d12] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.07)] px-4 py-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-violet/20">
                {artistProfile?.avatar ? (
                  <img src={artistProfile.avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-bold text-violet-light">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cream truncate">{displayName}</p>
                <p className="text-xs text-cream/35 truncate">{user.email}</p>
              </div>
            </div>

            {/* Links */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/65 hover:bg-white/5 hover:text-cream transition-colors"
                >
                  <span className="text-cream/35">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-[rgba(255,255,255,0.07)] py-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, fetchMe } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { unreadCount, fetchUnread } = useNotificationsStore();
  const { locale, setLocale, t } = useLanguage();
  const [meLoaded, setMeLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    user?.role === "STAFF" ? "/dashboard/artist" :
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

          {/* Desktop search only */}
          <div className="hidden md:block"><SearchBar className="relative w-full" /></div>

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
              <UserDropdown
                user={user}
                dashboardHref={dashboardHref}
                unreadCount={unreadCount}
                onLogout={() => void handleLogout()}
              />
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[rgba(255,255,255,0.08)]">
                <Link href="/login" className="px-3 py-2 text-sm text-cream/55 hover:text-cream/85 transition-colors">
                  {t.nav.login}
                </Link>
                <Link href="/register" className="rounded-sm bg-violet px-4 py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors">
                  {t.nav.register}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 text-cream/60 hover:text-cream transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="fixed left-0 right-0 top-[61px] z-20 border-b border-[rgba(255,255,255,0.08)] bg-bg/98 backdrop-blur-xl md:hidden"
            >
              {/* Search on mobile */}
              <div className="px-4 pt-3 pb-2">
                <SearchBar className="relative w-full" />
              </div>

              {/* Nav items */}
              <nav className="px-4 pb-3 space-y-0.5">
                {navItems.map(item => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive ? "bg-violet/15 text-cream" : "text-cream/60 hover:bg-white/5 hover:text-cream"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Language + auth on mobile */}
              <div className="border-t border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-0.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-surface px-1 py-0.5">
                  {LOCALES.map(l => (
                    <button key={l} onClick={() => setLocale(l)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider transition-all ${
                        locale === l ? "bg-violet text-white" : "text-cream/40 hover:text-cream/70"
                      }`}>{l}</button>
                  ))}
                </div>
                {!user && (
                  <div className="flex gap-2">
                    <Link href="/login" onClick={() => setMobileOpen(false)}
                      className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream transition-colors">{t.nav.login}</Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-violet px-4 py-1.5 text-sm font-medium text-white">{t.nav.register}</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

      <TrackDetailPanel />
      <CartDrawer />
      <SupportWidget />
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
              { href: "/patchnotes", label: "Patch Notes" },
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
