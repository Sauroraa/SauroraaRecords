import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/app-shell";
import { ArtistListCard } from "@/components/artist-list-card";
import { ReleaseShowcaseCard } from "@/components/release-showcase-card";
import { SectionHeader } from "@/components/section-header";
import { loadMobileCatalog } from "@/lib/mobile-data";
import { MobileArtist, MobileRelease, mobileArtists, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

export default function HomeTab() {
  const { t } = useAppState();
  const [trending, setTrending] = useState<MobileRelease[]>(mobileReleases);
  const [artists, setArtists] = useState<MobileArtist[]>(mobileArtists);
  const [featuredTrack, setFeaturedTrack] = useState<MobileRelease>(mobileReleases[0]);
  const [source, setSource] = useState<"api" | "fallback">("fallback");

  useEffect(() => {
    let mounted = true;

    loadMobileCatalog().then((catalog) => {
      if (!mounted) return;
      setTrending(catalog.trending);
      setArtists(catalog.artists);
      setFeaturedTrack(catalog.featuredTrack);
      setSource(catalog.source);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      title={t("homeTitle")}
      subtitle={t("homeSubtitle")}
      currentTrack={featuredTrack}
    >
      <SectionHeader title={t("trending")} action="Voir tout" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {trending.map((release) => (
          <ReleaseShowcaseCard key={release.id} release={release} />
        ))}
      </ScrollView>

      <SectionHeader title={t("artistsToWatch")} action="Charts" />
      <View style={styles.stack}>
        {artists.map((artist) => (
          <ArtistListCard key={artist.id} artist={artist} />
        ))}
      </View>

      <SectionHeader title={t("builtForMobile")} action="Sauroraa DNA" />
      <View style={styles.highlight}>
        <Text style={styles.highlightTag}>Playback</Text>
        <Text style={styles.highlightTitle}>Des pages release plus propres que le site desktop pour la lecture one-hand.</Text>
        <Text style={styles.highlightBody}>
          Hero immersif, carrousels de drops, artistes mis en avant et player flottant facon plateforme musicale moderne.
        </Text>
        <Text style={styles.highlightMeta}>
          {t("sourceSite")}: {source === "api" ? t("sourceApi") : t("sourceFallback")}
        </Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: 16,
    paddingRight: 20
  },
  stack: {
    gap: 12
  },
  highlight: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10
  },
  highlightTag: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  highlightTitle: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800"
  },
  highlightBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21
  },
  highlightMeta: {
    color: palette.dim,
    fontSize: 12
  }
});
