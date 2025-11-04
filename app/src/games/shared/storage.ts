/**
 * Debounced localStorage utilities
 * Prevents jank from excessive writes
 */

const saveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
const DEBOUNCE_MS = 150;

export function debouncedSave(key: string, value: unknown): void {
  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);
  
  const timer = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
    saveTimers.delete(key);
  }, DEBOUNCE_MS);
  
  saveTimers.set(key, timer);
}

export function loadData<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function saveImmediate(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage save failed:", e);
  }
}

// Cleanup pending saves (call on unmount)
export function flushPending(): void {
  saveTimers.forEach((timer) => clearTimeout(timer));
  saveTimers.clear();
}
