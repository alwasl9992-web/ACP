import { runtimeConfig } from "../config/runtime";
import {
  restDelete,
  restSelect,
  restUpdate,
  restUpsert,
} from "../lib/supabaseHttp";
import {
  enqueueMutation,
  listQueuedMutations,
  markMutationFailed,
  removeQueuedMutation,
  type OfflineMutation,
} from "../offline/offlineQueue";

export type AcpTable =
  | "projects"
  | "buildings"
  | "gates"
  | "employees"
  | "warehouses"
  | "warehouse_items"
  | "stock_movements"
  | "incidents"
  | "reports"
  | "attachments";

export interface QueryOptions {
  select?: string;
  order?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
}

function assertCloudConfigured(): void {
  if (!runtimeConfig.configured) {
    throw new Error(
      "قاعدة البيانات السحابية غير مرتبطة بعد. أضف مفاتيح Supabase في إعدادات البيئة.",
    );
  }
}

function isOnline(): boolean {
  return navigator.onLine && runtimeConfig.configured;
}

function buildQuery(options: QueryOptions): Record<string, string | number> {
  const query: Record<string, string | number> = {
    select: options.select ?? "*",
  };
  if (options.order) query.order = options.order;
  if (options.limit !== undefined) query.limit = options.limit;
  if (options.offset !== undefined) query.offset = options.offset;
  Object.entries(options.filters ?? {}).forEach(([key, value]) => {
    query[key] = value;
  });
  return query;
}

export async function listRecords<T>(
  table: AcpTable,
  options: QueryOptions = {},
): Promise<T[]> {
  assertCloudConfigured();
  return restSelect<T>(table, buildQuery(options));
}

export async function createRecord<T extends { id?: string }>(
  table: AcpTable,
  value: Omit<T, "id"> & { id?: string },
): Promise<T> {
  const payload = {
    ...value,
    id: value.id ?? crypto.randomUUID(),
  } as T;

  if (!isOnline()) {
    await enqueueMutation({
      table,
      operation: "insert",
      payload: payload as Record<string, unknown>,
    });
    return payload;
  }

  const rows = await restUpsert<T>(table, payload, "id");
  return rows[0] ?? payload;
}

export async function updateRecord<T extends object>(
  table: AcpTable,
  id: string,
  value: Partial<T>,
): Promise<T> {
  if (!isOnline()) {
    await enqueueMutation({
      table,
      operation: "update",
      payload: value as Record<string, unknown>,
      filters: { id },
    });
    return { ...value, id } as T;
  }

  const rows = await restUpdate<T>(table, { id }, value);
  if (!rows[0]) throw new Error(`No ${table} record found for update`);
  return rows[0];
}

export async function deleteRecord(
  table: AcpTable,
  id: string,
): Promise<void> {
  if (!isOnline()) {
    await enqueueMutation({
      table,
      operation: "delete",
      payload: {},
      filters: { id },
    });
    return;
  }

  await restDelete(table, { id });
}

async function applyMutation(mutation: OfflineMutation): Promise<void> {
  const table = mutation.table as AcpTable;

  if (mutation.operation === "insert") {
    await restUpsert(table, mutation.payload, "id");
  } else if (mutation.operation === "update") {
    await restUpdate(table, mutation.filters ?? {}, mutation.payload);
  } else {
    await restDelete(table, mutation.filters ?? {});
  }

  await restUpsert(
    "sync_mutations",
    {
      mutation_id: mutation.mutationId,
      device_id: mutation.deviceId,
      entity_type: mutation.table,
      operation: mutation.operation,
      payload: mutation.payload,
      status: "applied",
      applied_at: new Date().toISOString(),
    },
    "mutation_id",
  );
}

export interface SyncResult {
  applied: number;
  failed: number;
  remaining: number;
}

export async function syncPendingMutations(): Promise<SyncResult> {
  if (!isOnline()) {
    const queued = await listQueuedMutations();
    return { applied: 0, failed: 0, remaining: queued.length };
  }

  const queued = await listQueuedMutations();
  let applied = 0;
  let failed = 0;

  for (const mutation of queued) {
    try {
      await applyMutation(mutation);
      await removeQueuedMutation(mutation.mutationId);
      applied += 1;
    } catch (error) {
      await markMutationFailed(mutation, error);
      failed += 1;
    }
  }

  return {
    applied,
    failed,
    remaining: (await listQueuedMutations()).length,
  };
}

let syncListenerAttached = false;

export function enableAutomaticSync(
  onResult?: (result: SyncResult) => void,
): () => void {
  if (syncListenerAttached) return () => undefined;
  syncListenerAttached = true;

  const handler = () => {
    void syncPendingMutations().then(onResult).catch(() => undefined);
  };
  window.addEventListener("online", handler);
  handler();

  return () => {
    window.removeEventListener("online", handler);
    syncListenerAttached = false;
  };
}
