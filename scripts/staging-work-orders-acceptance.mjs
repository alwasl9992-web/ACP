import assert from "node:assert/strict";

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const supabaseUrl = requiredEnv("STAGING_SUPABASE_URL").replace(/\/+$/, "");
const anonKey = requiredEnv("STAGING_SUPABASE_ANON_KEY");
const adminEmail = requiredEnv("STAGING_ADMIN_EMAIL");
const adminPassword = requiredEnv("STAGING_ADMIN_PASSWORD");
const runId = process.env.GITHUB_RUN_ID || Date.now().toString();

let accessToken = "";
let userId = "";
let projectId = "";
let assetId = "";
let workOrderId = "";
let passed = 0;

const parse = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

async function request(path, {
  method = "GET",
  body,
  bearer,
  statuses = [200],
  headers = {},
} = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey: anonKey,
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

async function test(name, action) {
  await action();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function cleanup() {
  if (!projectId || !accessToken) return;
  try {
    await request(`/rest/v1/projects?id=eq.${projectId}`, {
      method: "DELETE",
      bearer: accessToken,
      statuses: [200, 204],
      headers: { Prefer: "return=minimal" },
    });
    console.log("CLEANUP work-order acceptance records removed");
  } catch {
    console.error("CLEANUP work-order acceptance records failed");
    process.exitCode = 1;
  }
}

try {
  await test("System Admin login for work-order acceptance", async () => {
    const { payload } = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      bearer: anonKey,
      body: { email: adminEmail, password: adminPassword },
    });
    assert.equal(typeof payload.access_token, "string");
    assert.equal(typeof payload.user?.id, "string");
    accessToken = payload.access_token;
    userId = payload.user.id;
  });

  await test("Anonymous work-order read is isolated", async () => {
    const { response, payload } = await request(
      "/rest/v1/work_orders?select=id&limit=1",
      { bearer: anonKey, statuses: [200, 401, 403] },
    );
    if (response.status === 200) assert.deepEqual(payload, []);
  });

  await test("Anonymous work-order write is denied", async () => {
    const { response } = await request("/rest/v1/work_orders", {
      method: "POST",
      bearer: anonKey,
      statuses: [400, 401, 403],
      body: {
        project_id: "00000000-0000-0000-0000-000000000000",
        asset_id: "00000000-0000-0000-0000-000000000000",
        code: `WO-ANON-${runId}`,
        title: "Rejected anonymous work order",
      },
    });
    assert.ok(response.status >= 400);
  });

  const unique = `${runId}-${Date.now()}`;

  await test("Create temporary project and asset", async () => {
    const { payload: projects } = await request("/rest/v1/projects", {
      method: "POST",
      bearer: accessToken,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        code: `ACP-WO-QA-${unique}`,
        name: "ACP Work Order Acceptance",
        city: "Riyadh",
        created_by: userId,
      },
    });
    assert.equal(projects.length, 1);
    projectId = projects[0].id;

    const { payload: assets } = await request("/rest/v1/assets", {
      method: "POST",
      bearer: accessToken,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        project_id: projectId,
        code: "QA-ASSET-01",
        name: "Acceptance Asset",
        asset_type: "Building",
        location: "QA",
        criticality: "High",
        operational_status: "Running",
        qr_code: `ACP-ASSET-QA:${unique}`,
      },
    });
    assert.equal(assets.length, 1);
    assetId = assets[0].id;
  });

  await test("Create and read persistent work order", async () => {
    const { payload: workOrders } = await request("/rest/v1/work_orders", {
      method: "POST",
      bearer: accessToken,
      statuses: [201],
      headers: { Prefer: "return=representation" },
      body: {
        project_id: projectId,
        asset_id: assetId,
        code: `WO-QA-${unique}`,
        title: "Inspect acceptance asset",
        description: "Automated live Staging acceptance record",
        priority: "High",
        status: "Open",
        assigned_to: "QA Team",
        created_by: userId,
      },
    });
    assert.equal(workOrders.length, 1);
    workOrderId = workOrders[0].id;
    assert.equal(workOrders[0].asset_id, assetId);
    assert.equal(workOrders[0].status, "Open");

    const { payload: selected } = await request(
      `/rest/v1/work_orders?id=eq.${workOrderId}&select=id,project_id,asset_id,code,status,priority&limit=1`,
      { bearer: accessToken },
    );
    assert.equal(selected.length, 1);
    assert.equal(selected[0].project_id, projectId);
    assert.equal(selected[0].priority, "High");
  });

  await test("Advance and complete work order", async () => {
    const { payload: started } = await request(
      `/rest/v1/work_orders?id=eq.${workOrderId}`,
      {
        method: "PATCH",
        bearer: accessToken,
        headers: { Prefer: "return=representation" },
        body: { status: "InProgress" },
      },
    );
    assert.equal(started[0].status, "InProgress");

    const completedAt = new Date().toISOString();
    const { payload: completed } = await request(
      `/rest/v1/work_orders?id=eq.${workOrderId}`,
      {
        method: "PATCH",
        bearer: accessToken,
        headers: { Prefer: "return=representation" },
        body: { status: "Completed", completed_at: completedAt },
      },
    );
    assert.equal(completed[0].status, "Completed");
    assert.equal(typeof completed[0].completed_at, "string");
  });

  await test("Work-order mutations are audited", async () => {
    const { payload } = await request(
      `/rest/v1/audit_logs?entity_type=eq.work_orders&entity_id=eq.${workOrderId}&select=action&order=created_at.asc`,
      { bearer: accessToken },
    );
    const actions = payload.map(({ action }) => action);
    assert.ok(actions.includes("INSERT"));
    assert.ok(actions.filter((action) => action === "UPDATE").length >= 2);
  });

  await cleanup();
  projectId = "";
  console.log(`ACP live work-order acceptance passed: ${passed} checks`);
} catch (error) {
  await cleanup();
  console.error(`ACP live work-order acceptance failed: ${error.message}`);
  process.exitCode = 1;
}
