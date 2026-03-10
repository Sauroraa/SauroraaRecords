import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthResponse,
  AuthUser,
  forgotPassword,
  LoginPayload,
  RegisterPayload,
  fetchAuthMe,
  login,
  logout as apiLogout,
  refreshSession,
  register
} from "@/lib/api";
import { Locale, translate } from "@/lib/i18n";
import { storageGet, storageRemove, storageSet } from "@/lib/storage";

type SessionState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AppContextValue = {
  hydrated: boolean;
  authBusy: boolean;
  locale: Locale;
  onboardingComplete: boolean;
  session: SessionState;
  setLocale: (locale: Locale) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (payload: AuthResponse) => Promise<void>;
  t: (key: string) => string;
};

const STORAGE_KEYS = {
  locale: "sauroraa.locale",
  onboarding: "sauroraa.onboarding",
  session: "sauroraa.session"
} as const;

const AppContext = createContext<AppContextValue | null>(null);

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    id: user.id ?? user.userId,
    userId: user.userId ?? user.id
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [session, setSessionState] = useState<SessionState>({
    user: null,
    accessToken: null,
    refreshToken: null
  });

  async function resolveSession(nextSession: SessionState) {
    if (nextSession.accessToken) {
      try {
        const user = await fetchAuthMe(nextSession.accessToken);
        const resolved = { ...nextSession, user: normalizeUser(user) };
        setSessionState(resolved);
        await storageSet(STORAGE_KEYS.session, JSON.stringify(resolved));
        return;
      } catch {
      }
    }

    if (nextSession.refreshToken) {
      const refreshed = await refreshSession(nextSession.refreshToken);
      const resolved = {
        user: normalizeUser(refreshed.user),
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken
      };
      setSessionState(resolved);
      await storageSet(STORAGE_KEYS.session, JSON.stringify(resolved));
      return;
    }

    setSessionState({ user: null, accessToken: null, refreshToken: null });
    await storageRemove(STORAGE_KEYS.session);
  }

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const [savedLocale, savedOnboarding, savedSession] = await Promise.all([
        storageGet(STORAGE_KEYS.locale),
        storageGet(STORAGE_KEYS.onboarding),
        storageGet(STORAGE_KEYS.session)
      ]);

      if (!mounted) return;

      if (savedLocale === "fr" || savedLocale === "en" || savedLocale === "nl") {
        setLocaleState(savedLocale);
      }

      setOnboardingComplete(savedOnboarding === "true");

      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession) as SessionState;
          const normalized: SessionState = {
            ...parsed,
            user: parsed.user ? normalizeUser(parsed.user) : null
          };
          setSessionState(normalized);
          try {
            await resolveSession(normalized);
          } catch {
            await storageRemove(STORAGE_KEYS.session);
            if (mounted) {
              setSessionState({ user: null, accessToken: null, refreshToken: null });
            }
          }
        } catch {
          await storageRemove(STORAGE_KEYS.session);
        }
      }

      if (mounted) setHydrated(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function persistSession(payload: AuthResponse) {
    const nextSession = {
      user: normalizeUser(payload.user),
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    };
    await resolveSession(nextSession);
  }

  async function handleSignIn(payload: LoginPayload) {
    setAuthBusy(true);
    try {
      const response = await login(payload);
      await persistSession(response);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignUp(payload: RegisterPayload) {
    setAuthBusy(true);
    try {
      const response = await register(payload);
      await persistSession(response);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    try {
      if (session.accessToken) {
        await apiLogout(session.accessToken);
      }
    } catch {
    } finally {
      setSessionState({ user: null, accessToken: null, refreshToken: null });
      await storageRemove(STORAGE_KEYS.session);
      setAuthBusy(false);
    }
  }

  async function handlePasswordReset(email: string) {
    setAuthBusy(true);
    try {
      await forgotPassword(email);
    } finally {
      setAuthBusy(false);
    }
  }

  const value = useMemo<AppContextValue>(() => ({
    hydrated,
    authBusy,
    locale,
    onboardingComplete,
    session,
    setLocale: async (nextLocale) => {
      setLocaleState(nextLocale);
      await storageSet(STORAGE_KEYS.locale, nextLocale);
    },
    completeOnboarding: async () => {
      setOnboardingComplete(true);
      await storageSet(STORAGE_KEYS.onboarding, "true");
    },
    signIn: handleSignIn,
    signUp: handleSignUp,
    requestPasswordReset: handlePasswordReset,
    signOut: handleSignOut,
    setSession: persistSession,
    t: (key: string) => translate(locale, key)
  }), [authBusy, hydrated, locale, onboardingComplete, session]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used inside AppProvider");
  return context;
}
