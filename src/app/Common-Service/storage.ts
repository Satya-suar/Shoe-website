// Small helpers so the cart, wishlist and profile services can save to the browser safely.

export function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Storage full or blocked: the app keeps working, the data just isn't saved.
  }
}