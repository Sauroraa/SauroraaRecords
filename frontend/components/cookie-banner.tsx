"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Button } from "./ui/button";

const CONSENT_KEY = "cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem(CONSENT_KEY, "refused");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-4xl mx-auto rounded-[16px] border border-[rgba(255,255,255,0.10)] bg-surface shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Cookie className="h-5 w-5 text-violet-light shrink-0 mt-0.5 sm:mt-0" />
            <p className="flex-1 text-sm text-cream/70 leading-relaxed">
              {t.cookie.text}{" "}
              <Link href="/legal/cookies" className="text-violet-light hover:underline">
                {t.cookie.learn_more}
              </Link>
              .
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={handleRefuse} className="text-cream/60">
                {t.cookie.refuse}
              </Button>
              <Button size="sm" onClick={handleAccept}>
                {t.cookie.accept}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
