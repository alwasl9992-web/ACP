import { assertRuntimeConfigured, runtimeConfig } from "../config/runtime";
import type { AuthSession } from "../types/platform";

const SESSION_KEY = "acp.auth.session.v1";

export class SupabaseHttpError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "SupabaseHttpError";
    this.status = status;
    this.details = details;
  }
}

export function loadStoredSession(): AuthSession | null {
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession | null): void {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function resolveAccessToken(explicitToken?: string): string | undefined {
  return explicitToken ?? loadStoredSession()?.access_token;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  assertRuntimeConfigured();

  const headers = new Headers(init.headers);
  headers.set("apikey", runtimeConfig.supabaseAnonKey);
  headers.set("Accept", "application/json");

  const token = resolveAccessToken(accessToken);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${runtimeConfig.supabaseUrl}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Supabase request failed with status ${response.status}`;
    throw new SupabaseHttpError(message, response.status, payload);
  }

  return payload as T;
}

export function buildRestQuery(
  table: string,
  parameters: Record<string, string | number | boolean | undefined> = {},
): string {
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const suffix = query.toString();
  return `/rest/v1/${encodeURIComponent(table)}${suffix ? `?${suffix}` : ""}`;
}

export async function restSelect<T>(
  table: string,
  parameters: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  return supabaseRequest<T[]>(
    buildRestQuery(table, { select: "*", ...parameters }),
    { method: "GET" },
  );
}

export async function restInsert<T extends object>(
  table: string,
  value: Partial<T> | Partial<T>[],
): Promise<T[]> {
  return supabaseRequest<T[]>(buildRestQuery(table), {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });
}

export async function restUpdate<T extends object>(
  table: string,
  filters: Record<string, string>,
  value: Partial<T>,
): Promise<T[]> {
  const parameters = Object.fromEntries(
    Object.entries(filters).map(([key, item]) => [key, `eq.${item}`]),
  );
  return supabaseRequest<T[]>(buildRestQuery(table, parameters), {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });
}

export async function restDelete(
  table: string,
  filters: Record<string, string>,
): Promise<void> {
  const parameters = Object.fromEntries(
    Object.entries(filters).map(([key, item]) => [key, `eq.${item}`]),
  );
  await supabaseRequest<unknown>(buildRestQuery(table, parameters), {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
