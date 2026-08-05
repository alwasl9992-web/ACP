import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const frontendRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(frontendRoot, "..");

async function read(relativePath) {
  return readFile(resolve(repositoryRoot, relativePath), "utf8");
}

test("dashboard reads operational metrics from real database tables", async () => {
  const source = await read("frontend/src/pages/Dashboard.tsx");
  for (const table of ["projects", "buildings", "assets", "gates", "employees", "warehouses", "incidents", "reports"]) {
    assert.match(source, new RegExp(`listRecords<[^>]+>\\(\\"${table}\\"`));
  }
  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /selectedProject/);
});

test("report preview keeps Safari compatibility and a mobile fallback", async () => {
  const source = await read("frontend/src/reports/exporters.ts");
  assert.match(source, /window\.open\(\"about:blank\", \"_blank\"\)/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /anchor\.target = \"_blank\"/);
  assert.doesNotMatch(source, /window\.open\([^\n]+noopener,noreferrer/);
});

test("asset profile exposes real QR and persistent work orders without placeholder modules", async () => {
  const source = await read("frontend/src/pages/AssetProfile.tsx");
  assert.match(source, /buildQrImageUrl/);
  assert.match(source, /listRecords<WorkOrder>\(\"work_orders\"/);
  assert.match(source, /createRecord<WorkOrder>\(\"work_orders\"/);
  assert.match(source, /updateRecord<WorkOrder>\(\"work_orders\"/);
  assert.doesNotMatch(source, /قريبًا/);
  assert.doesNotMatch(source, /disabled=!module\.active/);
});

test("work orders are protected with RLS, audit and authenticated grants", async () => {
  const sql = await read("supabase/migrations/20260806010000_asset_work_orders.sql");
  assert.match(sql, /create table public\.work_orders/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /create trigger work_orders_audit/i);
  assert.match(sql, /can_access_project\(project_id\)/i);
  assert.match(sql, /can_manage_project\(project_id\)/i);
  assert.match(sql, /revoke all on table public\.work_orders from anon/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.work_orders to authenticated/i);
});

test("ACP visual identity is centralized and applied", async () => {
  const theme = await read("frontend/src/theme/acpTheme.ts");
  const app = await read("frontend/src/App.tsx");
  const login = await read("frontend/src/auth/LoginPage.tsx");
  const logo = await read("frontend/public/acp-mark.svg");
  assert.match(theme, /navy: \"#071B34\"/);
  assert.match(theme, /gold: \"#C9A227\"/);
  assert.match(app, /BrandMark/);
  assert.match(login, /BrandMark/);
  assert.match(logo, /ACP Enterprise/);
});

test("security hardening gate scans code, dependencies and browser secrets", async () => {
  const workflow = await read(".github/workflows/security-hardening.yml");
  assert.match(workflow, /github\/codeql-action\/analyze@v3/);
  assert.match(workflow, /npm audit --omit=dev --audit-level=high/);
  assert.match(workflow, /service\[_-\]\?role/);
  assert.match(workflow, /Content-Security-Policy/);
});
