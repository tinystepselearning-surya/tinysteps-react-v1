/**
 * Tiny Steps Session Cutover: one scheduled worker; one or two target dates.
 *
 * Launch 2026-10-12 (IST): create Oct 12 and Oct 13.
 * Following days: create tomorrow only.
 *
 * Safe for deployment before activation: no reads/writes unless the feature
 * flag is explicitly true. The function never queries classSessions, repairs
 * history, overwrites sessions or updates enrollment materialization metadata.
 */
import * as admin from 'firebase-admin';
import {AUTOMATIC_SESSION_CREATION_RETIRED} from './legacy14DayCutover';
import * as logger from 'firebase-functions/logger';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {buildRollingScheduledSessionPayload, type RollingMaterializationOccurrence} from './rollingScheduleMaterializer';
import {buildDailySessionRunPlan, indiaTodayYmd} from './nextDaySessionPlan';

if (!admin.apps.length) admin.initializeApp();

const PROJECT_REGION = 'asia-south1';
const IST_TIMEZONE = 'Asia/Kolkata';
const SCHEDULE = '5 0 * * *';
const ACTOR = 'system:daily_session_generator';
const MAX_ENROLLMENTS = 450;
const MAX_SESSION_ATTEMPTS = 350;
const KID_LOOKUP_BATCH = 100;
const FINANCE_LOOKUP_BATCH = 100;
const MAX_ACTIVE_DAY_SESSIONS = 600;
const ACTIVE_SESSION_STATES = new Set([
  'scheduled', 'upcoming', 'planned', 'open', 'reschedule_requested',
  'approved', 'in_progress', 'replacement',
]);
const ACTIVE_STATUS_VALUES = [
  'active', 'enrolled', 'current', 'ongoing', 'pending_payment', 'pending_lp',
];

/**
 * Must be opted in explicitly AFTER cutover approval. Merely deploying does
 * not activate this writer. Never echo credentials or student details to logs.
 */
export const dailySessionWritesEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => !AUTOMATIC_SESSION_CREATION_RETIRED &&
  String(env.DAILY_SESSION_WRITES_ENABLED || '').trim().toLowerCase() === 'true';

const value = (raw: unknown): string => typeof raw === 'string' ? raw.trim() : '';

function isActiveKid(data: Record<string, unknown>): boolean {
  if (data.archived === true || data.isArchived === true || data.archivedAt ||
      data.deleted === true || data.isDeleted === true || data.deletedAt) return false;
  const status = value(data.status).toLowerCase();
  return status === '' || status === 'active';
}

function canonicalChildId(enrollment: Record<string, unknown>): string {
  const kids = Array.isArray(enrollment.kidIds)
    ? enrollment.kidIds.map(value).filter(Boolean) : [];
  return value(enrollment.kidId) || kids[0] ||
    value(enrollment.studentId) || value(enrollment.childId);
}

function alreadyExists(error: unknown): boolean {
  const e = error as {code?: number | string; message?: string} | null;
  const code = String(e?.code ?? '').toLowerCase();
  const message = String(e?.message || '').toLowerCase();
  return code === '6' || code === 'already-exists' || code === 'already_exists' ||
    message.includes('already exists') || message.includes('already-exists');
}

/**
 * A different scheduled/manual/makeup class at the same child/date/time
 * must block new automatic creation. Cancelled and completed records do not
 * reserve operational child/time slots. No queries occur in this helper.
 */
export function childTimeOccupancy(
  sessions: Array<{id: string; data: Record<string, unknown>}>,
): Map<string, Set<string>> {
  const reserved = new Map<string, Set<string>>();
  for (const {id, data} of sessions) {
    const status = value(data.status).toLowerCase();
    if (!ACTIVE_SESSION_STATES.has(status)) continue;
    const childIds = [
      value(data.kidId), value(data.studentId), value(data.childId),
      ...(Array.isArray(data.kidIds) ? data.kidIds.map(value) : []),
    ].filter(Boolean);
    const date = value(data.date);
    const startTime = value(data.startTime);
    if (!date || !startTime) continue;
    for (const childId of new Set(childIds)) {
      const key = `${childId}|${date}|${startTime}`;
      if (!reserved.has(key)) reserved.set(key, new Set());
      reserved.get(key)!.add(id);
    }
  }
  return reserved;
}

export async function runDailySessionGenerator(
  db: admin.firestore.Firestore,
  now = new Date(),
): Promise<{
  today: string;
  targetDays: string[];
  enrollmentDocuments: number;
  childDocuments: number;
  planned: number;
  created: number;
  alreadyExists: number;
  blocked: number;
  failed: number;
  issuesByReason: Record<string, number>;
}> {
  // No Firestore reads/writes, even if this helper is invoked directly.
  if (AUTOMATIC_SESSION_CREATION_RETIRED) {
    throw new Error('Automatic session generation is retired; calendar is enrollment-projected');
  }
  const todayYmd = indiaTodayYmd(now);
  // Date gate before any Firestore operation.
  if (todayYmd < '2026-10-12') throw new Error('Cutover not active until October 12 IST');

  // Only select operationally active enrollment statuses; a bounded query.
  const enrollmentQuery = await db.collection('enrollments')
    .where('status', 'in', ACTIVE_STATUS_VALUES)
    .limit(MAX_ENROLLMENTS).get();
  if (enrollmentQuery.size === MAX_ENROLLMENTS) {
    throw new Error('Enrollment safety limit reached; no new sessions written');
  }

  const enrollments = enrollmentQuery.docs.map((doc) => ({
    id: doc.id, data: doc.data() as Record<string, unknown>,
  }));
  const kidIds = Array.from(new Set(enrollments.map(({data}) => canonicalChildId(data)).filter(Boolean)));
  const activeKidIds = new Set<string>();
  let childDocuments = 0;
  for (let offset = 0; offset < kidIds.length; offset += KID_LOOKUP_BATCH) {
    const chunk = kidIds.slice(offset, offset + KID_LOOKUP_BATCH);
    const snaps = await db.getAll(...chunk.map((kidId) => db.collection('kids').doc(kidId)));
    for (const snap of snaps) {
      if (snap.exists) {
        childDocuments += 1;
        if (isActiveKid((snap.data() || {}) as Record<string, unknown>)) {
          activeKidIds.add(snap.id);
        }
      }
    }
  }

  const {targetDays, plans} = buildDailySessionRunPlan({
    todayYmd, enrollments, activeKidIds,
  });
  const rows = plans.flatMap((plan) => plan.occurrences);
  if (rows.length > MAX_SESSION_ATTEMPTS) {
    throw new Error('Session candidate safety limit reached; no new sessions written');
  }

  // Only two day buckets, not future/history scans. Manual and makeup
  // exceptions already in those dates must not be double booked.
  const existingSnap = await db.collection('classSessions')
    .where('date', 'in', targetDays)
    .limit(MAX_ACTIVE_DAY_SESSIONS).get();
  if (existingSnap.size === MAX_ACTIVE_DAY_SESSIONS) {
    throw new Error('Today/Tomorrow session safety limit reached; no writes');
  }
  const occupancy = childTimeOccupancy(existingSnap.docs.map((doc) => ({
    id: doc.id, data: doc.data() as Record<string, unknown>,
  })));
  const existingIds = new Set(existingSnap.docs.map((doc) => doc.id));
  const newRows = rows.filter((row) => !existingIds.has(row.sessionId));
  const financeLinkedIds = new Set<string>();
  for (let offset = 0; offset < newRows.length; offset += FINANCE_LOOKUP_BATCH) {
    const chunk = newRows.slice(offset, offset + FINANCE_LOOKUP_BATCH);
    const refs = chunk.flatMap(({sessionId}) => [
      db.collection('billingCharges').doc(sessionId),
      db.collection('teacherEarnings').doc(sessionId),
    ]);
    const links = await db.getAll(...refs);
    chunk.forEach(({sessionId}, i) => {
      if (links[2 * i].exists || links[2 * i + 1].exists) {
        financeLinkedIds.add(sessionId);
      }
    });
  }

  const enrollmentById = new Map(enrollments.map(({id, data}) => [id, data]));
  const issuesByReason: Record<string, number> = {};
  for (const issue of plans.flatMap((plan) => plan.issues)) {
    issuesByReason[issue.reason] = (issuesByReason[issue.reason] || 0) + 1;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;
  // Sequential create-only writes avoid overwhelming Firestore and make failures
  // observable; no reads of classSessions are performed.
  for (const row of rows) {
    // Already created deterministic IDs remain authoritative even when a
    // manually cancelled class is being deliberately left cancelled.
    if (existingIds.has(row.sessionId)) {
      skipped += 1;
      continue;
    }
    const key = `${row.kidId}|${row.date}|${row.startTime}`;
    const occupied = occupancy.get(key);
    if (occupied?.size) {
      issuesByReason.existing_student_time_conflict =
        (issuesByReason.existing_student_time_conflict || 0) + 1;
      continue;
    }
    if (financeLinkedIds.has(row.sessionId)) {
      issuesByReason.financial_reference_conflict =
        (issuesByReason.financial_reference_conflict || 0) + 1;
      continue;
    }
    const enrollment = enrollmentById.get(row.enrollmentId);
    if (!enrollment) {
      failed += 1;
      continue;
    }
    const date = new Date(`${row.date}T00:00:00.000Z`);
    const occurrence: RollingMaterializationOccurrence = {
      date: row.date,
      weekday: date.getUTCDay(),
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
      startAtUtcMs: row.startAtUtcMs,
      endAtUtcMs: row.endAtUtcMs,
      occurrenceKey: `${row.date}|${row.startTime}|${row.durationMinutes}`,
      sessionId: row.sessionId,
    };

    try {
      const revisionRaw = Number((enrollment.schedule as {revision?: unknown} | undefined)?.revision);
      const scheduleRevision = Number.isInteger(revisionRaw) && revisionRaw >= 1 ? revisionRaw : 1;
      const payload = buildRollingScheduledSessionPayload({
        enrollmentId: row.enrollmentId,
        enrollment,
        occurrence,
        scheduleRevision,
        actorId: ACTOR,
      });
      await db.collection('classSessions').doc(row.sessionId).create(payload);
      created += 1;
      if (!occupancy.has(key)) occupancy.set(key, new Set());
      occupancy.get(key)!.add(row.sessionId);
    } catch (error) {
      if (alreadyExists(error)) skipped += 1;
      else {
        failed += 1;
        logger.error('dailySessionGenerator:create_failed', {
          sessionId: row.sessionId,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const summary = {
    today: todayYmd,
    targetDays,
    enrollmentDocuments: enrollments.length,
    childDocuments,
    planned: rows.length,
    created,
    alreadyExists: skipped,
    blocked: Object.values(issuesByReason).reduce((sum, count) => sum + count, 0),
    failed,
    issuesByReason,
  };
  if (failed || summary.blocked) logger.warn('dailySessionGenerator:completed_with_issues', summary);
  else logger.info('dailySessionGenerator:completed', summary);
  return summary;
}

export const dailySessionsTomorrowAt0005 = onSchedule({
  schedule: SCHEDULE,
  timeZone: IST_TIMEZONE,
  region: PROJECT_REGION,
  memory: '256MiB',
  timeoutSeconds: 540,
  retryCount: 0,
}, async () => {
  if (!dailySessionWritesEnabled()) {
    logger.info('dailySessionGenerator:disabled');
    return;
  }
  await runDailySessionGenerator(admin.firestore());
});
