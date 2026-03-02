"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Send, CheckCircle2, Users, BarChart3, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

const PERKS = [
  { icon: Users, label: "Gestion multi-artistes depuis un tableau de bord unifié" },
  { icon: BarChart3, label: "Analytics avancées : revenus, downloads, tendances" },
  { icon: Headphones, label: "Support dédié & onboarding personnalisé" }
];

export default function AgencyRequestPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !company) {
      toast.error("Email et nom du label obligatoires");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/agency/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, company, message })
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast.error("Une erreur est survenue. Réessaie ou contacte contact@sauroraa.be");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-lg py-28 text-center px-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet/15 border border-violet/30">
            <CheckCircle2 className="h-10 w-10 text-violet-light" />
          </div>
          <h1 className="text-2xl font-bold text-cream">Demande envoyée !</h1>
          <p className="text-cream/50 text-sm leading-relaxed">
            Notre équipe examinera ta demande dans les <span className="text-cream">48h ouvrables</span>.
            Tu recevras une réponse à{" "}
            <span className="text-violet-light font-medium">{email}</span>.
          </p>
          <p className="text-xs text-cream/30">
            Questions ? <a href="mailto:contact@sauroraa.be" className="text-cream/50 hover:underline">contact@sauroraa.be</a>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/15 border border-violet/30">
            <Building2 className="h-6 w-6 text-violet-light" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-light">
              Sauroraa Records
            </p>
            <h1 className="text-2xl font-bold text-cream">Compte Agence</h1>
          </div>
        </div>
        <p className="text-sm text-cream/50 leading-relaxed">
          Les comptes agences permettent de gérer plusieurs artistes depuis un seul tableau de bord.
          Remplis ce formulaire pour soumettre ta candidature — nous reviendrons vers toi sous 48h.
        </p>
      </motion.div>

      {/* Perks */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8 grid gap-3"
      >
        {PERKS.map((perk, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface p-3.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10">
              <perk.icon className="h-4 w-4 text-violet-light" />
            </div>
            <p className="text-sm text-cream/70">{perk.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface p-6 space-y-4"
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest text-cream/40 pb-2 border-b border-[rgba(255,255,255,0.05)]">
            Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/70">Prénom</label>
              <Input
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/70">Nom</label>
              <Input
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cream/70">Email professionnel *</label>
            <Input
              type="email"
              placeholder="contact@monlabel.be"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-surface p-6 space-y-4"
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest text-cream/40 pb-2 border-b border-[rgba(255,255,255,0.05)]">
            Label / Agence
          </h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cream/70">Nom du label / société *</label>
            <Input
              placeholder="Mon Label Music"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cream/70">
              Message / présentation
            </label>
            <textarea
              placeholder="Décris ton activité, le nombre d'artistes représentés, tes besoins spécifiques…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none bg-surface2 border border-[rgba(255,255,255,0.08)] text-cream/80 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-violet/40 transition-colors placeholder:text-cream/25"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer la demande
              </>
            )}
          </Button>

          <p className="text-center text-xs text-cream/30 mt-4">
            Réponse sous 48h ouvrables.{" "}
            <a href="mailto:contact@sauroraa.be" className="text-cream/50 hover:underline">
              contact@sauroraa.be
            </a>
          </p>
        </motion.div>
      </form>
    </div>
  );
}
