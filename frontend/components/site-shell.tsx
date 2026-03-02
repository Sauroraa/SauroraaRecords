"use client";

import { motion } from "framer-motion";
import { Bell, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { GlobalPlayer } from "./global-player";
import { CartDrawer } from "./cart-drawer";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Releases" },
  { href: "/dubpacks", label: "Dubpacks" },
  { href: "/shop", label: "Shop" },
  { href: "/rankings", label: "Rankings" },
  { href: "/pricing", label: "Pricing" }
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, fetchMe } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { unreadCount, fetchUnread } = useNotificationsStore();

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) void fetchUnread();
  }, [user, fetchUnread]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const cartCount = items.length;

  return (
    <div className="min-h-screen bg-bg text-cream">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-violet-radial" />

      <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] text-cream/80 uppercase hover:text-cream transition-colors"
          >
            Sauroraa Records
          </Link>

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

          <div className="flex items-center gap-2">
            <button
              onClick={toggleCart}
              className="relative p-2 text-cream/50 hover:text-cream/80 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="relative p-2 text-cream/50 hover:text-cream/80 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-1 pl-2 border-l border-[rgba(255,255,255,0.08)]">
                  <Link
                    href={
                      user.role === "ARTIST"
                        ? "/dashboard/artist"
                        : user.role === "ADMIN"
                          ? "/dashboard/admin"
                          : user.role === "AGENCY"
                            ? "/dashboard/agency"
                            : user.role === "STAFF"
                              ? "/dashboard/staff"
                              : "/dashboard"
                    }
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
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-sm bg-violet px-4 py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl px-6 pb-32 pt-8"
      >
        {children}
      </motion.main>

      <CartDrawer />
      <GlobalPlayer />

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
              { href: "/pricing", label: "Tarifs" },
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
