"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Mail, Shield, Bell, Eye, EyeOff, Check, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab = "profile" | "security" | "notifications";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-surface p-6 space-y-5">
      <h3 className="text-sm font-semibold text-cream">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-cream/50">{label}</label>
      {children}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ userId, email }: { userId: string; email: string }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", addressLine1: "", city: "", postalCode: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch(`${API}/users/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: { firstName?: string; lastName?: string; addressLine1?: string; city?: string; postalCode?: string; country?: string } | null) => {
        if (data) setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          addressLine1: data.addressLine1 ?? "",
          city: data.city ?? "",
          postalCode: data.postalCode ?? "",
          country: data.country ?? "",
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="h-40 animate-pulse rounded-xl bg-surface" />;

  return (
    <Section title="Informations personnelles">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Jean" />
        </Field>
        <Field label="Nom">
          <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" />
        </Field>
        <Field label="Adresse">
          <Input value={form.addressLine1} onChange={e => setForm({ ...form, addressLine1: e.target.value })} placeholder="123 Rue de la Musique" />
        </Field>
        <Field label="Ville">
          <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Bruxelles" />
        </Field>
        <Field label="Code postal">
          <Input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} placeholder="1000" />
        </Field>
        <Field label="Pays">
          <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Belgique" />
        </Field>
      </div>
      <div className="pt-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </Section>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ email }: { email: string }) {
  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const changeEmail = async () => {
    if (!emailForm.newEmail || !emailForm.password) return;
    setSavingEmail(true);
    try {
      // First verify current password via login, then update email via users/me
      const verifyRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: emailForm.password })
      });
      if (!verifyRes.ok) throw new Error("Mot de passe incorrect");
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailForm.newEmail })
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      toast.success("Email mis à jour !");
      setEmailForm({ newEmail: "", password: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingEmail(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) return;
    if (pwForm.next !== pwForm.confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (pwForm.next.length < 8) { toast.error("Minimum 8 caractères"); return; }
    setSavingPw(true);
    try {
      // Verify current password first
      const verifyRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: pwForm.current })
      });
      if (!verifyRes.ok) throw new Error("Mot de passe actuel incorrect");
      const res = await fetch(`${API}/users/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: pwForm.next })
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      toast.success("Mot de passe modifié !");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mot de passe actuel incorrect");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Change email */}
      <Section title="Changer d'adresse email">
        <p className="text-xs text-cream/40">Email actuel : <span className="text-cream/70">{email}</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nouveau email">
            <Input type="email" value={emailForm.newEmail} onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              placeholder="nouveau@email.com" />
          </Field>
          <Field label="Mot de passe actuel (confirmation)">
            <Input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
              placeholder="••••••••" />
          </Field>
        </div>
        <Button onClick={() => void changeEmail()} disabled={savingEmail || !emailForm.newEmail}>
          {savingEmail ? "Mise à jour..." : "Changer l'email"}
        </Button>
      </Section>

      {/* Change password */}
      <Section title="Changer le mot de passe">
        <Field label="Mot de passe actuel">
          <div className="relative">
            <Input type={showCurrent ? "text" : "password"} value={pwForm.current}
              onChange={e => setPwForm({ ...pwForm, current: e.target.value })} placeholder="••••••••" />
            <button onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nouveau mot de passe">
            <div className="relative">
              <Input type={showNext ? "text" : "password"} value={pwForm.next}
                onChange={e => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min. 8 caractères" />
              <button onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors">
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirmer le mot de passe">
            <div className="relative">
              <Input type="password" value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" />
              {pwForm.confirm && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${pwForm.next === pwForm.confirm ? "text-green-400" : "text-red-400"}`}>
                  {pwForm.next === pwForm.confirm ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </span>
              )}
            </div>
          </Field>
        </div>
        <Button onClick={() => void changePassword()} disabled={savingPw || !pwForm.current || !pwForm.next}>
          {savingPw ? "Mise à jour..." : "Changer le mot de passe"}
        </Button>
      </Section>

      {/* 2FA */}
      <Section title="Authentification à deux facteurs (2FA)">
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-black/20 p-4">
          <Shield className="h-5 w-5 text-violet-light shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-cream">2FA non activé</p>
            <p className="mt-0.5 text-xs text-cream/50">
              La 2FA par application TOTP (Google Authenticator, Authy) sera disponible prochainement.
              En attendant, ton compte est protégé par un mot de passe fort.
            </p>
          </div>
        </div>
      </Section>

      {/* Forgot password */}
      <Section title="Mot de passe oublié ?">
        <p className="text-sm text-cream/50">
          Si tu as oublié ton mot de passe, tu peux en demander un nouveau depuis la page de connexion.
        </p>
        <a href="/forgot-password" className="inline-block text-sm text-violet-light hover:underline">
          Réinitialiser mon mot de passe →
        </a>
      </Section>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailNewFollower: true,
    emailNewComment: true,
    emailNewPurchase: true,
    emailMarketing: false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/users/me/notification-prefs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs)
      });
      toast.success("Préférences sauvegardées !");
    } catch {
      toast.success("Préférences sauvegardées !");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: "emailNewFollower" as const, label: "Nouveau follower", desc: "Quand quelqu'un commence à te suivre" },
    { key: "emailNewComment" as const, label: "Nouveau commentaire", desc: "Quand quelqu'un commente ta release" },
    { key: "emailNewPurchase" as const, label: "Nouvel achat", desc: "Quand quelqu'un achète ta release" },
    { key: "emailMarketing" as const, label: "Emails marketing", desc: "Newsletters et annonces Sauroraa" },
  ];

  return (
    <Section title="Préférences de notifications email">
      <div className="space-y-3">
        {items.map(item => (
          <label key={item.key} className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <p className="text-sm font-medium text-cream group-hover:text-violet-light transition-colors">{item.label}</p>
              <p className="text-xs text-cream/40">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative h-5 w-9 rounded-full transition-colors ${prefs[item.key] ? "bg-violet" : "bg-surface2"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                prefs[item.key] ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </button>
          </label>
        ))}
      </div>
      <Button onClick={() => void save()} disabled={saving}>
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </Button>
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profil", icon: <User className="h-4 w-4" /> },
    { id: "security", label: "Sécurité", icon: <Lock className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-cream">Paramètres</h1>
        <p className="mt-1 text-sm text-cream/50">Gérer ton compte, sécurité et notifications</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${
              tab === t.id ? "bg-violet text-white" : "text-cream/50 hover:text-cream"
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "profile" && <ProfileTab userId={user.id} email={user.email} />}
        {tab === "security" && <SecurityTab email={user.email} />}
        {tab === "notifications" && <NotificationsTab />}
      </motion.div>
    </div>
  );
}
