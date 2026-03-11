"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "CLIENT" | "ARTIST" | "ADMIN" | "AGENCY" | "STAFF";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isStaff?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: UserRole, extraData?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      initialized: false,

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
          set({ user: data.user, initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, role: UserRole = "CLIENT", extraData?: Record<string, unknown>) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, role, ...extraData })
          });
          if (!res.ok) {
            const err = (await res.json()) as { message?: string };
            throw new Error(err.message ?? "Registration failed");
          }
          const data = (await res.json()) as { user: AuthUser };
          set({ user: data.user, initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          credentials: "include"
        });
        set({ user: null, initialized: true });
      },

      fetchMe: async () => {
        try {
          const res = await fetch(`${API}/auth/me`, { credentials: "include" });
          if (res.ok) {
            const data = (await res.json()) as AuthUser;
            set({ user: data, initialized: true });
          } else {
            set({ user: null, initialized: true });
          }
        } catch {
          set({ user: null, initialized: true });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          if (!res.ok) {
            const err = (await res.json()) as { message?: string };
            throw new Error(err.message ?? "Failed to send reset email");
          }
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
          });
          if (!res.ok) {
            const err = (await res.json()) as { message?: string };
            throw new Error(err.message ?? "Failed to reset password");
          }
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: "sauroraa-auth",
      partialize: (state) => ({ user: state.user })
    }
  )
);
