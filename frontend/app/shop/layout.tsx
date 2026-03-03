import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — Releases & Dubpacks",
  description:
    "Achetez ou téléchargez des releases et dubpacks exclusifs des artistes Sauroraa Records. Kits de production, stems, samples et sorties originales.",
  alternates: { canonical: "https://sauroraarecords.be/shop" },
  openGraph: {
    title: "Shop Releases & Dubpacks · Sauroraa Records",
    description:
      "Dubpacks, kits de production et releases originales. Achetez directement et soutenez les artistes indépendants.",
    url: "https://sauroraarecords.be/shop"
  }
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
