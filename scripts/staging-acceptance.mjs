import assert from "node:assert/strict";

const env = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const url = env("STAGING_SUPABASE_URL").replace(/\/+$/, "");
const key = env("STAGING_SUPABASE_ANON_KEY");
const email = env("STAGING_ADMIN_EMAIL");
const password = env("STAGING_ADMIN_PASSWORD");
const ref = process.env.STAGING_SUPABASE_PROJECT_REF || "jvxodxfheftylolhqoip";
const appUrl = process.env.STAGING_APP_URL?.replace(/\/+$/, "") || "";
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();

assert.equal(new URL(url).hostname, `${ref}.supabase.co`);
assert.ok(password.length >= 8);

let token = "";
let userId = "";
let projectId = "";
let passed = 0;

const parse = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

async function api(path, {
  method = "GET",
  body,
  bearer,
  statuses = [200],
  headers = {},
} = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = parse(text);
  if (!statuses.includes(response.status)) {
    throw new Error(`${method} ${path}: HTTP ${response.status}`);
  }
  return { response, payload, text };
}

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function cleanup() {
  if (!projectId || !token) return;
  try {
    await api(`/rest/v1/projects?id=eq.${projectId}`, {
      method: "DELETE",
      bearer: token,
      statuses: [200, 204],
      headers: { Prefer: "return=minimal" },
    });
    console.log("CLEANUP acceptance records removed");
  } catch {
    console.error("CLEANUP failed");
    process.exitCode = 1;
  }
}

try {
  await test("Supabase health", async () => {
    const { payload } = await api("/auth/v1/health", {
      bearer: key,
      statuses: [200],
    });
    assert.ok(payload && typeof payload === "object");
  });

  await test("Anonymous profile isolation", async () => {
    const { response, payload } = await api(
      "/rest/v1/profiles?select=id&limit=1",
      {
        bearer: key,
        statuses: [200, 401, 403],
      },
    );
    if (response.status === 200) assert.deepEqual(payload, []);
  });

  await test("Anonymous project write denied", async () => {
    const { response } = await api("/rest/v1/projects", {
      method: "POST",
      bearer: key,
      body: { code: `ACP-ANON-${runId}`, name: "Rejected QA record" },
      statuses: [400, 401, 403],
    });
    assert.ok(response.status >= 400);
  });

  await test("System Admin login", async () => {
    const { payload } = await api("/auth/v1/token?grant_type=password", {
      method: "POST",
      bearer: key,
      body: { email, password },
    });
    assert.equal(typeof payload.access_token, "string");
    assert.equal(typeof payload.user?.id, "string");
    token = payload.access_token;
    userId = payload.user.id;
  });

  await test("Active System Admin profile", async () => {
    const { payload } = await api(
      `/rest/v1/profiles?id=eq.${userId}&select=id,role,is_active&limit=1`,
      { bearer: token },
    );
    assert.equal(payload.length, 1);
    assert.equal(payload[0].role, "system_admin");
    assert.equal(payload[0].is_active, true);
  });

  const unique = `${runId}-${Date.now()}`;

  await test("Project, building and report CRUD", async () => {
    const { payload: projects } = await api("/rest/v1/projects", {
      method: "POST",
      bearer: token,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        code: `ACP-QA-${unique}`,
        name: "ACP Staging Acceptance",
        city: "Riyadh",
        created_by: userId,
      },
    });
    projectId = projects[0].id;

    const { payload: buildings } = await api("/rest/v1/buildings", {
      method: "POST",
      bearer: token,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        project_id: projectId,
        code: "QA-B01",
        name: "Acceptance Building",
      },
    });
    assert.equal(buildings.length, 1);

    const { payload: reports } = await api("/rest/v1/reports", {
      method: "POST",
      bearer: token,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        project_id: projectId,
        report_no: `QA-${unique}`,
        report_type: "acceptance",
        title: "Staging acceptance report",
        payload: { automated: true, runId },
        created_by: userId,
      },
    });
    assert.equal(reports.length, 1);

    const { payload: updated } = await api(`/rest/v1/projects?id=eq.${projectId}`, {
      method: "PATCH",
      bearer: token,
      headers: { Prefer: "return=representation" },
      body: { name: "ACP Staging Acceptance Verified" },
    });
    assert.equal(updated[0].name, "ACP Staging Acceptance Verified");
  });

  await test("Audit log captures mutations", async () => {
    const { payload } = await api(
      `/rest/v1/audit_logs?entity_id=eq.${projectId}&entity_type=eq.projects&select=action`,
      { bearer: token },
    );
    const actions = new Set(payload.map(({ action }) => action));
    assert.ok(actions.has("INSERT"));
    assert.ok(actions.has("UPDATE"));
  });

  await test("QR Edge Function", async () => {
    const data = encodeURIComponent(`${url}/qa/${runId}`);
    const { response, text } = await api(
      `/functions/v1/report-qr?data=${data}&format=svg`,
      { bearer: token },
    );
    assert.match(response.headers.get("content-type") || "", /image\/svg\+xml/i);
    assert.match(text, /<svg[\s>]/i);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  });

  await test("Deployed frontend and offline shell", async () => {
    if (!appUrl) {
      console.log("SKIP frontend URL is not configured");
      return;
    }
    const page = await fetch(appUrl);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(html, /id=["']root["']/i);
    for (const header of [
      "strict-transport-security",
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
    ]) {
      assert.ok(page.headers.get(header), `Missing ${header}`);
    }
    const manifest = await fetch(`${appUrl}/manifest.webmanifest`);
    assert.equal(manifest.status, 200);
    assert.match(await manifest.text(), /"display"\s*:\s*"standalone"/i);
    const worker = await fetch(`${appUrl}/sw.js`);
    assert.equal(worker.status, 200);
    assert.match(await worker.text(), /acp-shell-v1/);
  });

  await cleanup();
  projectId = "";
  console.log(`ACP staging acceptance passed: ${passed} checks`);
} catch (error) {
  await cleanup();
  console.error(`ACP staging acceptance failed: ${error.message}`);
  process.exitCode = 1;
}
