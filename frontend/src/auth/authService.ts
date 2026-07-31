import { runtimeConfig } from "../config/runtime";
import {
  loadStoredSession,
  restSelect,
  storeSession,
  supabaseRequest,
} from "../lib/supabaseHttp";
import type {
  AppRole,
  AuthSession,
  PlatformProfile,
} from "../types/platform";

export type Permission =
  | "system.manage"
  | "project.create"
  | "project.manage"
  | "record.create"
  | "record.update"
  | "record.delete"
  | "report.create"
  | "report.approve"
  | "report.read"
  | "audit.read";

interface CachedProfile {
  profile: PlatformProfile;
  verifiedAt: string;
}

const PROFILE_KEY = "acp.auth.profile.v1";
const OFFLINE_PROFILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  system_admin: new Set<Permission>([
    "system.manage",
    "project.create",
    "project.manage",
    "record.create",
    "record.update",
    "record.delete",
    "report.create",
    "report.approve",
    "report.read",
    "audit.read",
  ]),
  project_manager: new Set<Permission>([
    "project.manage",
    "record.create",
    "record.update",
    "record.delete",
    "report.create",
    "report.approve",
    "report.read",
  ]),
  supervisor: new Set<Permission>([
    "record.create",
    "record.update",
    "report.create",
    "report.read",
  ]),
  employee: new Set<Permission>([
    "record.create",
    "report.create",
    "report.read",
  ]),
  reader: new Set<Permission>(["report.read"]),
};

export function can(
  role: AppRole | null | undefined,
  permission: Permission,
): boolean {
  return role ? rolePermissions[role].has(permission) : false;
}

function storeProfile(profile: PlatformProfile | null): void {
  if (!profile) {
    window.localStorage.removeItem(PROFILE_KEY);
    return;
  }

  window.localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      profile,
      verifiedAt: new Date().toISOString(),
    } satisfies CachedProfile),
  );
}

export function loadVerifiedOfflineProfile(
  userId: string,
): PlatformProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedProfile;
    const age = Date.now() - new Date(cached.verifiedAt).getTime();
    if (
      cached.profile.id !== userId ||
      !cached.profile.is_active ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > OFFLINE_PROFILE_MAX_AGE_MS
    ) {
      return null;
    }
    return cached.profile;
  } catch {
    window.localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthSession> {
  const session = await supabaseRequest<AuthSession>(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    },
  );
  storeSession(session);
  return session;
}

export async function refreshSession(): Promise<AuthSession | null> {
  const current = loadStoredSession();
  if (!current?.refresh_token || !runtimeConfig.configured) return null;
  if (!navigator.onLine) return current;

  try {
    const session = await supabaseRequest<AuthSession>(
      "/auth/v1/token?grant_type=refresh_token",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      },
    );
    storeSession(session);
    return session;
  } catch {
    storeSession(null);
    storeProfile(null);
    return null;
  }
}

export async function signOut(): Promise<void> {
  const session = loadStoredSession();
  try {
    if (session?.access_token && runtimeConfig.configured && navigator.onLine) {
      await supabaseRequest<unknown>(
        "/auth/v1/logout",
        { method: "POST" },
        session.access_token,
      );
    }
  } catch {
    // Local sign-out must complete even if the remote endpoint is unavailable.
  } finally {
    storeSession(null);
    storeProfile(null);
  }
}

export async function getCurrentProfile(
  userId: string,
): Promise<PlatformProfile | null> {
  const cached = loadVerifiedOfflineProfile(userId);
  if (!navigator.onLine) return cached;

  try {
    const profiles = await restSelect<PlatformProfile>("profiles", {
      id: `eq.${userId}`,
      limit: 1,
    });
    const profile = profiles[0] ?? null;
    storeProfile(profile);
    return profile;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export function createDemoProfile(): PlatformProfile {
  const timestamp = new Date().toISOString();
  return {
    id: "00000000-0000-0000-0000-000000000001",
    full_name: "مدير نظام ACP التجريبي",
    employee_no: "ACP-DEMO-001",
    phone: null,
    role: "system_admin",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
