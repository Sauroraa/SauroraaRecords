"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disc3, Users, TrendingUp, FileText, Tag, Trophy,
  Check, X, Search, Plus, Trash2, Edit3, Crown,
  Building2, Mail, CreditCard, BadgeCheck, Music2, Headphones, MessageCircle, Clock, AlertCircle, CheckCircle2, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ReleaseItem, DubpackItem, RankingItem } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab = "releases" | "artists" | "users" | "agencies" | "subscriptions" | "revenue" | "invoices" | "promo-codes" | "rankings" | "support";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "releases", label: "Releases", icon: <Disc3 className="h-4 w-4" /> },
  { id: "artists", label: "Artistes", icon: <Music2 className="h-4 w-4" /> },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "agencies", label: "Agences", icon: <Building2 className="h-4 w-4" /> },
  { id: "subscriptions", label: "Abonnements", icon: <CreditCard className="h-4 w-4" /> },
  { id: "revenue", label: "Revenue", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "invoices", label: "Invoices", icon: <FileText className="h-4 w-4" /> },
  { id: "promo-codes", label: "Promo Codes", icon: <Tag className="h-4 w-4" /> },
  { id: "rankings", label: "Rankings", icon: <Trophy className="h-4 w-4" /> },
  { id: "support", label: "Support", icon: <Headphones className="h-4 w-4" /> }
];

// ─── Releases ─────────────────────────────────────────────────────────────────

type AdminRelease = ReleaseItem & { type: "release" | "dubpack" };

function ReleasesTab() {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [dubpacks, setDubpacks] = useState<DubpackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  useEffect(() => {
    void (async () => {
      try {
        const [rRes, dRes] = await Promise.all([
          fetch(`${API}/releases/all`, { credentials: "include" }),
          fetch(`${API}/dubpacks/all`, { credentials: "include" })
        ]);
        if (rRes.ok) setReleases((await rRes.json()) as ReleaseItem[]);
        if (dRes.ok) setDubpacks((await dRes.json()) as DubpackItem[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const publish = async (id: string, type: "release" | "dubpack", publish: boolean) => {
    const endpoint = type === "release" ? `${API}/releases/${id}` : `${API}/dubpacks/${id}`;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ published: publish })
    });
    if (type === "release") {
      setReleases((prev) => prev.map((r) => r.id === id ? { ...r, published: publish } : r));
    } else {
      setDubpacks((prev) => prev.map((d) => d.id === id ? { ...d, published: publish } : d));
    }
    toast.success(publish ? "Published" : "Unpublished");
  };

  const allItems = [
    ...releases.map((r) => ({ ...r, _type: "release" as const })),
    ...dubpacks.map((d) => ({ ...d, _type: "dubpack" as const }))
  ].filter((i) => filter === "all" || !i.published);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Stats + filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === "pending" ? "bg-violet text-white" : "text-cream/50 hover:text-cream"}`}
          >
            Pending ({releases.filter((r) => !r.published).length + dubpacks.filter((d) => !d.published).length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${filter === "all" ? "bg-violet text-white" : "text-cream/50 hover:text-cream"}`}
          >
            All ({releases.length + dubpacks.length})
          </button>
        </div>
      </div>

      {!allItems.length ? (
        <EmptyState message={filter === "pending" ? "No pending releases" : "No releases found"} />
      ) : allItems.map((item) => {
        const artistName = item.artist?.displayName ?? item.artist?.user?.email?.split("@")[0] ?? "Unknown";
        return (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-cream">{item.title}</span>
                {item._type === "dubpack" && <Badge variant="violet">DUBPACK</Badge>}
                <Badge variant={item.published ? "green" : "gray"}>
                  {item.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-xs text-cream/40 mt-0.5">{artistName} · {item.type}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!item.published ? (
                <Button size="sm" onClick={() => void publish(item.id, item._type, true)} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => void publish(item.id, item._type, false)} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Unpublish
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Artists ───────────────────────────────────────────────────────────────────

type AdminArtist = {
  id: string;
  displayName: string | null;
  isVerified: boolean;
  user: { email: string };
  _count: { releases: number; followers: number };
};

function ArtistsTab() {
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/artists`, { credentials: "include" });
        if (res.ok) setArtists((await res.json()) as AdminArtist[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggleVerify = async (artist: AdminArtist) => {
    try {
      const res = await fetch(`${API}/admin/artists/${artist.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verified: !artist.isVerified })
      });
      if (!res.ok) throw new Error();
      setArtists((prev) => prev.map((a) => a.id === artist.id ? { ...a, isVerified: !artist.isVerified } : a));
      toast.success(artist.isVerified ? "Badge retiré" : "Compte vérifié !");
    } catch {
      toast.error("Erreur");
    }
  };

  const filtered = artists.filter((a) => {
    const q = search.toLowerCase();
    return (a.displayName ?? a.user.email).toLowerCase().includes(q) || a.user.email.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
        <Input placeholder="Rechercher un artiste..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? <EmptyState message="Aucun artiste trouvé" /> : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-cream truncate">{a.displayName ?? a.user.email}</p>
                  {a.isVerified && <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />}
                </div>
                <p className="text-xs text-cream/40">{a.user.email} · {a._count.releases} releases · {a._count.followers} followers</p>
              </div>
              <Button
                size="sm"
                variant={a.isVerified ? "outline" : "default"}
                onClick={() => void toggleVerify(a)}
                className="gap-1.5 shrink-0"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                {a.isVerified ? "Retirer badge" : "Vérifier"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Users ─────────────────────────────────────────────────────────────────────

type AdminUser = { id: string; email: string; role: string; createdAt: string; _count?: { orders: number } };

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/users`, { credentials: "include" });
        if (res.ok) setUsers((await res.json()) as AdminUser[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const changeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as AdminUser;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: updated.role } : u));
      toast.success("Role updated");
    } catch {
      toast.error("Role update failed");
    }
  };

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cream truncate">{u.email}</p>
              <p className="text-xs text-cream/40">
                Joined {new Date(u.createdAt).toLocaleDateString()} · {u._count?.orders ?? 0} orders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  u.role === "ADMIN"
                    ? "violet"
                    : u.role === "ARTIST"
                    ? "green"
                    : u.role === "AGENCY"
                    ? "orange"
                    : u.role === "STAFF"
                    ? "gray"
                    : "gray"
                }
              >
                {u.role}
              </Badge>
              <button
                onClick={() => void changeRole(u.id, u.role === "STAFF" ? "CLIENT" : "STAFF")}
                title={u.role === "STAFF" ? "Révoquer Staff" : "Accorder Staff"}
                className={`rounded-[6px] border px-2 py-1 text-xs font-medium transition-colors ${
                  u.role === "STAFF"
                    ? "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    : "border-[rgba(255,255,255,0.12)] bg-surface2 text-cream/50 hover:text-cream hover:border-red-500/30"
                }`}
              >
                {u.role === "STAFF" ? "- Staff" : "+ Staff"}
              </button>
              <select
                value={u.role}
                onChange={(e) => void changeRole(u.id, e.target.value)}
                className="text-xs rounded-[6px] border border-[rgba(255,255,255,0.12)] bg-surface2 px-2 py-1 text-cream/70 focus:outline-none"
              >
                <option value="CLIENT">CLIENT</option>
                <option value="ARTIST">ARTIST</option>
                <option value="ADMIN">ADMIN</option>
                <option value="AGENCY">AGENCY</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Revenue ───────────────────────────────────────────────────────────────────

type RevenueRow = { artistId: string; artistName: string; gross: number; net: number; label: number; month: string };

function AdminRevenueTab() {
  const [data, setData] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/revenue`, { credentials: "include" });
        if (res.ok) setData((await res.json()) as RevenueRow[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const totalLabel = data.reduce((s, r) => s + r.label, 0);
  const totalGross = data.reduce((s, r) => s + r.gross, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
          <p className="text-xs text-cream/40">Total Gross</p>
          <p className="text-2xl font-bold text-cream mt-1">€{totalGross.toFixed(2)}</p>
        </div>
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
          <p className="text-xs text-cream/40">Label Share (30%)</p>
          <p className="text-2xl font-bold text-violet-light mt-1">€{totalLabel.toFixed(2)}</p>
        </div>
      </div>

      {!data.length ? (
        <EmptyState message="No revenue data yet" />
      ) : (
        <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 text-left text-xs text-cream/40 font-medium">Artist</th>
                <th className="px-4 py-3 text-left text-xs text-cream/40 font-medium">Month</th>
                <th className="px-4 py-3 text-right text-xs text-cream/40 font-medium">Gross</th>
                <th className="px-4 py-3 text-right text-xs text-cream/40 font-medium">Artist (70%)</th>
                <th className="px-4 py-3 text-right text-xs text-cream/40 font-medium">Label (30%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-4 py-3 text-cream/80">{r.artistName}</td>
                  <td className="px-4 py-3 text-cream/50">{r.month}</td>
                  <td className="px-4 py-3 text-right text-cream">€{Number(r.gross).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-cream/70">€{Number(r.net).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-violet-light">€{Number(r.label).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

type Invoice = { id: string; artistName: string; month: string; gross: number; net: number; status: "PENDING" | "PAID"; pdfUrl?: string };

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/invoices`, { credentials: "include" });
        if (res.ok) setInvoices((await res.json()) as Invoice[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const markPaid = async (id: string) => {
    await fetch(`${API}/admin/invoices/${id}/paid`, { method: "PATCH", credentials: "include" });
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "PAID" } : inv));
    toast.success("Marked as paid");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {!invoices.length ? (
        <EmptyState message="No invoices generated yet" />
      ) : invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
          <div>
            <p className="text-sm font-medium text-cream">{inv.artistName}</p>
            <p className="text-xs text-cream/40">{inv.month} · €{Number(inv.gross).toFixed(2)} gross</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={inv.status === "PAID" ? "green" : "gray"}>{inv.status}</Badge>
            {inv.pdfUrl && (
              <Button size="sm" variant="ghost" asChild>
                <a href={inv.pdfUrl} target="_blank" rel="noreferrer">PDF</a>
              </Button>
            )}
            {inv.status === "PENDING" && (
              <Button size="sm" onClick={() => void markPaid(inv.id)}>
                Mark Paid
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Promo Codes ───────────────────────────────────────────────────────────────

type PromoCode = { id: string; code: string; discount: number; maxUses: number; uses: number; expiresAt: string | null };

function PromoCodesTab() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", discount: "10", maxUses: "100" });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/promo-codes`, { credentials: "include" });
        if (res.ok) setCodes((await res.json()) as PromoCode[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/promo-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: form.code.toUpperCase(), discount: parseInt(form.discount), maxUses: parseInt(form.maxUses) })
      });
      if (!res.ok) throw new Error();
      const newCode = (await res.json()) as PromoCode;
      setCodes((prev) => [newCode, ...prev]);
      setForm({ code: "", discount: "10", maxUses: "100" });
      toast.success("Promo code created");
    } catch {
      toast.error("Failed to create promo code");
    } finally {
      setCreating(false);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await fetch(`${API}/promo-codes/${id}`, { method: "DELETE", credentials: "include" });
    setCodes((prev) => prev.filter((c) => c.id !== id));
    toast.success("Deleted");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-3">
        <p className="text-sm font-medium text-cream">Create Promo Code</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-cream/50">Code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-cream/50">Discount (%)</label>
            <Input type="number" min="1" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-cream/50">Max Uses</label>
            <Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </div>
        </div>
        <Button onClick={() => void handleCreate()} disabled={creating} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Create
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {!codes.length ? (
          <EmptyState message="No promo codes yet" />
        ) : codes.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5 gap-4">
            <div>
              <span className="font-mono text-sm font-bold text-violet-light">{c.code}</span>
              <span className="ml-2 text-xs text-cream/50">{c.discount}% off · {c.uses}/{c.maxUses} uses</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void deleteCode(c.id)} className="text-red-400 hover:text-red-300 h-8 px-2">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

function RankingsAdminTab() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/rankings?month=${month}`, { credentials: "include" });
        if (res.ok) setRankings((await res.json()) as RankingItem[]);
        else setRankings([]);
      } catch {}
      setLoading(false);
    })();
  }, [month]);

  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-cream/50">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-surface px-3 py-1.5 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-violet/50"
        />
      </div>

      {loading ? <LoadingSpinner /> : !rankings.length ? (
        <EmptyState message="No rankings data for this month" />
      ) : (
        <div className="space-y-2">
          {rankings.map((r) => {
            const name = r.artist.displayName ?? r.artist.user?.email?.split("@")[0] ?? "Artist";
            return (
              <div key={r.id} className="flex items-center gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
                <span className="text-xl w-8 text-center">{MEDAL[r.rank - 1] ?? `#${r.rank}`}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream">{name}</p>
                  <p className="text-xs text-cream/40">{r.totalDownloads} downloads</p>
                </div>
                <p className="text-sm font-bold text-violet-light">€{Number(r.totalRevenue).toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Agencies ──────────────────────────────────────────────────────────────────

type AdminAgency = {
  id: string;
  displayName: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null; createdAt: string };
  _count: { artists: number; invitations: number };
};

function AgenciesTab() {
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/agencies`, { credentials: "include" });
        if (res.ok) setAgencies((await res.json()) as AdminAgency[]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const startEdit = (ag: AdminAgency) => {
    setEditing(ag.id);
    setEditName(ag.displayName ?? "");
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`${API}/admin/agencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: editName })
      });
      if (!res.ok) throw new Error();
      setAgencies((prev) => prev.map((a) => a.id === id ? { ...a, displayName: editName } : a));
      toast.success("Agence mise à jour");
    } catch {
      toast.error("Erreur");
    } finally {
      setEditing(null);
    }
  };

  const deleteAgency = async (id: string, name: string | null) => {
    if (!confirm(`Supprimer l'agence "${name ?? id}" ? Le compte sera rétrogradé en CLIENT.`)) return;
    try {
      const res = await fetch(`${API}/admin/agencies/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setAgencies((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agence supprimée");
    } catch {
      toast.error("Erreur");
    }
  };

  const filtered = agencies.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.displayName?.toLowerCase().includes(q) ?? false) ||
      a.user.email.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
          <Input
            placeholder="Rechercher une agence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="shrink-0 text-xs text-cream/40">{agencies.length} agence{agencies.length !== 1 ? "s" : ""}</span>
      </div>

      {!filtered.length ? (
        <EmptyState message="Aucune agence enregistrée" />
      ) : (
        <div className="space-y-3">
          {filtered.map((ag) => (
            <div
              key={ag.id}
              className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-violet-900/40 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    {editing === ag.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && void saveEdit(ag.id)}
                          className="h-7 text-sm py-0 w-48"
                          autoFocus
                        />
                        <Button size="sm" className="h-7 px-2" onClick={() => void saveEdit(ag.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <p className="font-semibold text-cream">
                        {ag.displayName ?? <span className="text-cream/30 italic">Sans nom</span>}
                      </p>
                    )}
                    <p className="text-xs text-cream/40 mt-0.5">{ag.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-cream/40 hover:text-cream"
                    onClick={() => startEdit(ag)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-cream/30 hover:text-red-400"
                    onClick={() => void deleteAgency(ag.id, ag.displayName)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                  <Users className="h-3 w-3 text-violet-400" />
                  <span className="text-xs text-cream/60">{ag._count.artists} artiste{ag._count.artists !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                  <Mail className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-cream/60">{ag._count.invitations} invitation{ag._count.invitations !== 1 ? "s" : ""} en attente</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1">
                  <span className="text-xs text-cream/30">
                    Depuis {new Date(ag.createdAt).toLocaleDateString("fr-BE")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

const PLANS = ["ARTIST_FREE", "ARTIST_BASIC", "ARTIST_PRO", "AGENCY_START", "AGENCY_PRO"];

type AdminSub = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
  createdAt: string;
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null; role: string };
};

function SubscriptionsTab() {
  const [subs, setSubs] = useState<AdminSub[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ userId: "", plan: "ARTIST_BASIC" });
  const [users, setUsers] = useState<{ id: string; email: string; role: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [subRes, userRes] = await Promise.all([
          fetch(`${API}/admin/subscriptions`, { credentials: "include" }),
          fetch(`${API}/admin/users`, { credentials: "include" })
        ]);
        if (subRes.ok) setSubs((await subRes.json()) as AdminSub[]);
        if (userRes.ok) setUsers((await userRes.json()) as typeof users);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const changePlan = async (userId: string, plan: string) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan })
      });
      if (!res.ok) throw new Error();
      setSubs((prev) => prev.map((s) => s.userId === userId ? { ...s, plan } : s));
      toast.success("Plan mis à jour");
    } catch {
      toast.error("Erreur");
    }
  };

  const cancelSub = async (userId: string) => {
    if (!confirm("Annuler cet abonnement ?")) return;
    try {
      const res = await fetch(`${API}/admin/users/${userId}/subscription`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      setSubs((prev) => prev.filter((s) => s.userId !== userId));
      toast.success("Abonnement annulé");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleAdd = async () => {
    if (!addForm.userId) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/admin/users/${addForm.userId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: addForm.plan })
      });
      if (!res.ok) throw new Error();
      const user = users.find((u) => u.id === addForm.userId);
      setSubs((prev) => {
        const exists = prev.find((s) => s.userId === addForm.userId);
        if (exists) return prev.map((s) => s.userId === addForm.userId ? { ...s, plan: addForm.plan } : s);
        return [{ id: Date.now().toString(), userId: addForm.userId, plan: addForm.plan, status: "active", createdAt: new Date().toISOString(), user: { id: addForm.userId, email: user?.email ?? "", role: user?.role ?? "", firstName: null, lastName: null } }, ...prev];
      });
      toast.success("Abonnement assigné");
      setAddForm({ userId: "", plan: "ARTIST_BASIC" });
    } catch {
      toast.error("Erreur");
    } finally {
      setAdding(false);
    }
  };

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase();
    return s.user.email.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Assign subscription */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-3">
        <p className="text-sm font-medium text-cream">Assigner un abonnement</p>
        <div className="flex gap-3 flex-wrap">
          <select
            value={addForm.userId}
            onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
            className="flex-1 min-w-0 rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-surface2 px-3 py-2 text-sm text-cream/80 focus:outline-none focus:ring-2 focus:ring-violet/50"
          >
            <option value="">Sélectionner un utilisateur…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
            ))}
          </select>
          <select
            value={addForm.plan}
            onChange={(e) => setAddForm({ ...addForm, plan: e.target.value })}
            className="rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-surface2 px-3 py-2 text-sm text-cream/80 focus:outline-none focus:ring-2 focus:ring-violet/50"
          >
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Button onClick={() => void handleAdd()} disabled={adding || !addForm.userId} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Assigner
          </Button>
        </div>
      </div>

      {/* Search + list */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
        <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {!filtered.length ? (
        <EmptyState message="Aucun abonnement actif" />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cream truncate">{s.user.email}</p>
                <p className="text-xs text-cream/40 mt-0.5">
                  {s.user.role} · depuis {new Date(s.createdAt).toLocaleDateString("fr-BE")}
                  {s.currentPeriodEnd ? ` · expire ${new Date(s.currentPeriodEnd).toLocaleDateString("fr-BE")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={s.plan}
                  onChange={(e) => void changePlan(s.userId, e.target.value)}
                  className="text-xs rounded-[6px] border border-[rgba(255,255,255,0.12)] bg-surface2 px-2 py-1 text-cream/70 focus:outline-none"
                >
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <Badge variant={s.status === "active" ? "green" : "gray"}>{s.status}</Badge>
                <Button size="sm" variant="ghost" onClick={() => void cancelSub(s.userId)} className="h-7 w-7 p-0 text-red-400/60 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-surface">
      <p className="text-sm text-cream/30">{message}</p>
    </div>
  );
}

// ─── Support Admin Tab ─────────────────────────────────────────────────────────

type SupportTicket = {
  id: string;
  subject: string;
  category?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; role: string };
  assignedTo?: { id: string; email: string } | null;
  _count?: { messages: number };
};

type SupportMessage = {
  id: string;
  authorType: string;
  body: string;
  createdAt: string;
  author?: { id: string; email: string; role: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-green-400 bg-green-400/10 border-green-400/30",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  WAITING_USER: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  RESOLVED: "text-cream/40 bg-surface2 border-[rgba(255,255,255,0.08)]",
  CLOSED: "text-cream/25 bg-surface2 border-[rgba(255,255,255,0.06)]"
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-cream/40",
  NORMAL: "text-cream/60",
  HIGH: "text-orange-400",
  URGENT: "text-red-400"
};

function SupportAdminTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("OPEN");

  useEffect(() => {
    void (async () => {
      const res = await fetch(`${API}/support/tickets/queue?status=${statusFilter}`, { credentials: "include" });
      if (res.ok) setTickets(await res.json() as SupportTicket[]);
      setLoading(false);
    })();
  }, [statusFilter]);

  const openTicket = async (id: string) => {
    setSelectedId(id);
    const res = await fetch(`${API}/support/tickets/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json() as { messages: SupportMessage[] };
      setMessages(data.messages ?? []);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/support/tickets/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: reply })
      });
      if (res.ok) {
        const data = await res.json() as { messages: SupportMessage[] };
        setMessages(data.messages ?? []);
        setReply("");
        toast.success("Réponse envoyée !");
      }
    } catch { toast.error("Erreur"); }
    setSending(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`${API}/support/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selectedId === id && status === "CLOSED") setSelectedId(null);
    toast.success(`Ticket ${status.toLowerCase()}`);
  };

  const selected = tickets.find(t => t.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface p-1">
          {["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setSelectedId(null); setLoading(true); }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-violet text-white" : "text-cream/50 hover:text-cream"
              }`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <p className="text-xs text-cream/40">{tickets.length} ticket(s)</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        {/* Ticket list */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />)
          ) : tickets.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface">
              <p className="text-sm text-cream/30">Aucun ticket</p>
            </div>
          ) : tickets.map(ticket => (
            <button key={ticket.id} onClick={() => void openTicket(ticket.id)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selectedId === ticket.id
                  ? "border-violet/40 bg-violet/10"
                  : "border-[rgba(255,255,255,0.06)] bg-surface hover:border-violet/20"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-cream line-clamp-1">{ticket.subject}</p>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[ticket.status] ?? ""}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-cream/40">{ticket.user.email}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-cream/30">
                <span className={PRIORITY_COLORS[ticket.priority]}>{ticket.priority}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{new Date(ticket.createdAt).toLocaleDateString("fr-BE")}</span>
                {(ticket._count?.messages ?? 0) > 0 && (
                  <><span>·</span><MessageCircle className="h-3 w-3" /><span>{ticket._count!.messages}</span></>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface flex flex-col" style={{ maxHeight: 600 }}>
            {/* Header */}
            <div className="border-b border-[rgba(255,255,255,0.08)] p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-cream">{selected.subject}</p>
                  <p className="text-xs text-cream/40 mt-0.5">{selected.user.email} · {selected.category ?? "Général"}</p>
                </div>
                <select
                  value={selected.status}
                  onChange={e => void updateStatus(selected.id, e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-surface2 px-2 py-1 text-xs text-cream outline-none"
                >
                  {["OPEN","IN_PROGRESS","WAITING_USER","RESOLVED","CLOSED"].map(s => (
                    <option key={s} value={s}>{s.replace("_"," ")}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-cream/30">
                Délai de réponse cible : 24–48h · Ouvert le {new Date(selected.createdAt).toLocaleDateString("fr-BE")}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.authorType === "AGENT" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    msg.authorType === "AGENT" ? "bg-violet/30 text-violet-light" : "bg-surface2 text-cream/40"
                  }`}>
                    {msg.authorType === "AGENT" ? "A" : "U"}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.authorType === "AGENT"
                      ? "bg-violet/15 text-cream/90"
                      : "bg-black/30 text-cream/75"
                  }`}>
                    <p className="leading-relaxed">{msg.body}</p>
                    <p className="mt-1 text-[10px] text-cream/30">{new Date(msg.createdAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-cream/30 text-center py-4">Aucun message encore.</p>}
            </div>

            {/* Reply */}
            {!["RESOLVED","CLOSED"].includes(selected.status) && (
              <div className="border-t border-[rgba(255,255,255,0.08)] p-3 flex gap-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Répondre au ticket... (24-48h garanti)"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface2 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-violet/40"
                />
                <button onClick={() => void sendReply()} disabled={sending || !reply.trim()}
                  className="self-end rounded-xl bg-violet px-3 py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors disabled:opacity-40">
                  {sending ? "..." : "Envoyer"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface">
            <div className="text-center">
              <Headphones className="mx-auto mb-2 h-8 w-8 text-cream/15" />
              <p className="text-sm text-cream/30">Sélectionne un ticket pour répondre</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("releases");

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    releases: <ReleasesTab />,
    artists: <ArtistsTab />,
    users: <UsersTab />,
    agencies: <AgenciesTab />,
    subscriptions: <SubscriptionsTab />,
    revenue: <AdminRevenueTab />,
    invoices: <InvoicesTab />,
    "promo-codes": <PromoCodesTab />,
    rankings: <RankingsAdminTab />,
    support: <SupportAdminTab />
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Crown className="h-7 w-7 text-violet-light" />
        <div>
          <h1 className="text-3xl font-bold text-cream">Admin Dashboard</h1>
          <p className="text-sm text-cream/50 mt-0.5">Manage the platform, moderate releases, and view revenue.</p>
        </div>
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
