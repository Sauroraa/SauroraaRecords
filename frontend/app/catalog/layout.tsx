import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue Releases",
  description:
    "Découvrez toutes les sorties musicales sur Sauroraa Records : singles, EPs et tracks exclusives d'artistes indépendants belges et internationaux.",
  alternates: { canonical: "https://sauroraarecords.be/catalog" },
  openGraph: {
    title: "Catalogue Releases · Sauroraa Records",
    description:
      "Singles, EPs et tracks exclusives des artistes Sauroraa Records. Téléchargements gratuits et payants.",
    url: "https://sauroraarecords.be/catalog"
  }
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
