import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS,
  MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  isMissingAttendanceIndexError,
  resolveCanonicalSessionKidIds,
  resolveSessionMonthKey,
} from './parentMonthlyAttendanceProjection';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;
const MONTH_RE = /^\d{4}-\d{2}$/;
const ATTENDANCE_REPAIR_VERSION = 2;

type RecordLike = Record<string, unknown>;

type ParentKidContext = {
  owned: boolean;
  aliases: Set<string>;
};

type AttendanceSource = {
  sessions: RecordLike[];
  sourceDocumentsRead: number;
  queryMode:
    | 'parentId_date_month_bounded'
    | 'parentId_capped_compatibility_zero_bounded'
    | 'parentId_capped_compatibility_missing_index';
};

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean)));
  }
  const single = text(value);
  return single ? [single] : [];
}

function parentMatches(data: RecordLike, parentId: string): boolean {
  return (
    text(data.parentId) === parentId ||
    text(data.primaryParentId) === parentId ||
    strings(data.parentIds).includes(parentId)
  );
}

function addKidAliases(aliases: Set<string>, data: RecordLike | undefined, docId: string): void {
  aliases.add(docId);
  if (!data) return;
  [
    data.kidId,
    data.studentId,
    data.studentUid,
    data.childId,
    data.linkedStudentId,
  ].forEach((value) => {
    const candidate = text(value);
    if (candidate) aliases.add(candidate);
  });
}

async function parentKidContext(
  db: admin.firestore.Firestore,
  parentId: string,
  kidId: string,
): Promise<ParentKidContext> {
  const [kidSnap, studentSnap, nestedSnap] = await Promise.all([
    db.collection('kids').doc(kidId).get(),
    db.collection('students').doc(kidId).get(),
    db.collection('parents').doc(parentId).collection('students').doc(kidId).get(),
  ]);

  const aliases = new Set<string>([kidId]);
  addKidAliases(aliases, kidSnap.exists ? (kidSnap.data() as RecordLike) : undefined, kidSnap.id);
  addKidAliases(aliases, studentSnap.exists ? (studentSnap.data() as RecordLike) : undefined, studentSnap.id);
  addKidAliases(aliases, nestedSnap.exists ? (nestedSnap.data() as RecordLike) : undefined, nestedSnap.id);

  const owned = Boolean(
    (kidSnap.exists && parentMatches((kidSnap.data() || {}) as RecordLike, parentId)) ||
      (studentSnap.exists && parentMatches((studentSnap.data() || {}) as RecordLike, parentId)) ||
      nestedSnap.exists,
  );

  return { owned, aliases };
}

export function currentIndiaAttendanceMonthKey(nowMs = Date.now()): string {
  const ist = new Date(nowMs + IST_OFFSET_MINUTES * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function isCurrentIndiaAttendanceMonthKey(monthKey: string, nowMs = Date.now()): boolean {
  return MONTH_RE.test(monthKey) && monthKey === currentIndiaAttendanceMonthKey(nowMs);
}

function monthDateRangeFromKey(monthKey: string): { startYmd: string; endYmd: string } | null {
  if (!MONTH_RE.test(monthKey)) return null;
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startYmd: `${yearRaw}-${monthRaw}-01`,
    endYmd: `${yearRaw}-${monthRaw}-${String(lastDay).padStart(2, '0')}`,
  };
}

function legacyKidAliases(session: RecordLike): string[] {
  return [
    session.studentId,
    session.studentUid,
    session.childId,
    session.linkedStudentId,
  ]
    .map((value) => text(value))
    .filter(Boolean);
}

/**
 * Bootstrap-only identity migration.
 *
 * P4's steady-state writer intentionally accepts only canonical kidId/kidIds. Historical
 * sessions can predate that contract, so the one-time repair may map a verified legacy alias
 * to the selected canonical kidId in memory. Source classSession documents are never mutated.
 */
export function normalizeAttendanceBootstrapSessionKidIdentity(
  session: RecordLike,
  kidId: string,
  aliases: Set<string>,
): { session: RecordLike; migrated: boolean } {
  const canonicalIds = resolveCanonicalSessionKidIds(session);
  if (canonicalIds.includes(kidId)) return { session, migrated: false };

  const canonicalAliasMatch = canonicalIds.some((candidate) => aliases.has(candidate));
  const legacyAliasMatch = legacyKidAliases(session).some((candidate) => aliases.has(candidate));

  if (canonicalIds.length > 0 && !canonicalAliasMatch) return { session, migrated: false };
  if (canonicalIds.length === 0 && !legacyAliasMatch) return { session, migrated: false };

  const mappedKidIds = canonicalIds.length > 0
    ? Array.from(new Set(canonicalIds.map((candidate) => (aliases.has(candidate) ? kidId : candidate))))
    : [kidId];

  const attendanceRaw = session.attendance;
  const nextAttendance =
    attendanceRaw && typeof attendanceRaw === 'object'
      ? { ...(attendanceRaw as RecordLike) }
      : undefined;

  if (nextAttendance && !nextAttendance[kidId]) {
    for (const alias of aliases) {
      if (alias !== kidId && nextAttendance[alias]) {
        nextAttendance[kidId] = nextAttendance[alias];
        break;
      }
    }
  }

  return {
    session: {
      ...session,
      kidId,
      kidIds: mappedKidIds,
      ...(nextAttendance ? { attendance: nextAttendance } : {}),
    },
    migrated: true,
  };
}

async function compatibilitySource(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string,
  queryMode: AttendanceSource['queryMode'],
): Promise<AttendanceSource> {
  const compatibilitySnap = await db
    .collection('classSessions')
    .where('parentId', '==', parentId)
    .limit(MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS + 1)
    .get();

  if (compatibilitySnap.size > MAX_PARENT_HISTORY_COMPATIBILITY_SESSIONS) {
    throw new Error(`attendance_compatibility_cap_exceeded:${compatibilitySnap.size}`);
  }

  const sessions = compatibilitySnap.docs
    .map((docSnap) => (docSnap.data() || {}) as RecordLike)
    .filter((session) => resolveSessionMonthKey(session) === monthKey);

  if (sessions.length > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
    throw new Error(`attendance_bootstrap_cap_exceeded:${sessions.length}`);
  }

  return {
    sessions,
    sourceDocumentsRead: compatibilitySnap.size,
    queryMode,
  };
}

/**
 * P4 steady-state reads are bounded by parentId + date. Existing sessions can predate `date`
 * and only carry startAt/scheduledAt. A zero bounded result therefore needs the same capped
 * compatibility pass already used by the Parent Classes reader.
 */
async function loadParentMonthSessionsForRepair(
  db: admin.firestore.Firestore,
  parentId: string,
  monthKey: string,
): Promise<AttendanceSource> {
  const range = monthDateRangeFromKey(monthKey);
  if (!range) throw new Error('invalid_month_key');

  try {
    const boundedSnap = await db
      .collection('classSessions')
      .where('parentId', '==', parentId)
      .where('date', '>=', range.startYmd)
      .where('date', '<=', range.endYmd)
      .limit(MAX_PARENT_MONTH_ATTENDANCE_SESSIONS + 1)
      .get();

    if (boundedSnap.size > MAX_PARENT_MONTH_ATTENDANCE_SESSIONS) {
      throw new Error(`attendance_bootstrap_cap_exceeded:${boundedSnap.size}`);
    }

    if (boundedSnap.size > 0) {
      return {
        sessions: boundedSnap.docs.map((docSnap) => (docSnap.data() || {}) as RecordLike),
        sourceDocumentsRead: boundedSnap.size,
        queryMode: 'parentId_date_month_bounded',
      };
    }

    return compatibilitySource(
      db,
      parentId,
      monthKey,
      'parentId_capped_compatibility_zero_bounded',
    );
  } catch (error) {
    if (!isMissingAttendanceIndexError(error)) throw error;
    return compatibilitySource(
      db,
      parentId,
      monthKey,
      'parentId_capped_compatibility_missing_index',
    );
  }
}

function hasAuthoritativeKidRow(
  attendance: RecordLike | undefined,
  kidId: string,
): boolean {
  const byKid = attendance?.byKid as RecordLike | undefined;
  return Boolean(
    Number(attendance?.schemaVersion) === 3 &&
      attendance?.modelType === 'class_attendance_v3' &&
      attendance?.childRowsAuthoritative === true &&
      byKid?.[kidId],
  );
}

async function currentKidRowExists(
  db: admin.firestore.Firestore,
  parentId: string,
  kidId: string,
  monthKey: string,
): Promise<boolean> {
  const snap = await db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey)
    .get();
  return hasAuthoritativeKidRow(snap.data()?.attendance as RecordLike | undefined, kidId);
}

async function repairParentClassAttendance(args: {
  db: admin.firestore.Firestore;
  parentId: string;
  kidId: string;
  monthKey: string;
  aliases: Set<string>;
}): Promise<RecordLike> {
  const { db, parentId, kidId, monthKey, aliases } = args;

  if (await currentKidRowExists(db, parentId, kidId, monthKey)) {
    return {
      mode: 'already_current',
      repairVersion: ATTENDANCE_REPAIR_VERSION,
      childRowPresent: true,
      sourceDocumentsRead: 1,
    };
  }

  const source = await loadParentMonthSessionsForRepair(db, parentId, monthKey);
  let migratedIdentityRecords = 0;
  const normalizedSessions = source.sessions.map((session) => {
    const normalized = normalizeAttendanceBootstrapSessionKidIdentity(session, kidId, aliases);
    if (normalized.migrated) migratedIdentityRecords += 1;
    return normalized.session;
  });

  const generatedAtMs = Date.now();
  const projection = buildParentMonthClassAttendanceProjection(
    normalizedSessions,
    monthKey,
    generatedAtMs,
  );
  const invariantErrors = classAttendanceProjectionInvariantErrors(projection);
  if (invariantErrors.length > 0) {
    throw new Error(`attendance_projection_invariant_failure:${invariantErrors.join('|')}`);
  }

  const readModelRef = db
    .collection('parentMonthlyReadModels')
    .doc(parentId)
    .collection('months')
    .doc(monthKey);

  await readModelRef.set(
    {
      parentId,
      monthKey,
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        classAuthority: 'class_sessions',
        attendanceAuthority: 'completed_session_attendance',
        childRowsAuthoritative: true,
        totalsScope: 'parent_month_child_session_instances',
        timeClassificationAsOfMs: generatedAtMs,
        timeBucketsRecomputableFromPendingStarts: true,
        queryMode: source.queryMode,
        sourceSessionCount: normalizedSessions.length,
        sourceDocumentsRead: source.sourceDocumentsRead,
        maxSourceSessionCount: MAX_PARENT_MONTH_ATTENDANCE_SESSIONS,
        unassignedSessionRecords: projection.unassignedSessionRecords,
        legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
        migratedIdentityRecords,
        repairVersion: ATTENDANCE_REPAIR_VERSION,
        refreshedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedAtMs,
        totals: projection.totals,
        byKid: projection.byKid,
      },
    },
    { merge: true },
  );

  return {
    mode: 'repaired',
    repairVersion: ATTENDANCE_REPAIR_VERSION,
    queryMode: source.queryMode,
    sourceDocumentsRead: 1 + source.sourceDocumentsRead,
    sourceSessionCount: normalizedSessions.length,
    childRowPresent: Boolean(projection.byKid[kidId]),
    migratedIdentityRecords,
    legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
    unassignedSessionRecords: projection.unassignedSessionRecords,
  };
}

async function claimRepairVersion(
  db: admin.firestore.Firestore,
  parentId: string,
  kidId: string,
  monthKey: string,
): Promise<{ claimed: boolean; lockRef: admin.firestore.DocumentReference }> {
  const lockRef = db
    .collection('parentProjectionBootstrapRepairLocks')
    .doc(parentId)
    .collection('kids')
    .doc(kidId)
    .collection('attendance')
    .doc(monthKey);

  const claimed = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef);
    const data = (snapshot.data() || {}) as RecordLike;
    if (Number(data.repairVersion ?? 0) >= ATTENDANCE_REPAIR_VERSION) return false;

    transaction.set(lockRef, {
      parentId,
      kidId,
      monthKey,
      repairVersion: ATTENDANCE_REPAIR_VERSION,
      status: 'processing',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  });

  return { claimed, lockRef };
}

export const bootstrapParentClassAttendance = onCall({ region: REGION }, async (request) => {
  const parentId = text(request.auth?.uid);
  if (!parentId) throw new HttpsError('unauthenticated', 'Sign in as a parent to repair class totals.');

  const tokenRole = text(request.auth?.token?.role).toLowerCase();
  const userRole = tokenRole || text(
    (await admin.firestore().collection('users').doc(parentId).get()).data()?.role,
  ).toLowerCase();
  if (userRole !== 'parent') {
    throw new HttpsError('permission-denied', 'Parent access is required.');
  }

  const payload = (request.data || {}) as { kidId?: unknown; monthKey?: unknown };
  const kidId = text(payload.kidId);
  const monthKey = text(payload.monthKey) || currentIndiaAttendanceMonthKey();
  if (!kidId || kidId.length > 200 || !MONTH_RE.test(monthKey)) {
    throw new HttpsError('invalid-argument', 'A valid kidId and monthKey are required.');
  }
  if (!isCurrentIndiaAttendanceMonthKey(monthKey)) {
    throw new HttpsError('failed-precondition', 'Only the current India calendar month can be repaired.');
  }

  const db = admin.firestore();
  const context = await parentKidContext(db, parentId, kidId);
  if (!context.owned) {
    throw new HttpsError('permission-denied', 'This child is not linked to the authenticated parent.');
  }

  if (await currentKidRowExists(db, parentId, kidId, monthKey)) {
    return {
      mode: 'already_current',
      repairVersion: ATTENDANCE_REPAIR_VERSION,
      childRowPresent: true,
    };
  }

  const { claimed, lockRef } = await claimRepairVersion(db, parentId, kidId, monthKey);
  if (!claimed) {
    return {
      mode: 'already_attempted',
      repairVersion: ATTENDANCE_REPAIR_VERSION,
      childRowPresent: await currentKidRowExists(db, parentId, kidId, monthKey),
    };
  }

  try {
    const result = await repairParentClassAttendance({
      db,
      parentId,
      kidId,
      monthKey,
      aliases: context.aliases,
    });
    await lockRef.set(
      {
        status: 'completed',
        result,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await lockRef.set(
      {
        status: 'failed',
        failureCode: message.slice(0, 180),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    throw new HttpsError('internal', 'Unable to repair class totals right now.');
  }
});
