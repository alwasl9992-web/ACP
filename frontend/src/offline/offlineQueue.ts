export type OfflineOperation = "insert" | "update" | "delete";

export interface OfflineMutation {
  mutationId: string;
  deviceId: string;
  table: string;
  operation: OfflineOperation;
  payload: Record<string, unknown>;
  filters?: Record<string, string>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface QueryCacheEntry {
  cacheKey: string;
  table: string;
  rows: Record<string, unknown>[];
  updatedAt: string;
}

const DB_NAME = "acp-enterprise";
const DB_VERSION = 2;
const MUTATION_STORE = "offline-mutations";
const QUERY_CACHE_STORE = "query-cache";
const DEVICE_KEY = "acp.device.id.v1";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MUTATION_STORE)) {
        const store = database.createObjectStore(MUTATION_STORE, {
          keyPath: "mutationId",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!database.objectStoreNames.contains(QUERY_CACHE_STORE)) {
        const cache = database.createObjectStore(QUERY_CACHE_STORE, {
          keyPath: "cacheKey",
        });
        cache.createIndex("table", "table", { unique: false });
        cache.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ?? new Error("Unable to open ACP offline database"),
      );
  });
}

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, value);
  return value;
}

export function buildQueryCacheKey(
  table: string,
  parameters: Record<string, string | number | boolean | undefined>,
): string {
  const normalized = Object.entries(parameters)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, String(value)]);
  return `${table}:${JSON.stringify(normalized)}`;
}

export async function cacheQueryRows<T extends object>(
  table: string,
  cacheKey: string,
  rows: T[],
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(QUERY_CACHE_STORE, "readwrite");
  transaction.objectStore(QUERY_CACHE_STORE).put({
    cacheKey,
    table,
    rows: rows as Record<string, unknown>[],
    updatedAt: new Date().toISOString(),
  } satisfies QueryCacheEntry);
  await transactionComplete(transaction);
  database.close();
}

export async function readCachedQueryRows<T extends object>(
  table: string,
  cacheKey: string,
): Promise<T[]> {
  const database = await openDatabase();
  const transaction = database.transaction(QUERY_CACHE_STORE, "readonly");
  const store = transaction.objectStore(QUERY_CACHE_STORE);
  const exact = await requestToPromise(
    store.get(cacheKey) as IDBRequest<QueryCacheEntry | undefined>,
  );

  let entry = exact;
  if (!entry) {
    const matches = await requestToPromise(
      store.index("table").getAll(table) as IDBRequest<QueryCacheEntry[]>,
    );
    entry = matches.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    )[0];
  }

  await transactionComplete(transaction);
  database.close();
  return (entry?.rows ?? []) as T[];
}

export async function clearQueryCache(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(QUERY_CACHE_STORE, "readwrite");
  transaction.objectStore(QUERY_CACHE_STORE).clear();
  await transactionComplete(transaction);
  database.close();
}

export async function enqueueMutation(
  mutation: Omit<
    OfflineMutation,
    "mutationId" | "deviceId" | "createdAt" | "attempts"
  >,
): Promise<OfflineMutation> {
  const record: OfflineMutation = {
    ...mutation,
    mutationId: crypto.randomUUID(),
    deviceId: getDeviceId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).put(record);
  await transactionComplete(transaction);
  database.close();
  return record;
}

export async function listQueuedMutations(): Promise<OfflineMutation[]> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readonly");
  const records = await requestToPromise(
    transaction.objectStore(MUTATION_STORE).index("createdAt").getAll(),
  );
  await transactionComplete(transaction);
  database.close();
  return records;
}

export async function removeQueuedMutation(
  mutationId: string,
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).delete(mutationId);
  await transactionComplete(transaction);
  database.close();
}

export async function markMutationFailed(
  mutation: OfflineMutation,
  error: unknown,
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).put({
    ...mutation,
    attempts: mutation.attempts + 1,
    lastError: error instanceof Error ? error.message : String(error),
  } satisfies OfflineMutation);
  await transactionComplete(transaction);
  database.close();
}

export async function clearOfflineQueue(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATION_STORE, "readwrite");
  transaction.objectStore(MUTATION_STORE).clear();
  await transactionComplete(transaction);
  database.close();
}

function valueMatchesFilter(
  value: unknown,
  filter: string,
): boolean {
  if (filter.startsWith("eq.")) {
    return String(value ?? "") === filter.slice(3);
  }

  if (filter.startsWith("in.(") && filter.endsWith(")")) {
    const accepted = filter
      .slice(4, -1)
      .split(",")
      .map((item) => item.trim());
    return accepted.includes(String(value ?? ""));
  }

  return String(value ?? "") === filter;
}

function recordMatchesFilters(
  record: Record<string, unknown>,
  filters: Record<string, string>,
): boolean {
  return Object.entries(filters).every(([key, filter]) =>
    valueMatchesFilter(record[key], filter),
  );
}

export async function overlayQueuedMutations<T extends object>(
  table: string,
  rows: T[],
  queryFilters: Record<string, string> = {},
): Promise<T[]> {
  const mutations = (await listQueuedMutations()).filter(
    (mutation) => mutation.table === table,
  );
  const records = new Map<string, Record<string, unknown>>();

  rows.forEach((row) => {
    const record = row as Record<string, unknown>;
    const id = String(record.id ?? "");
    if (id) records.set(id, { ...record });
  });

  mutations.forEach((mutation) => {
    if (mutation.operation === "insert") {
      const id = String(mutation.payload.id ?? mutation.mutationId);
      records.set(id, { ...mutation.payload, id });
      return;
    }

    const mutationFilters = mutation.filters ?? {};
    Array.from(records.entries()).forEach(([id, record]) => {
      if (!recordMatchesFilters(record, mutationFilters)) return;
      if (mutation.operation === "delete") {
        records.delete(id);
      } else {
        records.set(id, { ...record, ...mutation.payload });
      }
    });
  });

  return Array.from(records.values())
    .filter((record) => recordMatchesFilters(record, queryFilters)) as T[];
}
