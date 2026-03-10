"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t.reset_password.missing_token);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.reset_password.password_mismatch);
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t.reset_password.password_too_short);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? t.reset_password.reset_failed);
      }

      toast.success(t.reset_password.reset_success);
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.reset_password.reset_error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="mx-auto w-full max-w-sm pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-cream">Lien invalide</h1>
          <p className="mt-1.5 text-sm text-muted">{t.reset_password.invalid_sub}</p>
        </div>
        <Card className="p-6">
          <Link href="/forgot-password" className="block">
            <Button className="w-full">{t.reset_password.request_new}</Button>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-sm pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-cream">{t.reset_password.title}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.reset_password.sub}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">{t.reset_password.new_password}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">{t.reset_password.confirm_password}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t.reset_password.resetting : t.reset_password.submit}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-cream/50">
          <Link href="/login" className="text-violet-light hover:underline">
            {t.reset_password.back_login}
          </Link>
        </p>
      </Card>
    </section>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <section className="mx-auto w-full max-w-sm pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-cream">{t.reset_password.loading}</h1>
        </div>
      </section>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
