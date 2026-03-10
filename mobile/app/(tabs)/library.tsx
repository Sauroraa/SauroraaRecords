import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/app-shell";
import { ReleaseShowcaseCard } from "@/components/release-showcase-card";
import { SectionHeader } from "@/components/section-header";
import { loadMobileCatalog } from "@/lib/mobile-data";
import { MobileArtist, MobileRelease, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

export default function LibraryTab() {
  const { t } = useAppState();
  const [releases, setReleases] = useState<MobileRelease[]>(mobileReleases);
  const [artists, setArtists] = useState<MobileArtist[]>([]);

  useEffect(() => {
    let mounted = true;
    loadMobileCatalog().then((catalog) => {
      if (!mounted) return;
      setReleases(catalog.releases);
      setArtists(catalog.artists);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      title={t("libraryTitle")}
      subtitle={t("librarySubtitle")}
      currentTrack={releases[0]}
    >
      <View style={styles.stats}>
        <Metric label={t("tracksLive")} value={`${releases.length}`} />
        <Metric label={t("artistsLive")} value={`${artists.length}`} />
        <Metric label={t("comments")} value={`${releases.reduce((total, item) => total + item.comments, 0)}`} />
      </View>

      <SectionHeader title={t("recentlySaved")} action="Manage" />
      <View style={styles.list}>
        {releases.slice(0, 8).map((release) => (
          <ReleaseShowcaseCard key={release.id} release={release} compact />
        ))}
      </View>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    gap: 10
  },
  metric: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  metricValue: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800"
  },
  metricLabel: {
    color: palette.dim,
    fontSize: 11,
    marginTop: 4
  },
  list: {
    gap: 14
  }
});
