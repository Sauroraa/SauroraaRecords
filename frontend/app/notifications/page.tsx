"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Notification = {
  id: string;
  type: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  sourceType?: "notification" | "broadcast";
};

function timeAgo(date: string, t: ReturnType<typeof useLanguage>["t"]) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return t.notifications.just_now;
  if (min < 60) return t.notifications.minutes_ago.replace("{count}", String(min));
  if (hr < 24) return t.notifications.hours_ago.replace("{count}", String(hr));
  return t.notifications.days_ago.replace("{count}", String(day));
}

const TYPE_ICONS: Record<string, string> = {
  NEW_FOLLOWER: "👤",
  NEW_COMMENT: "💬",
  NEW_PURCHASE: "💰",
  RELEASE_PUBLISHED: "🎵",
  SYSTEM: "🔔",
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const { fetchUnread } = useNotificationsStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    void (async () => {
      try {
        const res = await fetch(`${API}/notifications`, { credentials: "include" });
        if (res.ok) setNotifications(await res.json() as Notification[]);
      } catch {}
      setLoading(false);
    })();
  }, [user, router]);

  const markRead = async (id: string) => {
    await fetch(`${API}/notifications/${id}/read`, { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    void fetchUnread();
  };

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all/all`, { method: "PATCH", credentials: "include" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    void fetchUnread();
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-violet-light" />
          <h1 className="text-2xl font-bold text-cream">{t.notifications.title}</h1>
          {unread > 0 && (
            <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={() => void markAllRead()}
            className="flex items-center gap-1.5 text-xs text-cream/50 hover:text-violet-light transition-colors">
            <CheckCheck className="h-3.5 w-3.5" />
            {t.notifications.mark_all_read}
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface">
          <div className="text-center">
            <Bell className="mx-auto mb-2 h-10 w-10 text-cream/10" />
            <p className="text-sm text-cream/30">{t.notifications.empty}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                n.isRead
                  ? "border-[rgba(255,255,255,0.06)] bg-surface/50"
                  : "border-violet/20 bg-violet/5"
              }`}
            >
              <span className="mt-0.5 text-lg">{TYPE_ICONS[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                {n.link ? (
                  <Link href={n.link} className={`text-sm leading-relaxed hover:text-violet-light ${n.isRead ? "text-cream/60" : "text-cream"}`}>
                    {n.body}
                  </Link>
                ) : (
                  <p className={`text-sm leading-relaxed ${n.isRead ? "text-cream/60" : "text-cream"}`}>
                    {n.body}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-cream/30">{timeAgo(n.createdAt, t)}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => void markRead(n.id)}
                  title={t.notifications.mark_read}
                  className="shrink-0 p-1 text-cream/30 hover:text-violet-light transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
