"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token de réinitialisation manquant");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
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
        throw new Error(err.message ?? "Échec de la réinitialisation");
      }

      toast.success("Mot de passe réinitialisé avec succès !");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="mx-auto w-full max-w-sm pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-cream">Lien invalide</h1>
          <p className="mt-1.5 text-sm text-muted">Ce lien de réinitialisation n'est pas valide ou a expiré.</p>
        </div>
        <Card className="p-6">
          <Link href="/forgot-password" className="block">
            <Button className="w-full">Demander un nouveau lien</Button>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-sm pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-cream">Nouveau mot de passe</h1>
        <p className="mt-1.5 text-sm text-muted">Choisissez un nouveau mot de passe sécurisé</p>
      </div>

      <Card className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-cream/70">Nouveau mot de passe</label>
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
            <label className="text-xs font-medium text-cream/70">Confirmer le mot de passe</label>
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
            {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-cream/50">
          <Link href="/login" className="text-violet-light hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </Card>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <section className="mx-auto w-full max-w-sm pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-cream">Chargement...</h1>
        </div>
      </section>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}