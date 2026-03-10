import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

const glyphs: Record<string, string> = {
  home: "◉",
  search: "⌕",
  library: "▣",
  inbox: "✦",
  profile: "◎"
};

export default function TabsLayout() {
  const { t } = useAppState();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 20,
          height: 66,
          paddingTop: 8,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: "rgba(13,13,18,0.96)"
        },
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.dim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        },
        tabBarIcon: ({ color }) => (
          // eslint-disable-next-line react-native/no-inline-styles
          <TabsIcon glyph={glyphs[route.name] ?? "•"} color={color} />
        )
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: t("results") }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="inbox" options={{ title: t("notifications") }} />
      <Tabs.Screen name="profile" options={{ title: t("profileSection") }} />
    </Tabs>
  );
}

function TabsIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ color, fontSize: 15 }}>{glyph}</Text>;
}
