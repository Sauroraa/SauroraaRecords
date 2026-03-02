"use client";

import { CheckCircle2, Circle, ExternalLink, Copy, Check, MessageCircle, Mail, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { ReleaseItem, DubpackItem } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

type ActionType =
  | "FOLLOW_ARTIST"
  | "SUBSCRIBE_NEWSLETTER"
  | "LEAVE_COMMENT"
  | "SHARE_LINK"
  | "FOLLOW_INSTAGRAM"
  | "FOLLOW_SOUNDCLOUD"
  | "JOIN_DISCORD";

interface ActionStatus {
  action: ActionType;
  completed: boolean;
}

interface SessionData {
  sessionId: string;
  progress: { completed: number; total: number };
  actions: ActionStatus[];
  allCompleted: boolean;
}

interface FreeDownloadModalProps {
  open: boolean;
  onClose: () => void;
  release?: ReleaseItem;
  dubpack?: DubpackItem;
}

const ACTION_LABELS: Record<ActionType, { label: string; icon: React.ReactNode; description: string }> = {
  FOLLOW_ARTIST: { label: "Follow Artist", icon: <UserPlus className="h-4 w-4" />, description: "Follow the artist on Sauroraa" },
  SUBSCRIBE_NEWSLETTER: { label: "Subscribe to Newsletter", icon: <Mail className="h-4 w-4" />, description: "Subscribe with your email" },
  LEAVE_COMMENT: { label: "Leave a Comment", icon: <MessageCircle className="h-4 w-4" />, description: "Share your thoughts" },
  SHARE_LINK: { label: "Share This", icon: <Copy className="h-4 w-4" />, description: "Copy & share the link" },
  FOLLOW_INSTAGRAM: { label: "Follow on Instagram", icon: <ExternalLink className="h-4 w-4" />, description: "Open artist Instagram" },
  FOLLOW_SOUNDCLOUD: { label: "Follow on SoundCloud", icon: <ExternalLink className="h-4 w-4" />, description: "Open artist SoundCloud" },
  JOIN_DISCORD: { label: "Join Discord", icon: <ExternalLink className="h-4 w-4" />, description: "Join the community Discord" }
};

export function FreeDownloadModal({ open, onClose, release, dubpack }: FreeDownloadModalProps) {
  const { user } = useAuthStore();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completingAction, setCompletingAction] = useState<ActionType | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const itemId = release?.id ?? dubpack?.id;
  const itemTitle = release?.title ?? dubpack?.title;
  const itemType = release ? "release" : "dubpack";

  useEffect(() => {
    if (open && user && itemId) {
      void initSession();
    }
    if (!open) {
      setSession(null);
    }
  }, [open, user, itemId]);

  const initSession = async () => {
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (release) body.releaseId = release.id;
      if (dubpack) body.dubpackId = dubpack.id;

      const res = await fetch(`${API}/free-downloads/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = (await res.json()) as SessionData;
      setSession(data);
    } catch {
      toast.error("Failed to start download session");
    } finally {
      setLoading(false);
    }
  };

  const completeAction = async (action: ActionType, metadata?: Record<string, string>) => {
    if (!session) return;
    setCompletingAction(action);
    try {
      const res = await fetch(`${API}/free-downloads/session/${session.sessionId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, ...metadata })
      });
      if (!res.ok) throw new Error("Failed to complete action");
      const data = (await res.json()) as SessionData;
      setSession(data);
      toast.success("Action completed!");
    } catch {
      toast.error("Failed to complete action");
    } finally {
      setCompletingAction(null);
    }
  };

  const handleAction = async (action: ActionType) => {
    if (!session) return;
    const status = session.actions.find((a) => a.action === action);
    if (status?.completed) return;

    switch (action) {
      case "SHARE_LINK": {
        const url = window.location.origin + (release ? `/release/${release.slug}` : `/dubpack/${dubpack?.slug}`);
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        await completeAction(action);
        break;
      }
      case "FOLLOW_INSTAGRAM": {
        const artistId = release?.artist?.id ?? dubpack?.artist?.id;
        const instaUrl = (release?.artist as { instagramUrl?: string })?.instagramUrl
          ?? (dubpack?.artist as { instagramUrl?: string })?.instagramUrl
          ?? `https://instagram.com/sauroraarecords`;
        window.open(instaUrl, "_blank");
        await completeAction(action);
        break;
      }
      case "FOLLOW_SOUNDCLOUD": {
        const scUrl = (release?.artist as { soundcloudUrl?: string })?.soundcloudUrl
          ?? (dubpack?.artist as { soundcloudUrl?: string })?.soundcloudUrl
          ?? `https://soundcloud.com/sauroraarecords`;
        window.open(scUrl, "_blank");
        await completeAction(action);
        break;
      }
      case "JOIN_DISCORD": {
        const discordUrl = (release?.artist as { discordUrl?: string })?.discordUrl
          ?? `https://discord.gg/sauroraa`;
        window.open(discordUrl, "_blank");
        await completeAction(action);
        break;
      }
      default:
        await completeAction(action);
    }
  };

  const handleNewsletter = async () => {
    if (!newsletterEmail.trim()) return;
    await completeAction("SUBSCRIBE_NEWSLETTER", { email: newsletterEmail });
    setNewsletterEmail("");
  };

  const handleComment = async () => {
    if (!commentBody.trim()) return;
    // Post comment then mark action done
    const body: Record<string, string | undefined> = { body: commentBody };
    if (release) body.releaseId = release.id;
    if (dubpack) body.dubpackId = dubpack.id;
    await fetch(`${API}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    await completeAction("LEAVE_COMMENT");
    setCommentBody("");
  };

  const handleDownload = async () => {
    if (!session) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `${API}/free-downloads/session/${session.sessionId}/link`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to get download link");
      const data = (await res.json()) as { downloadUrl: string };
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      a.target = "_blank";
      a.click();
      toast.success("Download started!");
      onClose();
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const progress = session ? session.progress : { completed: 0, total: 0 };
  const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Get Your Free Download"
      size="md"
    >
      {!user ? (
        <div className="space-y-4 text-center py-4">
          <p className="text-cream/60 text-sm">You need to be signed in to download for free.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/login" onClick={onClose}>Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register" onClick={onClose}>Create Account</Link>
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-light" />
        </div>
      ) : session ? (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-cream/60">Complete the required actions to download</p>
            <p className="mt-1 text-base font-medium text-cream">{itemTitle}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-cream/50">
              <span>{progress.completed} / {progress.total} completed</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {session.actions.map((actionStatus) => {
              const info = ACTION_LABELS[actionStatus.action];
              const isCompleting = completingAction === actionStatus.action;

              return (
                <div
                  key={actionStatus.action}
                  className={`rounded-[12px] border p-3.5 transition-colors ${
                    actionStatus.completed
                      ? "border-violet-border bg-violet/10"
                      : "border-[rgba(255,255,255,0.08)] bg-surface2"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {actionStatus.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-violet-light" />
                      ) : (
                        <Circle className="h-5 w-5 text-cream/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${actionStatus.completed ? "text-violet-light" : "text-cream"}`}>
                        {info.label}
                      </p>
                      {!actionStatus.completed && (
                        <p className="text-xs text-cream/50 mt-0.5">{info.description}</p>
                      )}

                      {/* Action-specific inputs */}
                      {!actionStatus.completed && actionStatus.action === "SUBSCRIBE_NEWSLETTER" && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => void handleNewsletter()} disabled={isCompleting}>
                            Subscribe
                          </Button>
                        </div>
                      )}

                      {!actionStatus.completed && actionStatus.action === "LEAVE_COMMENT" && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="What do you think of this track?"
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            rows={2}
                          />
                          <Button size="sm" onClick={() => void handleComment()} disabled={isCompleting || !commentBody.trim()}>
                            Post Comment
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    {!actionStatus.completed &&
                      actionStatus.action !== "SUBSCRIBE_NEWSLETTER" &&
                      actionStatus.action !== "LEAVE_COMMENT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleAction(actionStatus.action)}
                          disabled={isCompleting}
                          className="shrink-0 gap-1.5"
                        >
                          {isCompleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : actionStatus.action === "SHARE_LINK" && copied ? (
                            <><Check className="h-3.5 w-3.5" /> Copied!</>
                          ) : (
                            <>{info.icon} {info.label.split(" ")[0]}</>
                          )}
                        </Button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Download button */}
          {session.allCompleted && (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => void handleDownload()}
              disabled={downloading}
            >
              {downloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Preparing download...</>
              ) : (
                "Get Your Download"
              )}
            </Button>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
