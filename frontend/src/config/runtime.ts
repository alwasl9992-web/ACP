import { stagingBrowserConfig } from "./staging.generated";

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

const hostname = window.location.hostname.toLowerCase();
const canonicalStagingDeployment =
  hostname === "acp-85qn.vercel.app" ||
  (hostname.startsWith("acp-85qn-") && hostname.endsWith(".vercel.app"));
const generatedStagingConfigured = Boolean(
  stagingBrowserConfig.supabaseUrl && stagingBrowserConfig.supabaseAnonKey,
);
const useGeneratedStagingConfig =
  canonicalStagingDeployment && generatedStagingConfigured;

const supabaseUrl = useGeneratedStagingConfig
  ? normalizeUrl(stagingBrowserConfig.supabaseUrl)
  : normalizeUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = useGeneratedStagingConfig
  ? stagingBrowserConfig.supabaseAnonKey.trim()
  : (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const appUrl = useGeneratedStagingConfig
  ? normalizeUrl(stagingBrowserConfig.appUrl)
  : normalizeUrl(import.meta.env.VITE_APP_URL) || window.location.origin;
const rawEnvironment = useGeneratedStagingConfig
  ? stagingBrowserConfig.environment
  : (import.meta.env.VITE_APP_ENV ?? "development").trim();

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
