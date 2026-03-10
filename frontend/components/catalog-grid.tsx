"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Disc3 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { fetchReleases } from "@/lib/api";
import { usePlayerStore } from "@/store/player-store";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function CatalogGrid() {
  const { t } = useLanguage();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const { data = [], isLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: fetchReleases
  });

  if (isLoading) {
    return <Card className="text-white/70">{t.catalog.loading}</Card>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((release, idx) => (
        <motion.div key={release.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{release.title}</h3>
                <p className="text-sm text-white/65">{release.description ?? t.catalog.no_description}</p>
              </div>
              <Disc3 className="h-5 w-5 text-[#c2ff2a]" />
            </div>
            <div className="text-sm text-white/85">
              {release.type === "FREE" ? t.artist.free_download : `${Number(release.price).toFixed(2)} EUR`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTrack({
                    title: release.title,
                    artist: release.artist?.user?.email ?? t.common.artist,
                    src: release.audioPath,
                    coverPath: release.coverPath ?? null,
                    releaseId: release.id
                  });
                  setPlaying(true);
                }}
              >
                {t.common.preview}
              </Button>
              <Button>{release.type === "FREE" ? t.catalog.get_release : t.catalog.buy_release}</Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
