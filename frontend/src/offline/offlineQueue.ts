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

const DB_NAME = "acp-enterprise";
const DB_VERSION = 1;
const STORE_NAME = "offline-mutations";
const DEVICE_KEY = "acp.device.id.v1";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "mutationId",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open ACP offline database"));
  });
}

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const value = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, value);
  return value;
}

export async function enqueueMutation(
  mutation: Omit<OfflineMutation, "mutationId" | "deviceId" | "createdAt" | "attempts">,
): Promise<OfflineMutation> {
  const record: OfflineMutation = {
    ...mutation,
    mutationId: crypto.randomUUID(),
    deviceId: getDeviceId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(record);
  await transactionComplete(transaction);
  database.close();
  return record;
}

export async function listQueuedMutations(): Promise<OfflineMutation[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const records = await requestToPromise(
    transaction.objectStore(STORE_NAME).index("createdAt").getAll(),
  );
  await transactionComplete(transaction);
  database.close();
  return records;
}

export async function removeQueuedMutation(mutationId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(mutationId);
  await transactionComplete(transaction);
  database.close();
}

export async function markMutationFailed(
  mutation: OfflineMutation,
  error: unknown,
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put({
    ...mutation,
    attempts: mutation.attempts + 1,
    lastError: error instanceof Error ? error.message : String(error),
  } satisfies OfflineMutation);
  await transactionComplete(transaction);
  database.close();
}

export async function clearOfflineQueue(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).clear();
  await transactionComplete(transaction);
  database.close();
}
