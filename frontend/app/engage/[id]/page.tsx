"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Check,
  ChevronRight,
  Download,
  Loader2,
  Music,
  Share2,
  Users,
  Mail,
  ExternalLink
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
const BASE = API.replace("/api", "");

type EngageActionType =
  | "FOLLOW_SOUNDCLOUD"
  | "LIKE_SOUNDCLOUD"
  | "REPOST_SOUNDCLOUD"
  | "FOLLOW_INSTAGRAM"
  | "JOIN_DISCORD"
  | "SUBSCRIBE_NEWSLETTER"
  | "FOLLOW_ARTIST"
  | "LEAVE_COMMENT";

interface CampaignAction {
  id: string;
  actionType: EngageActionType;
  required: boolean;
  position: number;
  label: string | null;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  releaseCountdown: string | null;
  discordInviteUrl: string | null;
  instagramHandle: string | null;
  soundcloudArtistId: string | null;
  soundcloudTrackId: string | null;
  actions: CampaignAction[];
  release: {
    id: string;
    title: string;
    slug: string;
    coverPath: string | null;
    genre: string | null;
  } | null;
  artist: {
    id: string;
    displayName: string | null;
    avatar: string | null;
    soundcloudUrl: string | null;
    instagramUrl: string | null;
    discordUrl: string | null;
    _count: { followers: number };
  };
}

const ACTION_LABELS: Record<EngageActionType, string> = {
  FOLLOW_SOUNDCLOUD: "Follow on SoundCloud",
  LIKE_SOUNDCLOUD: "Like the track on SoundCloud",
  REPOST_SOUNDCLOUD: "Repost on SoundCloud",
  FOLLOW_INSTAGRAM: "Follow on Instagram",
  JOIN_DISCORD: "Join the Discord server",
  SUBSCRIBE_NEWSLETTER: "Subscribe to newsletter",
  FOLLOW_ARTIST: "Follow on Sauroraa",
  LEAVE_COMMENT: "Leave a comment"
};

const ACTION_ICONS: Record<EngageActionType, React.ReactNode> = {
  FOLLOW_SOUNDCLOUD: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.318 0-.551.249-.551.582l-.468 3.89.468 3.763c0 .332.233.582.551.582.314 0 .545-.25.545-.582l.532-3.763-.532-3.89c0-.333-.23-.582-.545-.582zm2.456-.901c-.339 0-.609.278-.609.624l-.401 4.769.401 4.316c0 .346.27.625.609.625.338 0 .607-.279.607-.625l.456-4.316-.456-4.769c0-.346-.27-.624-.607-.624zm2.501-.249c-.378 0-.683.312-.683.697l-.337 5.018.337 4.684c0 .386.305.697.683.697.378 0 .682-.311.682-.697l.383-4.684-.383-5.018c0-.385-.304-.697-.682-.697zm2.534-.221c-.419 0-.757.345-.757.771l-.273 5.24.273 4.633c0 .426.338.771.757.771.42 0 .757-.345.757-.771l.312-4.633-.312-5.24c0-.426-.337-.771-.757-.771zm2.567-.003c-.46 0-.832.38-.832.848l-.209 5.24.209 4.614c0 .468.372.849.832.849.46 0 .832-.381.832-.849l.237-4.614-.237-5.24c0-.468-.372-.848-.832-.848zm8.547 3.87c-.259 0-.505.05-.732.141C18.79 9.5 17.35 8 15.604 8c-.39 0-.763.076-1.103.211-.128.049-.163.1-.165.149V19.7c.002.055.044.099.099.104h7.316c.547 0 .99-.45.99-1.004 0-.554-.443-1.004-.99-1.004H21.7c.002-.044.003-.088.003-.133 0-2.082-1.655-3.769-3.694-3.769.062-.234.095-.48.095-.734 0-1.59-1.263-2.879-2.822-2.879z"/></svg>,
  LIKE_SOUNDCLOUD: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  REPOST_SOUNDCLOUD: <Share2 className="h-5 w-5" />,
  FOLLOW_INSTAGRAM: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  JOIN_DISCORD: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.034.055a19.866 19.866 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>,
  SUBSCRIBE_NEWSLETTER: <Mail className="h-5 w-5" />,
  FOLLOW_ARTIST: <Users className="h-5 w-5" />,
  LEAVE_COMMENT: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

function formatCountdown(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Released!";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function EngagePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load campaign
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/engage/${id}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Campaign;
        setCampaign(data);

        if (data.releaseCountdown) {
          setCountdown(formatCountdown(data.releaseCountdown));
          countdownRef.current = setInterval(() => {
            setCountdown(formatCountdown(data.releaseCountdown!));
          }, 30000);
        }
      } catch {
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [id]);

  // Start session
  const startSession = async (emailValue?: string) => {
    if (sessionId) return sessionId;
    const res = await fetch(`${API}/engage/${id}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: emailValue ?? undefined })
    });
    if (!res.ok) throw new Error("Failed to start session");
    const data = (await res.json()) as { sessionId: string };
    setSessionId(data.sessionId);
    return data.sessionId;
  };

  const completeAction = async (actionId: string, emailValue?: string) => {
    if (completing) return;
    setCompleting(actionId);
    try {
      const sid = await startSession(emailValue);
      const res = await fetch(`${API}/engage/${id}/session/${sid}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ actionId })
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        allDone?: boolean;
        downloadToken?: string;
        alreadyCompleted?: boolean;
      };
      setCompletedActions((prev) => new Set([...prev, actionId]));
      if (data.allDone && data.downloadToken) {
        setDownloadToken(data.downloadToken);
        setTimeout(() => setShowShare(true), 1500);
      }
    } catch {
      toast.error("Impossible de valider cette action");
    } finally {
      setCompleting(null);
    }
  };

  const handleExternalAction = async (action: CampaignAction, externalUrl?: string) => {
    if (externalUrl) window.open(externalUrl, "_blank", "noopener");
    await completeAction(action.id);
  };

  const handleNewsletterAction = async (action: CampaignAction) => {
    if (!email.trim()) {
      toast.error("Entre ton email pour continuer");
      return;
    }
    setEmailSent(true);
    await completeAction(action.id, email);
  };

  const getActionUrl = (action: CampaignAction): string | undefined => {
    if (!campaign) return undefined;
    switch (action.actionType) {
      case "FOLLOW_SOUNDCLOUD":
      case "LIKE_SOUNDCLOUD":
      case "REPOST_SOUNDCLOUD":
        return campaign.soundcloudTrackId
          ? `https://soundcloud.com/${campaign.soundcloudArtistId ?? ""}/${campaign.soundcloudTrackId}`
          : campaign.artist.soundcloudUrl ?? undefined;
      case "FOLLOW_INSTAGRAM":
        return campaign.instagramHandle
          ? `https://instagram.com/${campaign.instagramHandle}`
          : campaign.artist.instagramUrl ?? undefined;
      case "JOIN_DISCORD":
        return campaign.discordInviteUrl ?? campaign.artist.discordUrl ?? undefined;
      case "FOLLOW_ARTIST":
        return `/artist/${campaign.artist.id}`;
      default:
        return undefined;
    }
  };

  const requiredActions = campaign?.actions.filter((a) => a.required) ?? [];
  const optionalActions = campaign?.actions.filter((a) => !a.required) ?? [];
  const completedRequired = requiredActions.filter((a) => completedActions.has(a.id)).length;
  const progress = requiredActions.length > 0 ? (completedRequired / requiredActions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-violet" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-cream">
        <Music className="h-12 w-12 text-violet/50" />
        <p className="text-lg font-semibold">Campagne introuvable</p>
        <Link href="/" className="text-sm text-violet-light hover:underline">Retour à Sauroraa</Link>
      </div>
    );
  }

  const artistName = campaign.artist.displayName ?? "Artiste";
  const coverPath = campaign.release?.coverPath
    ? campaign.release.coverPath.startsWith("http")
      ? campaign.release.coverPath
      : `${BASE}${campaign.release.coverPath}`
    : null;

  const avatarPath = campaign.artist.avatar
    ? campaign.artist.avatar.startsWith("http")
      ? campaign.artist.avatar
      : `${BASE}${campaign.artist.avatar}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {coverPath && (
          <div className="absolute inset-0">
            <Image src={coverPath} alt={campaign.title} fill className="object-cover blur-2xl scale-110 opacity-20" />
          </div>
        )}
        <div className="relative mx-auto max-w-lg px-4 py-12 text-center">
          {coverPath ? (
            <div className="mx-auto mb-6 h-48 w-48 overflow-hidden rounded-[16px] shadow-2xl ring-1 ring-white/10">
              <Image src={coverPath} alt={campaign.title} width={192} height={192} className="object-cover" />
            </div>
          ) : (
            <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-[16px] bg-violet/20 ring-1 ring-white/10">
              <Music className="h-20 w-20 text-violet/60" />
            </div>
          )}

          {countdown && (
            <div className="mb-4 inline-block rounded-full bg-violet/20 px-4 py-1.5 text-sm font-medium text-violet-light ring-1 ring-violet/30">
              Release in {countdown}
            </div>
          )}

          <h1 className="text-2xl font-bold text-white">{campaign.title}</h1>

          <div className="mt-3 flex items-center justify-center gap-2">
            {avatarPath && (
              <Image src={avatarPath} alt={artistName} width={24} height={24} className="rounded-full object-cover" />
            )}
            <span className="text-sm text-cream/60">{artistName}</span>
          </div>

          {campaign.description && (
            <p className="mt-3 text-sm leading-relaxed text-cream/50">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-lg px-4 pb-16">
        {/* Download unlocked */}
        {downloadToken ? (
          <div className="mb-6 overflow-hidden rounded-[16px] border border-violet/40 bg-violet/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet text-white">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Download unlocked!</h2>
            <p className="mt-1 text-sm text-cream/60">Ton téléchargement est prêt. Lien valable 10 minutes.</p>
            <a
              href={`${API}/engage/download/${downloadToken}`}
              className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-hover transition-colors"
              download
            >
              <Download className="h-4 w-4" />
              Télécharger maintenant
            </a>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            {requiredActions.length > 0 && (
              <div className="mb-6 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-surface p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-cream/50">
                  <span>{completedRequired} / {requiredActions.length} actions complétées</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-violet transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Required actions */}
            {requiredActions.length > 0 && (
              <div className="mb-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream/40">Actions requises</p>
                {requiredActions.map((action) => {
                  const done = completedActions.has(action.id);
                  const isLoading = completing === action.id;
                  const url = getActionUrl(action);
                  const label = action.label ?? ACTION_LABELS[action.actionType];

                  return (
                    <ActionCard
                      key={action.id}
                      action={action}
                      label={label}
                      done={done}
                      isLoading={isLoading}
                      url={url}
                      email={email}
                      setEmail={setEmail}
                      emailSent={emailSent}
                      onComplete={completeAction}
                      onExternalAction={handleExternalAction}
                      onNewsletterAction={handleNewsletterAction}
                    />
                  );
                })}
              </div>
            )}

            {/* Optional actions */}
            {optionalActions.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream/40">Actions optionnelles</p>
                {optionalActions.map((action) => {
                  const done = completedActions.has(action.id);
                  const isLoading = completing === action.id;
                  const url = getActionUrl(action);
                  const label = action.label ?? ACTION_LABELS[action.actionType];

                  return (
                    <ActionCard
                      key={action.id}
                      action={action}
                      label={label}
                      done={done}
                      isLoading={isLoading}
                      url={url}
                      email={email}
                      setEmail={setEmail}
                      emailSent={emailSent}
                      onComplete={completeAction}
                      onExternalAction={handleExternalAction}
                      onNewsletterAction={handleNewsletterAction}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Share popup */}
        {showShare && (
          <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-surface p-5 text-center">
            <Share2 className="mx-auto mb-3 h-8 w-8 text-violet" />
            <p className="text-sm font-semibold text-cream">Partage ce drop !</p>
            <p className="mt-1 text-xs text-cream/50">Aide l'artiste à se faire connaître</p>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Je viens de télécharger "${campaign.title}" sur Sauroraa Records!`)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[8px] bg-[#1DA1F2]/20 px-4 py-2 text-xs text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-colors"
              >
                Twitter/X
              </a>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Lien copié !");
                }}
                className="rounded-[8px] bg-white/10 px-4 py-2 text-xs text-cream/70 hover:bg-white/15 transition-colors"
              >
                Copier le lien
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-cream/30 hover:text-cream/60 transition-colors">
            Powered by Sauroraa Records
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  action,
  label,
  done,
  isLoading,
  url,
  email,
  setEmail,
  emailSent,
  onComplete,
  onExternalAction,
  onNewsletterAction
}: {
  action: CampaignAction;
  label: string;
  done: boolean;
  isLoading: boolean;
  url: string | undefined;
  email: string;
  setEmail: (v: string) => void;
  emailSent: boolean;
  onComplete: (actionId: string) => Promise<void>;
  onExternalAction: (action: CampaignAction, url?: string) => Promise<void>;
  onNewsletterAction: (action: CampaignAction) => Promise<void>;
}) {
  const isNewsletter = action.actionType === "SUBSCRIBE_NEWSLETTER";
  const isComment = action.actionType === "LEAVE_COMMENT";
  const isFollowArtist = action.actionType === "FOLLOW_ARTIST";

  return (
    <div
      className={`rounded-[12px] border p-4 transition-all ${
        done
          ? "border-violet/40 bg-violet/10"
          : "border-[rgba(255,255,255,0.08)] bg-surface"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            done ? "bg-violet text-white" : "bg-black/30 text-cream/50"
          }`}
        >
          {done ? <Check className="h-5 w-5" /> : ACTION_ICONS[action.actionType]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${done ? "text-violet-light" : "text-cream"}`}>
            {label}
          </p>
          {!action.required && (
            <p className="text-xs text-cream/40">Optionnel</p>
          )}
        </div>

        {!done && (
          <div className="shrink-0">
            {isNewsletter ? (
              <button
                onClick={() => void onNewsletterAction(action)}
                disabled={isLoading || emailSent}
                className="rounded-[8px] bg-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Valider"}
              </button>
            ) : isComment || isFollowArtist ? (
              <button
                onClick={() => void onComplete(action.id)}
                disabled={isLoading}
                className="rounded-[8px] bg-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Valider"}
              </button>
            ) : (
              <button
                onClick={() => void onExternalAction(action, url)}
                disabled={isLoading}
                className="flex items-center gap-1 rounded-[8px] bg-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-3 w-3" />
                    Faire
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Newsletter email input */}
      {isNewsletter && !done && (
        <div className="mt-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            className="w-full rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-black/20 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-1 focus:ring-violet/50"
          />
        </div>
      )}

      {/* Discord link */}
      {action.actionType === "JOIN_DISCORD" && !done && url && (
        <div className="mt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-light hover:underline"
          >
            Ouvrir l'invitation Discord →
          </a>
        </div>
      )}
    </div>
  );
}
