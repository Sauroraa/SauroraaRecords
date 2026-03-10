import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { palette } from "@/lib/theme";
import { AppProvider, useAppState } from "@/providers/app-provider";
import { PlayerProvider } from "@/providers/player-provider";

export default function RootLayout() {
  return (
    <AppProvider>
      <PlayerProvider>
        <RootNavigator />
      </PlayerProvider>
    </AppProvider>
  );
}

function RootNavigator() {
  const { t } = useAppState();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.bg }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ title: t("loginTitle") }} />
        <Stack.Screen name="dashboard" options={{ title: t("dashboard") }} />
        <Stack.Screen name="login" options={{ title: t("loginTitle") }} />
        <Stack.Screen name="releases/[slug]" options={{ title: "Release" }} />
      </Stack>
    </>
  );
}
