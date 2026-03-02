"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Tag, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export function CartDrawer() {
  const { items, removeItem, clear, isOpen, closeCart, promoCode, promoDiscount, setPromo, clearPromo, total } =
    useCartStore();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();

  const handlePromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch(`${API}/promo-codes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() })
      });
      if (!res.ok) {
        toast.error("Invalid promo code");
        return;
      }
      const data = (await res.json()) as { code: string; discount: number };
      setPromo(data.code, data.discount);
      toast.success(`${data.discount}% discount applied!`);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const checkoutItems = items.map((item) => ({
        [item.type === "release" ? "releaseId" : "dubpackId"]: item.id
      }));

      const res = await fetch(`${API}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: checkoutItems,
          promoCode: promoCode ?? undefined
        })
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast.error(err.message ?? "Checkout failed");
        return;
      }

      const data = (await res.json()) as { sessionUrl: string };
      clear();
      closeCart();
      window.location.href = data.sessionUrl;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartTotal = total();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-[rgba(255,255,255,0.08)] bg-surface shadow-soft flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-violet-light" />
                <h2 className="text-base font-semibold text-cream">Cart</h2>
                <span className="rounded-full bg-violet/20 px-2 py-0.5 text-xs text-violet-light">
                  {items.length}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-cream/40 hover:text-cream/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ShoppingBag className="h-10 w-10 text-cream/20 mb-3" />
                  <p className="text-sm text-cream/40">Your cart is empty</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-surface2 p-3"
                  >
                    {item.coverPath ? (
                      <Image
                        src={item.coverPath}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="rounded-sm object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-sm bg-violet/15 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-violet/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cream truncate">{item.title}</p>
                      <p className="text-xs text-cream/50">{item.artist}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-cream">
                        €{item.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-cream/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[rgba(255,255,255,0.08)] px-6 py-5 space-y-4">
                {/* Promo Code */}
                <div className="flex gap-2">
                  {promoCode ? (
                    <div className="flex items-center gap-2 flex-1 rounded-sm border border-violet-border bg-violet/10 px-3 py-2">
                      <Tag className="h-4 w-4 text-violet-light" />
                      <span className="text-sm text-violet-light">{promoCode} — {promoDiscount}% off</span>
                      <button onClick={clearPromo} className="ml-auto text-cream/40 hover:text-cream/70">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Promo code"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handlePromo()}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handlePromo()}
                        disabled={promoLoading}
                      >
                        Apply
                      </Button>
                    </>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream/60">Total</span>
                  <span className="text-xl font-bold text-cream">€{cartTotal.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => void handleCheckout()}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Redirecting..." : "Checkout with Stripe"}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
