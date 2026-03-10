"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Headphones, MessageCircle, AlertTriangle, ShieldAlert,
  Search, Trash2, Send, Clock, Shield, X, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type Tab = "support" | "comments" | "warnings" | "strikes";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "support", label: "Support", icon: <Headphones className="h-4 w-4" /> },
  { id: "comments", label: "Commentaires", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "warnings", label: "Warnings", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "strikes", label: "Strikes", icon: <ShieldAlert className="h-4 w-4" /> },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string | null;
  createdAt: string;
  user: { id: string; email: string };
  _count?: { messages: number };
};

type SupportMessage = {
  id: string;
  authorType: string;
  body: string;
  createdAt: string;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user?: { id: string; email: string; firstName?: string | null; lastName?: string | null } | null;
  author?: { id: string; email: string } | null;
  release?: { id: string; title: string; slug: string } | null;
  dubpack?: { id: string; title: string; slug: string } | null;
};

type StrikeUser = {
  id: string;
  email: string;
  role: string;
  strikeCount?: number;
  suspended?: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-green-400 bg-green-400/10 border-green-400/30",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  WAITING_USER: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  RESOLVED: "text-cream/40 bg-surface2 border-[rgba(255,255,255,0.08)]",
  CLOSED: "text-cream/25 bg-surface2 border-[rgba(255,255,255,0.06)]",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-cream/40",
  NORMAL: "text-cream/60",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

// ─── Loading ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet border-t-transparent" />
    </div>
  );
}

// ─── Support Tab ───────────────────────────────────────────────────────────────

function StaffSupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("OPEN");

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`${API}/support/tickets/queue?status=${statusFilter}`, { credentials: "include" });
        if (res.ok) setTickets(await res.json() as SupportTicket[]);
      } catch {}
      setLoading(false);
    })();
  }, [statusFilter]);

  const openTicket = async (id: string) => {
    setSelectedId(id);
    try {
      const res = await fetch(`${API}/support/tickets/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { messages: SupportMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch {}
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/support/tickets/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: reply }),
      });
      if (res.ok) {
        const data = await res.json() as { messages: SupportMessage[] };
        setMessages(data.messages ?? []);
        setReply("");
        toast.success("Réponse envoyée !");
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSending(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API}/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      if (selectedId === id && status === "CLOSED") setSelectedId(null);
      toast.success(`Ticket ${status.toLowerCase()}`);
    } catch {
      toast.error("Erreur");
    }
  };

  const selected = tickets.find((t) => t.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface p-1">
          {["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setSelectedId(null); }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-violet text-white" : "text-cream/50 hover:text-cream"
              }`}
            >
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
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
            ))
          ) : tickets.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface">
              <p className="text-sm text-cream/30">Aucun ticket</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => void openTicket(ticket.id)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  selectedId === ticket.id
                    ? "border-violet/40 bg-violet/10"
                    : "border-[rgba(255,255,255,0.06)] bg-surface hover:border-violet/20"
                }`}
              >
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
            ))
          )}
        </div>

        {/* Ticket detail */}
        {selected ? (
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface flex flex-col" style={{ maxHeight: 600 }}>
            <div className="border-b border-[rgba(255,255,255,0.08)] p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-cream">{selected.subject}</p>
                  <p className="text-xs text-cream/40 mt-0.5">{selected.user.email} · {selected.category ?? "Général"}</p>
                </div>
                <select
                  value={selected.status}
                  onChange={(e) => void updateStatus(selected.id, e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-surface2 px-2 py-1 text-xs text-cream outline-none"
                >
                  {["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-cream/30">
                Délai de réponse cible : 24–48h · Ouvert le {new Date(selected.createdAt).toLocaleDateString("fr-BE")}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.authorType === "AGENT" ? "flex-row-reverse" : ""}`}>
                  <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    msg.authorType === "AGENT" ? "bg-violet/30 text-violet-light" : "bg-surface2 text-cream/40"
                  }`}>
                    {msg.authorType === "AGENT" ? "S" : "U"}
                  </div>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.authorType === "AGENT" ? "bg-violet/15 text-cream/90" : "bg-black/30 text-cream/75"
                  }`}>
                    <p className="leading-relaxed">{msg.body}</p>
                    <p className="mt-1 text-[10px] text-cream/30">
                      {new Date(msg.createdAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-cream/30 text-center py-4">Aucun message encore.</p>
              )}
            </div>

            {!["RESOLVED", "CLOSED"].includes(selected.status) && (
              <div className="border-t border-[rgba(255,255,255,0.08)] p-3 flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Répondre au ticket..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface2 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-violet/40"
                />
                <button
                  onClick={() => void sendReply()}
                  disabled={sending || !reply.trim()}
                  className="self-end rounded-xl bg-violet px-3 py-2 text-sm font-medium text-white hover:bg-violet-hover transition-colors disabled:opacity-40"
                >
                  {sending ? "..." : "Envoyer"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex h-64 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface">
            <p className="text-sm text-cream/25">Sélectionnez un ticket</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Comments Tab ──────────────────────────────────────────────────────────────

function StaffCommentsTab() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/admin/comments`, { credentials: "include" });
        if (res.ok) {
          setComments(await res.json() as Comment[]);
        } else {
          // Fallback: try general comments endpoint
          const res2 = await fetch(`${API}/comments?limit=100`, { credentials: "include" });
          if (res2.ok) setComments(await res2.json() as Comment[]);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const deleteComment = async (id: string) => {
    try {
      const res = await fetch(`${API}/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        toast.success("Commentaire supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const filtered = comments.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.body.toLowerCase().includes(q) ||
      (c.user?.email ?? c.author?.email ?? "").toLowerCase().includes(q) ||
      (c.release?.title ?? "").toLowerCase().includes(q) ||
      (c.dubpack?.title ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
        <Input
          placeholder="Rechercher dans les commentaires..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface">
            <p className="text-sm text-cream/30">Aucun commentaire trouvé</p>
          </div>
        ) : (
          filtered.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-violet-light truncate">
                    {comment.user?.email ?? comment.author?.email ?? "Anonyme"}
                  </p>
                  {comment.release && (
                    <>
                      <span className="text-cream/20">·</span>
                      <p className="text-xs text-cream/40 truncate">sur {comment.release.title}</p>
                    </>
                  )}
                  {comment.dubpack && (
                    <>
                      <span className="text-cream/20">·</span>
                      <p className="text-xs text-cream/40 truncate">sur dubpack {comment.dubpack.title}</p>
                    </>
                  )}
                  <span className="text-cream/20">·</span>
                  <p className="text-xs text-cream/30">
                    {new Date(comment.createdAt).toLocaleDateString("fr-BE")}
                  </p>
                </div>
                <p className="text-sm text-cream/80 line-clamp-3">{comment.body}</p>
              </div>
              <button
                onClick={() => void deleteComment(comment.id)}
                title="Supprimer"
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Warnings Tab ──────────────────────────────────────────────────────────────

type WarnUser = { id: string; email: string; role: string };

function StaffWarningsTab() {
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<WarnUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<WarnUser | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API}/admin/users?search=${encodeURIComponent(userSearch)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json() as WarnUser[];
        setSearchResults(data.slice(0, 10));
      }
    } catch {}
    setSearching(false);
  };

  const sendWarning = async () => {
    if (!selectedUser || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/users/${selectedUser.id}/warn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
      });
      if (res.ok || res.status === 201) {
        toast.success(`Avertissement envoyé à ${selectedUser.email}`);
        setMessage("");
        setSelectedUser(null);
        setSearchResults([]);
        setUserSearch("");
      } else {
        // Endpoint might not exist yet — graceful fallback
        toast.error("Endpoint non disponible (POST /users/:id/warn)");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Envoyer un avertissement
        </h3>

        {/* User search */}
        <div className="space-y-2">
          <label className="text-xs text-cream/50">Rechercher un utilisateur par email</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
              <Input
                placeholder="email@exemple.com"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void searchUsers()}
                className="pl-9"
              />
            </div>
            <Button onClick={() => void searchUsers()} disabled={searching} variant="outline" size="sm">
              {searching ? "..." : "Chercher"}
            </Button>
          </div>

          {searchResults.length > 0 && !selectedUser && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface2 overflow-hidden">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setSearchResults([]); setUserSearch(u.email); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-violet/10 transition-colors border-b border-[rgba(255,255,255,0.05)] last:border-0"
                >
                  <span className="text-sm text-cream">{u.email}</span>
                  <span className="text-xs text-cream/40">{u.role}</span>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <span className="text-sm text-amber-300 flex-1">{selectedUser.email}</span>
              <button onClick={() => { setSelectedUser(null); setUserSearch(""); }} className="text-cream/30 hover:text-cream">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Warning message */}
        <div className="space-y-2">
          <label className="text-xs text-cream/50">Message d&apos;avertissement</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez la raison de l'avertissement..."
            rows={4}
            className="w-full resize-none rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface2 px-3 py-2 text-sm text-cream placeholder-cream/25 outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>

        <Button
          onClick={() => void sendWarning()}
          disabled={sending || !selectedUser || !message.trim()}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? "Envoi..." : "Envoyer l'avertissement"}
        </Button>
      </div>

      <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-surface/50 p-4">
        <p className="text-xs text-cream/30">
          Les avertissements sont enregistrés dans le profil de l&apos;utilisateur et lui sont communiqués par email.
          Après 3 avertissements, un strike peut être appliqué.
        </p>
      </div>
    </div>
  );
}

// ─── Strikes Tab ───────────────────────────────────────────────────────────────

type StrikeEntry = {
  id: string;
  email: string;
  role: string;
  strikeCount: number;
  suspended: boolean;
  warningCount?: number;
  suspensionReason?: string | null;
};

function StaffStrikesTab() {
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<StrikeEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<StrikeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users?search=${encodeURIComponent(userSearch)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json() as StrikeEntry[];
        setSearchResults(
          data.slice(0, 10).map((u) => ({
            ...u,
            strikeCount: (u as any).strikeCount ?? 0,
            suspended: (u as any).suspended ?? false,
          }))
        );
      }
    } catch {}
    setLoading(false);
  };

  const giveStrike = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users/${selectedUser.id}/strike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok || res.status === 201) {
        const updated = await res.json() as StrikeEntry;
        setSelectedUser(updated);
        setSearchResults((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...updated } : u));
        toast.success(`Strike donné à ${selectedUser.email} (${updated.strikeCount}/3)`);
        if (updated.suspended) toast.error("Compte suspendu automatiquement (3 strikes)");
      } else {
        toast.error("Impossible d'appliquer le strike");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSubmitting(false);
  };

  const revokeStrike = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users/${selectedUser.id}/strike`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        const updated = await res.json() as StrikeEntry;
        setSelectedUser(updated);
        setSearchResults((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...updated } : u));
        toast.success(`Strike retiré de ${selectedUser.email}`);
      } else {
        toast.error("Erreur lors de la révocation");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSubmitting(false);
  };

  const toggleSuspension = async (suspended: boolean) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users/${selectedUser.id}/suspension`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          suspended,
          reason: suspended ? "Suspension manuelle staff" : ""
        }),
      });
      if (res.ok) {
        const updated = await res.json() as StrikeEntry;
        setSelectedUser(updated);
        setSearchResults((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        toast.success(suspended ? "Compte suspendu" : "Compte réactivé");
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSubmitting(false);
  };

  const StrikeIndicator = ({ count }: { count: number }) => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full border-2 transition-colors ${
            i < count
              ? "bg-red-500 border-red-400"
              : "bg-transparent border-cream/20"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
        <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          Gestion des strikes
        </h3>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/30" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void searchUsers()}
              className="pl-9"
            />
          </div>
          <Button onClick={() => void searchUsers()} disabled={loading} variant="outline" size="sm">
            {loading ? "..." : "Chercher"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  selectedUser?.id === u.id
                    ? "border-violet/40 bg-violet/10"
                    : "border-[rgba(255,255,255,0.06)] bg-surface2 hover:border-violet/20"
                }`}
              >
                <div>
                  <p className="text-sm text-cream">{u.email}</p>
                  <p className="text-xs text-cream/40">{u.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StrikeIndicator count={u.strikeCount} />
                  {u.suspended && (
                    <span className="rounded border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                      SUSPENDU
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected user actions */}
      {selectedUser && (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-cream">{selectedUser.email}</p>
              <p className="text-xs text-cream/40">{selectedUser.role}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-cream/30 hover:text-cream">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Strike display */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-xs text-cream/50">Strikes actuels</p>
              <div className="flex items-center gap-3">
                <StrikeIndicator count={selectedUser.strikeCount} />
                <span className="text-sm font-semibold text-cream">{selectedUser.strikeCount} / 3</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-cream/50">Warnings</p>
              <p className="text-sm font-semibold text-cream">{selectedUser.warningCount ?? 0}</p>
            </div>
            {selectedUser.suspended && (
              <span className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">
                Compte suspendu
              </span>
            )}
          </div>

          {selectedUser.strikeCount >= 3 && !selectedUser.suspended && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-300">3 strikes atteints — compte automatiquement suspendu.</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => void giveStrike()}
              disabled={submitting || selectedUser.strikeCount >= 3}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <ShieldAlert className="h-4 w-4" />
              {submitting ? "..." : "Donner un strike"}
            </Button>
            {selectedUser.strikeCount > 0 && (
              <Button
                onClick={() => void revokeStrike()}
                disabled={submitting}
                variant="outline"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Retirer un strike
              </Button>
            )}
            <Button
              onClick={() => void toggleSuspension(!selectedUser.suspended)}
              disabled={submitting}
              variant="outline"
            >
              {selectedUser.suspended ? "Réactiver le compte" : "Suspendre le compte"}
            </Button>
          </div>

          <p className="text-[10px] text-cream/25">
            À 3 strikes, le compte est suspendu automatiquement. Un strike peut être retiré en cas d&apos;erreur.
            {selectedUser.suspensionReason ? ` Raison: ${selectedUser.suspensionReason}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("support");

  useEffect(() => {
    if (user && user.role !== "STAFF" && user.role !== "ADMIN") {
      void router.replace("/");
    }
  }, [user, router]);

  if (!user) return <LoadingSpinner />;

  if (user.role !== "STAFF" && user.role !== "ADMIN") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-cream/50">Accès refusé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-red-400" />
          <h1 className="text-3xl font-bold text-cream">Staff Dashboard</h1>
        </div>
        <p className="mt-1 text-sm text-cream/50">
          Modération, support et gestion des utilisateurs — {user.email}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-sm border border-[rgba(255,255,255,0.08)] bg-surface p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm transition-colors ${
              tab === t.id ? "bg-violet text-white" : "text-cream/50 hover:text-cream"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "support" && <StaffSupportTab />}
        {tab === "comments" && <StaffCommentsTab />}
        {tab === "warnings" && <StaffWarningsTab />}
        {tab === "strikes" && <StaffStrikesTab />}
      </div>
    </div>
  );
}
