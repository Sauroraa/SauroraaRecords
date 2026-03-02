import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { CookieBanner } from "@/components/cookie-banner";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "Sauroraa Records",
  description: "Premium music label platform — releases, dubpacks & exclusive drops.",
  openGraph: {
    title: "Sauroraa Records",
    description: "Premium music label platform — releases, dubpacks & exclusive drops.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
