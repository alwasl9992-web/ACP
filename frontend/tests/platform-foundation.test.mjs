import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const frontendRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(frontendRoot, "..");

async function read(relativePath) {
  return readFile(resolve(repositoryRoot, relativePath), "utf8");
}

test("core migration defines all required business tables", async () => {
  const sql = await read("supabase/migrations/20260731143000_acp_core.sql");
  for (const table of [
    "profiles",
    "projects",
    "buildings",
    "gates",
    "employees",
    "warehouses",
    "warehouse_items",
    "incidents",
    "reports",
    "sync_mutations",
    "audit_logs",
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, "i"));
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
  }
});

test("assets migration enables RLS and audit", async () => {
  const sql = await read("supabase/migrations/20260731150000_acp_assets.sql");
  assert.match(sql, /create table public\.assets/i);
  assert.match(sql, /alter table public\.assets enable row level security/i);
  assert.match(sql, /create trigger assets_audit/i);
});

test("operations migration protects gate logs and employee records", async () => {
  const sql = await read("supabase/migrations/20260731153000_acp_operations.sql");
  for (const table of [
    "gate_daily_logs",
    "employee_assignments",
    "attendance_events",
    "employee_warnings",
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`, "i"));
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
  }
});

test("system settings are singleton and admin-managed", async () => {
  const sql = await read(
    "supabase/migrations/20260731160000_acp_system_settings.sql",
  );
  assert.match(sql, /create table public\.system_settings/i);
  assert.match(sql, /create unique index system_settings_singleton_idx/i);
  assert.match(sql, /current_app_role\(\) = 'system_admin'/i);
  assert.match(sql, /enable row level security/i);
});

test("browser environment template never contains privileged secrets", async () => {
  const env = await read("frontend/.env.example");
  assert.doesNotMatch(env, /service[_-]?role/i);
  assert.doesNotMatch(env, /database[_-]?password/i);
  assert.match(env, /VITE_SUPABASE_ANON_KEY/);
});

test("offline synchronization uses IndexedDB and idempotent UUIDs", async () => {
  const source = await read("frontend/src/offline/offlineQueue.ts");
  assert.match(source, /indexedDB\.open/);
  assert.match(source, /crypto\.randomUUID/);
  assert.match(source, /offline-mutations/);
});

test("role model includes the five approved roles", async () => {
  const source = await read("frontend/src/types/platform.ts");
  for (const role of [
    "system_admin",
    "project_manager",
    "supervisor",
    "employee",
    "reader",
  ]) {
    assert.match(source, new RegExp(`"${role}"`));
  }
});

test("user invitations require authenticated system administrator", async () => {
  const source = await read("supabase/functions/invite-user/index.ts");
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /callerProfile\.role !== "system_admin"/);
  assert.match(source, /inviteUserByEmail/);
  assert.doesNotMatch(source, /VITE_/);
});
