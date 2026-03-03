import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classement Artistes",
  description:
    "Top artistes du mois sur Sauroraa Records — classement par téléchargements, revenus et popularité. Découvrez les artistes émergents et les stars de la scène indépendante.",
  alternates: { canonical: "https://sauroraarecords.be/rankings" },
  openGraph: {
    title: "Classement Artistes · Sauroraa Records",
    description:
      "Top artistes du mois classés par popularité, téléchargements et revenus sur Sauroraa Records.",
    url: "https://sauroraarecords.be/rankings"
  }
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
