"use client";

import { Copy, X } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/language-context";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  releaseTitle: string;
  artistName: string;
  releaseSlug: string;
}

const RECORDS_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sauroraarecords.be";

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function ShareModal({ open, onClose, releaseTitle, artistName, releaseSlug }: ShareModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  const url = `${RECORDS_BASE}/release/${releaseSlug}`;

  const shareDiscord = () => {
    const text = `🎵 **${releaseTitle}** by *${artistName}*\n${url}`;
    void navigator.clipboard.writeText(text);
    toast.success(t.share.discord_copied);
    onClose();
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`🎵 ${releaseTitle} by ${artistName} — ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener");
    onClose();
  };

  const copyLink = () => {
    void navigator.clipboard.writeText(url);
    toast.success(t.share.link_copied);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0d0d12] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-cream">{t.share.title}</h3>
            <p className="mt-0.5 text-xs text-cream/40 truncate max-w-[220px]">
              {releaseTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-cream/30 hover:text-cream/70 hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={shareDiscord}
            className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#5865F2]/10 px-4 py-3 text-sm font-medium text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
          >
            <DiscordIcon />
            <span>{t.share.copy_discord}</span>
          </button>

          <button
            onClick={shareTwitter}
            className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 px-4 py-3 text-sm font-medium text-cream/80 hover:bg-white/10 transition-colors"
          >
            <TwitterIcon />
            <span>{t.share.share_twitter}</span>
          </button>

          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-violet/10 px-4 py-3 text-sm font-medium text-violet-light hover:bg-violet/20 transition-colors"
          >
            <Copy className="h-5 w-5" />
            <span>{t.share.copy_link}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
