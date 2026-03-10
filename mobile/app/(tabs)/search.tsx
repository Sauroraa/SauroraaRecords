import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppShell } from "@/components/app-shell";
import { ReleaseShowcaseCard } from "@/components/release-showcase-card";
import { SectionHeader } from "@/components/section-header";
import { loadMobileCatalog } from "@/lib/mobile-data";
import { MobileRelease, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

const chips = ["Electronic", "Techno", "Trap", "DnB", "Premium", "Trending"];

export default function SearchTab() {
  const { t } = useAppState();
  const [query, setQuery] = useState("");
  const [releases, setReleases] = useState<MobileRelease[]>(mobileReleases);

  useEffect(() => {
    let mounted = true;
    loadMobileCatalog().then((catalog) => {
      if (!mounted) return;
      setReleases(catalog.releases);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return releases;
    return releases.filter((release) =>
      [release.title, release.artist, release.genre, release.description]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, releases]);

  return (
    <AppShell
      title={t("searchTitle")}
      subtitle={t("searchSubtitle")}
      currentTrack={results[0] ?? releases[0]}
    >
      <TextInput
        placeholder={t("searchPlaceholder")}
        placeholderTextColor={palette.dim}
        style={styles.search}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.chips}>
        {chips.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title={t("results")} action={`${results.length}`} />
      <View style={styles.results}>
        {results.map((release) => (
          <ReleaseShowcaseCard key={release.id} release={release} compact />
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: palette.surface,
    color: palette.text
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  chipText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700"
  },
  results: {
    gap: 14
  }
});
