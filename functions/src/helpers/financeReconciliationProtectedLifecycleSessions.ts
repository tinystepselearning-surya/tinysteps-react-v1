import * as admin from 'firebase-admin';
import {
  buildFinanceReconciliationMonthBounds,
} from './financeReconciliationCompletedSessions';
import {
  isFinanciallyEarnedAttendanceStatus,
} from './status';

const PROTECTED_LIFECYCLE_STATUSES = new Set([
  'cancelled',
  'rescheduled',
  'reschedule_requested',
]);

export type ProtectedLifecycleSessionFetchMode =
  | 'all_time_protected_lifecycle'
  | 'month_bounded_protected_lifecycle_union';

export interface ProtectedLifecycleSessionFetchResult {
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[];
  truncated: boolean;
  mode: ProtectedLifecycleSessionFetchMode;
}

function normalizeStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'canceled' ? 'cancelled' : raw;
}

function resolveAttendanceStatus(entry: unknown): string {
  if (typeof entry === 'string') return normalizeStatus(entry);

  if (entry && typeof entry === 'object') {
    return normalizeStatus(
      (entry as Record<string, unknown>).status,
    );
  }

  return '';
}

export function isFinanciallyEarnedProtectedLifecycleSessionData(
  session: Record<string, unknown>,
): boolean {
  if (!PROTECTED_LIFECYCLE_STATUSES.has(
    normalizeStatus(session.status),
  )) {
    return false;
  }

  const attendance = session.attendance;

  if (
    !attendance ||
    typeof attendance !== 'object' ||
    Array.isArray(attendance)
  ) {
    return false;
  }

  return Object.values(
    attendance as Record<string, unknown>,
  ).some(entry =>
    isFinanciallyEarnedAttendanceStatus(
      resolveAttendanceStatus(entry),
    )
  );
}

async function fetchLimited(
  query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
  maxDocs: number,
): Promise<{
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[];
  truncated: boolean;
}> {
  const limitedSnap = await query.limit(maxDocs).get();

  let truncated = false;

  if (
    limitedSnap.size === maxDocs &&
    limitedSnap.docs.length > 0
  ) {
    const lastDoc =
      limitedSnap.docs[limitedSnap.docs.length - 1];

    const probe =
      await query.startAfter(lastDoc).limit(1).get();

    truncated = !probe.empty;
  }

  return {
    docs: limitedSnap.docs,
    truncated,
  };
}

export async function fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation(
  input: {
    db: FirebaseFirestore.Firestore;
    monthKey: string | null;
    maxDocs: number;
  },
): Promise<ProtectedLifecycleSessionFetchResult> {
  const { db, monthKey } = input;
  const maxDocs =
    Math.max(1, Math.floor(input.maxDocs));

  if (!monthKey) {
    const results = await Promise.all(
      [...PROTECTED_LIFECYCLE_STATUSES].map(
        lifecycleStatus =>
          fetchLimited(
            db.collection('classSessions')
              .where(
                'status',
                '==',
                lifecycleStatus,
              ),
            maxDocs,
          ),
      ),
    );

    const byId = new Map<
      string,
      FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    >();

    for (const result of results) {
      for (const docSnap of result.docs) {
        const data =
          (docSnap.data() || {}) as Record<string, unknown>;

        if (
          isFinanciallyEarnedProtectedLifecycleSessionData(data)
        ) {
          byId.set(docSnap.id, docSnap);
        }
      }
    }

    const docs =
      Array.from(byId.values())
        .sort((a, b) => a.id.localeCompare(b.id));

    const unionTruncated =
      docs.length > maxDocs;

    return {
      docs:
        unionTruncated
          ? docs.slice(0, maxDocs)
          : docs,
      truncated:
        results.some(result => result.truncated) ||
        unionTruncated,
      mode: 'all_time_protected_lifecycle',
    };
  }

  const bounds =
    buildFinanceReconciliationMonthBounds(monthKey);

  const [dateSnap, startAtSnap, explicitMonthSnap] =
    await Promise.all([
      fetchLimited(
        db.collection('classSessions')
          .where('date', '>=', bounds.firstDate)
          .where('date', '<', bounds.nextMonthDate),
        maxDocs,
      ),

      fetchLimited(
        db.collection('classSessions')
          .where(
            'startAt',
            '>=',
            admin.firestore.Timestamp.fromDate(
              bounds.startAtInclusive,
            ),
          )
          .where(
            'startAt',
            '<',
            admin.firestore.Timestamp.fromDate(
              bounds.startAtExclusive,
            ),
          ),
        maxDocs,
      ),

      fetchLimited(
        db.collection('classSessions')
          .where('monthKey', '==', monthKey),
        maxDocs,
      ),
    ]);

  const byId = new Map<
    string,
    FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  >();

  for (
    const docSnap of [
      ...dateSnap.docs,
      ...startAtSnap.docs,
      ...explicitMonthSnap.docs,
    ]
  ) {
    const data =
      (docSnap.data() || {}) as Record<string, unknown>;

    if (
      isFinanciallyEarnedProtectedLifecycleSessionData(data)
    ) {
      byId.set(docSnap.id, docSnap);
    }
  }

  const docs =
    Array.from(byId.values())
      .sort((a, b) => a.id.localeCompare(b.id));

  const unionTruncated =
    docs.length > maxDocs;

  return {
    docs:
      unionTruncated
        ? docs.slice(0, maxDocs)
        : docs,

    truncated:
      dateSnap.truncated ||
      startAtSnap.truncated ||
      explicitMonthSnap.truncated ||
      unionTruncated,

    mode:
      'month_bounded_protected_lifecycle_union',
  };
}
