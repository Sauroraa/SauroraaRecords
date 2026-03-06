"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "./ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface FollowButtonProps {
  artistId: string;
}

export function FollowButton({ artistId }: FollowButtonProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

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

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow artists");
      return;
    }
    setLoading(true);
    // Optimistic update
    queryClient.setQueryData(["follow-status", artistId], {
      isFollowing: !isFollowing,
      count: isFollowing ? count - 1 : count + 1
    });
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${API}/follows/artist/${artistId}`, {
        method,
        credentials: "include"
      });
      if (res.ok) {
        // Refetch to get authoritative count from server
        void queryClient.invalidateQueries({ queryKey: ["follow-status", artistId] });
        toast.success(isFollowing ? "Unfollowed" : "Following!");
      } else {
        // Revert optimistic update
        queryClient.setQueryData(["follow-status", artistId], data);
      }
    } catch {
      queryClient.setQueryData(["follow-status", artistId], data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        onClick={() => void toggle()}
        disabled={loading}
        className="gap-1.5"
      >
        {isFollowing ? (
          <><UserCheck className="h-4 w-4" /> Following</>
        ) : (
          <><UserPlus className="h-4 w-4" /> Follow</>
        )}
      </Button>
      <span className="text-sm text-cream/50">{count.toLocaleString()} followers</span>
    </div>
  );
}
