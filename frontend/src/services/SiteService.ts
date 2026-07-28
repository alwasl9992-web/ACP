export default class StorageService {
  static read(key: string) {
    const data = localStorage.getItem(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  static write(key: string, value: any) {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }

  static remove(key: string) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}