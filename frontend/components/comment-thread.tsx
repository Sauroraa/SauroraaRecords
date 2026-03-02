"use client";

import { Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { CommentItem } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface CommentThreadProps {
  releaseId?: string;
  dubpackId?: string;
  comments: CommentItem[];
  onCommentPosted?: () => void;
}

interface CommentRowProps {
  comment: CommentItem;
  onLike: (id: string) => void;
  onReply?: (parentId: string) => void;
  depth?: number;
}

function CommentRow({ comment, onLike, onReply, depth = 0 }: CommentRowProps) {
  const { user } = useAuthStore();
  return (
    <div className={`${depth > 0 ? "ml-10 border-l border-[rgba(255,255,255,0.06)] pl-4" : ""}`}>
      <div className="flex gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-violet/20 flex items-center justify-center text-xs font-bold text-violet-light">
          {comment.user.email.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-cream/70">{comment.user.email.split("@")[0]}</span>
            {comment.isVerifiedPurchase && (
              <span className="flex items-center gap-0.5 text-[10px] text-violet-light">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
            <span className="text-[11px] text-cream/30">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-cream/80 leading-relaxed">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 text-xs text-cream/40 hover:text-violet-light transition-colors"
            >
              <Heart className="h-3.5 w-3.5" />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>
            {depth === 0 && user && onReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-cream/40 hover:text-cream/70 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentRow comment={reply} onLike={onLike} depth={1} />
        </div>
      ))}
    </div>
  );
}

export function CommentThread({ releaseId, dubpackId, comments: initialComments, onCommentPosted }: CommentThreadProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitComment = async () => {
    if (!body.trim() || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId, dubpackId, parentId: replyTo, body })
      });
      if (!res.ok) throw new Error("Failed to post");
      const newComment = (await res.json()) as CommentItem;
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setBody("");
      setReplyTo(null);
      onCommentPosted?.();
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    try {
      await fetch(`${API}/comments/${id}/like`, {
        method: "POST",
        credentials: "include"
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, likesCount: c.likesCount + 1 } : c
        )
      );
    } catch {}
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-cream">
        Comments <span className="text-cream/40 text-sm font-normal">({comments.length})</span>
      </h3>

      {user && (
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-cream/50">
              <span>Replying to comment</span>
              <button onClick={() => setReplyTo(null)} className="text-violet-light hover:underline">
                Cancel
              </button>
            </div>
          )}
          <Textarea
            placeholder="Share your thoughts..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => void submitComment()} disabled={submitting || !body.trim()}>
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <p className="text-sm text-cream/40">
          <a href="/login" className="text-violet-light hover:underline">Sign in</a> to leave a comment
        </p>
      )}

      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            onLike={(id) => void handleLike(id)}
            onReply={(parentId) => setReplyTo(parentId)}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-cream/30">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
