export interface ManualReminderCacheEntry {
  notifiedAt: number;
}

export type ManualReminderCache = Record<string, ManualReminderCacheEntry>;

export const MANUAL_REMINDER_CACHE_KEY_PREFIX = 'ts_manual_class_reminders_cache_';
export const MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY =
  `${MANUAL_REMINDER_CACHE_KEY_PREFIX}schema_version`;
export const MANUAL_REMINDER_CACHE_SCHEMA_VERSION = '2';

const DATE_SUFFIX_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATED_CACHE_ENTRIES = 3;

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('[manualReminderCache] localStorage unavailable', error);
    return null;
  }
};

const listReminderCacheKeys = (storage: Storage): string[] => {
  const keys: string[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(MANUAL_REMINDER_CACHE_KEY_PREFIX)) keys.push(key);
    }
  } catch (error) {
    console.warn('[manualReminderCache] unable to inspect cache keys', error);
  }
  return keys;
};

const isDatedReminderCacheKey = (key: string): boolean =>
  key.startsWith(MANUAL_REMINDER_CACHE_KEY_PREFIX) &&
  DATE_SUFFIX_PATTERN.test(key.slice(MANUAL_REMINDER_CACHE_KEY_PREFIX.length));

const safelyRemove = (storage: Storage, key: string): boolean => {
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('[manualReminderCache] unable to remove cache entry', error);
    return false;
  }
};

export const buildManualReminderCacheKey = (dateKey: string): string =>
  `${MANUAL_REMINDER_CACHE_KEY_PREFIX}${dateKey}`;

export const isQuotaExceededError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; name?: unknown };
  return (
    candidate.name === 'QuotaExceededError' ||
    candidate.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    candidate.code === 22 ||
    candidate.code === 1014
  );
};

export const migrateManualReminderCache = (): boolean => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    if (storage.getItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY) === MANUAL_REMINDER_CACHE_SCHEMA_VERSION) {
      return true;
    }
  } catch (error) {
    console.warn('[manualReminderCache] unable to read schema version', error);
    return false;
  }

  let cleanupSucceeded = true;
  for (const key of listReminderCacheKeys(storage)) {
    if (key !== MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY) {
      cleanupSucceeded = safelyRemove(storage, key) && cleanupSucceeded;
    }
  }

  if (!cleanupSucceeded) return false;
  try {
    storage.setItem(MANUAL_REMINDER_CACHE_SCHEMA_VERSION_KEY, MANUAL_REMINDER_CACHE_SCHEMA_VERSION);
    return true;
  } catch (error) {
    // A blocked or completely full store must never prevent the dashboard loading.
    console.warn('[manualReminderCache] unable to record schema version', error);
    return false;
  }
};

const removeExpiredWithStorage = (storage: Storage, pendingDateKey?: string): boolean => {
  const datedKeys = listReminderCacheKeys(storage).filter(isDatedReminderCacheKey);
  const dateKeys = datedKeys.map((key) => key.slice(MANUAL_REMINDER_CACHE_KEY_PREFIX.length));
  if (pendingDateKey && DATE_SUFFIX_PATTERN.test(pendingDateKey)) dateKeys.push(pendingDateKey);
  const retainedDates = new Set(
    Array.from(new Set(dateKeys)).sort((left, right) => right.localeCompare(left)).slice(0, MAX_DATED_CACHE_ENTRIES),
  );

  let succeeded = true;
  for (const key of datedKeys) {
    const dateKey = key.slice(MANUAL_REMINDER_CACHE_KEY_PREFIX.length);
    if (!retainedDates.has(dateKey)) succeeded = safelyRemove(storage, key) && succeeded;
  }
  return succeeded;
};

export const removeExpiredManualReminderCaches = (): boolean => {
  migrateManualReminderCache();
  const storage = getStorage();
  return storage ? removeExpiredWithStorage(storage) : false;
};

const isManualReminderCache = (value: unknown): value is ManualReminderCache => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      Number.isFinite((entry as ManualReminderCacheEntry).notifiedAt),
  );
};

export const readManualReminderCache = (dateKey: string): ManualReminderCache | null => {
  migrateManualReminderCache();
  const storage = getStorage();
  if (!storage) return null;
  const key = buildManualReminderCacheKey(dateKey);

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isManualReminderCache(parsed)) return parsed;
    safelyRemove(storage, key);
  } catch (error) {
    console.warn('[manualReminderCache] ignoring malformed or unreadable cache', error);
    safelyRemove(storage, key);
  }
  return null;
};

export const writeManualReminderCache = (
  dateKey: string,
  value: ManualReminderCache,
): boolean => {
  migrateManualReminderCache();
  const storage = getStorage();
  if (!storage) return false;
  const key = buildManualReminderCacheKey(dateKey);
  removeExpiredWithStorage(storage, dateKey);

  const serialized = JSON.stringify(value);
  try {
    storage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      console.warn('[manualReminderCache] unable to write cache', error);
      return false;
    }

    console.warn('[manualReminderCache] quota exceeded; pruning reminder caches and retrying');
    for (const reminderKey of listReminderCacheKeys(storage)) {
      if (isDatedReminderCacheKey(reminderKey)) safelyRemove(storage, reminderKey);
    }
    try {
      storage.setItem(key, serialized);
      return true;
    } catch (retryError) {
      console.warn('[manualReminderCache] cache retry failed; continuing without cache', retryError);
      return false;
    }
  }
};
