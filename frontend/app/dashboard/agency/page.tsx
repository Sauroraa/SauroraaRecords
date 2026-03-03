"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  Music,
  Mail,
  Settings,
  LayoutDashboard,
  UserPlus,
  Trash2,
  Clock,
  CheckCircle2,
  Send,
  ChevronRight,
  Disc3,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type AgencyArtist = {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  user: { email?: string; firstName?: string | null; lastName?: string | null };
  _count: { releases: number; dubpacks: number; followers: number };
};

type AgencyData = {
  id: string;
  displayName: string | null;
  logoPath: string | null;
  pendingInvitations: number;
  artists: AgencyArtist[];
};

type Invitation = {
  id: string;
  email: string;
  accepted: boolean;
  expiresAt: string;
  createdAt: string;
};

type Tab = "overview" | "artists" | "invitations" | "settings";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Aperçu", icon: LayoutDashboard },
  { key: "artists", label: "Artistes", icon: Users },
  { key: "invitations", label: "Invitations", icon: Mail },
  { key: "settings", label: "Paramètres", icon: Settings }
];

export default function AgencyDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    void loadAgency();
  }, []);

  async function loadAgency() {
    setLoading(true);
    try {
      const [agRes, invRes] = await Promise.all([
        fetch(`${API}/agency/me`, { credentials: "include" }),
        fetch(`${API}/agency/invitations`, { credentials: "include" })
      ]);
      if (agRes.ok) {
        const data: AgencyData = await agRes.json();
        setAgency(data);
        setDisplayName(data.displayName ?? "");
      }
      if (invRes.ok) {
        setInvitations(await invRes.json());
      }
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`${API}/agency/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      setInvitations((prev) => [
        {
          id: data.id,
          email: data.email,
          accepted: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      setAgency((prev) =>
        prev ? { ...prev, pendingInvitations: prev.pendingInvitations + 1 } : prev
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvitation(id: string) {
    try {
      const res = await fetch(`${API}/agency/invitations/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Erreur");
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      setAgency((prev) =>
        prev ? { ...prev, pendingInvitations: Math.max(0, prev.pendingInvitations - 1) } : prev
      );
      toast.success("Invitation révoquée");
    } catch {
      toast.error("Impossible de révoquer");
    }
  }

  async function handleRemoveArtist(artistId: string) {
    try {
      const res = await fetch(`${API}/agency/artist/${artistId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Erreur");
      setAgency((prev) =>
        prev ? { ...prev, artists: prev.artists.filter((a) => a.id !== artistId) } : prev
      );
      toast.success("Artiste retiré du roster");
    } catch {
      toast.error("Impossible de retirer l'artiste");
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch(`${API}/agency/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName })
      });
      if (!res.ok) throw new Error("Erreur");
      setAgency((prev) => (prev ? { ...prev, displayName } : prev));
      toast.success("Paramètres sauvegardés");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingSettings(false);
    }
  }

  if (!user || user.role !== "AGENCY") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-cream/50">Accès réservé aux agences.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const totalReleases = agency?.artists.reduce((s, a) => s + a._count.releases, 0) ?? 0;
  const totalDubpacks = agency?.artists.reduce((s, a) => s + a._count.dubpacks, 0) ?? 0;
  const totalFollowers = agency?.artists.reduce((s, a) => s + a._count.followers, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-cream">
            {agency?.displayName ?? "Mon Agence"}
          </h1>
          <p className="mt-1 text-sm text-cream/40">Dashboard agence — gestion complète du roster</p>
        </div>
        <div className="flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-surface px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-cream/50">
            {agency?.artists.length ?? 0} artiste{(agency?.artists.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[12px] border border-[rgba(255,255,255,0.06)] bg-surface p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-cream" : "text-cream/40 hover:text-cream/70"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="agency-tab-bg"
                  className="absolute inset-0 rounded-[9px] bg-white/8"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative hidden sm:inline">{t.label}</span>
              {t.key === "invitations" && invitations.length > 0 && (
                <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                  {invitations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── APERÇU ──────────────────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Artistes", value: agency?.artists.length ?? 0, icon: Users, color: "text-violet-400" },
                  { label: "Releases", value: totalReleases, icon: Disc3, color: "text-blue-400" },
                  { label: "Dubpacks", value: totalDubpacks, icon: Package, color: "text-emerald-400" },
                  { label: "Followers", value: totalFollowers, icon: Users, color: "text-amber-400" }
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-cream/40">{stat.label}</p>
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <p className="mt-3 text-3xl font-bold text-cream">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Roster rapide */}
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6">
                <h2 className="mb-4 text-sm font-semibold text-cream/70 uppercase tracking-widest">
                  Roster
                </h2>
                {agency?.artists.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <UserPlus className="h-10 w-10 text-cream/20" />
                    <p className="text-cream/40 text-sm">Aucun artiste dans le roster.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTab("invitations")}
                    >
                      Inviter un artiste
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agency?.artists.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 rounded-[10px] border border-[rgba(255,255,255,0.06)] p-3"
                      >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-violet-900/40 flex items-center justify-center">
                          {a.avatar ? (
                            <img src={a.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <Users className="h-4 w-4 text-violet-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-cream truncate">
                            {a.displayName ?? a.user.email ?? "Artiste"}
                          </p>
                          <p className="text-xs text-cream/40 truncate">{a.user.email}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-xs text-cream/40">
                          <span>{a._count.releases} release{a._count.releases !== 1 ? "s" : ""}</span>
                          <span>{a._count.followers} follower{a._count.followers !== 1 ? "s" : ""}</span>
                        </div>
                        <button
                          onClick={() => setTab("artists")}
                          className="text-cream/30 hover:text-cream transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invitations en attente */}
              {invitations.length > 0 && (
                <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6">
                  <h2 className="mb-4 text-sm font-semibold text-cream/70 uppercase tracking-widest">
                    Invitations en attente
                  </h2>
                  <div className="space-y-2">
                    {invitations.slice(0, 3).map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 text-sm">
                        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-cream/70 truncate">{inv.email}</span>
                        <span className="ml-auto text-cream/30 text-xs whitespace-nowrap">
                          exp. {new Date(inv.expiresAt).toLocaleDateString("fr-BE")}
                        </span>
                      </div>
                    ))}
                    {invitations.length > 3 && (
                      <button
                        onClick={() => setTab("invitations")}
                        className="text-xs text-violet-400 hover:text-violet-300 mt-1"
                      >
                        +{invitations.length - 3} autres →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ARTISTES ────────────────────────────────────────────────── */}
          {tab === "artists" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-cream/50">
                  {agency?.artists.length ?? 0} artiste{(agency?.artists.length ?? 0) !== 1 ? "s" : ""} dans votre roster
                </p>
                <Button size="sm" variant="outline" onClick={() => setTab("invitations")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inviter
                </Button>
              </div>

              {agency?.artists.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface py-16">
                  <Users className="h-12 w-12 text-cream/15" />
                  <div className="text-center">
                    <p className="text-cream/50 text-sm">Votre roster est vide</p>
                    <p className="text-cream/30 text-xs mt-1">Invitez vos premiers artistes par email</p>
                  </div>
                  <Button size="sm" onClick={() => setTab("invitations")}>
                    Envoyer une invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {agency?.artists.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-violet-900/40 flex items-center justify-center overflow-hidden">
                          {a.avatar ? (
                            <img src={a.avatar} alt="" className="h-12 w-12 object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-violet-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-cream">
                                {a.displayName || `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() || "Artiste sans nom"}
                              </p>
                              <p className="text-xs text-cream/40 mt-0.5">{a.user.email}</p>
                            </div>
                            <button
                              onClick={() => void handleRemoveArtist(a.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-cream/30 hover:text-red-400 transition-colors shrink-0"
                              title="Retirer du roster"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {a.bio && (
                            <p className="mt-2 text-sm text-cream/50 line-clamp-2">{a.bio}</p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-3">
                            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                              <Music className="h-3 w-3 text-blue-400" />
                              <span className="text-xs text-cream/60">
                                {a._count.releases} release{a._count.releases !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                              <Package className="h-3 w-3 text-emerald-400" />
                              <span className="text-xs text-cream/60">
                                {a._count.dubpacks} dubpack{a._count.dubpacks !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                              <Users className="h-3 w-3 text-amber-400" />
                              <span className="text-xs text-cream/60">
                                {a._count.followers} follower{a._count.followers !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── INVITATIONS ─────────────────────────────────────────────── */}
          {tab === "invitations" && (
            <div className="space-y-6">
              {/* Send invite */}
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6">
                <h2 className="mb-1 font-semibold text-cream">Inviter un artiste</h2>
                <p className="mb-5 text-sm text-cream/40">
                  Un email d'invitation sera envoyé. L'artiste aura 7 jours pour accepter.
                </p>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="email@artiste.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => void handleInvite()}
                    disabled={inviting || !inviteEmail.trim()}
                  >
                    {inviting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Envoi…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Envoyer
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pending invitations */}
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6">
                <h2 className="mb-4 text-sm font-semibold text-cream/70 uppercase tracking-widest">
                  En attente ({invitations.length})
                </h2>
                {invitations.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-cream/15" />
                    <p className="text-cream/40 text-sm">Aucune invitation en attente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((inv) => {
                      const expired = new Date(inv.expiresAt) < new Date();
                      return (
                        <div
                          key={inv.id}
                          className="flex items-center gap-3 rounded-[10px] border border-[rgba(255,255,255,0.06)] p-3.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cream truncate">{inv.email}</p>
                            <p className={`text-xs mt-0.5 ${expired ? "text-red-400" : "text-cream/30"}`}>
                              {expired
                                ? "Expirée"
                                : `Expire le ${new Date(inv.expiresAt).toLocaleDateString("fr-BE")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                              <Clock className="h-3 w-3" />
                              En attente
                            </span>
                            <button
                              onClick={() => void handleRevokeInvitation(inv.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-cream/25 hover:text-red-400 transition-colors"
                              title="Révoquer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ──────────────────────────────────────────────── */}
          {tab === "settings" && (
            <div className="space-y-4">
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6 space-y-5">
                <h2 className="font-semibold text-cream">Profil de l'agence</h2>

                <div className="space-y-2">
                  <label className="text-xs text-cream/50 uppercase tracking-widest">
                    Nom de l'agence
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nom affiché publiquement"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => void handleSaveSettings()}
                    disabled={savingSettings}
                  >
                    {savingSettings ? "Sauvegarde…" : "Sauvegarder"}
                  </Button>
                </div>
              </div>

              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-6">
                <h2 className="mb-1 font-semibold text-cream">Profil complet</h2>
                <p className="mb-4 text-sm text-cream/40">
                  Modifiez vos informations personnelles, adresse et mot de passe.
                </p>
                <a href="/dashboard/profile">
                  <Button variant="outline" size="sm">
                    Gérer mon profil →
                  </Button>
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
