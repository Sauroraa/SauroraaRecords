import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/lib/theme";
import { CoverArt } from "./cover-art";

type MiniPlayerProps = {
  title: string;
  artist: string;
  progressLabel: string;
  imageUri?: string | null;
  colors?: [string, string];
  playing?: boolean;
  progress?: number;
  onToggle?: () => void;
};

export function MiniPlayer({ title, artist, progressLabel, imageUri, colors, playing, progress, onToggle }: MiniPlayerProps) {
  return (
    <View style={styles.shell}>
      <CoverArt
        title={title}
        subtitle={artist}
        colors={colors ?? [palette.accent, "#312e81"]}
        size={56}
        rounded={16}
        imageUri={imageUri}
      />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{artist} • {progressLabel}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${Math.max(6, Math.round((progress ?? 0.46) * 100))}%` }]} />
        </View>
      </View>
      <Pressable style={styles.playButton} onPress={onToggle}>
        <Text style={styles.playGlyph}>{playing ? "❚❚" : "▶"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.28)",
    backgroundColor: "rgba(13,13,19,0.94)"
  },
  body: {
    flex: 1,
    gap: 4
  },
  title: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    color: palette.muted,
    fontSize: 12
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  progressValue: {
    width: "46%",
    height: "100%",
    backgroundColor: palette.accentSoft
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.accent
  },
  playGlyph: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 2
  }
});
