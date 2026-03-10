"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? t.forgot_password.send_failed);
      }

      setIsSubmitted(true);
      toast.success(t.forgot_password.sent_success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.forgot_password.sent_error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="mx-auto w-full max-w-sm pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-cream">{t.forgot_password.sent_title}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {t.forgot_password.sent_sub}
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm text-cream/70 mb-4">
            {t.forgot_password.sent_hint}
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              {t.forgot_password.back_login}
            </Button>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-sm pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-cream">{t.forgot_password.title}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {t.forgot_password.sub}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">{t.forgot_password.email}</label>
            <Input
              type="email"
              placeholder="vous@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t.forgot_password.sending : t.forgot_password.submit}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-cream/50">
          <Link href="/login" className="text-violet-light hover:underline">
            {t.forgot_password.back_login}
          </Link>
        </p>
      </Card>
    </section>
  );
}
