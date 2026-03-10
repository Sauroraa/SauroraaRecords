"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/language-context";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success(t.auth.welcome_back);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.login_failed);
    }
  };

  return (
    <section className="mx-auto w-full max-w-sm pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-cream">{t.auth.login_title}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.auth.login_sub}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">{t.auth.email}</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">{t.auth.password}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t.auth.signing_in : t.auth.sign_in}
          </Button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-sm text-cream/50">
            <Link href="/forgot-password" className="text-violet-light hover:underline">
              {t.auth.forgot_password}
            </Link>
          </p>
          <p className="text-sm text-cream/50">
            {t.auth.no_account}{" "}
            <Link href="/register" className="text-violet-light hover:underline">
              {t.auth.create_one}
            </Link>
          </p>
        </div>
      </Card>
    </section>
  );
}
