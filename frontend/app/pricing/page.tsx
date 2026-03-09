"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, ChevronDown, Zap, Building2, ArrowRight, Star, Tag, Sparkles
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type PlanKey = "ARTIST_FREE" | "ARTIST_BASIC" | "ARTIST_PRO" | "AGENCY_START" | "AGENCY_PRO";

const ARTIST_PLANS: { key: PlanKey; price: string; rawPrice: number; popular?: boolean }[] = [
  { key: "ARTIST_FREE", price: "0", rawPrice: 0 },
  { key: "ARTIST_BASIC", price: "4,99", rawPrice: 4.99, popular: true },
  { key: "ARTIST_PRO", price: "9,99", rawPrice: 9.99 }
];

const AGENCY_PLANS: { key: PlanKey; price: string; rawPrice: number; popular?: boolean }[] = [
  { key: "AGENCY_START", price: "14,99", rawPrice: 14.99 },
  { key: "AGENCY_PRO", price: "24,99", rawPrice: 24.99, popular: true }
];

const ARTIST_FEATURES = [
  { key: "artist_free" as const, features: { analytics: false, branding: false } },
  { key: "artist_basic" as const, features: { analytics: true, branding: false } },
  { key: "artist_pro" as const, features: { analytics: true, branding: true } }
];

export default function PricingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t } = useLanguage();
  const [tab, setTab] = useState<"artist" | "agency">("artist");
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = tab === "artist" ? ARTIST_PLANS : AGENCY_PLANS;

  const handleSubscribe = async (key: PlanKey) => {
    if (!user) { router.push("/register"); return; }
    setLoading(key);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: key })
      });
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error("Les paiements ne sont pas encore activés. Contactez l'administrateur.");
        }
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? "Une erreur est survenue.");
      }
      const data = await res.json() as { sessionUrl?: string; message?: string };
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.success(data.message ?? "Plan activé !");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const planName = (key: PlanKey) => {
    const map: Record<PlanKey, string> = {
      ARTIST_FREE: t.pricing.plans.artist_free.name,
      ARTIST_BASIC: t.pricing.plans.artist_basic.name,
      ARTIST_PRO: t.pricing.plans.artist_pro.name,
      AGENCY_START: t.pricing.plans.agency_start.name,
      AGENCY_PRO: t.pricing.plans.agency_pro.name
    };
    return map[key];
  };

  const planCommission = (key: PlanKey) => {
    const map: Record<PlanKey, string> = {
      ARTIST_FREE: t.pricing.plans.artist_free.commission,
      ARTIST_BASIC: t.pricing.plans.artist_basic.commission,
      ARTIST_PRO: t.pricing.plans.artist_pro.commission,
      AGENCY_START: t.pricing.plans.agency_start.commission,
      AGENCY_PRO: t.pricing.plans.agency_pro.commission
    };
    return map[key];
  };

  const planSub = (key: PlanKey) => {
    const map: Record<PlanKey, string> = {
      ARTIST_FREE: t.pricing.plans.artist_free.releases,
      ARTIST_BASIC: t.pricing.plans.artist_basic.releases,
      ARTIST_PRO: t.pricing.plans.artist_pro.releases,
      AGENCY_START: t.pricing.plans.agency_start.artists,
      AGENCY_PRO: t.pricing.plans.agency_pro.artists
    };
    return map[key];
  };

  const isPromo = tab === "artist";

  return (
    <div className="space-y-24 py-12">
      {/* March promo banner */}
      {isPromo && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/60 via-violet-800/50 to-violet-900/60 border border-violet/30 px-6 py-4"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet/30">
              <Tag className="h-5 w-5 text-violet-light" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-cream flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                <Sparkles className="h-4 w-4 text-violet-light" />
                Offre Découverte — Mars 2026
              </p>
              <p className="text-xs text-cream/60 mt-0.5">
                Profitez de <strong className="text-violet-light">−50% sur le premier mois Artist Pro</strong>. Offre limitée jusqu'au 31 mars 2026.
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-violet px-4 py-1.5 text-xs font-bold text-white">
              4,99€ au lieu de 9,99€
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-light"
        >
          Sauroraa Records
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-5xl font-bold text-cream"
        >
          {t.pricing.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-cream/50 text-lg"
        >
          {t.pricing.sub}
        </motion.p>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-surface p-1 mt-6"
        >
          <button
            onClick={() => setTab("artist")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              tab === "artist" ? "bg-violet text-white shadow-violet" : "text-cream/50 hover:text-cream/80"
            }`}
          >
            <Zap className="h-4 w-4" />
            {t.pricing.toggle_artist}
          </button>
          <button
            onClick={() => setTab("agency")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              tab === "agency" ? "bg-violet text-white shadow-violet" : "text-cream/50 hover:text-cream/80"
            }`}
          >
            <Building2 className="h-4 w-4" />
            {t.pricing.toggle_agency}
          </button>
        </motion.div>
      </div>

      {/* Plan cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`grid gap-6 ${
            tab === "artist"
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto w-full"
          }`}
        >
          {plans.map((plan, i) => {
            const isPopular = plan.popular;
            const isFree = plan.rawPrice === 0;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                  isPopular
                    ? "border-violet/50 bg-surface shadow-violet"
                    : "border-[rgba(255,255,255,0.08)] bg-surface hover:border-violet/25"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1.5 rounded-full bg-violet px-4 py-1 text-xs font-semibold text-white">
                      <Star className="h-3 w-3 fill-current" />
                      {t.pricing.popular}
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-violet-light mb-2">
                    {tab === "artist" ? "Artist" : "Agency"}
                  </p>
                  <h2 className="text-xl font-bold text-cream">{planName(plan.key)}</h2>
                </div>

                {/* Price */}
                <div className="mb-8">
                  {isFree ? (
                    <span className="text-5xl font-bold text-cream">{t.pricing.free}</span>
                  ) : plan.key === "ARTIST_PRO" ? (
                    <div className="space-y-1">
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-cream">4,99€</span>
                        <span className="text-cream/40 mb-1.5 text-sm">{t.pricing.per_month}</span>
                      </div>
                      <p className="text-sm text-cream/35 line-through">9,99€/mois</p>
                      <p className="text-xs text-violet-light font-medium">Premier mois · Offre mars</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-bold text-cream">{plan.price}€</span>
                      <span className="text-cream/40 mb-1.5 text-sm">{t.pricing.per_month}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  <FeatureRow label={`Commission ${planCommission(plan.key)}`} ok />
                  <FeatureRow label={planSub(plan.key)} ok />
                  {tab === "artist" && (
                    <>
                      <FeatureRow
                        label={t.pricing.features.analytics}
                        ok={(ARTIST_FEATURES.find(f => f.key === plan.key.toLowerCase().replace("artist_", "artist_") as "artist_free" | "artist_basic" | "artist_pro")?.features.analytics) ?? false}
                      />
                      <FeatureRow
                        label={t.pricing.features.branding}
                        ok={plan.key === "ARTIST_PRO"}
                      />
                    </>
                  )}
                  <FeatureRow
                    label={
                      plan.key === "ARTIST_FREE" ? t.pricing.plans.artist_free.support :
                      plan.key === "ARTIST_BASIC" ? t.pricing.plans.artist_basic.support :
                      plan.key === "ARTIST_PRO" ? t.pricing.plans.artist_pro.support :
                      plan.key === "AGENCY_START" ? t.pricing.plans.agency_start.support :
                      t.pricing.plans.agency_pro.support
                    }
                    ok
                  />
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => void handleSubscribe(plan.key)}
                  disabled={!!loading}
                  className={`w-full gap-2 ${isPopular ? "shadow-violet" : ""}`}
                  variant={isPopular ? "default" : "outline"}
                >
                  {loading === plan.key ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      {isFree ? t.pricing.select : t.pricing.subscribe}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Feature comparison table (artist only) */}
      {tab === "artist" && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-cream text-center">{t.pricing.features_title}</h2>
          <div className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="px-6 py-4 text-left text-cream/50 font-medium">{t.pricing.features.releases}</th>
                  <th className="px-6 py-4 text-center text-cream font-semibold">Free</th>
                  <th className="px-6 py-4 text-center text-violet-light font-semibold">Basic</th>
                  <th className="px-6 py-4 text-center text-cream font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {([
                  { label: "Releases par mois", free: "3/mois", basic: "∞", pro: "∞" },
                  { label: "Commission artiste", free: "70% / 30%", basic: "80% / 20%", pro: "90% / 10%" },
                  { label: "Streaming sur Sauroraa Music", free: true, basic: true, pro: true },
                  { label: "Preview sécurisé (30–90s)", free: true, basic: true, pro: true },
                  { label: "Waveform interactive", free: true, basic: true, pro: true },
                  { label: "DJ Metadata (BPM / Key)", free: true, basic: true, pro: true },
                  { label: "AI Genre Tagging", free: true, basic: true, pro: true },
                  { label: "AI Drop Detection", free: true, basic: true, pro: true },
                  { label: "Scheduled releases", free: false, basic: true, pro: true },
                  { label: "Multi-artist (collabs)", free: false, basic: true, pro: true },
                  { label: "Private track links (promo DJs)", free: false, basic: true, pro: true },
                  { label: "Engage system (type Hypeddit)", free: true, basic: true, pro: true },
                  { label: "Analytics basiques", free: true, basic: true, pro: true },
                  { label: "Analytics avancées", free: false, basic: true, pro: true },
                  { label: "Heatmap d'écoute", free: false, basic: false, pro: true },
                  { label: "Export données (CSV)", free: false, basic: true, pro: true },
                  { label: "Dubpacks / bundles", free: false, basic: true, pro: true },
                  { label: "Sample packs / stems", free: false, basic: true, pro: true },
                  { label: "Artist profile customization", free: false, basic: false, pro: true },
                  { label: "Artist verified badge", free: false, basic: false, pro: true },
                  { label: "Featured playlists", free: false, basic: true, pro: true },
                  { label: "Homepage feature promotion", free: false, basic: false, pro: true },
                  { label: "Trending boost promotion", free: false, basic: false, pro: true },
                  { label: "Fan messaging (annonces)", free: false, basic: false, pro: true },
                  { label: "Mailing list export", free: false, basic: true, pro: true },
                  { label: "Custom landing pages", free: false, basic: false, pro: true },
                  { label: "API access (dev tools)", free: false, basic: false, pro: true },
                  { label: "Support", free: "Standard", basic: "Prioritaire", pro: "Dédié" }
                ] as { label: string; free: boolean | string; basic: boolean | string; pro: boolean | string }[]).map((row) => (
                  <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 text-cream/70">{row.label}</td>
                    <td className="px-6 py-3 text-center">{renderCell(row.free)}</td>
                    <td className="px-6 py-3 text-center">{renderCell(row.basic)}</td>
                    <td className="px-6 py-3 text-center">{renderCell(row.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}

      {/* FAQ */}
      <section className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-cream text-center mb-8">{t.pricing.faq_title}</h2>
        {t.pricing.faq.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="font-medium text-cream">{item.q}</span>
              <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="h-4 w-4 text-cream/40" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="px-6 pb-5 text-sm text-cream/60 leading-relaxed border-t border-[rgba(255,255,255,0.05)] pt-4">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

function FeatureRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {ok ? (
        <Check className="h-4 w-4 text-violet-light shrink-0 mt-0.5" />
      ) : (
        <X className="h-4 w-4 text-cream/20 shrink-0 mt-0.5" />
      )}
      <span className={ok ? "text-cream/80 text-sm" : "text-cream/30 text-sm"}>{label}</span>
    </li>
  );
}

function renderCell(value: string | boolean) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="h-4 w-4 text-violet-light mx-auto" />
      : <X className="h-4 w-4 text-cream/20 mx-auto" />;
  }
  return <span className="text-cream/70">{value}</span>;
}
