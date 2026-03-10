import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/section-header";
import { loadMobileCatalog } from "@/lib/mobile-data";
import { MobileArtist, MobileRelease, mobileArtists, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

export default function ProfileTab() {
  const router = useRouter();
  const { session, signOut, t } = useAppState();
  const [featuredArtist, setFeaturedArtist] = useState<MobileArtist>(mobileArtists[0]);
  const [featuredTrack, setFeaturedTrack] = useState<MobileRelease>(mobileReleases[0]);
  const [releaseCount, setReleaseCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    loadMobileCatalog().then((catalog) => {
      if (!mounted) return;
      setFeaturedArtist(catalog.artists[0] ?? mobileArtists[0]);
      setFeaturedTrack(catalog.featuredTrack);
      setReleaseCount(catalog.releases.length);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      title={t("profileTitle")}
      subtitle={t("profileSubtitle")}
      currentTrack={featuredTrack}
    >
      <SectionHeader title={t("account")} action={session.user ? t("dashboard") : "Auth"} />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            {featuredArtist.avatarUrl ? (
              <Image source={{ uri: featuredArtist.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarText}>{featuredArtist.initials}</Text>
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{session.user?.email?.split("@")[0] ?? featuredArtist.name}</Text>
            <Text style={styles.meta}>{featuredArtist.genre} • Sauroraa ecosystem</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Metric label="Followers" value={featuredArtist.followers} />
          <Metric label="Tracks" value={`${releaseCount}`} />
          <Metric label="Featured" value={featuredTrack.trendScore.toString()} />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>{t("artistFocus")}</Text>
          <Text style={styles.noteText}>
            {featuredArtist.bio ?? "Profil artiste alimente directement depuis le catalogue SauroraaRecords pour garder la meme identite entre site et mobile."}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/dashboard" as never)}>
            <Text style={styles.primaryButtonText}>{t("openDashboard")}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
            <Text style={styles.secondaryButtonText}>{t("logout")}</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>{t("profileDashboardHint")}</Text>
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
  card: {
    gap: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceRaised,
    overflow: "hidden"
  },
  avatarImage: {
    width: "100%",
    height: "100%"
  },
  avatarText: {
    color: palette.accentSoft,
    fontSize: 22,
    fontWeight: "800"
  },
  body: {
    flex: 1
  },
  name: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800"
  },
  meta: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 4
  },
  stats: {
    flexDirection: "row",
    gap: 10
  },
  metric: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)"
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
  note: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(124,58,237,0.08)"
  },
  noteTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  },
  noteText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: palette.accent
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border
  },
  secondaryButtonText: {
    color: palette.text,
    fontWeight: "700"
  },
  hint: {
    color: palette.dim,
    fontSize: 12,
    lineHeight: 18
  }
});
