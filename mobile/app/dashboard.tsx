import { useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  changeUserPassword,
  fetchMyArtistProfile,
  fetchMyArtistStats,
  fetchMyFollows,
  fetchMyOrders,
  fetchMyReleases,
  fetchNotifications,
  fetchUserProfile,
  markAllNotificationsRead,
  markNotificationRead,
  unfollowArtist,
  updateUserProfile
} from "@/lib/api";
import { normalizeAssetPath } from "@/lib/api";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

type DashboardTab = "purchases" | "following" | "notifications" | "profile" | "workspace";

export default function DashboardScreen() {
  const { hydrated, session, signOut, t } = useAppState();
  const [activeTab, setActiveTab] = useState<DashboardTab>("purchases");
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [follows, setFollows] = useState<Array<Record<string, unknown>>>([]);
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [artistProfile, setArtistProfile] = useState<Record<string, unknown> | null>(null);
  const [artistStats, setArtistStats] = useState<Record<string, unknown> | null>(null);
  const [artistReleases, setArtistReleases] = useState<Array<Record<string, unknown>>>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session.accessToken) return;
    let mounted = true;

    void (async () => {
      const token = session.accessToken!;
      const [ordersData, followsData, notificationsData, profileData] = await Promise.all([
        fetchMyOrders(token).catch(() => []),
        fetchMyFollows(token).catch(() => []),
        fetchNotifications(token).catch(() => []),
        fetchUserProfile(token).catch(() => null)
      ]);

      if (!mounted) return;

      setOrders(ordersData);
      setFollows(followsData);
      setNotifications(notificationsData);
      setProfile(profileData);
      setFirstName((profileData?.firstName as string | undefined) ?? "");
      setLastName((profileData?.lastName as string | undefined) ?? "");

      if (session.user?.role === "ARTIST") {
        const [artistData, statsData, releasesData] = await Promise.all([
          fetchMyArtistProfile(token).catch(() => null),
          fetchMyArtistStats(token).catch(() => null),
          fetchMyReleases(token).catch(() => [])
        ]);
        if (!mounted) return;
        setArtistProfile(artistData);
        setArtistStats(statsData);
        setArtistReleases(releasesData);
        setActiveTab("workspace");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session.accessToken, session.user?.role]);

  const tabs = useMemo(() => {
    const baseTabs: Array<{ id: DashboardTab; label: string }> = [
      { id: "purchases", label: t("purchases") },
      { id: "following", label: t("following") },
      { id: "notifications", label: t("notifications") },
      { id: "profile", label: t("profileSection") }
    ];

    if (session.user?.role === "ARTIST") {
      return [{ id: "workspace" as const, label: t("workspace") }, ...baseTabs];
    }

    return baseTabs;
  }, [session.user?.role, t]);

  if (!hydrated) return null;
  if (!session.user || !session.accessToken) return <Redirect href={"/auth" as never} />;

  async function saveProfile() {
    setSaving(true);
    try {
      const token = session.accessToken!;
      const updated = await updateUserProfile({ firstName, lastName }, token);
      setProfile(updated);
      if (newPassword.trim()) {
        await changeUserPassword(newPassword.trim(), token);
        setNewPassword("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUnfollow(artistId: string) {
    await unfollowArtist(artistId, session.accessToken!);
    setFollows((current) => current.filter((item) => item.id !== artistId));
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id, session.accessToken!);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(session.accessToken!);
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{t("dashboard")}</Text>
        <Text style={styles.title}>{session.user.email}</Text>
        <Text style={styles.body}>{t("dashboardBody")}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable key={tab.id} style={[styles.tabButton, activeTab === tab.id ? styles.tabButtonActive : null]} onPress={() => setActiveTab(tab.id)}>
            <Text style={styles.tabButtonText}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === "workspace" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("workspace")}</Text>
          <View style={styles.metricRow}>
            <Metric label="Downloads" value={`${Number(artistStats?.totalDownloads ?? 0)}`} />
            <Metric label="Releases" value={`${Number(artistStats?.totalReleases ?? artistReleases.length)}`} />
            <Metric label="Followers" value={`${Number(artistStats?.totalFollowers ?? 0)}`} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {(artistProfile?.displayName as string | undefined) ??
                (((artistProfile?.user as { email?: string } | undefined)?.email) ?? "Artist")}
            </Text>
            <Text style={styles.cardText}>{(artistProfile?.bio as string | undefined) ?? t("noData")}</Text>
          </View>
          <View style={styles.stack}>
            {artistReleases.length ? artistReleases.map((release) => (
              <View key={String(release.id)} style={styles.listCard}>
                <Text style={styles.listTitle}>{String(release.title ?? "Release")}</Text>
                <Text style={styles.listMeta}>
                  {String(release.genre ?? "Electronic")} • {String(((release._count as { comments?: number } | undefined)?.comments) ?? 0)} com
                </Text>
              </View>
            )) : <EmptyCard message={t("noData")} />}
          </View>
        </View>
      ) : null}

      {activeTab === "purchases" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("purchases")}</Text>
          <View style={styles.stack}>
            {orders.length ? orders.map((order) => (
              <View key={String(order.id)} style={styles.listCard}>
                <Text style={styles.listTitle}>€{Number(order.total ?? 0).toFixed(2)}</Text>
                <Text style={styles.listMeta}>{new Date(String(order.createdAt ?? Date.now())).toLocaleDateString("fr-BE")}</Text>
              </View>
            )) : <EmptyCard message={t("noData")} />}
          </View>
        </View>
      ) : null}

      {activeTab === "following" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("following")}</Text>
          <View style={styles.stack}>
            {follows.length ? follows.map((artist) => (
              <View key={String(artist.id)} style={styles.listRow}>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>
                    {String(artist.displayName ?? ((artist.user as { email?: string } | undefined)?.email) ?? "Artist")}
                  </Text>
                  <Text style={styles.listMeta}>
                    {String(((artist._count as { followers?: number } | undefined)?.followers) ?? 0)} followers
                  </Text>
                </View>
                <Pressable style={styles.inlineButton} onPress={() => void handleUnfollow(String(artist.id))}>
                  <Text style={styles.inlineButtonText}>Unfollow</Text>
                </Pressable>
              </View>
            )) : <EmptyCard message={t("noData")} />}
          </View>
        </View>
      ) : null}

      {activeTab === "notifications" ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("notifications")}</Text>
            <Pressable onPress={() => void handleMarkAll()}>
              <Text style={styles.link}>{t("markAll")}</Text>
            </Pressable>
          </View>
          <View style={styles.stack}>
            {notifications.length ? notifications.map((notification) => (
              <View key={String(notification.id)} style={styles.listRow}>
                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{String(notification.body ?? "Notification")}</Text>
                  <Text style={styles.listMeta}>{new Date(String(notification.createdAt ?? Date.now())).toLocaleDateString("fr-BE")}</Text>
                </View>
                {notification.isRead ? null : (
                  <Pressable style={styles.inlineButton} onPress={() => void handleMarkRead(String(notification.id))}>
                    <Text style={styles.inlineButtonText}>{t("unread")}</Text>
                  </Pressable>
                )}
              </View>
            )) : <EmptyCard message={t("noData")} />}
          </View>
        </View>
      ) : null}

      {activeTab === "profile" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profileSection")}</Text>
          <View style={styles.card}>
            <TextInput placeholder={t("firstName")} placeholderTextColor={palette.dim} style={styles.input} value={firstName} onChangeText={setFirstName} />
            <TextInput placeholder={t("lastName")} placeholderTextColor={palette.dim} style={styles.input} value={lastName} onChangeText={setLastName} />
            <TextInput placeholder={t("password")} placeholderTextColor={palette.dim} secureTextEntry style={styles.input} value={newPassword} onChangeText={setNewPassword} />
            <Pressable style={styles.primaryButton} onPress={() => void saveProfile()}>
              <Text style={styles.primaryButtonText}>{saving ? t("loading") : t("save")}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
              <Text style={styles.secondaryButtonText}>{t("logout")}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
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

function EmptyCard({ message }: { message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: palette.bg
  },
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8
  },
  kicker: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800"
  },
  body: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21
  },
  tabs: {
    gap: 10,
    paddingRight: 20
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  tabButtonActive: {
    backgroundColor: "rgba(124,58,237,0.12)",
    borderColor: "rgba(139,92,246,0.45)"
  },
  tabButtonText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700"
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "800"
  },
  link: {
    color: palette.accentSoft,
    fontSize: 13,
    fontWeight: "700"
  },
  metricRow: {
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
  stack: {
    gap: 12
  },
  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10
  },
  cardTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700"
  },
  cardText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20
  },
  listCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  listBody: {
    flex: 1,
    gap: 4
  },
  listTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700"
  },
  listMeta: {
    color: palette.dim,
    fontSize: 12
  },
  inlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  inlineButtonText: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: palette.bgSoft,
    color: palette.text
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  }
});
