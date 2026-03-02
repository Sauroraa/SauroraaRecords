"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  type: "release" | "dubpack";
  title: string;
  artist: string;
  price: number;
  coverPath: string | null;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setPromo: (code: string, discount: number) => void;
  clearPromo: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      isOpen: false,

      addItem: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (!exists) {
          set((state) => ({ items: [...state.items, item] }));
        }
        set({ isOpen: true });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clear: () => set({ items: [], promoCode: null, promoDiscount: 0 }),

      setPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),

      clearPromo: () => set({ promoCode: null, promoDiscount: 0 }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      total: () => {
        const { items, promoDiscount } = get();
        const subtotal = items.reduce((sum, i) => sum + i.price, 0);
        return subtotal * (1 - promoDiscount / 100);
      }
    }),
    {
      name: "sauroraa-cart",
      partialize: (state) => ({ items: state.items, promoCode: state.promoCode, promoDiscount: state.promoDiscount })
    }
  )
);
