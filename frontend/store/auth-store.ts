"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "CLIENT" | "ARTIST" | "ADMIN" | "AGENCY" | "STAFF";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) {
            const err = (await res.json()) as { message?: string };
            throw new Error(err.message ?? "Login failed");
          }
          const data = (await res.json()) as { user: AuthUser };
          set({ user: data.user });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, role: UserRole = "CLIENT") => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, role })
          });
          if (!res.ok) {
            const err = (await res.json()) as { message?: string };
            throw new Error(err.message ?? "Registration failed");
          }
          const data = (await res.json()) as { user: AuthUser };
          set({ user: data.user });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          credentials: "include"
        });
        set({ user: null });
      },

      fetchMe: async () => {
        try {
          const res = await fetch(`${API}/auth/me`, { credentials: "include" });
          if (res.ok) {
            const data = (await res.json()) as AuthUser;
            set({ user: data });
          } else {
            set({ user: null });
          }
        } catch {
          set({ user: null });
        }
      }
    }),
    {
      name: "sauroraa-auth",
      partialize: (state) => ({ user: state.user })
    }
  )
);
