import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs & Abonnements",
  description:
    "Choisissez votre plan Sauroraa Records : Artist Free, Basic ou Pro, et Agency Start ou Pro. Commissions jusqu'à 90%, offre découverte −50% sur le premier mois Pro en mars 2026.",
  alternates: { canonical: "https://sauroraarecords.be/pricing" },
  openGraph: {
    title: "Tarifs & Abonnements · Sauroraa Records",
    description:
      "Plans Artiste et Agence — commissions jusqu'à 90%. Offre découverte −50% en mars 2026.",
    url: "https://sauroraarecords.be/pricing"
  }
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
