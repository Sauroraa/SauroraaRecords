"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage, type Locale } from "@/context/language-context";

const PROMPT_KEY = "locale_prompt_seen";

const OPTIONS: { locale: Locale; label: string; native: string }[] = [
  { locale: "fr", label: "Francais", native: "FR" },
  { locale: "en", label: "English", native: "EN" },
  { locale: "nl", label: "Nederlands", native: "NL" }
];

export function LanguageChooserModal() {
  const { setLocale, t, initialized } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    const seen = localStorage.getItem(PROMPT_KEY);
    const storedLocale = localStorage.getItem("locale");
    if (!seen && !storedLocale) {
      setOpen(true);
    }
  }, [initialized]);

  const selectLanguage = (locale: Locale) => {
    setLocale(locale);
    localStorage.setItem(PROMPT_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[#0d0d12] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/15 text-violet-light">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cream/35">{t.language.overline}</p>
                <h2 className="text-xl font-semibold text-cream">{t.language.title}</h2>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-cream/60">{t.language.description}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              {OPTIONS.map((option) => (
                <button
                  key={option.locale}
                  onClick={() => selectLanguage(option.locale)}
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface px-4 py-4 text-left transition-colors hover:border-violet/35 hover:bg-violet/10"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-light">{option.native}</p>
                  <p className="mt-2 text-sm font-medium text-cream">{option.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
