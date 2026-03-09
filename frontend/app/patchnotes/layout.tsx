import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patch Notes",
  description:
    "Historique complet des mises à jour de Sauroraa Records — nouvelles fonctionnalités, corrections de bugs et améliorations de la plateforme.",
  alternates: { canonical: "https://sauroraarecords.be/patchnotes" },
  openGraph: {
    title: "Patch Notes · Sauroraa Records",
    description: "Historique des mises à jour de la plateforme Sauroraa Records.",
    url: "https://sauroraarecords.be/patchnotes"
  }
};

export default function PatchnotesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
