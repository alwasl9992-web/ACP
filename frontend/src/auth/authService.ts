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

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  return role ? rolePermissions[role].has(permission) : false;
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
    return null;
  }
}

export async function signOut(): Promise<void> {
  const session = loadStoredSession();
  try {
    if (session?.access_token && runtimeConfig.configured) {
      await supabaseRequest<unknown>(
        "/auth/v1/logout",
        { method: "POST" },
        session.access_token,
      );
    }
  } finally {
    storeSession(null);
  }
}

export async function getCurrentProfile(
  userId: string,
): Promise<PlatformProfile | null> {
  const profiles = await restSelect<PlatformProfile>("profiles", {
    id: `eq.${userId}`,
    limit: 1,
  });
  return profiles[0] ?? null;
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
