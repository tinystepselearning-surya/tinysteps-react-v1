import * as admin from 'firebase-admin';

const IST_OFFSET_MINUTES = 330;
const MONTH_KEY_RE = /^(\d{4})-(\d{2})$/;

export type CompletedSessionFetchMode =
  | 'all_time_completed'
  | 'month_bounded_canonical_union';

export interface CompletedSessionFetchResult {
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[];
  truncated: boolean;
  mode: CompletedSessionFetchMode;
}

export interface FinanceReconciliationMonthBounds {
  firstDate: string;
  nextMonthDate: string;
  startAtInclusive: Date;
  startAtExclusive: Date;
}

function dateToYmdUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

/**
 * Returns canonical IST month boundaries for Firestore session queries.
 * `date` is stored as YYYY-MM-DD in IST; `startAt` is an absolute timestamp.
 */
export function buildFinanceReconciliationMonthBounds(
  monthKey: string,
): FinanceReconciliationMonthBounds {
  const match = MONTH_KEY_RE.exec(String(monthKey || '').trim());
  if (!match) throw new Error('monthKey must be YYYY-MM');

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    throw new Error('monthKey must be YYYY-MM');
  }

  const firstDayContext = new Date(Date.UTC(year, month - 1, 1));
  const nextMonthContext = new Date(Date.UTC(year, month, 1));
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;

  return {
    firstDate: dateToYmdUtc(firstDayContext),
    nextMonthDate: dateToYmdUtc(nextMonthContext),
    startAtInclusive: new Date(firstDayContext.getTime() - offsetMs),
    startAtExclusive: new Date(nextMonthContext.getTime() - offsetMs),
  };
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
  if (limitedSnap.size === maxDocs && limitedSnap.docs.length > 0) {
    const lastDoc = limitedSnap.docs[limitedSnap.docs.length - 1];
    const probeSnap = await query.startAfter(lastDoc).limit(1).get();
    truncated = !probeSnap.empty;
  }
  return { docs: limitedSnap.docs, truncated };
}

/**
 * B6 Brick 5A.
 *
 * Historical behavior queried every completed class session, then filtered to the requested
 * month in memory. For month-scoped reconciliation we instead query the canonical service-date
 * fields before download:
 *   1) `date` within the requested YYYY-MM range;
 *   2) `startAt` within the exact IST month timestamp range;
 *   3) explicit `monthKey == requested month` for any compatible historical rows.
 *
 * Results are deduped by document id and filtered to `status == completed`. The caller keeps its
 * existing month-scope filter as a final parity guard. Manual all-time audits retain the original
 * `status == completed` query.
 *
 * The bounded queries intentionally use single fields (no status predicate) so they rely only on
 * Firestore's automatic single-field indexes and do not require a new composite index rollout.
 */
export async function fetchCompletedSessionsForFinanceReconciliation(input: {
  db: FirebaseFirestore.Firestore;
  monthKey: string | null;
  maxDocs: number;
}): Promise<CompletedSessionFetchResult> {
  const { db, monthKey } = input;
  const maxDocs = Math.max(1, Math.floor(input.maxDocs));

  if (!monthKey) {
    const result = await fetchLimited(
      db.collection('classSessions').where('status', '==', 'completed'),
      maxDocs,
    );
    return {
      ...result,
      mode: 'all_time_completed',
    };
  }

  const bounds = buildFinanceReconciliationMonthBounds(monthKey);
  const [dateSnap, startAtSnap, explicitMonthSnap] = await Promise.all([
    fetchLimited(
      db
        .collection('classSessions')
        .where('date', '>=', bounds.firstDate)
        .where('date', '<', bounds.nextMonthDate),
      maxDocs,
    ),
    fetchLimited(
      db
        .collection('classSessions')
        .where('startAt', '>=', admin.firestore.Timestamp.fromDate(bounds.startAtInclusive))
        .where('startAt', '<', admin.firestore.Timestamp.fromDate(bounds.startAtExclusive)),
      maxDocs,
    ),
    fetchLimited(db.collection('classSessions').where('monthKey', '==', monthKey), maxDocs),
  ]);

  const byId = new Map<
    string,
    FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  >();
  for (const docSnap of [...dateSnap.docs, ...startAtSnap.docs, ...explicitMonthSnap.docs]) {
    if (String(docSnap.data()?.status || '').trim().toLowerCase() !== 'completed') continue;
    byId.set(docSnap.id, docSnap);
  }

  const docs = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  const unionTruncated = docs.length > maxDocs;

  return {
    docs: unionTruncated ? docs.slice(0, maxDocs) : docs,
    truncated:
      dateSnap.truncated || startAtSnap.truncated || explicitMonthSnap.truncated || unionTruncated,
    mode: 'month_bounded_canonical_union',
  };
}
