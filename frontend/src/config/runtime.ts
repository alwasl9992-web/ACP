export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
  environment: "development" | "staging" | "production";
  configured: boolean;
}

function normalizeUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "");
}

const supabaseUrl = normalizeUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const appUrl = normalizeUrl(import.meta.env.VITE_APP_URL) || window.location.origin;
const rawEnvironment = (import.meta.env.VITE_APP_ENV ?? "development").trim();

const environment: RuntimeConfig["environment"] =
  rawEnvironment === "production" || rawEnvironment === "staging"
    ? rawEnvironment
    : "development";

export const runtimeConfig: RuntimeConfig = Object.freeze({
  supabaseUrl,
  supabaseAnonKey,
  appUrl,
  environment,
  configured: Boolean(supabaseUrl && supabaseAnonKey),
});

export function assertRuntimeConfigured(): void {
  if (!runtimeConfig.configured) {
    throw new Error(
      "ACP cloud connection is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}
