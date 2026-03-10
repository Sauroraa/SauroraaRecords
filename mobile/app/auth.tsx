import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { RegisterPayload, UserRole } from "@/lib/api";
import { useAppState } from "@/providers/app-provider";
import { palette } from "@/lib/theme";

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const { authBusy, hydrated, session, signIn, signUp, requestPasswordReset, t } = useAppState();
  const [mode, setMode] = useState<"login" | "register">(params.mode === "register" ? "register" : "login");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("BE");
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [hasSociete, setHasSociete] = useState(false);
  const [societeName, setSocieteName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const screenCopy = useMemo(() => ({
    title: mode === "login" ? t("loginTitle") : t("registerTitle"),
    body: mode === "login" ? t("loginBody") : t("registerBody")
  }), [mode, t]);

  function isEmailValid(value: string): boolean {
    return /\S+@\S+\.\S+/.test(value);
  }

  if (hydrated && session.user) {
    return <Redirect href={"/dashboard" as never} />;
  }

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isEmailValid(normalizedEmail)) {
      Alert.alert(t("appName"), t("invalidEmail"));
      return;
    }

    if (!password || password.length < 8) {
      Alert.alert(t("appName"), t("shortPassword"));
      return;
    }

    try {
      setPending(true);
      if (mode === "login") {
        await signIn({ email: normalizedEmail, password });
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          Alert.alert(t("appName"), t("requiredNames"));
          return;
        }

        const payload: RegisterPayload = {
          email: normalizedEmail,
          password,
          role,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          dateOfBirth: dateOfBirth || undefined,
          addressLine1: addressLine1 || undefined,
          addressLine2: addressLine2 || undefined,
          postalCode: postalCode || undefined,
          city: city || undefined,
          country,
          hasSociete,
          societeName: hasSociete ? societeName || undefined : undefined,
          vatNumber: hasSociete ? vatNumber || undefined : undefined,
          billingAddress: hasSociete ? billingAddress || undefined : undefined
        };
        await signUp(payload);
      }
      router.replace("/dashboard" as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(t("appName"), message);
    } finally {
      setPending(false);
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isEmailValid(normalizedEmail)) {
      Alert.alert(t("appName"), t("invalidEmail"));
      return;
    }

    try {
      setPending(true);
      await requestPasswordReset(normalizedEmail);
      Alert.alert(t("appName"), t("resetPasswordSent"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(t("appName"), message);
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.glowLarge} />
        <View style={styles.glowSmall} />
        <Text style={styles.kicker}>{t("appName")}</Text>
        <Text style={styles.title}>{screenCopy.title}</Text>
        <Text style={styles.body}>{screenCopy.body}</Text>
        <Text style={styles.helper}>{t("authIntro")}</Text>
      </View>

      <View style={styles.switcher}>
        <Pressable style={[styles.switchButton, mode === "login" ? styles.switchButtonActive : null]} onPress={() => setMode("login")}>
          <Text style={styles.switchText}>{t("signIn")}</Text>
        </Pressable>
        <Pressable style={[styles.switchButton, mode === "register" ? styles.switchButtonActive : null]} onPress={() => setMode("register")}>
          <Text style={styles.switchText}>{t("signUp")}</Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        {mode === "register" ? (
          <>
            <TextInput placeholder={t("firstName")} placeholderTextColor={palette.dim} style={styles.input} value={firstName} onChangeText={setFirstName} />
            <TextInput placeholder={t("lastName")} placeholderTextColor={palette.dim} style={styles.input} value={lastName} onChangeText={setLastName} />
            <TextInput placeholder={t("dateOfBirth")} placeholderTextColor={palette.dim} style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} />
          </>
        ) : null}

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder={t("email")}
          placeholderTextColor={palette.dim}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          secureTextEntry
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={t("password")}
          placeholderTextColor={palette.dim}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {mode === "register" ? (
          <>
            <TextInput placeholder={t("addressLine1")} placeholderTextColor={palette.dim} style={styles.input} value={addressLine1} onChangeText={setAddressLine1} />
            <TextInput placeholder={t("addressLine2")} placeholderTextColor={palette.dim} style={styles.input} value={addressLine2} onChangeText={setAddressLine2} />
            <TextInput placeholder={t("postalCode")} placeholderTextColor={palette.dim} style={styles.input} value={postalCode} onChangeText={setPostalCode} />
            <TextInput placeholder={t("city")} placeholderTextColor={palette.dim} style={styles.input} value={city} onChangeText={setCity} />
            <TextInput placeholder={t("country")} placeholderTextColor={palette.dim} style={styles.input} value={country} onChangeText={setCountry} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t("companyToggle")}</Text>
              <Switch value={hasSociete} onValueChange={setHasSociete} trackColor={{ false: palette.surfaceRaised, true: palette.accent }} thumbColor="#fff" />
            </View>
            <View style={styles.roleRow}>
              <Pressable style={[styles.roleCard, role === "CLIENT" ? styles.roleCardActive : null]} onPress={() => setRole("CLIENT")}>
                <Text style={styles.roleTitle}>{t("roleClient")}</Text>
              </Pressable>
              <Pressable style={[styles.roleCard, role === "ARTIST" ? styles.roleCardActive : null]} onPress={() => setRole("ARTIST")}>
                <Text style={styles.roleTitle}>{t("roleArtist")}</Text>
              </Pressable>
            </View>
            {hasSociete ? (
              <>
                <TextInput placeholder={t("companyName")} placeholderTextColor={palette.dim} style={styles.input} value={societeName} onChangeText={setSocieteName} />
                <TextInput placeholder={t("vatNumber")} placeholderTextColor={palette.dim} style={styles.input} value={vatNumber} onChangeText={setVatNumber} />
                <TextInput placeholder={t("billingAddress")} placeholderTextColor={palette.dim} style={styles.input} value={billingAddress} onChangeText={setBillingAddress} />
              </>
            ) : null}
          </>
        ) : null}

        <Pressable disabled={pending || authBusy} onPress={() => void submit()} style={[styles.primaryButton, pending || authBusy ? styles.primaryButtonDisabled : null]}>
          <Text style={styles.primaryButtonText}>{pending || authBusy ? t("loading") : mode === "login" ? t("signIn") : t("signUp")}</Text>
        </Pressable>

        {mode === "login" ? (
          <Pressable disabled={pending || authBusy} onPress={() => void handleForgotPassword()}>
            <Text style={styles.secondaryLinkText}>{t("forgotPassword")}</Text>
          </Pressable>
        ) : null}

        <Pressable disabled={pending || authBusy} onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={styles.linkText}>{mode === "login" ? t("switchToRegister") : t("switchToLogin")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    gap: 18,
    backgroundColor: palette.bg,
    minHeight: "100%"
  },
  hero: {
    overflow: "hidden",
    padding: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
    backgroundColor: "#0f0f18",
    gap: 10
  },
  glowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    right: -20,
    top: -50,
    backgroundColor: "rgba(124,58,237,0.34)"
  },
  glowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    left: -30,
    bottom: -40,
    backgroundColor: "rgba(59,130,246,0.12)"
  },
  kicker: {
    color: palette.accentSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: palette.cream,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800"
  },
  body: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21
  },
  helper: {
    color: palette.dim,
    fontSize: 12,
    lineHeight: 18
  },
  switcher: {
    flexDirection: "row",
    gap: 8
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  switchButtonActive: {
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  switchText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700"
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 18,
    gap: 12
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
  roleRow: {
    flexDirection: "row",
    gap: 10
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2
  },
  toggleLabel: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
    paddingRight: 12
  },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgSoft
  },
  roleCardActive: {
    borderColor: "rgba(139,92,246,0.45)",
    backgroundColor: "rgba(124,58,237,0.12)"
  },
  roleTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "700"
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  primaryButtonDisabled: {
    opacity: 0.72
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700"
  },
  linkText: {
    color: palette.accentSoft,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6
  },
  secondaryLinkText: {
    color: palette.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4
  }
});
