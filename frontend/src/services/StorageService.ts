const ACP_STORAGE_PREFIX = "ACP_";

export default class StorageService {
  static read<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);

      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`تعذر قراءة بيانات التخزين للمفتاح ${key}`, error);
      localStorage.removeItem(key);
      return null;
    }
  }

  static write<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`تعذر حفظ بيانات التخزين للمفتاح ${key}`, error);
      return false;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clearACPData(): void {
    const keysToRemove = Array.from(
      { length: localStorage.length },
      (_, index) => localStorage.key(index)
    ).filter(
      (key): key is string =>
        typeof key === "string" && key.startsWith(ACP_STORAGE_PREFIX)
    );

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}
