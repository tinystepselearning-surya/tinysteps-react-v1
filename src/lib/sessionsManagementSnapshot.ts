import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebaseConfig';

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
  buildStartedAtMs?: number;
  projectionRevision: number;
  deltaDocumentsApplied?: number;
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
  ownerUid: string;
  snapshot: SessionsManagementSnapshotPayload;
  extraDates: Record<string, SessionsManagementDatePayload>;
};

type SnapshotActor = { uid: string; generation: number };

const CACHE_KEY = 'tinysteps:sessions-management-snapshot:v4';
const LEGACY_CACHE_KEY = 'tinysteps:sessions-management-snapshot:v3';
let memoryCache: BrowserSnapshotCache | null = null;
let loadPromise: Promise<SessionsManagementSnapshotPayload> | null = null;
let refreshPromise: Promise<SessionsManagementSnapshotPayload> | null = null;
let activeUid: string | null | undefined;
let authGeneration = 0;
// Persisted data can be sent back as a revision hint but must not be displayed
// until the backend successfully authorizes the current authenticated session.
let verifiedGeneration = -1;

const canUseSessionStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const discardBrowserCache = (): void => {
  memoryCache = null;
  loadPromise = null;
  refreshPromise = null;
  verifiedGeneration = -1;
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
    window.sessionStorage.removeItem(LEGACY_CACHE_KEY);
  } catch {
    // An unavailable browser storage API must not block cache invalidation.
  }
};

/**
 * Called on Firebase Auth changes and checked at every cache boundary. A new
 * UID invalidates memory, storage and in-flight promises without new reads.
 */
export const observeSessionsManagementAuthUid = (uid: string | null): void => {
  const next = typeof uid === 'string' && uid.trim() ? uid : null;
  if (activeUid === next) return;
  const previous = activeUid;
  activeUid = next;
  authGeneration++;
  if (previous !== undefined && previous !== null && previous !== next) {
    discardBrowserCache();
  } else {
    memoryCache = null;
    loadPromise = null;
    refreshPromise = null;
    verifiedGeneration = -1;
    // First auth restoration can retain a same-user v4 revision hint.
    // A confirmed sign-out always erases any persisted actor's data.
    if (next === null && previous !== undefined) discardBrowserCache();
  }
  if (canUseSessionStorage()) {
    try { window.sessionStorage.removeItem(LEGACY_CACHE_KEY); } catch { /* best effort */ }
  }
};

const currentSnapshotActor = (): SnapshotActor | null => {
  const uid = auth.currentUser?.uid || null;
  observeSessionsManagementAuthUid(uid);
  return uid ? { uid, generation: authGeneration } : null;
};

const snapshotSessionError = (code: 'snapshot/unauthenticated' | 'snapshot/actor-changed'): Error & {code: string} =>
  Object.assign(new Error(code === 'snapshot/unauthenticated'
    ? 'Sessions Management snapshot requires an authenticated session.'
    : 'Sessions Management snapshot authentication changed during the request.'), {code});

const requireSnapshotActor = (): SnapshotActor => {
  const actor = currentSnapshotActor();
  if (!actor) throw snapshotSessionError('snapshot/unauthenticated');
  return actor;
};

const assertSnapshotActor = (actor: SnapshotActor): void => {
  const current = currentSnapshotActor();
  if (!current || current.uid !== actor.uid || current.generation !== actor.generation) {
    throw snapshotSessionError('snapshot/actor-changed');
  }
};

const failureCode = (error: unknown): string =>
  error && typeof error === 'object' && 'code' in error
    ? String((error as {code?: unknown}).code || '').toLowerCase()
    : '';

const isAccessFailure = (error: unknown): boolean => {
  const code = failureCode(error);
  return [
    'functions/permission-denied', 'permission-denied',
    'functions/unauthenticated', 'unauthenticated',
    'auth/user-disabled', 'auth/id-token-expired', 'auth/user-token-expired',
    'auth/invalid-user-token', 'auth/user-not-found',
  ].includes(code);
};

const isTransientFailure = (error: unknown): boolean => {
  const code = failureCode(error);
  return [
    'functions/unavailable', 'unavailable',
    'functions/deadline-exceeded', 'deadline-exceeded',
    'auth/network-request-failed',
  ].includes(code);
};

/** Authorization and account changes must never fall back to raw Firestore or cached rows. */
export const isSessionsManagementAuthorizationFailure = (error: unknown): boolean =>
  isAccessFailure(error) || [
    'snapshot/unauthenticated', 'snapshot/actor-changed',
  ].includes(failureCode(error));

/** Only known transient transport failures can use the legacy direct-read fallback. */
export const isSessionsManagementTransientFailure = (error: unknown): boolean =>
  isTransientFailure(error);

const canUseVerifiedFallback = (actor: SnapshotActor, cached: BrowserSnapshotCache | null, error: unknown): boolean =>
  Boolean(cached && cached.ownerUid === actor.uid &&
    verifiedGeneration === actor.generation && isTransientFailure(error));

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
    buildStartedAtMs: Number.isFinite(Number(data.buildStartedAtMs))
      ? Math.max(0, Number(data.buildStartedAtMs))
      : undefined,
    projectionRevision: Number.isFinite(Number(data.projectionRevision))
      ? Math.max(0, Number(data.projectionRevision))
      : 0,
    deltaDocumentsApplied: Number.isFinite(Number(data.deltaDocumentsApplied))
      ? Math.max(0, Number(data.deltaDocumentsApplied))
      : undefined,
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

const readStoredCache = (actor = currentSnapshotActor()): BrowserSnapshotCache | null => {
  if (!actor) return null;
  if (memoryCache?.ownerUid === actor.uid) return memoryCache;
  if (!canUseSessionStorage()) return null;
  try {
    // No v3 migration: old persisted snapshots were not tied to a principal.
    window.sessionStorage.removeItem(LEGACY_CACHE_KEY);
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      ownerUid?: unknown; snapshot?: unknown; extraDates?: Record<string, unknown>;
    };
    if (parsed.ownerUid !== actor.uid) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    const snapshot = normalizeSnapshot(parsed.snapshot);
    if (!snapshot) return null;
    const extraDates: Record<string, SessionsManagementDatePayload> = {};
    Object.entries(parsed.extraDates || {}).forEach(([dateKey, datePayload]) => {
      const normalized = normalizeDatePayload(datePayload);
      if (normalized && normalized.snapshotId === snapshot.snapshotId) extraDates[dateKey] = normalized;
    });
    memoryCache = { ownerUid: actor.uid, snapshot, extraDates };
    return memoryCache;
  } catch {
    return null;
  }
};

const persistCache = (actor: SnapshotActor, cache: BrowserSnapshotCache): void => {
  assertSnapshotActor(actor);
  if (cache.ownerUid !== actor.uid) throw new Error('Sessions Management cache owner changed.');
  memoryCache = cache;
  verifiedGeneration = actor.generation;
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // An unavailable storage API must not prevent in-memory caching.
  }
};

const replaceSnapshotCache = (
  actor: SnapshotActor,
  snapshot: SessionsManagementSnapshotPayload,
): SessionsManagementSnapshotPayload => {
  persistCache(actor, { ownerUid: actor.uid, snapshot, extraDates: {} });
  return snapshot;
};

/** Immediate invalidation on sign-out, revocation or account boundary. */
export const clearSessionsManagementSnapshotCache = (): void => {
  authGeneration++;
  discardBrowserCache();
};

export const clearSessionsManagementSnapshotCacheForTests = clearSessionsManagementSnapshotCache;

export const getCachedSessionsManagementSnapshot = (): SessionsManagementSnapshotPayload | null => {
  const actor = currentSnapshotActor();
  if (!actor) return null;
  // Check ownership and purge mismatched persisted data even before this
  // session is allowed to display a previously saved revision hint.
  const cache = readStoredCache(actor);
  return verifiedGeneration === actor.generation ? cache?.snapshot || null : null;
};

export async function loadSessionsManagementSnapshot(): Promise<SessionsManagementSnapshotPayload> {
  const actor = requireSnapshotActor();
  if (loadPromise) return loadPromise;
  rejectUninjectedTestNetwork();

  const pending = (async () => {
    const cached = readStoredCache(actor);
    const callable = httpsCallable(functions, 'getSessionsManagementSnapshot');
    try {
      const response = await callable({
        knownSnapshotId: cached?.snapshot.snapshotId || '',
        knownProjectionRevision: cached?.snapshot.projectionRevision ?? -1,
      });
      assertSnapshotActor(actor);
      const result = response.data as Record<string, unknown>;
      if (result?.unchanged === true && cached?.snapshot) {
        // Even a persisted revision hint must be validated by this signed-in
        // actor's successful callable before the UI may consume cached rows.
        verifiedGeneration = actor.generation;
        return cached.snapshot;
      }

      const snapshot = normalizeSnapshot(result?.snapshot);
      if (snapshot) return replaceSnapshotCache(actor, snapshot);

      const retry = await callable({ knownSnapshotId: '' });
      assertSnapshotActor(actor);
      const retryResult = retry.data as Record<string, unknown>;
      const retrySnapshot = normalizeSnapshot(retryResult?.snapshot);
      if (!retrySnapshot) throw new Error('Sessions Management snapshot response was invalid.');
      return replaceSnapshotCache(actor, retrySnapshot);
    } catch (error) {
      assertSnapshotActor(actor);
      if (canUseVerifiedFallback(actor, cached, error)) {
        console.warn('[SessionsManagementSnapshot] temporary snapshot service failure; using actor-verified cache');
        return cached!.snapshot;
      }
      // Permission-denied / unauthenticated and all unknown errors fail closed.
      // Do not retain sensitive rows after a denied backend revalidation.
      if (isAccessFailure(error) || !isTransientFailure(error)) clearSessionsManagementSnapshotCache();
      throw error;
    }
  })();
  const wrapped = pending.finally(() => { if (loadPromise === wrapped) loadPromise = null; });
  loadPromise = wrapped;
  return wrapped;
}

export async function refreshSessionsManagementSnapshot(): Promise<SessionsManagementSnapshotPayload> {
  const actor = requireSnapshotActor();
  if (refreshPromise) return refreshPromise;
  rejectUninjectedTestNetwork();

  const pending = (async () => {
    const cached = readStoredCache(actor);
    const callable = httpsCallable(functions, 'adminRefreshSessionsManagementSnapshot');
    try {
      const response = await callable({});
      assertSnapshotActor(actor);
      const result = response.data as Record<string, unknown>;
      const snapshot = normalizeSnapshot(result?.snapshot);
      if (!snapshot) throw new Error('Manual Sessions Management refresh returned an invalid snapshot.');
      return replaceSnapshotCache(actor, snapshot);
    } catch (error) {
      assertSnapshotActor(actor);
      if (canUseVerifiedFallback(actor, cached, error)) {
        console.warn('[SessionsManagementSnapshot] temporary manual refresh failure; using actor-verified cache');
        return cached!.snapshot;
      }
      if (isAccessFailure(error) || !isTransientFailure(error)) clearSessionsManagementSnapshotCache();
      throw error;
    }
  })();
  const wrapped = pending.finally(() => { if (refreshPromise === wrapped) refreshPromise = null; });
  refreshPromise = wrapped;
  return wrapped;
}

export async function loadSessionsManagementDateSnapshot(
  dateKey: string,
): Promise<SessionsManagementDatePayload> {
  rejectUninjectedTestNetwork();
  const actor = requireSnapshotActor();
  const snapshot = await loadSessionsManagementSnapshot();
  assertSnapshotActor(actor);
  const cached = readStoredCache(actor);

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
  try {
    const response = await callable({ dateKey });
    assertSnapshotActor(actor);
    const result = response.data as Record<string, unknown>;
    const payload = normalizeDatePayload(result?.payload);
    if (!payload) throw new Error('Selected-date Sessions Management response was invalid.');

    const current = readStoredCache(actor);
    if (current && current.snapshot.snapshotId === payload.snapshotId) {
      persistCache(actor, {
        ownerUid: actor.uid,
        snapshot: current.snapshot,
        extraDates: { ...current.extraDates, [dateKey]: payload },
      });
    }
    return payload;
  } catch (error) {
    assertSnapshotActor(actor);
    if (isAccessFailure(error) || !isTransientFailure(error)) clearSessionsManagementSnapshotCache();
    throw error;
  }
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
  const actor = currentSnapshotActor();
  if (!actor) return null;
  const cache = readStoredCache(actor);
  if (!cache || verifiedGeneration !== actor.generation) return null;
  const { snapshot, extraDates } = cache;
  const extraPayloads = Object.values(extraDates)
    .filter((payload) => payload.snapshotId === snapshot.snapshotId);

  if (label === 'TodaysNotifications:overall-admissions') {
    const count = Math.max(0, Number(snapshot.counts.overallEnrollments || 0));
    return snapshot.enrollments.slice(0, count);
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
