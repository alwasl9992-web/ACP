import assert from "node:assert/strict";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const managementToken = required("SUPABASE_ACCESS_TOKEN");
const projectRef = required("STAGING_SUPABASE_PROJECT_REF");
const supabaseUrl = required("STAGING_SUPABASE_URL").replace(/\/+$/, "");
const anonKey = required("STAGING_SUPABASE_ANON_KEY");
const email = required("STAGING_ADMIN_EMAIL").toLowerCase();
const password = required("STAGING_ADMIN_PASSWORD");

assert.equal(new URL(supabaseUrl).hostname, `${projectRef}.supabase.co`);
assert.ok(password.length >= 8, "System Admin password must contain at least 8 characters");

async function request(url, {
  method = "GET",
  headers = {},
  body,
  statuses = [200],
} = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!statuses.includes(response.status)) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `HTTP ${response.status}`;
    throw new Error(`${method} ${new URL(url).pathname}: ${message}`);
  }

  return { response, payload };
}

function selectAdminKey(keys) {
  if (!Array.isArray(keys)) return "";
  const candidates = keys.filter((item) => item && typeof item.api_key === "string");
  return (
    candidates.find((item) => item.type === "secret")?.api_key ||
    candidates.find((item) => item.name === "service_role")?.api_key ||
    candidates.find((item) => String(item.name || "").includes("service"))?.api_key ||
    ""
  );
}

const managementHeaders = {
  Authorization: `Bearer ${managementToken}`,
};

const { payload: keyPayload } = await request(
  `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
  { headers: managementHeaders },
);
const adminKey = selectAdminKey(keyPayload);
assert.ok(adminKey, "No server-side Supabase API key is available for Staging");

const adminHeaders = {
  apikey: adminKey,
  Authorization: `Bearer ${adminKey}`,
};

const { payload: usersPayload } = await request(
  `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
  { headers: adminHeaders },
);
const users = Array.isArray(usersPayload?.users) ? usersPayload.users : [];
let user = users.find((item) => String(item.email || "").toLowerCase() === email);

if (!user) {
  const { payload } = await request(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    statuses: [200, 201],
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "ACP System Administrator" },
    },
  });
  user = payload?.user || payload;
  console.log("RECONCILE Auth user created");
} else {
  const { payload } = await request(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers: adminHeaders,
    statuses: [200],
    body: {
      password,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: user.user_metadata?.full_name || "ACP System Administrator",
      },
    },
  });
  user = payload?.user || payload;
  console.log("RECONCILE Auth user credentials verified");
}

assert.equal(typeof user?.id, "string", "Supabase Auth did not return a user id");
assert.match(user.id, /^[0-9a-f-]{36}$/i, "Supabase Auth returned an invalid user id");

await request(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: managementHeaders,
    statuses: [200, 201],
    body: {
      query: `
        insert into public.profiles (id, full_name, role, is_active)
        values ($1::uuid, $2::text, 'system_admin'::public.app_role, true)
        on conflict (id) do update
          set role = 'system_admin'::public.app_role,
              is_active = true,
              updated_at = now()
        returning id, role::text, is_active;
      `,
      parameters: [
        user.id,
        user.user_metadata?.full_name || "ACP System Administrator",
      ],
      read_only: false,
    },
  },
);
console.log("RECONCILE System Admin profile promoted and activated");

const { payload: login } = await request(
  `${supabaseUrl}/auth/v1/token?grant_type=password`,
  {
    method: "POST",
    headers: { apikey: anonKey },
    statuses: [200],
    body: { email, password },
  },
);
assert.equal(typeof login?.access_token, "string", "System Admin login did not return an access token");
assert.equal(login?.user?.id, user.id, "Authenticated user does not match reconciled user");

const { payload: verifiedProfiles } = await request(
  `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,is_active&limit=1`,
  {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${login.access_token}`,
    },
  },
);
assert.equal(verifiedProfiles?.[0]?.role, "system_admin");
assert.equal(verifiedProfiles?.[0]?.is_active, true);

console.log("RECONCILE Staging System Admin login and authorization verified");
