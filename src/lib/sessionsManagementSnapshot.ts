import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export type SessionsManagementSnapshotRow = {
  id: string;
  data: Record<string, any>;
};

export type SessionsManagementSnapshotPayload = {
  schemaVersion: number;
  snapshotId: string;
  generatedAt: string;
  generatedBy: 'scheduled' | 'manual' | 'bootstrap';
  generatedByUid?: string | null;
  dateKeys: string[];
  counts: Record<string, number>;
  sourceStats?: Record<string, number>;
  sessions: SessionsManagementSnapshotRow[];
  enrollments: SessionsManagementSnapshotRow[];
  users: SessionsManagementSnapshotRow[];
  kids: SessionsManagementSnapshotRow[];
  students: SessionsManagementSnapshotRow[];
  courses: SessionsManagementSnapshotRow[];
};

export type SessionsManagementDatePayload = {
  snapshotId: string;
  dateKey: string;
  sessions: SessionsManagementSnapshotRow[];
  enrollments: SessionsManagementSnapshotRow[];
  users: SessionsManagementSnapshotRow[];
  kids: SessionsManagementSnapshotRow[];
  students: SessionsManagementSnapshotRow[];
  courses: SessionsManagementSnapshotRow[];
  sourceStats?: Record<string, number>;
};

type BrowserSnapshotCache = {
  snapshot: SessionsManagementSnapshotPayload;
  extraDates: Record<string, SessionsManagementDatePayload>;
};

const CACHE_KEY = 'tinysteps:sessions-management-snapshot:v1';
let memoryCache: BrowserSnapshotCache | null = null;
let loadPromise: Promise<SessionsManagementSnapshotPayload> | null = null;
let refreshPromise: Promise<SessionsManagementSnapshotPayload> | null = null;

const canUseSessionStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const rejectUninjectedTestNetwork = (): void => {
  if (import.meta.env.MODE === 'test') {
    throw new Error('Sessions Management snapshot network disabled in unit tests; inject a snapshot loader.');
  }
};

const normalizeRows = (value: unknown): SessionsManagementSnapshotRow[] =>
  Array.isArray(value)
    ? value
        .filter((row) => row && typeof row === 'object')
        .map((row) => {
          const record = row as Record<string, unknown>;
          return {
            id: String(record.id || '').trim(),
            data: record.data && typeof record.data === 'object'
              ? record.data as Record<string, any>
              : {},
          };
        })
        .filter((row) => Boolean(row.id))
    : [];

const normalizeSnapshot = (value: unknown): SessionsManagementSnapshotPayload | null => {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const snapshotId = String(data.snapshotId || '').trim();
  if (!snapshotId) return null;
  return {
    schemaVersion: Number(data.schemaVersion || 1),
    snapshotId,
    generatedAt: String(data.generatedAt || ''),
    generatedBy: (String(data.generatedBy || 'scheduled') as SessionsManagementSnapshotPayload['generatedBy']),
    generatedByUid: data.generatedByUid ? String(data.generatedByUid) : null,
    dateKeys: Array.isArray(data.dateKeys) ? data.dateKeys.map(String) : [],
    counts: data.counts && typeof data.counts === 'object'
      ? data.counts as Record<string, number>
      : {},
    sourceStats: data.sourceStats && typeof data.sourceStats === 'object'
      ? data.sourceStats as Record<string, number>
      : undefined,
    sessions: normalizeRows(data.sessions),
    enrollments: normalizeRows(data.enrollments),
    users: normalizeRows(data.users),
    kids: normalizeRows(data.kids),
    students: normalizeRows(data.students),
    courses: normalizeRows(data.courses),
  };
};

const normalizeDatePayload = (value: unknown): SessionsManagementDatePayload | null => {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const snapshotId = String(data.snapshotId || '').trim();
  const dateKey = String(data.dateKey || '').trim();
  if (!snapshotId || !dateKey) return null;
  return {
    snapshotId,
    dateKey,
    sessions: normalizeRows(data.sessions),
    enrollments: normalizeRows(data.enrollments),
    users: normalizeRows(data.users),
    kids: normalizeRows(data.kids),
    students: normalizeRows(data.students),
    courses: normalizeRows(data.courses),
    sourceStats: data.sourceStats && typeof data.sourceStats === 'object'
      ? data.sourceStats as Record<string, number>
      : undefined,
  };
};

const readStoredCache = (): BrowserSnapshotCache | null => {
  if (memoryCache) return memoryCache;
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { snapshot?: unknown; extraDates?: Record<string, unknown> };
    const snapshot = normalizeSnapshot(parsed.snapshot);
    if (!snapshot) return null;
    const extraDates: Record<string, SessionsManagementDatePayload> = {};
    Object.entries(parsed.extraDates || {}).forEach(([dateKey, datePayload]) => {
      const normalized = normalizeDatePayload(datePayload);
      if (normalized && normalized.snapshotId === snapshot.snapshotId) {
        extraDates[dateKey] = normalized;
      }
    });
    memoryCache = { snapshot, extraDates };
    return memoryCache;
  } catch {
    return null;
  }
};

const persistCache = (cache: BrowserSnapshotCache): void => {
  memoryCache = cache;
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('[SessionsManagementSnapshot] session cache write failed; using memory cache only', error);
  }
};

const replaceSnapshotCache = (snapshot: SessionsManagementSnapshotPayload): SessionsManagementSnapshotPayload => {
  persistCache({ snapshot, extraDates: {} });
  return snapshot;
};

export const clearSessionsManagementSnapshotCacheForTests = (): void => {
  memoryCache = null;
  loadPromise = null;
  refreshPromise = null;
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // test/browser storage cleanup is best effort
  }
};

export const getCachedSessionsManagementSnapshot = (): SessionsManagementSnapshotPayload | null =>
  readStoredCache()?.snapshot || null;

export async function loadSessionsManagementSnapshot(): Promise<SessionsManagementSnapshotPayload> {
  if (loadPromise) return loadPromise;
  rejectUninjectedTestNetwork();

  loadPromise = (async () => {
    const cached = readStoredCache();
    const callable = httpsCallable(functions, 'getSessionsManagementSnapshot');
    const response = await callable({ knownSnapshotId: cached?.snapshot.snapshotId || '' });
    const result = response.data as Record<string, unknown>;

    if (result?.unchanged === true && cached?.snapshot) {
      return cached.snapshot;
    }

    const snapshot = normalizeSnapshot(result?.snapshot);
    if (snapshot) return replaceSnapshotCache(snapshot);

    const retry = await callable({ knownSnapshotId: '' });
    const retryResult = retry.data as Record<string, unknown>;
    const retrySnapshot = normalizeSnapshot(retryResult?.snapshot);
    if (!retrySnapshot) throw new Error('Sessions Management snapshot response was invalid.');
    return replaceSnapshotCache(retrySnapshot);
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export async function refreshSessionsManagementSnapshot(): Promise<SessionsManagementSnapshotPayload> {
  if (refreshPromise) return refreshPromise;
  rejectUninjectedTestNetwork();

  refreshPromise = (async () => {
    const callable = httpsCallable(functions, 'adminRefreshSessionsManagementSnapshot');
    const response = await callable({});
    const result = response.data as Record<string, unknown>;
    const snapshot = normalizeSnapshot(result?.snapshot);
    if (!snapshot) throw new Error('Manual Sessions Management refresh returned an invalid snapshot.');
    return replaceSnapshotCache(snapshot);
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function loadSessionsManagementDateSnapshot(
  dateKey: string,
): Promise<SessionsManagementDatePayload> {
  rejectUninjectedTestNetwork();
  const snapshot = await loadSessionsManagementSnapshot();
  const cached = readStoredCache();

  if (snapshot.dateKeys.includes(dateKey)) {
    return {
      snapshotId: snapshot.snapshotId,
      dateKey,
      sessions: snapshot.sessions.filter((row) => String(row.data.date || '').trim() === dateKey),
      enrollments: snapshot.enrollments,
      users: snapshot.users,
      kids: snapshot.kids,
      students: snapshot.students,
      courses: snapshot.courses,
      sourceStats: snapshot.sourceStats,
    };
  }

  const existing = cached?.extraDates[dateKey];
  if (existing && existing.snapshotId === snapshot.snapshotId) return existing;

  const callable = httpsCallable(functions, 'getSessionsManagementDateSnapshot');
  const response = await callable({ dateKey });
  const result = response.data as Record<string, unknown>;
  const payload = normalizeDatePayload(result?.payload);
  if (!payload) throw new Error('Selected-date Sessions Management response was invalid.');

  const current = readStoredCache();
  if (current && current.snapshot.snapshotId === payload.snapshotId) {
    persistCache({
      snapshot: current.snapshot,
      extraDates: { ...current.extraDates, [dateKey]: payload },
    });
  }
  return payload;
}

const mergeRows = (
  baseRows: SessionsManagementSnapshotRow[],
  extras: SessionsManagementSnapshotRow[][],
): SessionsManagementSnapshotRow[] => {
  const byId = new Map<string, SessionsManagementSnapshotRow>();
  [...baseRows, ...extras.flat()].forEach((row) => byId.set(row.id, row));
  return Array.from(byId.values());
};

export function getCachedSessionsManagementRowsForReadLabel(
  label: string,
): SessionsManagementSnapshotRow[] | null {
  const cache = readStoredCache();
  if (!cache) return null;
  const { snapshot, extraDates } = cache;
  const extraPayloads = Object.values(extraDates)
    .filter((payload) => payload.snapshotId === snapshot.snapshotId);

  if (label === 'TodaysNotifications:overall-admissions') {
    const count = Math.max(0, Number(snapshot.counts.overallEnrollments || 0));
    return snapshot.enrollments.slice(0, count || snapshot.enrollments.length);
  }
  if (label === 'TodaysNotifications:users-by-doc-id' || label === 'TodaysNotifications:users-by-uid') {
    return mergeRows(snapshot.users, extraPayloads.map((payload) => payload.users));
  }
  if (label.startsWith('TodaysNotifications:fetchDocsByIds:')) {
    const collectionName = label.slice('TodaysNotifications:fetchDocsByIds:'.length);
    if (collectionName === 'enrollments') {
      return mergeRows(snapshot.enrollments, extraPayloads.map((payload) => payload.enrollments));
    }
    if (collectionName === 'kids') {
      return mergeRows(snapshot.kids, extraPayloads.map((payload) => payload.kids));
    }
    if (collectionName === 'students') {
      return mergeRows(snapshot.students, extraPayloads.map((payload) => payload.students));
    }
    if (collectionName === 'courses') {
      return mergeRows(snapshot.courses, extraPayloads.map((payload) => payload.courses));
    }
  }
  return null;
}
