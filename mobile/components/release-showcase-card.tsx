import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MobileRelease } from "@/lib/mock-data";
import { palette } from "@/lib/theme";
import { CoverArt } from "./cover-art";

export function ReleaseShowcaseCard({ release, compact = false }: { release: MobileRelease; compact?: boolean }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/releases/${release.slug}`)}
      style={[styles.card, compact ? styles.compactCard : null]}
    >
      <CoverArt
        title={release.title}
        subtitle={release.artist}
        colors={[release.colorA, release.colorB]}
        size={compact ? 78 : 176}
        rounded={compact ? 20 : 28}
        imageUri={release.coverUrl}
      />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.genre}>{release.genre}</Text>
          <Text style={styles.score}>{release.trendScore} pts</Text>
        </View>
        <Text numberOfLines={1} style={styles.title}>{release.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{release.artist} • {release.duration}</Text>
        {compact ? null : <Text numberOfLines={2} style={styles.desc}>{release.description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 198,
    gap: 12
  },
  compactCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  body: {
    flex: 1,
    gap: 6
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  genre: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  score: {
    color: palette.warning,
    fontSize: 11,
    fontWeight: "700"
  },
  title: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800"
  },
  meta: {
    color: palette.muted,
    fontSize: 12
  },
  desc: {
    color: palette.dim,
    fontSize: 12,
    lineHeight: 18
  }
});
