import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileRelease, mobileReleases } from "@/lib/mock-data";
import { usePlayer } from "@/providers/player-provider";
import { palette, spacing } from "@/lib/theme";
import { MiniPlayer } from "./mini-player";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  currentTrack?: MobileRelease | null;
};

export function AppShell({ title, subtitle, children, currentTrack }: AppShellProps) {
  const player = usePlayer();
  const activeTrack = currentTrack ?? mobileReleases[0];
  const playerTrack = player.currentTrack ?? {
    id: activeTrack.id,
    slug: activeTrack.slug,
    title: activeTrack.title,
    artist: activeTrack.artist,
    audioUrl: activeTrack.audioUrl ?? null,
    coverUrl: activeTrack.coverUrl,
    colors: [activeTrack.colorA, activeTrack.colorB] as [string, string]
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <Text style={styles.kicker}>SauroraaMusic</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>

      <View style={styles.playerDock}>
        <MiniPlayer
          title={playerTrack.title}
          artist={playerTrack.artist}
          progressLabel={player.progressLabel || (activeTrack.duration ? `Preview • ${activeTrack.duration}` : "Preview")}
          imageUri={playerTrack.coverUrl}
          colors={playerTrack.colors ?? [activeTrack.colorA, activeTrack.colorB]}
          playing={player.playing}
          progress={player.progress}
          onToggle={player.togglePlayback}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: 18,
    paddingBottom: 178,
    gap: spacing.section
  },
  header: {
    position: "relative",
    overflow: "hidden",
    padding: 24,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
    backgroundColor: "#0f0f18",
    gap: 10
  },
  glowA: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    right: -40,
    top: -90,
    backgroundColor: "rgba(124,58,237,0.30)"
  },
  glowB: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    left: -30,
    bottom: -50,
    backgroundColor: "rgba(59,130,246,0.14)"
  },
  kicker: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  title: {
    color: palette.cream,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800"
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 23
  },
  playerDock: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 86
  }
});
