"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { nl } from "@/lib/i18n/nl";
import type { Dict } from "@/lib/i18n/fr";

export type Locale = "fr" | "en" | "nl";

const dicts: Record<Locale, Dict> = { fr, en, nl };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "fr",
  setLocale: () => {},
  t: fr
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && dicts[stored]) setLocaleState(stored);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dicts[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
