"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth-store";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

const REASONS = [
  { id: "COPYRIGHT", label: "Copyright violation" },
  { id: "FAKE_ARTIST", label: "Fake artist / impersonation" },
  { id: "SPAM", label: "Spam or misleading" },
  { id: "OFFENSIVE", label: "Offensive content" },
  { id: "WRONG_CATEGORY", label: "Wrong category / mislabelled" },
  { id: "DUPLICATE", label: "Duplicate release" },
] as const;

type ReasonId = (typeof REASONS)[number]["id"];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  releaseId: string;
  releaseTitle: string;
}

export function ReportModal({ open, onClose, releaseId, releaseTitle }: ReportModalProps) {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<ReasonId | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/ecosystem/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId, reason: selected, detail }),
      });
      toast.success("Report submitted. Thank you!");
      onClose();
      setSelected(null);
      setDetail("");
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
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
            <h3 className="flex items-center gap-2 text-base font-semibold text-cream">
              <Flag className="h-4 w-4 text-red-400" />
              Report
            </h3>
            <p className="mt-0.5 text-xs text-cream/40 truncate max-w-[220px]">{releaseTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-cream/30 hover:text-cream/70 hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user ? (
          <p className="text-sm text-cream/50">
            <a href="/login" className="text-violet-light hover:underline">Sign in</a> to submit a report.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition-colors ${
                    selected === r.id
                      ? "border-red-500/50 bg-red-500/10 text-red-300"
                      : "border-[rgba(255,255,255,0.08)] text-cream/60 hover:text-cream hover:bg-white/5"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Optional details..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 px-3 py-2 text-sm text-cream/80 placeholder-cream/25 outline-none focus:border-violet/40"
            />

            <button
              onClick={() => void submit()}
              disabled={!selected || submitting}
              className="mt-3 w-full rounded-xl bg-red-500/80 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
