"use client";

import {
  CheckCircle2, Circle, ExternalLink, Copy, Check, MessageCircle,
  Mail, UserPlus, Loader2, Download, Instagram
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { ReleaseItem, DubpackItem } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { useAuthStore } from "@/store/auth-store";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// ─── Old session-based types ──────────────────────────────────────────────────

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
  FOLLOW_INSTAGRAM: { label: "Follow on Instagram", icon: <Instagram className="h-4 w-4" />, description: "Open artist Instagram" },
  FOLLOW_SOUNDCLOUD: { label: "Follow on SoundCloud", icon: <ExternalLink className="h-4 w-4" />, description: "Open artist SoundCloud" },
  JOIN_DISCORD: { label: "Join Discord", icon: <ExternalLink className="h-4 w-4" />, description: "Join the community Discord" }
};

// ─── HypeEdit Gate types ──────────────────────────────────────────────────────

interface GateAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  type: "external" | "email" | "follow";
  url?: string;
}

// ─── HypeEdit Gate Modal ──────────────────────────────────────────────────────

function HypeEditGate({
  release,
  onClose
}: {
  release: ReleaseItem;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const artist = release.artist;

  const [actions, setActions] = useState<GateAction[]>(() => {
    const list: GateAction[] = [];
    if (release.gateFollowArtist)
      list.push({
        id: "follow",
        label: "Suivre l'artiste",
        description: "Suis l'artiste sur Sauroraa Records",
        icon: <UserPlus className="h-4 w-4" />,
        completed: false,
        type: "follow"
      });
    if (release.gateEmail)
      list.push({
        id: "email",
        label: "Laisser ton email",
        description: "Reçois les prochaines sorties en avant-première",
        icon: <Mail className="h-4 w-4" />,
        completed: false,
        type: "email"
      });
    if (release.gateInstagram && artist?.instagramUrl)
      list.push({
        id: "instagram",
        label: "Follow sur Instagram",
        description: "Rejoins la communauté Instagram",
        icon: <Instagram className="h-4 w-4" />,
        completed: false,
        type: "external",
        url: artist.instagramUrl
      });
    if (release.gateSoundcloud && artist?.soundcloudUrl)
      list.push({
        id: "soundcloud",
        label: "Follow sur SoundCloud",
        description: "Écoute plus de tracks sur SoundCloud",
        icon: <ExternalLink className="h-4 w-4" />,
        completed: false,
        type: "external",
        url: artist.soundcloudUrl
      });
    if (release.gateDiscord && artist?.discordUrl)
      list.push({
        id: "discord",
        label: "Rejoindre le Discord",
        description: "Rejoins le serveur Discord de l'artiste",
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.034.055a19.866 19.866 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
        ),
        completed: false,
        type: "external",
        url: artist?.discordUrl ?? undefined
      });
    return list;
  });

  const [email, setEmail] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const allDone = actions.every((a) => a.completed);

  const markDone = (id: string) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, completed: true } : a)));
  };

  const handleExternalAction = (action: GateAction) => {
    if (action.url) window.open(action.url, "_blank");
    setTimeout(() => markDone(action.id), 1500);
  };

  const handleFollow = async (action: GateAction) => {
    if (!user) {
      toast.error("Connecte-toi pour suivre l'artiste");
      return;
    }
    try {
      await fetch(`${API}/follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ artistId: release.artist?.id })
      });
    } catch {}
    markDone(action.id);
  };

  const handleEmailSubmit = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Saisis un email valide");
      return;
    }
    markDone("email");
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch(`${API}/releases/${release.id}/gate-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email || undefined,
          followedArtist: release.gateFollowArtist || undefined,
          followedInstagram: release.gateInstagram || undefined,
          followedSoundcloud: release.gateSoundcloud || undefined,
          joinedDiscord: release.gateDiscord || undefined
        })
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { downloadUrl: string };
      setDownloadUrl(data.downloadUrl);
    } catch {
      toast.error("Impossible d'obtenir le lien de téléchargement");
    } finally {
      setUnlocking(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.target = "_blank";
    a.click();
    toast.success("Téléchargement démarré !");
    onClose();
  };

  const completed = actions.filter((a) => a.completed).length;
  const total = actions.length;
  const pct = total > 0 ? (completed / total) * 100 : 100;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-cream/40 uppercase tracking-wide font-medium mb-0.5">HypeEdit Gate</p>
        <p className="text-base font-semibold text-cream">{release.title}</p>
        <p className="text-sm text-cream/50 mt-0.5">
          {artist?.displayName ?? artist?.user?.firstName ?? "Artiste"}
        </p>
      </div>

      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-cream/50">
            <span>{completed} / {total} actions</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`rounded-[12px] border p-3.5 transition-colors ${
              action.completed
                ? "border-violet-border bg-violet/10"
                : "border-[rgba(255,255,255,0.08)] bg-surface2"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {action.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-violet-light" />
                ) : (
                  <Circle className="h-5 w-5 text-cream/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${action.completed ? "text-violet-light" : "text-cream"}`}>
                  {action.label}
                </p>
                {!action.completed && (
                  <p className="text-xs text-cream/50 mt-0.5">{action.description}</p>
                )}
                {!action.completed && action.type === "email" && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="email"
                      placeholder="ton@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleEmailSubmit}>OK</Button>
                  </div>
                )}
              </div>
              {!action.completed && action.type !== "email" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() =>
                    action.type === "follow"
                      ? void handleFollow(action)
                      : handleExternalAction(action)
                  }
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.type === "external" ? "Ouvrir" : "Suivre"}</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {allDone && !downloadUrl && (
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => void handleUnlock()}
          disabled={unlocking}
        >
          {unlocking ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Déverrouillage...</>
          ) : (
            <><Download className="h-4 w-4" /> Obtenir le download</>
          )}
        </Button>
      )}

      {downloadUrl && (
        <Button className="w-full gap-2" size="lg" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Télécharger maintenant
        </Button>
      )}
    </div>
  );
}

// ─── Session-based flow ───────────────────────────────────────────────────────

function SessionFlow({
  release,
  dubpack,
  onClose
}: {
  release?: ReleaseItem;
  dubpack?: DubpackItem;
  onClose: () => void;
}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completingAction, setCompletingAction] = useState<ActionType | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const itemId = release?.id ?? dubpack?.id;
  const itemTitle = release?.title ?? dubpack?.title;

  useEffect(() => {
    if (itemId) void initSession();
  }, [itemId]);

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
      if (!res.ok) throw new Error();
      setSession((await res.json()) as SessionData);
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
      if (!res.ok) throw new Error();
      setSession((await res.json()) as SessionData);
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
        const instaUrl = release?.artist?.instagramUrl ?? dubpack?.artist?.instagramUrl ?? "https://instagram.com/sauroraarecords";
        window.open(instaUrl, "_blank");
        await completeAction(action);
        break;
      }
      case "FOLLOW_SOUNDCLOUD": {
        const scUrl = release?.artist?.soundcloudUrl ?? dubpack?.artist?.soundcloudUrl ?? "https://soundcloud.com/sauroraarecords";
        window.open(scUrl, "_blank");
        await completeAction(action);
        break;
      }
      case "JOIN_DISCORD": {
        const discordUrl = release?.artist?.discordUrl ?? dubpack?.artist?.discordUrl ?? "https://discord.gg/sauroraa";
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
    await completeAction("LEAVE_COMMENT", { commentBody });
    setCommentBody("");
  };

  const handleDownload = async () => {
    if (!session) return;
    setDownloading(true);
    try {
      const res = await fetch(`${API}/free-downloads/session/${session.sessionId}/link`, { credentials: "include" });
      if (!res.ok) throw new Error();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-light" />
      </div>
    );
  }

  if (!session) return null;

  const progress = session.progress;
  const progressPct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-cream/60">Complete the required actions to download</p>
        <p className="mt-1 text-base font-medium text-cream">{itemTitle}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-cream/50">
          <span>{progress.completed} / {progress.total} completed</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
          <div className="h-full rounded-full bg-violet transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {session.actions.map((actionStatus) => {
          const info = ACTION_LABELS[actionStatus.action];
          const isCompleting = completingAction === actionStatus.action;

          return (
            <div
              key={actionStatus.action}
              className={`rounded-[12px] border p-3.5 transition-colors ${
                actionStatus.completed ? "border-violet-border bg-violet/10" : "border-[rgba(255,255,255,0.08)] bg-surface2"
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

      {session.allCompleted && (
        <Button className="w-full gap-2" size="lg" onClick={() => void handleDownload()} disabled={downloading}>
          {downloading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Preparing download...</>
          ) : (
            "Get Your Download"
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function FreeDownloadModal({ open, onClose, release, dubpack }: FreeDownloadModalProps) {
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const useGate = !!release?.gateEnabled;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={useGate ? t.common.download : t.release.download_free}
      size="md"
    >
      {!user ? (
        <div className="space-y-4 text-center py-4">
          <p className="text-cream/60 text-sm">
            {useGate
              ? t.auth.login_sub
              : t.comments.sign_in_to_comment}
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/login" onClick={onClose}>
                {t.auth.sign_in}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register" onClick={onClose}>
                {t.auth.create_account}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <SessionFlow release={release} dubpack={dubpack} onClose={onClose} />
      )}
    </Modal>
  );
}
