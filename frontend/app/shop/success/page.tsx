"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, Download } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

function SuccessContent() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet/10 ring-2 ring-violet/30">
            <CheckCircle2 className="h-10 w-10 text-violet-light" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-cream">{t.shop_success.title}</h1>
          <p className="text-cream/60 text-sm leading-relaxed">
            {t.shop_success.sub}
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-cream/30 font-mono">
            {t.shop_success.order_ref} {sessionId.slice(0, 24)}...
          </p>
        )}

        <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-3 text-left">
          <p className="text-sm font-medium text-cream">{t.shop_success.next_title}</p>
          <ul className="space-y-2">
            {[
              t.shop_success.next_1,
              t.shop_success.next_2,
              t.shop_success.next_3
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-cream/60">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-light" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard" className="gap-2">
              <Download className="h-4 w-4" />
              {t.shop_success.purchases}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/catalog" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t.shop_success.continue}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ShopSuccessPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-cream/40 text-sm">{t.shop_success.loading}</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
