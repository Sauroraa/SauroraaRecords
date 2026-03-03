"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type InviteDetails = {
  agencyName: string;
  email: string;
  isNewUser: boolean;
};

type State = "loading" | "valid" | "invalid" | "accepted" | "error";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<State>("loading");
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/agency/invite/${token}`);
        if (res.status === 404 || res.status === 400) {
          setState("invalid");
          return;
        }
        if (!res.ok) throw new Error();
        setDetails(await res.json());
        setState("valid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  async function handleAccept() {
    if (!details) return;
    if (details.isNewUser && (!password || password.length < 8)) {
      setErrorMsg("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/agency/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          details.isNewUser ? { password, firstName, lastName } : {}
        )
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setState("accepted");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#f5f3ef]">Sauroraa Records</h1>
          <p className="mt-1 text-xs text-[#7c3aed] tracking-[0.25em] uppercase">
            Plateforme musicale indépendante
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Loading */}
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-[16px] border border-white/8 bg-[#111] p-10"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
              <p className="text-sm text-[#f5f3ef]/50">Vérification de l'invitation…</p>
            </motion.div>
          )}

          {/* Invalid */}
          {state === "invalid" && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[16px] border border-white/8 bg-[#111] p-8 text-center space-y-4"
            >
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold text-[#f5f3ef]">Invitation invalide</h2>
              <p className="text-sm text-[#f5f3ef]/50">
                Ce lien d'invitation est expiré, déjà utilisé, ou incorrect.
              </p>
              <Button variant="outline" onClick={() => router.push("/")}>
                Retour à l'accueil
              </Button>
            </motion.div>
          )}

          {/* Accepted */}
          {state === "accepted" && (
            <motion.div
              key="accepted"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[16px] border border-white/8 bg-[#111] p-8 text-center space-y-5"
            >
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
              <div>
                <h2 className="text-xl font-bold text-[#f5f3ef]">
                  Bienvenue dans {details?.agencyName} !
                </h2>
                <p className="mt-2 text-sm text-[#f5f3ef]/50">
                  Tu fais maintenant partie du roster. Tu peux accéder à ton espace artiste.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push("/login?redirect=/dashboard")}>
                  Se connecter
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Accueil
                </Button>
              </div>
            </motion.div>
          )}

          {/* Valid — show form */}
          {(state === "valid" || state === "error") && details && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[16px] border border-white/8 bg-[#111] p-8 space-y-6"
            >
              {/* Agency badge */}
              <div className="rounded-[10px] bg-[#7c3aed]/10 border border-[#7c3aed]/25 p-4 text-center">
                <p className="text-xs text-[#7c3aed] uppercase tracking-widest mb-1">Invitation de</p>
                <p className="font-bold text-[#f5f3ef] text-lg">{details.agencyName}</p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#f5f3ef]">
                  {details.isNewUser ? "Créer ton compte artiste" : "Rejoindre l'agence"}
                </h2>
                <p className="mt-1 text-sm text-[#f5f3ef]/50">
                  {details.isNewUser
                    ? `Un compte sera créé pour ${details.email}.`
                    : `Ton compte ${details.email} sera lié à ${details.agencyName}.`}
                </p>
              </div>

              {/* New user fields */}
              {details.isNewUser && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#f5f3ef]/40 uppercase tracking-widest">Prénom</label>
                      <Input
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[#f5f3ef]/40 uppercase tracking-widest">Nom</label>
                      <Input
                        placeholder="Nom"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#f5f3ef]/40 uppercase tracking-widest">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="8 caractères minimum"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f3ef]/30 hover:text-[#f5f3ef]/60"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-[8px] bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400"
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={() => void handleAccept()}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traitement…
                    </span>
                  ) : details.isNewUser ? (
                    "Créer mon compte & rejoindre"
                  ) : (
                    "Rejoindre l'agence"
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  Décliner
                </Button>
              </div>

              <p className="text-center text-xs text-[#f5f3ef]/20">
                En acceptant, tu rejoins le roster de {details.agencyName} sur Sauroraa Records.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
