import {
  getDoc,
  getDocs,
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getCachedSessionsManagementRowsForReadLabel,
  loadSessionsManagementSnapshot,
  type SessionsManagementSnapshotRow,
} from './sessionsManagementSnapshot';

type ReadTarget = Query<DocumentData> | DocumentReference<DocumentData>;

type FirestoreReadLogMeta = {
  source: string;
};

const readPathLike = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;

  if (typeof record.path === 'string') return record.path;

  const segments = Array.isArray(record.segments)
    ? record.segments.map((segment) => String(segment || '').trim()).filter(Boolean)
    : [];
  if (segments.length > 0) return segments.join('/');

  if (typeof record.canonicalString === 'function') {
    try {
      const canonical = record.canonicalString as () => string;
      return String(canonical() || '').trim();
    } catch {
      return '';
    }
  }

  return '';
};

const resolveTargetPath = (target: ReadTarget): string => {
  const record = target as unknown as Record<string, unknown>;

  return (
    readPathLike(record._query) ||
    readPathLike(record._path) ||
    readPathLike(record._key) ||
    readPathLike(record)
  );
};

const getResultSize = (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>): number => {
  if ('size' in snapshot && typeof snapshot.size === 'number') return snapshot.size;
  if ('docs' in snapshot && Array.isArray(snapshot.docs)) return snapshot.docs.length;
  if (typeof (snapshot as DocumentSnapshot<DocumentData>).exists === 'function') {
    return (snapshot as DocumentSnapshot<DocumentData>).exists() ? 1 : 0;
  }
  return 0;
};

const logRead = (
  phase: 'listen' | 'result' | 'error',
  label: string,
  target: ReadTarget,
  meta: FirestoreReadLogMeta,
  details: Record<string, unknown>,
) => {
  if (!import.meta.env.DEV) return;

  const payload = {
    label,
    collectionPath: resolveTargetPath(target) || 'unknown',
    source: meta.source,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const logger =
    phase === 'error' ? console.error :
    phase === 'listen' ? console.info :
    console.debug;

  logger('[firestore-read]', payload);
};

const isSessionsManagementSnapshotLabel = (label: string): boolean =>
  label === 'TodaysNotifications:overall-admissions' ||
  label === 'TodaysNotifications:users-by-doc-id' ||
  label === 'TodaysNotifications:users-by-uid' ||
  label.startsWith('TodaysNotifications:fetchDocsByIds:');

const makeCachedQuerySnapshot = <T extends DocumentData>(
  rows: SessionsManagementSnapshotRow[],
): QuerySnapshot<T> => {
  const docs = rows.map((row) => ({
    id: row.id,
    exists: () => true,
    data: () => row.data as T,
  })) as unknown as QueryDocumentSnapshot<T>[];

  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (callback: (result: QueryDocumentSnapshot<T>) => void) => docs.forEach(callback),
  } as unknown as QuerySnapshot<T>;
};

const tryGetSessionsManagementCachedRows = async (
  label: string,
): Promise<SessionsManagementSnapshotRow[] | null> => {
  if (!isSessionsManagementSnapshotLabel(label)) return null;

  let rows = getCachedSessionsManagementRowsForReadLabel(label);
  if (rows !== null) return rows;

  try {
    await loadSessionsManagementSnapshot();
    rows = getCachedSessionsManagementRowsForReadLabel(label);
    return rows;
  } catch (error) {
    console.warn('[firestore-read] Sessions Management snapshot unavailable; using Firestore fallback', {
      label,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export async function getDocsLogged<T extends DocumentData>(
  label: string,
  target: Query<T>,
  meta: FirestoreReadLogMeta,
): Promise<QuerySnapshot<T>> {
  const startedAt = Date.now();
  try {
    const cachedRows = await tryGetSessionsManagementCachedRows(label);
    if (cachedRows !== null) {
      const snapshot = makeCachedQuerySnapshot<T>(cachedRows);
      logRead('result', label, target as unknown as ReadTarget, meta, {
        mode: 'sessions-management-snapshot-cache',
        durationMs: Date.now() - startedAt,
        resultSize: snapshot.size,
      });
      return snapshot;
    }

    const snapshot = await getDocs(target);
    logRead('result', label, target as unknown as ReadTarget, meta, {
      mode: 'getDocs',
      durationMs: Date.now() - startedAt,
      resultSize: snapshot.size,
    });
    return snapshot;
  } catch (error) {
    logRead('error', label, target as unknown as ReadTarget, meta, {
      mode: 'getDocs',
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      code: typeof (error as { code?: unknown } | undefined)?.code === 'string'
        ? (error as { code: string }).code
        : null,
    });
    throw error;
  }
}

export async function getDocLogged<T extends DocumentData>(
  label: string,
  target: DocumentReference<T>,
  meta: FirestoreReadLogMeta,
): Promise<DocumentSnapshot<T>> {
  const startedAt = Date.now();
  try {
    const snapshot = await getDoc(target);
    logRead('result', label, target as unknown as ReadTarget, meta, {
      mode: 'getDoc',
      durationMs: Date.now() - startedAt,
      resultSize: snapshot.exists() ? 1 : 0,
    });
    return snapshot;
  } catch (error) {
    logRead('error', label, target as unknown as ReadTarget, meta, {
      mode: 'getDoc',
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      code: typeof (error as { code?: unknown } | undefined)?.code === 'string'
        ? (error as { code: string }).code
        : null,
    });
    throw error;
  }
}

export function onSnapshotLogged<T extends DocumentData>(
  label: string,
  target: Query<T>,
  meta: FirestoreReadLogMeta,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  logRead('listen', label, target as unknown as ReadTarget, meta, {
    mode: 'onSnapshot',
  });

  return onSnapshot(
    target,
    (snapshot: QuerySnapshot<T>) => {
      logRead('result', label, target as unknown as ReadTarget, meta, {
        mode: 'onSnapshot',
        resultSize: getResultSize(snapshot as QuerySnapshot<DocumentData>),
      });
      onNext(snapshot);
    },
    (error: FirestoreError) => {
      logRead('error', label, target as unknown as ReadTarget, meta, {
        mode: 'onSnapshot',
        error: error.message,
        code: error.code,
      });
      onError?.(error);
    },
  );
}

export function onSnapshotLoggedDoc<T extends DocumentData>(
  label: string,
  target: DocumentReference<T>,
  meta: FirestoreReadLogMeta,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  logRead('listen', label, target as unknown as ReadTarget, meta, {
    mode: 'onSnapshot',
  });

  return onSnapshot(
    target,
    (snapshot: DocumentSnapshot<T>) => {
      logRead('result', label, target as unknown as ReadTarget, meta, {
        mode: 'onSnapshot',
        resultSize: snapshot.exists() ? 1 : 0,
      });
      onNext(snapshot);
    },
    (error: FirestoreError) => {
      logRead('error', label, target as unknown as ReadTarget, meta, {
        mode: 'onSnapshot',
        error: error.message,
        code: error.code,
      });
      onError?.(error);
    },
  );
}
