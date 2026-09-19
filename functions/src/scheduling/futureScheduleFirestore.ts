import * as admin from 'firebase-admin';
import type {
  FutureScheduleExecutionReadStore,
  FutureScheduleExecutionTransaction,
  FutureScheduleExecutorStore,
} from './futureScheduleExecutor';
import type {
  FutureScheduleSessionEvidence,
} from './futureScheduleInspection';

export const MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT = 2500;
export const MAX_FUTURE_SCHEDULE_EXCEPTION_ROWS = 256;
export const MAX_FUTURE_SCHEDULE_FINANCE_IDS = 256;
const FIRESTORE_IN_QUERY_CHUNK = 30;

const EXCEPTION_LINK_FIELDS = [
  'makeupForSessionId',
  'rescheduledFromSessionId',
  'originalSessionId',
  'sourceSessionId',
  'replacementForSessionId',
] as const;

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const isValidYmd = (value: unknown): value is string => {
  const raw = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [year, month, day] = raw.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const startAtIstYmd = (value: unknown): string | null => {
  if (!value) return null;
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.toDate === 'function') {
      try {
        date = (record.toDate as () => Date)();
      } catch {
        date = null;
      }
    } else {
      const seconds = Number(record.seconds ?? record._seconds);
      if (Number.isFinite(seconds)) date = new Date(seconds * 1000);
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
};

export function shouldIncludeFutureScheduleWindowRow(args: {
  data: Record<string, unknown>;
  fromYmd: string;
  throughYmd: string;
}): boolean {
  const rawDate = args.data.date;
  if (isValidYmd(rawDate)) {
    return rawDate >= args.fromYmd && rawDate <= args.throughYmd;
  }

  // A malformed explicit date still fails closed when its timestamp places it
  // inside the managed future window. Historical malformed rows are excluded so
  // immutable old data cannot permanently block future self-healing.
  const fallbackDate = startAtIstYmd(args.data.startAt);
  if (fallbackDate) {
    return fallbackDate >= args.fromYmd && fallbackDate <= args.throughYmd;
  }

  // With no usable date or timestamp we cannot prove that the row is historical,
  // so retain it as evidence and let Brick 2 block rather than guess.
  return true;
}

const chunks = <T>(values: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
};

type FirestoreReader = {
  getDocument(
    ref: admin.firestore.DocumentReference,
  ): Promise<admin.firestore.DocumentSnapshot>;
  getQuery(
    query: admin.firestore.Query,
  ): Promise<admin.firestore.QuerySnapshot>;
};

function evidenceFromSnapshot(
  snapshot: admin.firestore.DocumentSnapshot,
): FutureScheduleSessionEvidence | null {
  if (!snapshot.exists) return null;
  return {
    id: snapshot.id,
    data: (snapshot.data() || {}) as Record<string, unknown>,
  };
}

function mergeEvidence(
  groups: FutureScheduleSessionEvidence[][],
): FutureScheduleSessionEvidence[] {
  const byId = new Map<string, FutureScheduleSessionEvidence>();
  groups.flat().forEach((row) => {
    if (!row?.id || byId.has(row.id)) return;
    byId.set(row.id, row);
  });
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}

async function getSessionsByIdsWithReader(args: {
  db: admin.firestore.Firestore;
  reader: FirestoreReader;
  sessionIds: string[];
}): Promise<FutureScheduleSessionEvidence[]> {
  const ids = Array.from(new Set(args.sessionIds.map((id) => text(id)).filter(Boolean)));
  if (!ids.length) return [];
  if (ids.length > MAX_FUTURE_SCHEDULE_FINANCE_IDS) {
    throw new Error('Future schedule deterministic session read exceeded safe bound');
  }

  const snapshots = await Promise.all(
    ids.map((id) =>
      args.reader.getDocument(args.db.collection('classSessions').doc(id)),
    ),
  );
  return snapshots
    .map(evidenceFromSnapshot)
    .filter((row): row is FutureScheduleSessionEvidence => Boolean(row))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function listSessionsForEnrollmentWindowWithReader(args: {
  db: admin.firestore.Firestore;
  reader: FirestoreReader;
  enrollmentId: string;
  fromYmd: string;
  throughYmd: string;
}): Promise<FutureScheduleSessionEvidence[]> {
  // Single-field enrollmentId discovery deliberately avoids a new composite-index
  // deployment dependency. The bounded cap fails closed long before one enrollment
  // can turn this into an unbounded historical scan.
  const snapshot = await args.reader.getQuery(
    args.db
      .collection('classSessions')
      .where('enrollmentId', '==', args.enrollmentId)
      .limit(MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT + 1),
  );

  if (snapshot.size > MAX_FUTURE_SCHEDULE_SESSION_ROWS_PER_ENROLLMENT) {
    throw new Error(
      `Enrollment ${args.enrollmentId} exceeds the safe classSessions scan bound`,
    );
  }

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      data: (doc.data() || {}) as Record<string, unknown>,
    }))
    .filter((row) =>
      shouldIncludeFutureScheduleWindowRow({
        data: row.data,
        fromYmd: args.fromYmd,
        throughYmd: args.throughYmd,
      }),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function listExceptionSessionsReferencingIdsWithReader(args: {
  db: admin.firestore.Firestore;
  reader: FirestoreReader;
  sessionIds: string[];
}): Promise<FutureScheduleSessionEvidence[]> {
  const ids = Array.from(new Set(args.sessionIds.map((id) => text(id)).filter(Boolean)));
  if (!ids.length) return [];
  if (ids.length > MAX_FUTURE_SCHEDULE_FINANCE_IDS) {
    throw new Error('Future schedule exception lookup exceeded safe occurrence bound');
  }

  const queryPromises: Array<Promise<admin.firestore.QuerySnapshot>> = [];
  for (const field of EXCEPTION_LINK_FIELDS) {
    for (const chunk of chunks(ids, FIRESTORE_IN_QUERY_CHUNK)) {
      queryPromises.push(
        args.reader.getQuery(
          args.db.collection('classSessions').where(field, 'in', chunk),
        ),
      );
    }
  }

  const snapshots = await Promise.all(queryPromises);
  const evidence = mergeEvidence(
    snapshots.map((snapshot) =>
      snapshot.docs.map((doc) => ({
        id: doc.id,
        data: (doc.data() || {}) as Record<string, unknown>,
      })),
    ),
  );

  if (evidence.length > MAX_FUTURE_SCHEDULE_EXCEPTION_ROWS) {
    throw new Error('Future schedule linked exception evidence exceeded safe bound');
  }
  return evidence;
}

async function getExternallyFinanceLinkedSessionIdsWithReader(args: {
  db: admin.firestore.Firestore;
  reader: FirestoreReader;
  sessionIds: string[];
}): Promise<string[]> {
  const ids = Array.from(new Set(args.sessionIds.map((id) => text(id)).filter(Boolean)));
  if (!ids.length) return [];
  if (ids.length > MAX_FUTURE_SCHEDULE_FINANCE_IDS) {
    throw new Error('Future schedule finance lookup exceeded safe bound');
  }

  const pairs = await Promise.all(
    ids.map(async (sessionId) => {
      const [charge, earning] = await Promise.all([
        args.reader.getDocument(args.db.collection('billingCharges').doc(sessionId)),
        args.reader.getDocument(args.db.collection('teacherEarnings').doc(sessionId)),
      ]);
      return charge.exists || earning.exists ? sessionId : null;
    }),
  );

  return pairs.filter((id): id is string => Boolean(id)).sort();
}

function createReadStore(args: {
  db: admin.firestore.Firestore;
  reader: FirestoreReader;
  now: () => Date;
}): FutureScheduleExecutionReadStore {
  return {
    getNow: args.now,

    async getEnrollment(enrollmentId) {
      const snapshot = await args.reader.getDocument(
        args.db.collection('enrollments').doc(enrollmentId),
      );
      return snapshot.exists
        ? ((snapshot.data() || {}) as Record<string, unknown>)
        : null;
    },

    async getSessionsByIds(sessionIds) {
      return getSessionsByIdsWithReader({
        db: args.db,
        reader: args.reader,
        sessionIds,
      });
    },

    async listSessionsForEnrollmentWindow(input) {
      return listSessionsForEnrollmentWindowWithReader({
        db: args.db,
        reader: args.reader,
        ...input,
      });
    },

    async listExceptionSessionsReferencingIds(sessionIds) {
      return listExceptionSessionsReferencingIdsWithReader({
        db: args.db,
        reader: args.reader,
        sessionIds,
      });
    },

    async getExternallyFinanceLinkedSessionIds(sessionIds) {
      return getExternallyFinanceLinkedSessionIdsWithReader({
        db: args.db,
        reader: args.reader,
        sessionIds,
      });
    },
  };
}

export function createFutureScheduleFirestoreStore(
  db: admin.firestore.Firestore,
  options: {now?: () => Date} = {},
): FutureScheduleExecutorStore {
  const now = options.now || (() => new Date());

  const outsideReader: FirestoreReader = {
    getDocument: (ref) => ref.get(),
    getQuery: (query) => query.get(),
  };

  const outside = createReadStore({db, reader: outsideReader, now});

  return {
    ...outside,

    async runTransaction<T>(
      handler: (tx: FutureScheduleExecutionTransaction) => Promise<T>,
    ): Promise<T> {
      return db.runTransaction(async (firestoreTx) => {
        const transactionReader: FirestoreReader = {
          getDocument: (ref) => firestoreTx.get(ref),
          getQuery: (query) => firestoreTx.get(query),
        };
        const readStore = createReadStore({
          db,
          reader: transactionReader,
          now,
        });

        const tx: FutureScheduleExecutionTransaction = {
          ...readStore,

          async createSession(sessionId, payload) {
            firestoreTx.create(
              db.collection('classSessions').doc(sessionId),
              payload,
            );
          },

          async patchSession(sessionId, patch) {
            firestoreTx.set(
              db.collection('classSessions').doc(sessionId),
              patch,
              {merge: true},
            );
          },
        };

        return handler(tx);
      });
    },
  };
}
