import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { CookieBanner } from "@/components/cookie-banner";
import { Providers } from "./providers";
import { LanguageProvider } from "@/context/language-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Sauroraa Records — Label Musical Indépendant",
    template: "%s · Sauroraa Records"
  },
  description:
    "Sauroraa Records est le label musical indépendant belge qui propulse les artistes émergents. Découvrez les releases exclusives, dubpacks et classements d'artistes.",
  keywords: [
    "Sauroraa Records", "Sauroraa", "sauroraarecords", "sauroraa music",
    "sauroraa records belgique", "sauroraa records be",
    "label musical belge", "label musical indépendant",
    "musique indépendante belgique", "artistes émergents",
    "dubpack", "releases musicales", "téléchargement gratuit musique",
    "free music download belgium", "EDM Belgium", "Drum and Bass Belgium",
    "DNB Belgium", "trap music belgium", "electronic music label belgium",
    "independent music label", "music platform", "NXW", "LØWEX"
  ],
  authors: [{ name: "Sauroraa Records", url: BASE_URL }],
  creator: "Sauroraa Records",
  publisher: "Sauroraa Records",
  category: "music",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: BASE_URL
  },

  // OpenGraph
  openGraph: {
    type: "website",
    locale: "fr_BE",
    alternateLocale: ["en_US", "nl_BE"],
    url: BASE_URL,
    siteName: "Sauroraa Records",
    title: "Sauroraa Records — Label Musical Indépendant",
    description:
      "Découvrez les releases exclusives, dubpacks et classements d'artistes sur Sauroraa Records — le label musical indépendant belge.",
    images: [
      {
        url: OG_IMAGE,
        width: 1400,
        height: 800,
        alt: "Sauroraa Records — Label Musical",
        type: "image/png"
      }
    ]
  },

  // Twitter / X
  twitter: {
    card: "summary_large_image",
    site: "@SauroraaRecords",
    creator: "@SauroraaRecords",
    title: "Sauroraa Records — Label Musical Indépendant",
    description:
      "Releases exclusives, dubpacks & classements d'artistes. Rejoignez la scène musicale indépendante belge.",
    images: [OG_IMAGE]
  },

  // Icons
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon.png"
  },

  // App manifest
  manifest: "/site.webmanifest"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" }
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <LanguageProvider>
          <Providers>
            <SiteShell>{children}</SiteShell>
            <CookieBanner />
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
