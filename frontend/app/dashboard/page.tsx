"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Download, Users, Bell, User, CheckCircle2,
  Package, ExternalLink, LogOut, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderItem, NotificationItem } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab = "purchases" | "downloads" | "following" | "notifications" | "profile";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "purchases", label: "Purchases", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "downloads", label: "Downloads", icon: <Download className="h-4 w-4" /> },
  { id: "following", label: "Following", icon: <Users className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> }
];

// ─── Purchases Tab ─────────────────────────────────────────────────────────────

function PurchasesTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/orders/me`, { credentials: "include" });
        if (res.ok) setOrders((await res.json()) as OrderItem[]);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!orders.length) return (
    <EmptyState
      icon={<ShoppingBag className="h-8 w-8 text-violet/40" />}
      message="No purchases yet"
      action={<Button asChild size="sm"><Link href="/shop">Browse Shop</Link></Button>}
    />
  );

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-cream/40">
              {new Date(order.createdAt).toLocaleDateString("en-BE", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="text-sm font-medium text-cream">€{Number(order.total).toFixed(2)}</span>
          </div>
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-cream/70">
                  {item.release?.title ?? item.dubpack?.title ?? "Item"}
                </span>
                <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" asChild>
                  <Link href={
                    item.release ? `/release/${item.release.slug}` :
                    item.dubpack ? `/dubpack/${item.dubpack.slug}` : "#"
                  }>
                    <Download className="h-3 w-3" /> Download
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Downloads Tab ─────────────────────────────────────────────────────────────

function DownloadsTab() {
  const [sessions, setSessions] = useState<{ id: string; release?: { title: string; slug: string } | null; dubpack?: { title: string; slug: string } | null; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/free-downloads/me`, { credentials: "include" });
        if (res.ok) setSessions(await res.json() as typeof sessions);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!sessions.length) return (
    <EmptyState
      icon={<Download className="h-8 w-8 text-violet/40" />}
      message="No free downloads yet"
      action={<Button asChild size="sm"><Link href="/catalog">Browse Catalog</Link></Button>}
    />
  );

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5">
          <div>
            <p className="text-sm text-cream">{s.release?.title ?? s.dubpack?.title ?? "Download"}</p>
            <p className="text-xs text-cream/40 mt-0.5">
              {new Date(s.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs" asChild>
            <Link href={s.release ? `/release/${s.release.slug}` : s.dubpack ? `/dubpack/${s.dubpack.slug}` : "#"}>
              <ExternalLink className="h-3 w-3" /> View
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Following Tab ─────────────────────────────────────────────────────────────

function FollowingTab() {
  const [artists, setArtists] = useState<{ id: string; displayName: string | null; user?: { email?: string }; avatar: string | null; _count?: { followers: number } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/follows/me`, { credentials: "include" });
        if (res.ok) setArtists(await res.json() as typeof artists);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unfollow = async (artistId: string) => {
    await fetch(`${API}/follows/artist/${artistId}`, { method: "DELETE", credentials: "include" });
    setArtists((prev) => prev.filter((a) => a.id !== artistId));
    toast.success("Unfollowed");
  };

  if (loading) return <LoadingSpinner />;

  if (!artists.length) return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-violet/40" />}
      message="Not following anyone yet"
      action={<Button asChild size="sm"><Link href="/artists">Discover Artists</Link></Button>}
    />
  );

  return (
    <div className="space-y-2">
      {artists.map((artist) => {
        const name = artist.displayName ?? artist.user?.email?.split("@")[0] ?? "Artist";
        return (
          <div key={artist.id} className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-violet/20 flex items-center justify-center text-sm font-bold text-violet-light">
                {name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-cream">{name}</p>
                <p className="text-xs text-cream/40">{artist._count?.followers ?? 0} followers</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/artist/${artist.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => void unfollow(artist.id)}>
                Unfollow
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/notifications`, { credentials: "include" });
        if (res.ok) setNotifications((await res.json()) as NotificationItem[]);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markRead = async (id: string) => {
    await fetch(`${API}/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all/all`, { method: "PATCH", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        </div>
      )}
      {!notifications.length ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-violet/40" />}
          message="No notifications yet"
        />
      ) : notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 rounded-[12px] border p-3.5 transition-colors ${
            n.isRead ? "border-[rgba(255,255,255,0.06)] bg-surface" : "border-violet/30 bg-violet/5"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${n.isRead ? "text-cream/70" : "text-cream"}`}>{n.body}</p>
            <p className="text-xs text-cream/30 mt-1">
              {new Date(n.createdAt).toLocaleDateString()}
            </p>
          </div>
          {!n.isRead && (
            <Button size="sm" variant="ghost" onClick={() => void markRead(n.id)} className="shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await fetch(`${API}/users/me`, { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null };
          setFirstName(data.firstName ?? "");
          setLastName(data.lastName ?? "");
          setAvatarUrl(data.avatarUrl ?? null);
        }
      } catch {}
    })();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedAvatar = avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const upRes = await fetch(`${API}/upload/cover`, { method: "POST", credentials: "include", body: fd });
        if (upRes.ok) {
          uploadedAvatar = ((await upRes.json()) as { path: string }).path;
          setAvatarUrl(uploadedAvatar);
          setAvatarFile(null);
        }
      }
      const body: Record<string, string | undefined> = {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        avatarUrl: uploadedAvatar ?? undefined
      };
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();

      if (newPassword) {
        if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); setSaving(false); return; }
        if (newPassword.length < 8) { toast.error("8 caractères minimum"); setSaving(false); return; }
        await fetch(`${API}/users/me/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newPassword })
        });
        setNewPassword("");
        setConfirmPassword("");
      }
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="max-w-md space-y-6">
      <input ref={avatarRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && setAvatarFile(e.target.files[0])} />

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => avatarRef.current?.click()}
          className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.12)] bg-surface2 hover:border-violet/40 transition-colors group"
        >
          {avatarFile || avatarUrl ? (
            <img
              src={avatarFile ? URL.createObjectURL(avatarFile) : `${API.replace("/api", "")}${avatarUrl}`}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-6 w-6 text-cream/20" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-cream">{user?.email}</p>
          <p className="text-xs text-cream/40">Role: {user?.role}</p>
          <button type="button" onClick={() => avatarRef.current?.click()} className="mt-1 text-xs text-violet-light hover:underline">
            Changer la photo
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Prénom</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Nom</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" />
        </div>
      </div>

      {/* Full profile link */}
      <div className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-surface p-3.5 flex items-center justify-between">
        <p className="text-sm text-cream/60">Adresse, facturation, préférences…</p>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/profile">Profil complet →</Link>
        </Button>
      </div>

      {/* Password */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-cream/60">Changer le mot de passe</p>
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            placeholder="Nouveau mot de passe (8 car. min)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {newPassword && (
          <Input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSave()} disabled={saving} className="flex-1">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleLogout()} className="gap-1.5 text-cream/60 hover:text-cream">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-violet border-t-transparent animate-spin" />
    </div>
  );
}

function EmptyState({ icon, message, action }: { icon?: React.ReactNode; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface h-48">
      {icon}
      <p className="text-sm text-cream/40">{message}</p>
      {action}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("purchases");

  useEffect(() => {
    if (user?.role === "ARTIST") router.replace("/dashboard/artist");
    if (user?.role === "ADMIN") router.replace("/dashboard/admin");
  }, [user, router]);

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    purchases: <PurchasesTab />,
    downloads: <DownloadsTab />,
    following: <FollowingTab />,
    notifications: <NotificationsTab />,
    profile: <ProfileTab />
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-cream">My Dashboard</h1>
        <p className="text-sm text-cream/50 mt-1">
          Welcome back, {user?.email?.split("@")[0] ?? "there"}
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)] pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-violet text-cream"
                : "text-cream/50 hover:text-cream"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {TAB_CONTENT[tab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
