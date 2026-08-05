import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { runtimeConfig } from "../config/runtime";
import { loadStoredSession } from "../lib/supabaseHttp";
import type {
  AuthSession,
  AuthState,
  PlatformProfile,
} from "../types/platform";
import {
  createDemoProfile,
  getCurrentProfile,
  refreshSession,
  signInWithPassword,
  signOut as signOutRequest,
} from "./authService";

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function requireActiveProfile(
  nextSession: AuthSession,
): Promise<PlatformProfile> {
  const nextProfile = await getCurrentProfile(nextSession.user.id);
  if (!nextProfile?.is_active) {
    throw new Error("الحساب غير مفعل أو لا يملك ملف صلاحيات.");
  }
  return nextProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<PlatformProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const demoMode = !runtimeConfig.configured;

  const loadProfile = useCallback(async (nextSession: AuthSession | null) => {
    if (!nextSession) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await requireActiveProfile(nextSession);
      setProfile(nextProfile);
    } catch (error) {
      await signOutRequest();
      setSession(null);
      setProfile(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        if (demoMode) {
          if (!active) return;
          setProfile(createDemoProfile());
          setSession(null);
          return;
        }

        const stored = loadStoredSession();
        const current = stored ?? (await refreshSession());
        if (!active) return;
        setSession(current);
        if (current) await loadProfile(current);
      } finally {
        if (active) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [demoMode, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await signInWithPassword(email, password);

    try {
      const nextProfile = await requireActiveProfile(nextSession);
      setSession(nextSession);
      setProfile(nextProfile);
    } catch (error) {
      await signOutRequest();
      setSession(null);
      setProfile(null);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await signOutRequest();
      setSession(null);
      setProfile(demoMode ? createDemoProfile() : null);
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  const reloadProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configured: runtimeConfig.configured,
      demoMode,
      signIn,
      signOut,
      reloadProfile,
    }),
    [session, profile, loading, demoMode, signIn, signOut, reloadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
