import { createClient } from "npm:@supabase/supabase-js@2";

type AppRole =
  | "system_admin"
  | "project_manager"
  | "supervisor"
  | "employee"
  | "reader";

interface InviteRequest {
  email: string;
  fullName: string;
  role: AppRole;
  redirectTo?: string;
}

const approvedRoles = new Set<AppRole>([
  "system_admin",
  "project_manager",
  "supervisor",
  "employee",
  "reader",
]);

function readNamedKey(environmentName: string, fallbackName: string): string {
  const raw = Deno.env.get(environmentName);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed)[0];
      if (first) return first;
    } catch {
      if (raw.trim()) return raw.trim();
    }
  }
  return Deno.env.get(fallbackName) ?? "";
}

function json(body: unknown, status: number, origin: string): Response {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (request) => {
  const allowedOrigin = Deno.env.get("ACP_APP_ORIGIN") ?? "*";
  const requestOrigin = request.headers.get("origin") ?? "";
  const responseOrigin =
    allowedOrigin === "*" || requestOrigin === allowedOrigin
      ? allowedOrigin === "*"
        ? "*"
        : requestOrigin
      : allowedOrigin;

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": responseOrigin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, responseOrigin);
  }

  if (allowedOrigin !== "*" && requestOrigin !== allowedOrigin) {
    return json({ error: "Origin not allowed" }, 403, responseOrigin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = readNamedKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_ANON_KEY",
  );
  const secretKey = readNamedKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const authorization = request.headers.get("authorization") ?? "";

  if (
    !supabaseUrl ||
    !publishableKey ||
    !secretKey ||
    !authorization.startsWith("Bearer ")
  ) {
    return json(
      { error: "Function authentication is not configured" },
      500,
      responseOrigin,
    );
  }

  try {
    const payload = (await request.json()) as InviteRequest;
    const email = payload.email?.trim().toLowerCase();
    const fullName = payload.fullName?.trim();

    if (!email || !fullName || !approvedRoles.has(payload.role)) {
      return json({ error: "Invalid invitation payload" }, 400, responseOrigin);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Unauthenticated" }, 401, responseOrigin);
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role,is_active")
      .eq("id", userData.user.id)
      .single();

    if (
      profileError ||
      !callerProfile?.is_active ||
      callerProfile.role !== "system_admin"
    ) {
      return json(
        { error: "Administrator permission required" },
        403,
        responseOrigin,
      );
    }

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: payload.redirectTo,
      });

    if (inviteError || !inviteData.user) {
      return json(
        { error: inviteError?.message ?? "Invitation failed" },
        400,
        responseOrigin,
      );
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: fullName,
        role: payload.role,
        is_active: true,
      })
      .eq("id", inviteData.user.id);

    if (updateError) {
      return json({ error: updateError.message }, 500, responseOrigin);
    }

    return json(
      {
        id: inviteData.user.id,
        email,
        role: payload.role,
        invited: true,
      },
      201,
      responseOrigin,
    );
  } catch (error) {
    console.error("invite-user failed", error);
    return json(
      { error: "Unexpected invitation error" },
      500,
      responseOrigin,
    );
  }
});
