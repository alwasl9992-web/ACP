import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const frontendRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(frontendRoot, "..");

async function read(relativePath) {
  return readFile(resolve(repositoryRoot, relativePath), "utf8");
}

async function collectTsx(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTsx(full));
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

test("sites page is backed by live operational tables and has no inert add button", async () => {
  const source = await read("frontend/src/sites/SitesPage.tsx");
  for (const table of ["buildings", "gates", "assets", "warehouses"]) {
    assert.match(source, new RegExp(`listRecords<[^>]+>\\(\\"${table}\\"`));
  }
  assert.doesNotMatch(source, />\s*إضافة موقع\s*</);
  assert.doesNotMatch(source, /لا توجد مواقع مسجلة حالياً/);
});

test("warehouse UI persists capacity and an employee manager", async () => {
  const source = await read("frontend/src/pages/Warehouses.tsx");
  assert.match(source, /manager_id/);
  assert.match(source, /capacity/);
  assert.match(source, /listRecords<PlatformEmployee>\(\"employees\"/);
  assert.match(source, /label=\"المسؤول\"/);
  assert.doesNotMatch(source, /وصف مؤقت/);
});

test("warehouse schema adds constrained operational fields", async () => {
  const sql = await read("supabase/migrations/20260806014500_warehouse_operational_fields.sql");
  assert.match(sql, /manager_id uuid references public\.employees/i);
  assert.match(sql, /capacity numeric\(14,3\) not null default 0/i);
  assert.match(sql, /warehouses_capacity_nonnegative/i);
  assert.match(sql, /warehouses_manager_idx/i);
});

test("commercial UI contains no coming-soon or temporary placeholder labels", async () => {
  const files = await collectTsx(resolve(frontendRoot, "src"));
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /قريبًا|وصف مؤقت|غير متوفر(?:ة)?/u, file);
  }
});

test("browser UAT covers Chromium, iPhone WebKit and authenticated navigation", async () => {
  const config = await read("frontend/playwright.config.mjs");
  const spec = await read("frontend/e2e/commercial-uat.spec.mjs");
  const workflow = await read(".github/workflows/browser-uat.yml");
  assert.match(config, /Desktop Chromium/);
  assert.match(config, /iPhone WebKit/);
  assert.match(spec, /STAGING_ADMIN_EMAIL/);
  assert.match(spec, /assertNoHorizontalOverflow/);
  assert.match(spec, /مركز التقارير/);
  assert.match(spec, /هوية QR للأصل/);
  assert.match(workflow, /playwright install --with-deps chromium webkit/);
  assert.match(workflow, /environment: staging/);
});
