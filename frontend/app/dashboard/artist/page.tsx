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
  Plus,
  ToggleLeft,
  ToggleRight,
  Check,
  CreditCard
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
  | "subscription"
  | "upload-release"
  | "upload-dubpack"
  | "downloads-config"
  | "revenue"
  | "releases";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="h-4 w-4" /> },
  { id: "upload-release", label: "Upload Release", icon: <Upload className="h-4 w-4" /> },
  { id: "upload-dubpack", label: "Upload Dubpack", icon: <Archive className="h-4 w-4" /> },
  { id: "downloads-config", label: "Downloads Config", icon: <Settings2 className="h-4 w-4" /> },
  { id: "revenue", label: "Revenue", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "releases", label: "My Releases", icon: <Disc3 className="h-4 w-4" /> }
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

function SubscriptionTab() {
  const [sub, setSub] = useState<{ id: string; plan: string; status: string; currentPeriodEnd?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/subscriptions/me`, { credentials: "include" });
        if (res.ok) {
          setSub(await res.json());
        }
      } catch {} finally {
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
        toast.success("Subscription canceled");
      } else {
        toast.error("Could not cancel subscription");
      }
    } catch {
      toast.error("Could not cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <p>Loading subscription...</p>;
  }

  if (!sub) {
    return (
      <div className="space-y-4">
        <p>You do not currently have an active plan.</p>
        <Button asChild>
          <a href="/pricing">Choose a plan</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p>Your current plan: <strong>{sub.plan}</strong></p>
      <p>Status: {sub.status}</p>
      {sub.currentPeriodEnd && <p>Expires: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>}
      {sub.status === "active" && (
        <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
          {canceling ? "Canceling…" : "Cancel subscription"}
        </Button>
      )}
    </div>
  );
}

// ─── Upload Release ────────────────────────────────────────────────────────────

function UploadReleaseTab() {
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "0", type: "FREE", previewClip: "" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragAudio, setDragAudio] = useState(false);
  const [dragCover, setDragCover] = useState(false);

  const uploadFile = async (file: File, route: string): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/upload/${route}`, {
      method: "POST",
      credentials: "include",
      body: fd
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { path: string };
    return data.path;
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !audioFile) {
      toast.error("Title and audio file are required");
      return;
    }
    setUploading(true);
    try {
      const [audioPath, coverPath] = await Promise.all([
        uploadFile(audioFile, "audio"),
        coverFile ? uploadFile(coverFile, "cover") : Promise.resolve(undefined)
      ]);
      const res = await fetch(`${API}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          price: parseFloat(form.price) || 0,
          type: form.type,
          audioPath,
          coverPath,
          previewClip: form.previewClip || undefined
        })
      });
      if (!res.ok) throw new Error("Failed to create release");
      toast.success("Release created! Pending admin approval.");
      setForm({ title: "", description: "", price: "0", type: "FREE", previewClip: "" });
      setAudioFile(null);
      setCoverFile(null);
    } catch {
      toast.error("Failed to upload release");
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
      </div>

      <Button onClick={() => void handleSubmit()} disabled={uploading} className="w-full">
        {uploading ? "Uploading..." : "Submit Release"}
      </Button>
    </div>
  );
}

// ─── Upload Dubpack ────────────────────────────────────────────────────────────

function UploadDubpackTab() {
  const zipRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "0", type: "FREE" });
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
        body: JSON.stringify({ title: form.title, description: form.description || undefined, price: parseFloat(form.price) || 0, type: form.type, zipPath, coverPath })
      });
      if (!res.ok) throw new Error();
      toast.success("Dubpack submitted! Pending admin approval.");
      setForm({ title: "", description: "", price: "0", type: "FREE" });
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-violet border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ArtistDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (user && user.role !== "ARTIST" && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    subscription: <SubscriptionTab />,
    "upload-release": <UploadReleaseTab />,
    "upload-dubpack": <UploadDubpackTab />,
    "downloads-config": <DownloadsConfigTab />,
    revenue: <RevenueTab />,
    releases: <ReleasesTab />
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
