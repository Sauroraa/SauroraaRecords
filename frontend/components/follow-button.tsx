"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "./ui/button";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface FollowButtonProps {
  artistId: string;
}

export function FollowButton({ artistId }: FollowButtonProps) {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchStatus();
  }, [artistId, user]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/follows/artist/${artistId}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = (await res.json()) as { count: number; isFollowing: boolean };
        setIsFollowing(data.isFollowing);
        setCount(data.count);
      }
    } catch {}
  };

  const toggle = async () => {
    if (!user) {
      toast.error("Sign in to follow artists");
      return;
    }
    setLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${API}/follows/artist/${artistId}`, {
        method,
        credentials: "include"
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setCount((c) => (isFollowing ? c - 1 : c + 1));
        toast.success(isFollowing ? "Unfollowed" : "Following!");
      }
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
