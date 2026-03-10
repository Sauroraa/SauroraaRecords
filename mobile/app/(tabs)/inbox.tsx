import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppShell } from "@/components/app-shell";
import { SectionHeader } from "@/components/section-header";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { MobileNotification, mobileNotifications, mobileReleases } from "@/lib/mock-data";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

export default function InboxTab() {
  const { t, session } = useAppState();
  const [notifications, setNotifications] = useState<MobileNotification[]>(mobileNotifications);

  useEffect(() => {
    if (!session.accessToken) return;
    let mounted = true;
    fetchNotifications(session.accessToken)
      .then((items) => {
        if (!mounted) return;
        setNotifications(items.map((item) => ({
          id: String(item.id),
          title: String(item.type ?? "Notification"),
          body: String(item.body ?? ""),
          time: new Date(String(item.createdAt ?? Date.now())).toLocaleDateString("fr-BE"),
          unread: !Boolean(item.isRead)
        })));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [session.accessToken]);

  async function handleMarkRead(id: string) {
    if (!session.accessToken) return;
    await markNotificationRead(id, session.accessToken).catch(() => {});
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
  }

  async function handleMarkAll() {
    if (!session.accessToken) return;
    await markAllNotificationsRead(session.accessToken).catch(() => {});
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }

  return (
    <AppShell
      title={t("inboxTitle")}
      subtitle={t("inboxSubtitle")}
      currentTrack={mobileReleases[0]}
    >
      <SectionHeader title={t("notifications")} action={t("markAll")} />
      <Pressable onPress={() => void handleMarkAll()}>
        <Text style={styles.markAll}>{t("markAll")}</Text>
      </Pressable>
      <View style={styles.list}>
        {notifications.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => void handleMarkRead(item.id)}>
            <View style={[styles.dot, item.unread ? styles.dotUnread : null]} />
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.text}>{item.body}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  },
  markAll: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "700"
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  dotUnread: {
    backgroundColor: palette.accentSoft
  },
  body: {
    flex: 1,
    gap: 6
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  title: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    fontWeight: "700"
  },
  time: {
    color: palette.dim,
    fontSize: 11
  },
  text: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19
  }
});
