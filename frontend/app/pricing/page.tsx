"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth-store";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

type Plan =
  | "ARTIST_FREE"
  | "ARTIST_BASIC"
  | "ARTIST_PRO"
  | "AGENCY_START"
  | "AGENCY_PRO";

const PLANS: { key: Plan; label: string; price: string; description: string }[] = [
  {
    key: "ARTIST_FREE",
    label: "Artist Free",
    price: "0€/mo",
    description: "70/30 commission, 1 release per month"
  },
  {
    key: "ARTIST_BASIC",
    label: "Artist Basic",
    price: "4,99€/mo",
    description: "80/20 commission, unlimited releases, analytics"
  },
  {
    key: "ARTIST_PRO",
    label: "Artist Pro",
    price: "9,99€/mo",
    description: "90/10 commission, priority support, branding"
  },
  {
    key: "AGENCY_START",
    label: "Agency Start",
    price: "14,99€/mo",
    description: "Manage up to 5 artists, 80/20 split"
  },
  {
    key: "AGENCY_PRO",
    label: "Agency Pro",
    price: "24,99€/mo",
    description: "Unlimited artists, 90/10 split"
  }
];

export default function PricingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan })
      });
      if (!res.ok) throw new Error("Failed to create session");
      const { sessionUrl } = await res.json();
      window.location.href = sessionUrl;
    } catch (err: any) {
      toast.error(err.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16">
      <h1 className="text-4xl font-bold text-cream mb-8 text-center">Pricing plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div key={plan.key} className="border border-[rgba(255,255,255,0.12)] rounded-lg p-6 bg-surface">
            <h2 className="text-xl font-semibold text-cream mb-2">{plan.label}</h2>
            <p className="text-3xl font-bold text-cream mb-4">{plan.price}</p>
            <p className="text-sm text-cream/70 mb-6">{plan.description}</p>
            <Button
              disabled={loading}
              onClick={() => handleSubscribe(plan.key)}
              className="w-full"
            >
              {plan.key === "ARTIST_FREE" ? "Select" : "Subscribe"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
