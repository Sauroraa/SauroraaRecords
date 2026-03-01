"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { Button } from "./ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

export function CheckoutButton({ releaseId }: { releaseId: string }) {
  const [loading, setLoading] = useState(false);

  async function onCheckout() {
    setLoading(true);
    try {
      // Wire this to /api/orders/create-checkout-session when Stripe backend is configured.
      const stripe = await stripePromise;
      if (!stripe) return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onCheckout} disabled={loading} variant="default">
      {loading ? "Preparing..." : `Checkout ${releaseId}`}
    </Button>
  );
}
