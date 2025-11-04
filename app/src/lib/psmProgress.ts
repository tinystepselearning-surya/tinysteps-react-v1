/**
 * Phonics Sounds Mastery Progress Tracker
 * SSR-safe localStorage utility for tracking level completion
 */

export const PSM_PROGRESS_KEY = "tsl_psm_progress";

export type PsmProgress = Record<string, { completed: boolean; stars?: number }>;

export type PsmMeta = {
  lastPlayedLevel?: string;
};

export const PSM_META_KEY = "tsl_psm_meta";

/**
 * Reads progress from storage (SSR-safe)
 * @param storage - Optional storage interface (defaults to localStorage if available)
 * @returns Progress object or empty object if storage unavailable or invalid
 */
export function readProgress(storage?: { getItem(k: string): string | null }): PsmProgress {
  const store = storage || (typeof window !== "undefined" ? window.localStorage : null);
  
  if (!store) {
    return {};
  }

  try {
    const raw = store.getItem(PSM_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    
    const parsed = JSON.parse(raw);
    
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    
    return parsed as PsmProgress;
  } catch {
    return {};
  }
}

/**
 * Writes progress to storage (SSR-safe)
 * @param p - Progress object to save
 * @param storage - Optional storage interface (defaults to localStorage if available)
 */
export function writeProgress(p: PsmProgress, storage?: { setItem(k: string, v: string): void }): void {
  const store = storage || (typeof window !== "undefined" ? window.localStorage : null);
  
  if (!store) {
    return;
  }

  try {
    store.setItem(PSM_PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // Silent fail if storage is unavailable
  }
}

/**
 * Reads metadata from storage (SSR-safe)
 * @param storage - Optional storage interface (defaults to localStorage if available)
 * @returns Metadata object or empty object if storage unavailable or invalid
 */
export function readMeta(storage?: { getItem(k: string): string | null }): PsmMeta {
  const store = storage || (typeof window !== "undefined" ? window.localStorage : null);
  
  if (!store) {
    return {};
  }

  try {
    const raw = store.getItem(PSM_META_KEY);
    if (!raw) {
      return {};
    }
    
    const parsed = JSON.parse(raw);
    
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    
    return parsed as PsmMeta;
  } catch {
    return {};
  }
}

/**
 * Writes metadata to storage (SSR-safe)
 * @param meta - Metadata object to save
 * @param storage - Optional storage interface (defaults to localStorage if available)
 */
export function writeMeta(meta: PsmMeta, storage?: { setItem(k: string, v: string): void }): void {
  const store = storage || (typeof window !== "undefined" ? window.localStorage : null);
  
  if (!store) {
    return;
  }

  try {
    store.setItem(PSM_META_KEY, JSON.stringify(meta));
  } catch {
    // Silent fail if storage is unavailable
  }
}
