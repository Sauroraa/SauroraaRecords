"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  Upload,
  Archive,
  Settings2,
  TrendingUp,
  Disc3,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Check,
  CreditCard,
  User,
  Instagram,
  Globe,
  Save,
  Loader2,
  Zap,
  Bell,
  Key,
  Copy,
  Music2,
  Cpu,
  Send,
  Package
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReleaseItem, DubpackItem, RevenueSeries } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab =
  | "overview"
  | "profile"
  | "subscription"
  | "upload-release"
  | "upload-dubpack"
  | "downloads-config"
  | "revenue"
  | "releases"
  | "engage-campaigns"
  | "analytics"
  | "broadcasts"
  | "private-links"
  | "api-keys";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "profile", label: "Mon Profil", icon: <User className="h-4 w-4" /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="h-4 w-4" /> },
  { id: "upload-release", label: "Upload Release", icon: <Upload className="h-4 w-4" /> },
  { id: "upload-dubpack", label: "Upload Dubpack", icon: <Archive className="h-4 w-4" /> },
  { id: "downloads-config", label: "Downloads Config", icon: <Settings2 className="h-4 w-4" /> },
  { id: "revenue", label: "Revenue", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "releases", label: "My Releases", icon: <Disc3 className="h-4 w-4" /> },
  { id: "engage-campaigns", label: "Engage", icon: <Zap className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics +", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "broadcasts", label: "Broadcasts", icon: <Bell className="h-4 w-4" /> },
  { id: "private-links", label: "Private Links", icon: <Link2 className="h-4 w-4" /> },
  { id: "api-keys", label: "API Keys", icon: <Key className="h-4 w-4" /> }
];

const ACTION_OPTIONS = [
  { value: "FOLLOW_ARTIST", label: "Follow Artist" },
  { value: "SUBSCRIBE_NEWSLETTER", label: "Subscribe Newsletter" },
  { value: "LEAVE_COMMENT", label: "Leave Comment" },
  { value: "SHARE_LINK", label: "Share Link" },
  { value: "FOLLOW_INSTAGRAM", label: "Follow on Instagram" },
  { value: "FOLLOW_SOUNDCLOUD", label: "Follow on SoundCloud" },
  { value: "JOIN_DISCORD", label: "Join Discord" }
];

const GENRE_OPTIONS = [
  { value: "ELECTRO", label: "Electro" },
  { value: "HOUSE", label: "House" },
  { value: "TECHNO", label: "Techno" },
  { value: "DNB", label: "Drum & Bass" },
  { value: "BASS", label: "Bass Music" },
  { value: "TRAP", label: "Trap" },
  { value: "DRILL", label: "Drill" },
  { value: "RAP", label: "Rap" },
  { value: "HIP_HOP", label: "Hip-Hop" },
  { value: "RNB", label: "R&B" },
  { value: "AFRO", label: "Afro" },
  { value: "AMAPIANO", label: "Amapiano" },
  { value: "REGGAE", label: "Reggae" },
  { value: "POP", label: "Pop" },
  { value: "OTHER", label: "Other" }
];

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ─── Mon Profil ───────────────────────────────────────────────────────────────

function ProfilTab() {
  const coverRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    instagramUrl: "",
    soundcloudUrl: "",
    discordUrl: "",
    websiteUrl: "",
    payoutIban: ""
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me`, { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as {
            displayName?: string | null;
            bio?: string | null;
            avatar?: string | null;
            bannerUrl?: string | null;
            instagramUrl?: string | null;
            soundcloudUrl?: string | null;
            discordUrl?: string | null;
            websiteUrl?: string | null;
            payoutIban?: string | null;
          } | null;
          if (data) {
            setForm({
              displayName: data.displayName ?? "",
              bio: data.bio ?? "",
              instagramUrl: data.instagramUrl ?? "",
              soundcloudUrl: data.soundcloudUrl ?? "",
              discordUrl: data.discordUrl ?? "",
              websiteUrl: data.websiteUrl ?? "",
              payoutIban: data.payoutIban ?? ""
            });
            setAvatar(data.avatar ?? null);
            setBanner(data.bannerUrl ?? null);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/upload/cover`, { method: "POST", credentials: "include", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return ((await res.json()) as { path: string }).path;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarPath = avatar;
      if (avatarFile) {
        avatarPath = await uploadImage(avatarFile);
        setAvatar(avatarPath);
        setAvatarFile(null);
      }
      let bannerPath = banner;
      if (bannerFile) {
        bannerPath = await uploadImage(bannerFile);
        setBanner(bannerPath);
        setBannerFile(null);
      }
      const res = await fetch(`${API}/artists/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, avatar: avatarPath ?? undefined, bannerUrl: bannerPath ?? undefined })
      });
      if (!res.ok) throw new Error();
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Impossible de sauvegarder le profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const bannerPreview = bannerFile
    ? URL.createObjectURL(bannerFile)
    : banner
    ? `${API.replace("/api", "")}${banner}`
    : null;

  return (
    <div className="max-w-xl space-y-6">
      {/* Banner */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream/40">Bannière de profil</p>
        <div
          onClick={() => bannerRef.current?.click()}
          className="relative h-32 w-full cursor-pointer overflow-hidden rounded-[12px] border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-surface2 hover:border-violet/40 transition-colors"
        >
          {bannerPreview ? (
            <img src={bannerPreview} alt="banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <Upload className="h-6 w-6 text-cream/20" />
              <p className="text-xs text-cream/30">Clique pour uploader une bannière</p>
            </div>
          )}
        </div>
        <input
          ref={bannerRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && setBannerFile(e.target.files[0])}
        />
        {bannerPreview && (
          <button
            type="button"
            onClick={() => { setBanner(null); setBannerFile(null); }}
            className="text-xs text-cream/40 hover:text-red-400 transition-colors"
          >
            Supprimer la bannière
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div
          onClick={() => coverRef.current?.click()}
          className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[rgba(255,255,255,0.12)] bg-surface2 hover:border-violet/40 transition-colors"
        >
          {avatar || avatarFile ? (
            <img
              src={avatarFile ? URL.createObjectURL(avatarFile) : `${API.replace("/api", "")}${avatar}`}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-8 w-8 text-cream/20" />
            </div>
          )}
        </div>
        <input
          ref={coverRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && setAvatarFile(e.target.files[0])}
        />
        <div>
          <p className="text-sm font-medium text-cream">Photo de profil</p>
          <p className="text-xs text-cream/40 mt-0.5">JPG, PNG ou WebP · max 5MB</p>
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="mt-1.5 text-xs text-violet-light hover:underline"
          >
            Changer la photo
          </button>
        </div>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Nom d'artiste</label>
          <Input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Ton nom sur la plateforme"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Décris-toi en quelques mots..."
            rows={4}
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-none"
          />
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream/40">Liens sociaux</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 shrink-0 text-cream/30" />
            <Input
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/tonprofil"
            />
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-cream/30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.56 8.87V17h-1.7V8.87h1.7zm2.7 1.46a1.8 1.8 0 0 1 1.35.57c.35.38.52.9.52 1.57V17h-1.65v-4.26c0-.37-.09-.66-.27-.87a.9.9 0 0 0-.72-.31c-.28 0-.53.07-.74.22a1.43 1.43 0 0 0-.48.6V17h-1.65V10.4h1.56l.05.65c.2-.25.44-.44.72-.57.28-.13.58-.2.9-.2.5 0 .89.17 1.21.5v-.45zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            <Input
              value={form.soundcloudUrl}
              onChange={(e) => setForm({ ...form, soundcloudUrl: e.target.value })}
              placeholder="https://soundcloud.com/tonprofil"
            />
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-cream/30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.034.055a19.866 19.866 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            <Input
              value={form.discordUrl}
              onChange={(e) => setForm({ ...form, discordUrl: e.target.value })}
              placeholder="https://discord.gg/toninvitation"
            />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-cream/30" />
            <Input
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://tonsite.com"
            />
          </div>
        </div>
      </div>

      {/* Payout */}
      <div className="space-y-1.5 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
        <label className="text-xs font-semibold text-cream/60">IBAN de virement (revenus)</label>
        <Input
          value={form.payoutIban}
          onChange={(e) => setForm({ ...form, payoutIban: e.target.value })}
          placeholder="BE00 0000 0000 0000"
          className="font-mono"
        />
        <p className="text-xs text-cream/30">Utilisé uniquement pour les virements de revenus. Stocké de manière sécurisée.</p>
      </div>

      <Button onClick={() => void handleSave()} disabled={saving} className="w-full gap-2">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde...</> : <><Save className="h-4 w-4" /> Sauvegarder le profil</>}
      </Button>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<{ totalRevenue: number; totalDownloads: number; totalReleases: number; totalFollowers: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/stats`, { credentials: "include" });
        if (res.ok) setStats(await res.json() as typeof stats);
      } catch {}
    })();
  }, []);

  const statCards = [
    { label: "Total Revenue", value: stats ? `€${Number(stats.totalRevenue).toFixed(2)}` : "—", color: "text-violet-light" },
    { label: "Downloads", value: stats?.totalDownloads?.toLocaleString() ?? "—", color: "text-cream" },
    { label: "Releases", value: stats?.totalReleases?.toLocaleString() ?? "—", color: "text-cream" },
    { label: "Followers", value: stats?.totalFollowers?.toLocaleString() ?? "—", color: "text-cream" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-1">
            <p className="text-xs text-cream/40">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
        <p className="text-sm text-cream/50">Revenue chart and recent activity available in the Revenue tab.</p>
      </div>
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; price: string; color: string }> = {
  ARTIST_FREE:  { name: "Free",  price: "0 €/mois",    color: "text-foreground" },
  ARTIST_BASIC: { name: "Basic", price: "4,99 €/mois", color: "text-violet-500" },
  ARTIST_PRO:   { name: "Pro",   price: "9,99 €/mois", color: "text-yellow-500" }
};

const PLAN_FEATURES: Record<string, string[]> = {
  ARTIST_FREE:  ["1 release par mois", "Partage 70/30", "HypeEdit gate"],
  ARTIST_BASIC: ["Releases illimitées", "Partage 80/20", "HypeEdit gate", "Support prioritaire"],
  ARTIST_PRO:   ["Releases illimitées", "Partage 90/10", "HypeEdit gate", "Support prioritaire", "Badge Vérifié"]
};

function SubscriptionTab() {
  const [sub, setSub] = useState<{ id: string; plan: string; status: string; currentPeriodEnd?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/subscriptions/me`, { credentials: "include" });
        if (res.ok) setSub(await res.json());
      } catch {
        // no subscription
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCancel = async () => {
    if (!sub) return;
    setCanceling(true);
    try {
      const res = await fetch(`${API}/subscriptions/me`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setSub(null);
        toast.success("Abonnement annulé");
      } else {
        toast.error("Impossible d'annuler l'abonnement");
      }
    } catch {
      toast.error("Impossible d'annuler l'abonnement");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Chargement…</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Mon abonnement</h2>
          <p className="text-muted-foreground text-sm">Vous n'avez pas encore de plan actif.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["ARTIST_FREE", "ARTIST_BASIC", "ARTIST_PRO"] as const).map((plan) => {
            const meta = PLAN_LABELS[plan];
            const features = PLAN_FEATURES[plan];
            return (
              <div key={plan} className={`rounded-xl border p-5 space-y-4 ${plan === "ARTIST_BASIC" ? "border-violet-500 ring-1 ring-violet-500/30" : "border-border"}`}>
                <div>
                  <p className={`text-lg font-bold ${meta.color}`}>{meta.name}</p>
                  <p className="text-2xl font-black mt-1">{meta.price}</p>
                </div>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="w-full" variant={plan === "ARTIST_BASIC" ? "default" : "outline"}>
                  <a href="/pricing">Choisir {meta.name}</a>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const meta = PLAN_LABELS[sub.plan] ?? { name: sub.plan, price: "—", color: "text-foreground" };
  const features = PLAN_FEATURES[sub.plan] ?? [];
  const isActive = sub.status === "active";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Mon abonnement</h2>
        <p className="text-muted-foreground text-sm">Gérez votre plan et vos avantages.</p>
      </div>

      {/* Current plan card */}
      <div className="rounded-xl border border-violet-500/40 bg-violet-500/5 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Plan actuel</p>
            <p className={`text-3xl font-black ${meta.color}`}>{meta.name}</p>
            <p className="text-muted-foreground text-sm mt-0.5">{meta.price}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-muted-foreground"}`} />
            {isActive ? "Actif" : sub.status}
          </span>
        </div>

        {features.length > 0 && (
          <ul className="grid sm:grid-cols-2 gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {sub.currentPeriodEnd && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Renouvellement / expiration le{" "}
            <strong className="text-foreground">
              {new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <a href="/pricing">Changer de plan</a>
        </Button>
        {isActive && (
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={canceling}>
            {canceling ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Annulation…</> : "Annuler l'abonnement"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Upload Release ────────────────────────────────────────────────────────────

function UploadReleaseTab() {
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "ELECTRO",
    price: "0",
    type: "FREE",
    previewClip: "",
    bpm: "",
    musicalKey: "",
    previewDuration: "30"
  });
  const [gate, setGate] = useState({
    gateEnabled: false,
    gateFollowArtist: false,
    gateEmail: false,
    gateInstagram: false,
    gateSoundcloud: false,
    gateDiscord: false
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragAudio, setDragAudio] = useState(false);
  const [dragCover, setDragCover] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  const uploadFileResumable = async (
    file: File,
    kind: "audio" | "cover",
    onProgress: (percent: number) => void
  ): Promise<string> => {
    const chunkSize = 5 * 1024 * 1024;
    const fingerprint = `${kind}:${file.name}:${file.size}:${file.lastModified}`;

    const initRes = await fetch(`${API}/upload/resumable/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        kind,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        totalSize: file.size,
        chunkSize,
        fingerprint
      })
    });
    if (initRes.status === 401) throw new Error("AUTH_REQUIRED");
    if (!initRes.ok) throw new Error("UPLOAD_INIT_FAILED");

    let state = (await initRes.json()) as {
      uploadId: string;
      nextChunk: number;
      chunkSize: number;
      uploadedBytes: number;
      totalSize: number;
    };
    onProgress(Math.round((state.uploadedBytes / state.totalSize) * 100));

    const totalChunks = Math.ceil(file.size / state.chunkSize);
    for (let chunkIndex = state.nextChunk; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * state.chunkSize;
      const end = Math.min(file.size, start + state.chunkSize);
      const chunkBlob = file.slice(start, end);
      const fd = new FormData();
      fd.append("chunk", chunkBlob, file.name);
      fd.append("chunkIndex", String(chunkIndex));

      const chunkRes = await fetch(`${API}/upload/resumable/${state.uploadId}/chunk`, {
        method: "POST",
        credentials: "include",
        body: fd
      });
      if (chunkRes.status === 401) throw new Error("AUTH_REQUIRED");
      if (!chunkRes.ok) throw new Error("UPLOAD_CHUNK_FAILED");
      state = (await chunkRes.json()) as typeof state;
      onProgress(Math.round((state.uploadedBytes / state.totalSize) * 100));
    }

    const completeRes = await fetch(`${API}/upload/resumable/${state.uploadId}/complete`, {
      method: "POST",
      credentials: "include"
    });
    if (completeRes.status === 401) throw new Error("AUTH_REQUIRED");
    if (!completeRes.ok) throw new Error("UPLOAD_COMPLETE_FAILED");
    const completeData = (await completeRes.json()) as { path: string };
    onProgress(100);
    return completeData.path;
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !audioFile) {
      toast.error("Title and audio file are required");
      return;
    }
    setUploading(true);
    setAudioProgress(0);
    setCoverProgress(0);
    try {
      const [audioPath, coverPath] = await Promise.all([
        uploadFileResumable(audioFile, "audio", setAudioProgress),
        coverFile ? uploadFileResumable(coverFile, "cover", setCoverProgress) : Promise.resolve(undefined)
      ]);
      const res = await fetch(`${API}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          genre: form.genre,
          price: String(form.type === "FREE" ? "0" : form.price || "0"),
          type: form.type,
          audioPath,
          coverPath,
          previewClip: form.previewClip || undefined,
          bpm: form.bpm || undefined,
          musicalKey: form.musicalKey || undefined,
          previewDuration: form.previewDuration || "30",
          ...(form.type === "FREE" && gate.gateEnabled ? gate : {})
        })
      });
      if (!res.ok) throw new Error("Failed to create release");
      toast.success("Release publiée automatiquement !");
      setForm({ title: "", description: "", genre: "ELECTRO", price: "0", type: "FREE", previewClip: "", bpm: "", musicalKey: "", previewDuration: "30" });
      setGate({ gateEnabled: false, gateFollowArtist: false, gateEmail: false, gateInstagram: false, gateSoundcloud: false, gateDiscord: false });
      setAudioFile(null);
      setCoverFile(null);
      setAudioProgress(0);
      setCoverProgress(0);
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        toast.error("Session expirée. Reconnecte-toi puis relance l'upload.");
      } else {
        toast.error("Failed to upload release");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-cream/60">Title *</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Release title" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-cream/60">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your release..."
            rows={3}
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-violet/50"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-xs font-medium text-cream/60">Genre</label>
          <Select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre.value} value={genre.value}>{genre.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Type</label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="FREE">Free</option>
            <option value="PAID">Paid</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Price (€)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={form.type === "FREE"}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">BPM</label>
          <Input type="number" min="60" max="220" placeholder="128" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Key (tonalité)</label>
          <Select value={form.musicalKey} onChange={(e) => setForm({ ...form, musicalKey: e.target.value })}>
            <option value="">-- Sélectionner --</option>
            {["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].flatMap((note) => [
              <option key={`${note}m`} value={`${note}m`}>{note} minor</option>,
              <option key={note} value={note}>{note} major</option>
            ])}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Preview duration (s)</label>
          <Input type="number" min="15" max="90" value={form.previewDuration} onChange={(e) => setForm({ ...form, previewDuration: e.target.value })} />
        </div>
      </div>

      {/* Audio dropzone */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cream/60">Audio File * (MP3/WAV, max 200MB)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragAudio(true); }}
          onDragLeave={() => setDragAudio(false)}
          onDrop={(e) => { e.preventDefault(); setDragAudio(false); const f = e.dataTransfer.files[0]; if (f) setAudioFile(f); }}
          onClick={() => audioRef.current?.click()}
          className={`cursor-pointer rounded-[12px] border-2 border-dashed p-6 text-center transition-colors ${
            dragAudio ? "border-violet bg-violet/10" : audioFile ? "border-violet/50 bg-violet/5" : "border-[rgba(255,255,255,0.12)] hover:border-violet/30"
          }`}
        >
          <input ref={audioRef} type="file" accept=".mp3,.wav,.flac" className="hidden" onChange={(e) => e.target.files?.[0] && setAudioFile(e.target.files[0])} />
          {audioFile ? (
            <p className="text-sm text-violet-light">{audioFile.name}</p>
          ) : (
            <p className="text-sm text-cream/40">Drop audio file here or click to browse</p>
          )}
        </div>
        {uploading && audioProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-cream/50">
              <span>Upload audio</span>
              <span>{audioProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
              <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${audioProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Cover dropzone */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cream/60">Cover Image (JPG/PNG, max 20MB)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragCover(true); }}
          onDragLeave={() => setDragCover(false)}
          onDrop={(e) => { e.preventDefault(); setDragCover(false); const f = e.dataTransfer.files[0]; if (f) setCoverFile(f); }}
          onClick={() => coverRef.current?.click()}
          className={`cursor-pointer rounded-[12px] border-2 border-dashed p-5 text-center transition-colors ${
            dragCover ? "border-violet bg-violet/10" : coverFile ? "border-violet/50 bg-violet/5" : "border-[rgba(255,255,255,0.12)] hover:border-violet/30"
          }`}
        >
          <input ref={coverRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => e.target.files?.[0] && setCoverFile(e.target.files[0])} />
          {coverFile ? (
            <p className="text-sm text-violet-light">{coverFile.name}</p>
          ) : (
            <p className="text-sm text-cream/40">Drop cover image here or click to browse</p>
          )}
        </div>
        {uploading && coverFile && coverProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-cream/50">
              <span>Upload cover</span>
              <span>{coverProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
              <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${coverProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* HypeEdit Gate — only for FREE releases */}
      {form.type === "FREE" && (
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cream">HypeEdit Gate</p>
              <p className="text-xs text-cream/40 mt-0.5">Require actions before the download link is revealed</p>
            </div>
            <button
              type="button"
              onClick={() => setGate((g) => ({ ...g, gateEnabled: !g.gateEnabled }))}
              className="flex items-center gap-1.5"
            >
              {gate.gateEnabled
                ? <ToggleRight className="h-6 w-6 text-violet-light" />
                : <ToggleLeft className="h-6 w-6 text-cream/30" />}
            </button>
          </div>

          {gate.gateEnabled && (
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              {[
                { key: "gateFollowArtist" as const, label: "Follow Artist on Sauroraa" },
                { key: "gateEmail" as const, label: "Capture email address" },
                { key: "gateInstagram" as const, label: "Follow on Instagram" },
                { key: "gateSoundcloud" as const, label: "Follow on SoundCloud" },
                { key: "gateDiscord" as const, label: "Join Discord server" }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setGate((g) => ({ ...g, [key]: !g[key] }))}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      gate[key]
                        ? "bg-violet border-violet"
                        : "border-[rgba(255,255,255,0.2)] bg-transparent group-hover:border-violet/50"
                    }`}
                  >
                    {gate[key] && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className="text-sm text-cream/70 group-hover:text-cream/90 transition-colors">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Button onClick={() => void handleSubmit()} disabled={uploading} className="w-full">
        {uploading ? `Uploading... ${audioProgress}%` : "Submit Release"}
      </Button>
    </div>
  );
}

// ─── Upload Dubpack ────────────────────────────────────────────────────────────

function UploadDubpackTab() {
  const zipRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", genre: "ELECTRO", price: "0", type: "FREE" });
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragZip, setDragZip] = useState(false);

  const uploadFile = async (file: File, route: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/upload/${route}`, { method: "POST", credentials: "include", body: fd });
    if (!res.ok) throw new Error();
    return ((await res.json()) as { path: string }).path;
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !zipFile) {
      toast.error("Title and ZIP file are required");
      return;
    }
    setUploading(true);
    try {
      const [zipPath, coverPath] = await Promise.all([
        uploadFile(zipFile, "zip"),
        coverFile ? uploadFile(coverFile, "cover") : Promise.resolve(undefined)
      ]);
      const res = await fetch(`${API}/dubpacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: slugifyTitle(form.title),
          title: form.title,
          description: form.description || undefined,
          genre: form.genre,
          price: String(form.type === "FREE" ? "0" : form.price || "0"),
          type: form.type,
          zipPath,
          coverPath
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Dubpack submitted! Pending admin approval.");
      setForm({ title: "", description: "", genre: "ELECTRO", price: "0", type: "FREE" });
      setZipFile(null);
      setCoverFile(null);
    } catch {
      toast.error("Failed to upload dubpack");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Title *</label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Dubpack name" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="What's included in this pack?"
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-violet/50"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Genre</label>
          <Select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre.value} value={genre.value}>{genre.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Type</label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="FREE">Free</option>
            <option value="PAID">Paid</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cream/60">Price (€)</label>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={form.type === "FREE"} />
        </div>
      </div>

      {/* ZIP dropzone */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cream/60">ZIP File * (max 500MB)</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragZip(true); }}
          onDragLeave={() => setDragZip(false)}
          onDrop={(e) => { e.preventDefault(); setDragZip(false); const f = e.dataTransfer.files[0]; if (f) setZipFile(f); }}
          onClick={() => zipRef.current?.click()}
          className={`cursor-pointer rounded-[12px] border-2 border-dashed p-6 text-center transition-colors ${
            dragZip ? "border-violet bg-violet/10" : zipFile ? "border-violet/50 bg-violet/5" : "border-[rgba(255,255,255,0.12)] hover:border-violet/30"
          }`}
        >
          <input ref={zipRef} type="file" accept=".zip,.rar,.7z" className="hidden" onChange={(e) => e.target.files?.[0] && setZipFile(e.target.files[0])} />
          {zipFile ? (
            <p className="text-sm text-violet-light">{zipFile.name}</p>
          ) : (
            <p className="text-sm text-cream/40">Drop ZIP file here or click to browse</p>
          )}
        </div>
      </div>

      {/* Cover image */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cream/60">Cover Image (optional)</label>
        <div
          onClick={() => coverRef.current?.click()}
          className={`cursor-pointer rounded-[12px] border-2 border-dashed p-5 text-center transition-colors ${
            coverFile ? "border-violet/50 bg-violet/5" : "border-[rgba(255,255,255,0.12)] hover:border-violet/30"
          }`}
        >
          <input ref={coverRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => e.target.files?.[0] && setCoverFile(e.target.files[0])} />
          {coverFile ? (
            <p className="text-sm text-violet-light">{coverFile.name}</p>
          ) : (
            <p className="text-sm text-cream/40">Drop cover image or click to browse</p>
          )}
        </div>
      </div>

      <Button onClick={() => void handleSubmit()} disabled={uploading} className="w-full">
        {uploading ? "Uploading..." : "Submit Dubpack"}
      </Button>
    </div>
  );
}

// ─── Downloads Config ──────────────────────────────────────────────────────────

function DownloadsConfigTab() {
  const [enabled, setEnabled] = useState(true);
  const [selected, setSelected] = useState<string[]>(["FOLLOW_ARTIST"]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/download-config`, { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { enabled: boolean; requiredActions: string[] };
          setEnabled(data.enabled);
          setSelected(data.requiredActions ?? []);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const toggleAction = (val: string) => {
    setSelected((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/artists/me/download-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled, requiredActions: selected })
      });
      toast.success("Download config saved");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <LoadingSpinner />;

  return (
    <div className="max-w-lg space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
        <div>
          <p className="text-sm font-medium text-cream">Free Download Gating</p>
          <p className="text-xs text-cream/50 mt-0.5">Require fans to complete actions before downloading for free</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}>
          {enabled
            ? <ToggleRight className="h-7 w-7 text-violet-light" />
            : <ToggleLeft className="h-7 w-7 text-cream/30" />
          }
        </button>
      </div>

      {/* Action checkboxes */}
      <div className={`space-y-2 transition-opacity ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <p className="text-xs font-medium text-cream/60 mb-3">Required Actions</p>
        {ACTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleAction(opt.value)}
            className={`w-full flex items-center justify-between rounded-[10px] border p-3.5 text-left transition-colors ${
              selected.includes(opt.value)
                ? "border-violet/40 bg-violet/10"
                : "border-[rgba(255,255,255,0.08)] bg-surface hover:border-violet/20"
            }`}
          >
            <span className="text-sm text-cream">{opt.label}</span>
            {selected.includes(opt.value) && (
              <Check className="h-4 w-4 text-violet-light shrink-0" />
            )}
          </button>
        ))}
      </div>

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  );
}

// ─── Revenue ───────────────────────────────────────────────────────────────────

function RevenueTab() {
  const [revenue, setRevenue] = useState<RevenueSeries[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/revenue`, { credentials: "include" });
        if (res.ok) setRevenue((await res.json()) as RevenueSeries[]);
      } catch {}
    })();
  }, []);

  const totalGross = revenue.reduce((s, r) => s + r.gross, 0);
  const totalNet = revenue.reduce((s, r) => s + r.net, 0);
  const totalLabel = revenue.reduce((s, r) => s + r.label, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Gross Revenue", value: `€${totalGross.toFixed(2)}`, color: "text-cream" },
          { label: "Your Share (70%)", value: `€${totalNet.toFixed(2)}`, color: "text-violet-light" },
          { label: "Label Share (30%)", value: `€${totalLabel.toFixed(2)}`, color: "text-cream/50" }
        ].map((s) => (
          <div key={s.label} className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <p className="text-xs text-cream/40">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {revenue.length > 0 ? (
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
          <p className="text-xs text-cream/50 mb-4">Monthly breakdown</p>
          <div className="space-y-2">
            {revenue.map((r) => (
              <div key={r.month} className="flex items-center gap-4 text-sm">
                <span className="w-20 text-cream/50 shrink-0">{r.month}</span>
                <div className="flex-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{ width: `${Math.min(100, (r.gross / (revenue[0]?.gross || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-cream w-16 text-right">€{Number(r.gross).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-8 text-center">
          <p className="text-sm text-cream/30">No revenue data yet</p>
        </div>
      )}
    </div>
  );
}

// ─── My Releases ───────────────────────────────────────────────────────────────

function ReleasesTab() {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [dubpacks, setDubpacks] = useState<DubpackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"releases" | "dubpacks">("releases");

  useEffect(() => {
    void (async () => {
      try {
        const [rRes, dRes] = await Promise.all([
          fetch(`${API}/releases?mine=true`, { credentials: "include" }),
          fetch(`${API}/dubpacks?mine=true`, { credentials: "include" })
        ]);
        if (rRes.ok) setReleases((await rRes.json()) as ReleaseItem[]);
        if (dRes.ok) setDubpacks((await dRes.json()) as DubpackItem[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const togglePublish = async (id: string, type: "release" | "dubpack", current: boolean) => {
    const endpoint = type === "release" ? `${API}/releases/${id}` : `${API}/dubpacks/${id}`;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ published: !current })
    });
    if (type === "release") {
      setReleases((prev) => prev.map((r) => r.id === id ? { ...r, published: !current } : r));
    } else {
      setDubpacks((prev) => prev.map((d) => d.id === id ? { ...d, published: !current } : d));
    }
  };

  const deleteItem = async (id: string, type: "release" | "dubpack") => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const endpoint = type === "release" ? `${API}/releases/${id}` : `${API}/dubpacks/${id}`;
    await fetch(endpoint, { method: "DELETE", credentials: "include" });
    if (type === "release") setReleases((prev) => prev.filter((r) => r.id !== id));
    else setDubpacks((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deleted");
  };

  if (loading) return <LoadingSpinner />;

  const items = view === "releases" ? releases : dubpacks;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setView("releases")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === "releases" ? "bg-violet text-white" : "text-cream/50 hover:text-cream"}`}
        >
          Releases ({releases.length})
        </button>
        <button
          onClick={() => setView("dubpacks")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${view === "dubpacks" ? "bg-violet text-white" : "text-cream/50 hover:text-cream"}`}
        >
          Dubpacks ({dubpacks.length})
        </button>
      </div>

      {!items.length ? (
        <div className="flex h-40 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
          <p className="text-sm text-cream/30">Nothing here yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream truncate">{item.title}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className={`text-xs ${item.published ? "text-violet-light" : "text-cream/30"}`}>
                    {item.published ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-cream/30">·</span>
                  <span className="text-xs text-cream/40">{item.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void togglePublish(item.id, view === "releases" ? "release" : "dubpack", item.published ?? false)}
                  className="h-8 px-2"
                >
                  {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void deleteItem(item.id, view === "releases" ? "release" : "dubpack")}
                  className="h-8 px-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Engage Campaigns ─────────────────────────────────────────────────────────

type EngageActionType =
  | "FOLLOW_SOUNDCLOUD" | "LIKE_SOUNDCLOUD" | "REPOST_SOUNDCLOUD"
  | "FOLLOW_INSTAGRAM" | "JOIN_DISCORD" | "SUBSCRIBE_NEWSLETTER"
  | "FOLLOW_ARTIST" | "LEAVE_COMMENT";

interface EngageCampaign {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  downloadPath: string | null;
  soundcloudArtistId: string | null;
  soundcloudTrackId: string | null;
  instagramHandle: string | null;
  discordServerId: string | null;
  discordInviteUrl: string | null;
  newsletterTag: string | null;
  releaseCountdown: string | null;
  createdAt: string;
  actions: { id: string; actionType: EngageActionType; required: boolean; position: number }[];
  _count?: { sessions: number; subscribers: number };
}

const ENGAGE_ACTIONS: { value: EngageActionType; label: string }[] = [
  { value: "FOLLOW_SOUNDCLOUD", label: "Follow on SoundCloud" },
  { value: "LIKE_SOUNDCLOUD", label: "Like track on SoundCloud" },
  { value: "REPOST_SOUNDCLOUD", label: "Repost on SoundCloud" },
  { value: "FOLLOW_INSTAGRAM", label: "Follow on Instagram" },
  { value: "JOIN_DISCORD", label: "Join Discord server" },
  { value: "SUBSCRIBE_NEWSLETTER", label: "Subscribe to newsletter" },
  { value: "FOLLOW_ARTIST", label: "Follow on Sauroraa" },
  { value: "LEAVE_COMMENT", label: "Leave a comment" }
];

function EngageCampaignsTab() {
  const [campaigns, setCampaigns] = useState<EngageCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [analytics, setAnalytics] = useState<Record<string, { totalSessions: number; completedSessions: number; conversionRate: number; subscribers: number }>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    downloadPath: "",
    soundcloudArtistId: "",
    soundcloudTrackId: "",
    instagramHandle: "",
    discordServerId: "",
    discordInviteUrl: "",
    releaseCountdown: ""
  });
  const [selectedActions, setSelectedActions] = useState<{ actionType: EngageActionType; required: boolean }[]>([]);

  const load = async () => {
    try {
      const res = await fetch(`${API}/engage/me/campaigns`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as EngageCampaign[];
        setCampaigns(data);
        // Load analytics for each campaign
        await Promise.all(data.map(async (c) => {
          try {
            const r = await fetch(`${API}/engage/me/campaigns/${c.id}/analytics`, { credentials: "include" });
            if (r.ok) {
              const a = await r.json() as { totalSessions: number; completedSessions: number; conversionRate: number; subscribers: number };
              setAnalytics((prev) => ({ ...prev, [c.id]: a }));
            }
          } catch {}
        }));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Titre requis"); return; }
    if (selectedActions.length === 0) { toast.error("Ajoute au moins une action"); return; }
    setCreating(true);
    try {
      const res = await fetch(`${API}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          releaseCountdown: form.releaseCountdown || undefined,
          actions: selectedActions.map((a, idx) => ({ ...a, position: idx }))
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Campagne créée !");
      setShowForm(false);
      setForm({ title: "", description: "", downloadPath: "", soundcloudArtistId: "", soundcloudTrackId: "", instagramHandle: "", discordServerId: "", discordInviteUrl: "", releaseCountdown: "" });
      setSelectedActions([]);
      void load();
    } catch {
      toast.error("Impossible de créer la campagne");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusToggle = async (campaign: EngageCampaign) => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await fetch(`${API}/engage/me/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      void load();
    } catch {
      toast.error("Impossible de modifier la campagne");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    try {
      await fetch(`${API}/engage/me/campaigns/${id}`, { method: "DELETE", credentials: "include" });
      void load();
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  const toggleAction = (actionType: EngageActionType) => {
    setSelectedActions((prev) => {
      const exists = prev.find((a) => a.actionType === actionType);
      if (exists) return prev.filter((a) => a.actionType !== actionType);
      return [...prev, { actionType, required: true }];
    });
  };

  const toggleRequired = (actionType: EngageActionType) => {
    setSelectedActions((prev) =>
      prev.map((a) => a.actionType === actionType ? { ...a, required: !a.required } : a)
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cream">Sauroraa Engage</h2>
          <p className="text-xs text-cream/50 mt-0.5">Crée des campagnes de fan-gate pour débloquer tes téléchargements</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-[14px] border border-violet/30 bg-surface p-5 space-y-5">
          <h3 className="text-sm font-semibold text-cream">Nouvelle campagne Engage</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">Titre *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Free DL — Follow & Download" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">Fichier à débloquer (path)</label>
              <Input value={form.downloadPath} onChange={(e) => setForm({ ...form, downloadPath: e.target.value })} placeholder="/uploads/audio/track.wav" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-cream/60">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Décris le contenu à télécharger..."
                className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">SoundCloud Artist ID</label>
              <Input value={form.soundcloudArtistId} onChange={(e) => setForm({ ...form, soundcloudArtistId: e.target.value })} placeholder="ton-username-soundcloud" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">SoundCloud Track ID / slug</label>
              <Input value={form.soundcloudTrackId} onChange={(e) => setForm({ ...form, soundcloudTrackId: e.target.value })} placeholder="nom-du-track" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">Instagram handle</label>
              <Input value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })} placeholder="@tonhandle" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">Discord invite URL</label>
              <Input value={form.discordInviteUrl} onChange={(e) => setForm({ ...form, discordInviteUrl: e.target.value })} placeholder="https://discord.gg/..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cream/60">Release countdown</label>
              <Input type="datetime-local" value={form.releaseCountdown} onChange={(e) => setForm({ ...form, releaseCountdown: e.target.value })} />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cream/40">Actions requises pour débloquer</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ENGAGE_ACTIONS.map((action) => {
                const selected = selectedActions.find((a) => a.actionType === action.value);
                return (
                  <div key={action.value} className={`flex items-center justify-between rounded-[10px] border p-2.5 cursor-pointer transition-colors ${selected ? "border-violet/40 bg-violet/10" : "border-[rgba(255,255,255,0.08)] bg-surface2"}`}>
                    <button type="button" onClick={() => toggleAction(action.value)} className="flex items-center gap-2 flex-1 text-left">
                      <div className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-violet bg-violet" : "border-cream/20"}`}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-xs text-cream">{action.label}</span>
                    </button>
                    {selected && (
                      <button
                        type="button"
                        onClick={() => toggleRequired(action.value)}
                        className={`ml-2 text-[10px] rounded px-1.5 py-0.5 ${selected.required ? "bg-red-500/20 text-red-400" : "bg-black/20 text-cream/40"}`}
                      >
                        {selected.required ? "Requis" : "Optionnel"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void handleCreate()} disabled={creating} className="gap-2">
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : <><Check className="h-4 w-4" /> Créer la campagne</>}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !showForm ? (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-8 text-center">
          <Zap className="mx-auto mb-3 h-8 w-8 text-violet/40" />
          <p className="text-sm text-cream/50">Aucune campagne Engage. Crée ta première campagne de fan-gate !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const stats = analytics[campaign.id];
            const engageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/engage/${campaign.id}`;

            return (
              <div key={campaign.id} className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-cream">{campaign.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        campaign.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                        campaign.status === "PAUSED" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-cream/10 text-cream/40"
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="mt-1 text-xs text-cream/50 line-clamp-1">{campaign.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {campaign.actions.map((a) => (
                        <span key={a.id} className="rounded-[6px] bg-violet/10 px-2 py-0.5 text-[10px] text-violet-light">
                          {a.actionType.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(engageUrl);
                        toast.success("Lien copié !");
                      }}
                      title="Copier le lien"
                      className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-1.5 text-cream/50 hover:text-cream transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <a
                      href={`/engage/${campaign.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Voir la page"
                      className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-1.5 text-cream/50 hover:text-cream transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => void handleStatusToggle(campaign)}
                      title={campaign.status === "ACTIVE" ? "Mettre en pause" : "Activer"}
                      className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-1.5 text-cream/50 hover:text-cream transition-colors"
                    >
                      {campaign.status === "ACTIVE" ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => void handleDelete(campaign.id)}
                      className="rounded-[8px] border border-[rgba(255,255,255,0.1)] p-1.5 text-cream/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-cream">{stats.totalSessions}</p>
                      <p className="text-[10px] uppercase tracking-wide text-cream/40">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-cream">{stats.completedSessions}</p>
                      <p className="text-[10px] uppercase tracking-wide text-cream/40">Downloads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-violet-light">{stats.conversionRate}%</p>
                      <p className="text-[10px] uppercase tracking-wide text-cream/40">Conversion</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-cream">{stats.subscribers}</p>
                      <p className="text-[10px] uppercase tracking-wide text-cream/40">Emails</p>
                    </div>
                  </div>
                )}

                {/* Export subscribers */}
                {stats && stats.subscribers > 0 && (
                  <div className="mt-2 text-right">
                    <a
                      href={`${API}/engage/me/campaigns/${campaign.id}/subscribers/export`}
                      className="text-xs text-violet-light hover:underline"
                    >
                      Exporter {stats.subscribers} emails (CSV)
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-violet border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Advanced Analytics Tab ────────────────────────────────────────────────────

function AdvancedAnalyticsTab() {
  const [data, setData] = useState<{
    streamsByDay: Record<string, number>;
    downloadsByDay: Record<string, number>;
    topTracks: { id: string; title: string; coverPath?: string | null; streams: number; downloads: number; comments: number }[];
    followerGrowth: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/analytics/advanced`, { credentials: "include" });
        if (res.ok) setData(await res.json() as typeof data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet" /></div>;
  if (!data) return <div className="text-cream/40 text-center py-12">Aucune donnée disponible.</div>;

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const maxStreams = Math.max(...days.map((d) => data.streamsByDay[d] ?? 0), 1);

  return (
    <div className="space-y-6">
      {/* Streams chart */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-violet" />
          <p className="text-sm font-semibold text-cream">Streams — 30 derniers jours</p>
        </div>
        <div className="flex items-end gap-0.5 h-24">
          {days.map((day) => {
            const v = data.streamsByDay[day] ?? 0;
            const h = Math.max(4, (v / maxStreams) * 100);
            return (
              <div key={day} className="flex-1 relative group">
                <div className="w-full rounded-sm bg-violet/60 hover:bg-violet transition-colors" style={{ height: `${h}%` }} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-10">
                  <div className="rounded-[6px] bg-surface2 border border-[rgba(255,255,255,0.12)] px-2 py-1 text-[10px] text-cream whitespace-nowrap">{day.slice(5)}: {v}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-cream/30">
          <span>{days[0]?.slice(5)}</span><span>Aujourd'hui</span>
        </div>
      </div>

      {/* Downloads chart */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <p className="text-sm font-semibold text-cream">Downloads — 30 derniers jours</p>
        </div>
        <div className="flex items-end gap-0.5 h-20">
          {days.map((day) => {
            const v = data.downloadsByDay[day] ?? 0;
            const maxDl = Math.max(...days.map((d) => data.downloadsByDay[d] ?? 0), 1);
            const h = Math.max(4, (v / maxDl) * 100);
            return (
              <div key={day} className="flex-1">
                <div className="w-full rounded-sm bg-green-400/60 hover:bg-green-400 transition-colors" style={{ height: `${h}%` }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Top tracks */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-3">
        <p className="text-sm font-semibold text-cream">Top Tracks</p>
        <div className="space-y-2">
          {data.topTracks.slice(0, 5).map((track, i) => (
            <div key={track.id} className="flex items-center gap-3">
              <span className="text-sm font-bold text-cream/30 w-4">#{i + 1}</span>
              <p className="flex-1 text-sm text-cream truncate">{track.title}</p>
              <div className="flex gap-3 text-xs text-cream/50">
                <span>{track.streams} streams</span>
                <span>{track.downloads} DL</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follower growth */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5">
        <p className="text-sm font-semibold text-cream mb-2">Nouveaux followers (30j)</p>
        <p className="text-3xl font-bold text-violet">{data.followerGrowth.length}</p>
      </div>
    </div>
  );
}

// ─── Broadcasts Tab ────────────────────────────────────────────────────────────

function BroadcastsTab() {
  const [broadcasts, setBroadcasts] = useState<{ id: string; title: string; body: string; createdAt: string; _count: { recipients: number } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/broadcasts`, { credentials: "include" });
        if (res.ok) setBroadcasts(await res.json() as typeof broadcasts);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Titre et message requis"); return; }
    setSending(true);
    try {
      const res = await fetch(`${API}/artists/me/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: form.title, message: form.message })
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { id: string; title: string; body: string; createdAt: string; recipientCount: number; _count: { recipients: number } };
      setBroadcasts((prev) => [{ ...data, _count: { recipients: data.recipientCount ?? 0 } }, ...prev]);
      setForm({ title: "", message: "" });
      toast.success(`Broadcast envoyé à ${(data.recipientCount ?? 0)} abonné(s) !`);
    } catch { toast.error("Erreur lors de l'envoi"); }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
        <p className="text-sm font-semibold text-cream flex items-center gap-2"><Bell className="h-4 w-4 text-violet" /> Nouvelle annonce</p>
        <Input placeholder="Titre de l'annonce" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea
          rows={4}
          placeholder="Message pour vos fans…"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-[10px] border border-[rgba(255,255,255,0.12)] bg-surface2 px-3 py-2 text-sm text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-none"
        />
        <Button onClick={() => void send()} disabled={sending} className="gap-2">
          <Send className="h-3.5 w-3.5" />{sending ? "Envoi…" : "Envoyer à tous les abonnés"}
        </Button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin text-violet mx-auto" /> : (
        <div className="space-y-2">
          {broadcasts.map((b) => (
            <div key={b.id} className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-cream">{b.title}</p>
                <span className="text-xs text-cream/40">{b._count.recipients} destinataires</span>
              </div>
              <p className="text-xs text-cream/60 line-clamp-2">{b.body}</p>
              <p className="text-[10px] text-cream/30 mt-1">{new Date(b.createdAt).toLocaleDateString("fr-BE")}</p>
            </div>
          ))}
          {broadcasts.length === 0 && <p className="text-sm text-cream/30 text-center py-8">Aucun broadcast envoyé.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Private Links Tab ────────────────────────────────────────────────────────

function PrivateLinksTab() {
  const [releases, setReleases] = useState<{ id: string; title: string }[]>([]);
  const [links, setLinks] = useState<{ token: string; scope: string; maxPlays: number; playsCount: number; expiresAt: string; createdAt: string }[]>([]);
  const [selectedRelease, setSelectedRelease] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`${API}/releases`, { credentials: "include" });
      if (res.ok) setReleases(await res.json() as typeof releases);
    })();
  }, []);

  const loadLinks = async (releaseId: string) => {
    const res = await fetch(`${API}/releases/${releaseId}/private-links`, { credentials: "include" });
    if (res.ok) setLinks(await res.json() as typeof links);
  };

  const handleSelect = async (id: string) => {
    setSelectedRelease(id);
    if (id) await loadLinks(id);
    else setLinks([]);
  };

  const createLink = async () => {
    if (!selectedRelease) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/releases/${selectedRelease}/private-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scope: "STREAM", maxPlays: 50, expiryDays: 30 })
      });
      if (!res.ok) throw new Error();
      await loadLinks(selectedRelease);
      toast.success("Lien créé !");
    } catch { toast.error("Erreur"); }
    setCreating(false);
  };

  const deleteLink = async (token: string) => {
    await fetch(`${API}/releases/private-links/${token}`, { method: "DELETE", credentials: "include" });
    setLinks((prev) => prev.filter((l) => l.token !== token));
    toast.success("Lien supprimé");
  };

  const copyLink = (token: string) => {
    void navigator.clipboard.writeText(`${window.location.origin}/release/private/${token}`);
    toast.success("Lien copié !");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
        <p className="text-sm font-semibold text-cream flex items-center gap-2"><Link2 className="h-4 w-4 text-violet" /> Créer un lien privé</p>
        <Select value={selectedRelease} onChange={(e) => void handleSelect(e.target.value)}>
          <option value="">-- Sélectionner une release --</option>
          {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </Select>
        {selectedRelease && (
          <Button onClick={() => void createLink()} disabled={creating} className="gap-2">
            <Plus className="h-3.5 w-3.5" />{creating ? "Création…" : "Générer un lien"}
          </Button>
        )}
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.token} className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-cream/60 truncate">/release/private/{l.token.slice(0, 12)}…</p>
                  <p className="text-[10px] text-cream/30 mt-0.5">{l.playsCount}/{l.maxPlays} plays · Expire {new Date(l.expiresAt).toLocaleDateString("fr-BE")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => copyLink(l.token)} className="gap-1.5"><Copy className="h-3 w-3" />Copier</Button>
                  <Button size="sm" variant="outline" onClick={() => void deleteLink(l.token)} className="text-red-400"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<{ id: string; name: string; active: boolean; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/artists/me/api-keys`, { credentials: "include" });
        if (res.ok) setKeys(await res.json() as typeof keys);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/artists/me/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { key: string };
      setNewKey(data.key);
      setName("");
      const listRes = await fetch(`${API}/artists/me/api-keys`, { credentials: "include" });
      if (listRes.ok) setKeys(await listRes.json() as typeof keys);
    } catch { toast.error("Erreur"); }
    setCreating(false);
  };

  const revoke = async (id: string) => {
    await fetch(`${API}/artists/me/api-keys/${id}/revoke`, { method: "PATCH", credentials: "include" });
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, active: false } : k));
    toast.success("Clé révoquée");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
        <p className="text-sm font-semibold text-cream flex items-center gap-2"><Key className="h-4 w-4 text-violet" /> Créer une clé API</p>
        <p className="text-xs text-cream/50">Les clés API te permettent d'intégrer Sauroraa à tes propres applications.</p>
        <div className="flex gap-3">
          <Input placeholder="Nom de la clé (ex: Mon site)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={() => void create()} disabled={creating || !name.trim()} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />{creating ? "Création…" : "Créer"}
          </Button>
        </div>
        {newKey && (
          <div className="rounded-[10px] bg-violet/10 border border-violet/30 p-3 space-y-2">
            <p className="text-xs text-cream/70 font-medium">⚠️ Copie cette clé maintenant — elle ne sera plus visible.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-cream bg-black/40 rounded px-2 py-1 truncate">{newKey}</code>
              <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(newKey); toast.success("Copié !"); }} className="gap-1 shrink-0"><Copy className="h-3 w-3" /></Button>
            </div>
          </div>
        )}
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin text-violet mx-auto" /> : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
              <div>
                <p className="text-sm font-medium text-cream">{k.name}</p>
                <p className="text-[10px] text-cream/30">{new Date(k.createdAt).toLocaleDateString("fr-BE")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${k.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{k.active ? "Active" : "Révoquée"}</span>
                {k.active && <Button size="sm" variant="outline" onClick={() => void revoke(k.id)} className="text-red-400 text-xs">Révoquer</Button>}
              </div>
            </div>
          ))}
          {keys.length === 0 && <p className="text-sm text-cream/30 text-center py-8">Aucune clé API.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ArtistDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!user) {
      router.replace("/login?redirect=/dashboard/artist");
      return;
    }
    if (user.role !== "ARTIST" && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || (user.role !== "ARTIST" && user.role !== "ADMIN")) {
    return <LoadingSpinner />;
  }

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    profile: <ProfilTab />,
    subscription: <SubscriptionTab />,
    "upload-release": <UploadReleaseTab />,
    "upload-dubpack": <UploadDubpackTab />,
    "downloads-config": <DownloadsConfigTab />,
    revenue: <RevenueTab />,
    releases: <ReleasesTab />,
    analytics: <AdvancedAnalyticsTab />,
    broadcasts: <BroadcastsTab />,
    "private-links": <PrivateLinksTab />,
    "api-keys": <ApiKeysTab />,
    "engage-campaigns": <EngageCampaignsTab />
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-cream">Artist Dashboard</h1>
        <p className="text-sm text-cream/50 mt-1">Manage your releases, revenue, and download settings.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)] pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors ${
              tab === t.id ? "border-b-2 border-violet text-cream" : "text-cream/50 hover:text-cream"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {TAB_CONTENT[tab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
