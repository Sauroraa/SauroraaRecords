"use client";

import { create } from "zustand";

interface NotificationsState {
  unreadCount: number;
  fetchUnread: () => Promise<void>;
}

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  unreadCount: 0,

  fetchUnread: async () => {
    try {
      const res = await fetch(`${API}/notifications`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { isRead: boolean }[];
      const unread = data.filter((n) => !n.isRead).length;
      set({ unreadCount: unread });
    } catch {
      // Not logged in or error — ignore
    }
  }
}));
