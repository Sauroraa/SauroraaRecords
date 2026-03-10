"use client";

import { UserCheck, UserPlus, UserMinus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface FollowButtonProps {
  artistId: string;
  showCount?: boolean;
}

export function FollowButton({ artistId, showCount = true }: FollowButtonProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { data } = useQuery({
    queryKey: ["follow-status", artistId],
    queryFn: async () => {
      const res = await fetch(`${API}/follows/artist/${artistId}`, { credentials: "include" });
      if (!res.ok) return { count: 0, isFollowing: false };
      return res.json() as Promise<{ count: number; isFollowing: boolean }>;
    },
    staleTime: 10000
  });

  const isFollowing = data?.isFollowing ?? false;
  const count = data?.count ?? 0;

  const doToggle = async () => {
    if (!user) { toast.error("Connecte-toi pour suivre des artistes"); return; }
    setLoading(true);
    setConfirming(false);
    queryClient.setQueryData(["follow-status", artistId], {
      isFollowing: !isFollowing,
      count: isFollowing ? count - 1 : count + 1
    });
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${API}/follows/artist/${artistId}`, { method, credentials: "include" });
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ["follow-status", artistId] });
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      } else {
        queryClient.setQueryData(["follow-status", artistId], data);
      }
    } catch {
      queryClient.setQueryData(["follow-status", artistId], data);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!isFollowing) { void doToggle(); return; }
    // Show unfollow confirmation
    if (confirming) { void doToggle(); return; }
    setConfirming(true);
    // Auto-reset confirmation after 3s
    setTimeout(() => setConfirming(false), 3000);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); }}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
          confirming
            ? "bg-red-500/80 text-white hover:bg-red-500"
            : isFollowing
            ? hovering
              ? "bg-[rgba(255,255,255,0.08)] text-red-400 border border-red-400/30"
              : "bg-[rgba(255,255,255,0.08)] text-cream/70 border border-[rgba(255,255,255,0.15)]"
            : "bg-violet text-white hover:bg-violet-hover shadow-[0_0_16px_rgba(123,76,255,0.3)]"
        } disabled:opacity-50`}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : confirming ? (
          <><UserMinus className="h-4 w-4" /> Confirmer</>
        ) : isFollowing ? (
          hovering
            ? <><UserMinus className="h-4 w-4" /> Se désabonner</>
            : <><UserCheck className="h-4 w-4" /> Suivi</>
        ) : (
          <><UserPlus className="h-4 w-4" /> Suivre</>
        )}
      </button>

      {showCount && (
        <span className="text-sm text-cream/50">
          {count.toLocaleString()} follower{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
