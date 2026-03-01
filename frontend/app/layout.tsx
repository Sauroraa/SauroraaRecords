import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sauroraa Records",
  description: "Immersive platform for Sauroraa artists."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
