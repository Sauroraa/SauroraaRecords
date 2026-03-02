"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disc3, Users, TrendingUp, FileText, Tag, Trophy,
  Check, X, Search, Plus, Trash2, Edit3, Crown
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ReleaseItem, DubpackItem, RankingItem } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab = "releases" | "users" | "revenue" | "invoices" | "promo-codes" | "rankings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "releases", label: "Releases", icon: <Disc3 className="h-4 w-4" /> },
  { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { id: "revenue", label: "Revenue", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "invoices", label: "Invoices", icon: <FileText className="h-4 w-4" /> },
  { id: "promo-codes", label: "Promo Codes", icon: <Tag className="h-4 w-4" /> },
  { id: "rankings", label: "Rankings", icon: <Trophy className="h-4 w-4" /> }
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
          fetch(`${API}/releases?admin=true`, { credentials: "include" }),
          fetch(`${API}/dubpacks?admin=true`, { credentials: "include" })
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
    await fetch(`${API}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role })
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    toast.success("Role updated");
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
    users: <UsersTab />,
    revenue: <AdminRevenueTab />,
    invoices: <InvoicesTab />,
    "promo-codes": <PromoCodesTab />,
    rankings: <RankingsAdminTab />
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
