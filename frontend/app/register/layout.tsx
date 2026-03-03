import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Rejoignez Sauroraa Records en tant qu'artiste, agence ou fan. Inscrivez-vous gratuitement et commencez à partager votre musique avec le monde.",
  alternates: { canonical: "https://sauroraarecords.be/register" },
  openGraph: {
    title: "Créer un compte · Sauroraa Records",
    description:
      "Rejoignez le label musical indépendant belge. Inscription gratuite pour artistes et fans.",
    url: "https://sauroraarecords.be/register"
  },
  robots: { index: true, follow: false }
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
