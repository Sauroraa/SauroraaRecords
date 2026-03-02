"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import type { ArtistProfile } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export default function AgencyDashboard() {
  const { user } = useAuthStore();
  const [agency, setAgency] = useState<{ id: string; name: string | null; artists: ArtistProfile[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/agency/me`, { credentials: "include" });
        if (res.ok) {
          setAgency(await res.json());
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const addArtist = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/agency/artist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add artist");
      }
      const added = await res.json();
      toast.success("Artist added");
      setAgency((prev) => prev ? { ...prev, artists: [...prev.artists, added] } : prev);
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add artist");
    } finally {
      setAdding(false);
    }
  };

  const removeArtist = async (artistId: string) => {
    try {
      const res = await fetch(`${API}/agency/artist/${artistId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setAgency((prev) => prev ? { ...prev, artists: prev.artists.filter((a) => a.id !== artistId) } : prev);
        toast.success("Artist removed");
      }
    } catch {
      toast.error("Unable to remove artist");
    }
  };

  if (!user || user.role !== "AGENCY") {
    return <p className="text-cream">Access denied.</p>;
  }

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-cream">Agency Dashboard</h1>
      <p className="text-sm text-cream/50">Manage the artists linked to your agency.</p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Artist email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Button onClick={addArtist} disabled={adding}>{adding ? "Adding..." : "Add Artist"}</Button>
        </div>
      </div>

      {agency?.artists && agency.artists.length > 0 ? (
        <div className="space-y-2">
          {agency.artists.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-3.5"
            >
              <div>
                <p className="text-sm text-cream">{a.displayName ?? a.user?.email ?? "Artist"}</p>
                <p className="text-xs text-cream/40">{a.user?.email}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void removeArtist(a.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-cream/60">No artists added yet.</p>
      )}
    </div>
  );
}
