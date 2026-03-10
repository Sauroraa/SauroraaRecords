import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Locale } from "@/lib/i18n";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

const locales: Array<{ id: Locale; label: string; subtitle: string }> = [
  { id: "fr", label: "Francais", subtitle: "Interface principale en francais" },
  { id: "en", label: "English", subtitle: "Full app in English" },
  { id: "nl", label: "Nederlands", subtitle: "Volledige app in het Nederlands" }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { locale, setLocale, completeOnboarding, t } = useAppState();

  async function proceed(mode: "login" | "register") {
    await completeOnboarding();
    router.replace({ pathname: "/auth" as never, params: { mode } });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />
        <Text style={styles.kicker}>{t("installReady")}</Text>
        <Text style={styles.title}>{t("onboardingTitle")}</Text>
        <Text style={styles.body}>{t("onboardingBody")}</Text>
      </View>

      <View style={styles.card}>
        {locales.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void setLocale(item.id)}
            style={[styles.localeCard, locale === item.id ? styles.localeCardActive : null]}
          >
            <Text style={styles.localeTitle}>{item.label}</Text>
            <Text style={styles.localeSubtitle}>{item.subtitle}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.primaryButton} onPress={() => void proceed("login")}>
          <Text style={styles.primaryButtonText}>{t("alreadyAccount")}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => void proceed("register")}>
          <Text style={styles.secondaryButtonText}>{t("createAccount")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    padding: 20,
    gap: 18,
    justifyContent: "center"
  },
  hero: {
    overflow: "hidden",
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
    backgroundColor: "#0f0f18",
    gap: 10
  },
  glowLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    right: -30,
    top: -70,
    backgroundColor: "rgba(124,58,237,0.34)"
  },
  glowSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 999,
    left: -30,
    bottom: -40,
    backgroundColor: "rgba(59,130,246,0.12)"
  },
  kicker: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  title: {
    color: palette.cream,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "800"
  },
  body: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22
  },
  card: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12
  },
  localeCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgSoft
  },
  localeCardActive: {
    borderColor: "rgba(139,92,246,0.5)",
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  localeTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  },
  localeSubtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4
  },
  primaryButton: {
    marginTop: 6,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: palette.accent
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700"
  }
});
