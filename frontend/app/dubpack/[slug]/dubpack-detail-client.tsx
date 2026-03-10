"use client";

import { motion } from "framer-motion";
import { Download, ShoppingCart, Package, ArrowLeft, Archive } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useLanguage } from "@/context/language-context";
import type { DubpackItem, CommentItem } from "@/lib/types";
import { FreeDownloadModal } from "@/components/free-download-modal";
import { CommentThread } from "@/components/comment-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

interface DubpackDetailClientProps {
  dubpack: DubpackItem;
  initialComments: CommentItem[];
}

export function DubpackDetailClient({ dubpack, initialComments }: DubpackDetailClientProps) {
  const { t, locale } = useLanguage();
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const [freeDownloadOpen, setFreeDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const artistName =
    dubpack.artist?.displayName ?? dubpack.artist?.user?.email?.split("@")[0] ?? "Sauroraa Artist";

  const handleBuy = () => {
    addItem({
      id: dubpack.id,
      type: "dubpack",
      title: dubpack.title,
      artist: artistName,
      price: Number(dubpack.price),
      coverPath: dubpack.coverPath ?? null
    });
    openCart();
  };

  const handleDirectDownload = async () => {
    if (!user) {
      setFreeDownloadOpen(true);
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`${API}/free-downloads/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dubpackId: dubpack.id })
      });
      if (!res.ok) throw new Error();
      const { sessionId, actions } = (await res.json()) as { sessionId: string; actions: { action: string; completedAt: string | null }[] };
      const allDone = actions.every((a) => a.completedAt !== null);
      if (allDone) {
        const linkRes = await fetch(`${API}/free-downloads/session/${sessionId}/link`, { credentials: "include" });
        if (linkRes.ok) {
          const { downloadUrl } = (await linkRes.json()) as { downloadUrl: string };
          window.location.href = downloadUrl;
          return;
        }
      }
      setFreeDownloadOpen(true);
    } catch {
      toast.error(t.common.error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-12">
      <Link href="/dubpacks" className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-cream transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t.nav.dubpacks}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square w-full max-w-md"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-surface2 shadow-violet-lg">
            {dubpack.coverPath ? (
              <Image src={dubpack.coverPath} alt={dubpack.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 to-surface2">
                <Archive className="h-24 w-24 text-violet/30" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="violet">DUBPACK</Badge>
              {dubpack.type === "FREE" ? (
                <Badge variant="green">{t.common.free}</Badge>
              ) : (
                <Badge variant="gray">€{Number(dubpack.price).toFixed(2)}</Badge>
              )}
              {dubpack.isExclusive && (
                <Badge variant="exclusive">Exclusive Drop</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-cream sm:text-4xl">{dubpack.title}</h1>
            {dubpack.artist && (
              <Link href={`/artist/${dubpack.artist.id}`}>
                <p className="text-lg text-cream/60 hover:text-cream transition-colors">{artistName}</p>
              </Link>
            )}
          </div>

          {dubpack.description && (
            <p className="text-sm text-cream/60 leading-relaxed max-w-lg">{dubpack.description}</p>
          )}

          {/* Package info */}
          <div className="rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-cream/70">
              <Package className="h-4 w-4 text-violet-light" />
              <span>ZIP Archive</span>
            </div>
            <p className="text-xs text-cream/40 pl-6">
              WAV, stems et licence inclus.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {dubpack.type === "FREE" ? (
              <Button onClick={handleDirectDownload} disabled={downloading} className="gap-2">
                <Download className="h-4 w-4" />
                {downloading ? t.cart.redirecting : t.common.download}
              </Button>
            ) : (
              <Button onClick={handleBuy} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t.common.buy} — €{Number(dubpack.price).toFixed(2)}
              </Button>
            )}
          </div>

          {dubpack.createdAt && (
            <p className="text-xs text-cream/30">
              {t.release.released_on} {new Date(dubpack.createdAt).toLocaleDateString(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </motion.div>
      </div>

      {/* Comments */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-10">
        <CommentThread
          dubpackId={dubpack.id}
          comments={initialComments}
        />
      </div>

      {dubpack.type === "FREE" && (
        <FreeDownloadModal
          dubpack={dubpack}
          open={freeDownloadOpen}
          onClose={() => setFreeDownloadOpen(false)}
        />
      )}
    </div>
  );
}
