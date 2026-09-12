import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {FieldValue} from 'firebase-admin/firestore';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  addDaysYmd,
  buildRollingMaterializationPlan,
  buildRollingScheduledSessionPayload,
  normalizeRollingMaterializerSlots,
  type RollingMaterializationOccurrence,
  type RollingScheduleMaterializationState,
} from './rollingScheduleMaterializer';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const ROLLING_SCHEDULE_REPAIR_REGION = 'asia-south1';
export const MAX_ROLLING_SCHEDULE_REPAIR_ENROLLMENTS = 250;
export const ROLLING_SCHEDULE_REPAIR_CONFIRMATION = 'APPLY_ROLLING_SCHEDULE_REPAIR';

const IST_OFFSET_MINUTES = 330;
const REPAIR_ACTOR = 'system:rolling_schedule_admin_repair';
const MAX_DETAIL_ROWS = 100;
const ACTIVE_STATUS_ALIASES = new Set([
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
]);

export type RollingScheduleRepairAssessment = {
  enrollmentId: string;
  expectedCount: number;
  existingCount: number;
  missingOccurrences: RollingMaterializationOccurrence[];
  metadataNeedsInitialization: boolean;
  materialization: RollingScheduleMaterializationState;
};

export type RollingScheduleRepairSummary = {
  mode: 'DRY_RUN' | 'APPLY';
  anchorYmd: string;
  horizonEndYmd: string;
  operationalEnrollments: number;
  eligibleEnrollments: number;
  skippedInvalidSchedule: string[];
  skippedMissingTeacher: string[];
  failedEnrollments: Array<{enrollmentId: string; error: string}>;
  expectedOccurrences: number;
  existingSessionsPreserved: number;
  missingSessions: number;
  affectedEnrollments: number;
  zeroMaterializedEnrollments: number;
  metadataNeedingInitialization: number;
  missingByWeekday: Record<string, number>;
  missingByDate: Record<string, number>;
  sundayExpected: number;
  sundayExisting: number;
  sundayMissing: number;
  sessionsCreated: number;
  metadataUpdates: number;
  results: Array<{
    enrollmentId: string;
    expected: number;
    existing: number;
    missing: number;
    metadataNeedsInitialization: boolean;
  }>;
  postRepair?: {
    expectedOccurrences: number;
    existingSessionsPreserved: number;
    missingSessions: number;
    affectedEnrollments: number;
    metadataNeedingInitialization: number;
    sundayExpected: number;
    sundayExisting: number;
    sundayMissing: number;
  };
};

type RepairAuditResult = {
  summary: RollingScheduleRepairSummary;
  assessments: RollingScheduleRepairAssessment[];
};

type RepairInput = {
  apply?: boolean;
  confirmation?: string;
  expectedMissingCount?: number;
  anchorYmd?: string;
  maxEnrollments?: number;
};

const optionalText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isRecordLike = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pad2 = (value: number): string => String(value).padStart(2, '0');

export function resolveRollingScheduleRepairTodayYmd(now = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

export function isOperationalEnrollmentForRollingRepair(
  enrollment: Record<string, unknown>,
): boolean {
  if (enrollment.archivedAt || enrollment.archived === true || enrollment.isArchived === true) {
    return false;
  }
  return ACTIVE_STATUS_ALIASES.has(optionalText(enrollment.status).toLowerCase());
}

function validateAnchorYmd(value: string): string {
  const normalized = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'anchorYmd must use YYYY-MM-DD.');
  }
  try {
    addDaysYmd(normalized, 0);
  } catch {
    throw new HttpsError('invalid-argument', 'anchorYmd must be a valid calendar date.');
  }
  return normalized;
}

function buildMaterializationPatch(materialization: RollingScheduleMaterializationState) {
  return {
    'scheduleMaterialization.schemaVersion': materialization.schemaVersion,
    'scheduleMaterialization.horizonDays': materialization.horizonDays,
    'scheduleMaterialization.scheduleRevision': materialization.scheduleRevision,
    'scheduleMaterialization.materializedThroughYmd': materialization.materializedThroughYmd,
    'scheduleMaterialization.nextOccurrenceYmd': materialization.nextOccurrenceYmd,
    'scheduleMaterialization.nextMaterializationDueYmd': materialization.nextMaterializationDueYmd,
    'scheduleMaterialization.updatedAt': FieldValue.serverTimestamp(),
    'scheduleMaterialization.updatedBy': REPAIR_ACTOR,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: REPAIR_ACTOR,
  };
}

function normalizeMaxEnrollments(value: unknown): number {
  const parsed = Number(value ?? MAX_ROLLING_SCHEDULE_REPAIR_ENROLLMENTS);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_ROLLING_SCHEDULE_REPAIR_ENROLLMENTS) {
    throw new HttpsError(
      'invalid-argument',
      `maxEnrollments must be an integer from 1 to ${MAX_ROLLING_SCHEDULE_REPAIR_ENROLLMENTS}.`,
    );
  }
  return parsed;
}

function classifyCandidate(
  enrollment: Record<string, unknown>,
): 'eligible' | 'invalid_schedule' | 'missing_teacher' {
  try {
    const slots = normalizeRollingMaterializerSlots(enrollment.schedule);
    if (!slots.length) return 'invalid_schedule';
  } catch {
    return 'invalid_schedule';
  }

  const teacher = resolveCanonicalTeacherIdForWrite(enrollment);
  if (!teacher.teacherId || teacher.source === 'ambiguous_legacy') return 'missing_teacher';
  return 'eligible';
}

export async function assessRollingScheduleRepairEnrollment(
  db: admin.firestore.Firestore,
  args: {
    enrollmentId: string;
    enrollment: Record<string, unknown>;
    anchorYmd: string;
  },
): Promise<RollingScheduleRepairAssessment> {
  const plan = buildRollingMaterializationPlan({
    enrollmentId: args.enrollmentId,
    enrollment: args.enrollment,
    anchorYmd: args.anchorYmd,
  });
  const refs = plan.occurrences.map((occurrence) =>
    db.collection('classSessions').doc(occurrence.sessionId),
  );
  const snaps = refs.length ? await db.getAll(...refs) : [];
  const existingIds = new Set(snaps.filter((snap) => snap.exists).map((snap) => snap.id));
  const missingOccurrences = plan.occurrences.filter(
    (occurrence) => !existingIds.has(occurrence.sessionId),
  );

  // Dry-run must prove that every missing session payload can be constructed before
  // apply mode is allowed. This catches financial/identity defects without writes.
  missingOccurrences.forEach((occurrence) => {
    buildRollingScheduledSessionPayload({
      enrollmentId: args.enrollmentId,
      enrollment: args.enrollment,
      occurrence,
      scheduleRevision: plan.scheduleRevision,
      actorId: REPAIR_ACTOR,
    });
  });

  return {
    enrollmentId: args.enrollmentId,
    expectedCount: plan.occurrences.length,
    existingCount: existingIds.size,
    missingOccurrences,
    metadataNeedsInitialization: !isRecordLike(args.enrollment.scheduleMaterialization),
    materialization: plan.materialization,
  };
}

function addMissingBreakdown(
  summary: RollingScheduleRepairSummary,
  assessment: RollingScheduleRepairAssessment,
) {
  assessment.missingOccurrences.forEach((occurrence) => {
    const weekdayKey = String(occurrence.weekday);
    summary.missingByWeekday[weekdayKey] = (summary.missingByWeekday[weekdayKey] || 0) + 1;
    summary.missingByDate[occurrence.date] = (summary.missingByDate[occurrence.date] || 0) + 1;
    if (occurrence.weekday === 0) summary.sundayMissing += 1;
  });
}

async function auditRollingScheduleRepairState(
  db: admin.firestore.Firestore,
  args: {anchorYmd: string; maxEnrollments: number; mode: 'DRY_RUN' | 'APPLY'},
): Promise<RepairAuditResult> {
  const enrollmentSnap = await db.collection('enrollments').get();
  const operational = enrollmentSnap.docs
    .map((doc) => ({id: doc.id, data: (doc.data() || {}) as Record<string, unknown>}))
    .filter((row) => isOperationalEnrollmentForRollingRepair(row.data));

  if (operational.length > args.maxEnrollments) {
    throw new HttpsError(
      'failed-precondition',
      `Safety stop: ${operational.length} operational enrollments exceeds cap ${args.maxEnrollments}.`,
    );
  }

  const summary: RollingScheduleRepairSummary = {
    mode: args.mode,
    anchorYmd: args.anchorYmd,
    horizonEndYmd: addDaysYmd(args.anchorYmd, ROLLING_SCHEDULE_HORIZON_DAYS),
    operationalEnrollments: operational.length,
    eligibleEnrollments: 0,
    skippedInvalidSchedule: [],
    skippedMissingTeacher: [],
    failedEnrollments: [],
    expectedOccurrences: 0,
    existingSessionsPreserved: 0,
    missingSessions: 0,
    affectedEnrollments: 0,
    zeroMaterializedEnrollments: 0,
    metadataNeedingInitialization: 0,
    missingByWeekday: {'0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0},
    missingByDate: {},
    sundayExpected: 0,
    sundayExisting: 0,
    sundayMissing: 0,
    sessionsCreated: 0,
    metadataUpdates: 0,
    results: [],
  };
  const assessments: RollingScheduleRepairAssessment[] = [];

  for (const row of operational) {
    const candidate = classifyCandidate(row.data);
    if (candidate === 'invalid_schedule') {
      summary.skippedInvalidSchedule.push(row.id);
      continue;
    }
    if (candidate === 'missing_teacher') {
      summary.skippedMissingTeacher.push(row.id);
      continue;
    }
    summary.eligibleEnrollments += 1;

    try {
      const assessment = await assessRollingScheduleRepairEnrollment(db, {
        enrollmentId: row.id,
        enrollment: row.data,
        anchorYmd: args.anchorYmd,
      });
      assessments.push(assessment);
      summary.expectedOccurrences += assessment.expectedCount;
      summary.existingSessionsPreserved += assessment.existingCount;
      summary.missingSessions += assessment.missingOccurrences.length;
      if (assessment.missingOccurrences.length > 0) summary.affectedEnrollments += 1;
      if (assessment.expectedCount > 0 && assessment.existingCount === 0) {
        summary.zeroMaterializedEnrollments += 1;
      }
      if (assessment.metadataNeedsInitialization) summary.metadataNeedingInitialization += 1;

      const sundayExpected = assessment.missingOccurrences.filter((item) => item.weekday === 0).length +
        (assessment.expectedCount > 0 ? 0 : 0);
      const plan = buildRollingMaterializationPlan({
        enrollmentId: row.id,
        enrollment: row.data,
        anchorYmd: args.anchorYmd,
      });
      const expectedSundayIds = new Set(
        plan.occurrences.filter((item) => item.weekday === 0).map((item) => item.sessionId),
      );
      summary.sundayExpected += expectedSundayIds.size;
      summary.sundayExisting += expectedSundayIds.size - sundayExpected;
      addMissingBreakdown(summary, assessment);

      if (
        assessment.missingOccurrences.length > 0 ||
        assessment.metadataNeedsInitialization
      ) {
        summary.results.push({
          enrollmentId: row.id,
          expected: assessment.expectedCount,
          existing: assessment.existingCount,
          missing: assessment.missingOccurrences.length,
          metadataNeedsInitialization: assessment.metadataNeedsInitialization,
        });
      }
    } catch (error) {
      summary.failedEnrollments.push({
        enrollmentId: row.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  summary.results.sort((left, right) =>
    right.missing - left.missing || left.enrollmentId.localeCompare(right.enrollmentId),
  );
  summary.results = summary.results.slice(0, MAX_DETAIL_ROWS);
  summary.failedEnrollments = summary.failedEnrollments.slice(0, MAX_DETAIL_ROWS);
  summary.skippedInvalidSchedule.sort();
  summary.skippedMissingTeacher.sort();

  return {summary, assessments};
}

async function applyEnrollmentRepairTransaction(
  db: admin.firestore.Firestore,
  args: {enrollmentId: string; anchorYmd: string},
): Promise<{created: number; metadataUpdated: boolean}> {
  const enrollmentRef = db.collection('enrollments').doc(args.enrollmentId);
  return db.runTransaction(async (tx) => {
    const enrollmentSnap = await tx.get(enrollmentRef);
    if (!enrollmentSnap.exists) {
      throw new Error(`Enrollment ${args.enrollmentId} no longer exists`);
    }
    const enrollment = (enrollmentSnap.data() || {}) as Record<string, unknown>;
    if (!isOperationalEnrollmentForRollingRepair(enrollment)) {
      throw new Error('Enrollment is no longer operationally active');
    }

    const plan = buildRollingMaterializationPlan({
      enrollmentId: args.enrollmentId,
      enrollment,
      anchorYmd: args.anchorYmd,
    });
    const sessionRefs = plan.occurrences.map((occurrence) =>
      db.collection('classSessions').doc(occurrence.sessionId),
    );
    const sessionSnaps = await Promise.all(sessionRefs.map((ref) => tx.get(ref)));
    const existingIds = new Set(
      sessionSnaps.filter((snap) => snap.exists).map((snap) => snap.id),
    );
    const missingOccurrences = plan.occurrences.filter(
      (occurrence) => !existingIds.has(occurrence.sessionId),
    );

    // Build every payload before the first write so one invalid enrollment cannot leave
    // a partially created repair window.
    const prepared = missingOccurrences.map((occurrence) => ({
      occurrence,
      payload: buildRollingScheduledSessionPayload({
        enrollmentId: args.enrollmentId,
        enrollment,
        occurrence,
        scheduleRevision: plan.scheduleRevision,
        actorId: REPAIR_ACTOR,
      }),
    }));

    prepared.forEach(({occurrence, payload}) => {
      tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload);
    });
    tx.update(enrollmentRef, buildMaterializationPatch(plan.materialization));

    return {created: prepared.length, metadataUpdated: true};
  });
}

export async function runRollingScheduleRepairInternal(
  db: admin.firestore.Firestore,
  input: RepairInput = {},
): Promise<RollingScheduleRepairSummary> {
  const apply = input.apply === true;
  const anchorYmd = validateAnchorYmd(input.anchorYmd || resolveRollingScheduleRepairTodayYmd());
  const maxEnrollments = normalizeMaxEnrollments(input.maxEnrollments);
  const preflight = await auditRollingScheduleRepairState(db, {
    anchorYmd,
    maxEnrollments,
    mode: apply ? 'APPLY' : 'DRY_RUN',
  });

  if (!apply) {
    logger.info('rollingScheduleRepair: dry run complete', preflight.summary);
    return preflight.summary;
  }

  if (input.confirmation !== ROLLING_SCHEDULE_REPAIR_CONFIRMATION) {
    throw new HttpsError(
      'failed-precondition',
      `Apply mode requires confirmation=${ROLLING_SCHEDULE_REPAIR_CONFIRMATION}.`,
    );
  }
  if (!Number.isInteger(input.expectedMissingCount) || Number(input.expectedMissingCount) < 0) {
    throw new HttpsError(
      'failed-precondition',
      'Apply mode requires expectedMissingCount from the immediately preceding dry run.',
    );
  }
  if (Number(input.expectedMissingCount) !== preflight.summary.missingSessions) {
    throw new HttpsError(
      'aborted',
      `Repair state changed: expected ${input.expectedMissingCount} missing sessions but found ${preflight.summary.missingSessions}. Run dry-run again.`,
    );
  }
  if (preflight.summary.failedEnrollments.length > 0) {
    throw new HttpsError(
      'failed-precondition',
      `Repair preflight has ${preflight.summary.failedEnrollments.length} failed enrollment(s); no writes were attempted.`,
    );
  }

  let sessionsCreated = 0;
  let metadataUpdates = 0;
  for (const assessment of preflight.assessments) {
    try {
      const result = await applyEnrollmentRepairTransaction(db, {
        enrollmentId: assessment.enrollmentId,
        anchorYmd,
      });
      sessionsCreated += result.created;
      if (result.metadataUpdated) metadataUpdates += 1;
    } catch (error) {
      logger.error('rollingScheduleRepair: apply enrollment failed closed', {
        enrollmentId: assessment.enrollmentId,
        anchorYmd,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new HttpsError(
        'aborted',
        `Repair stopped at enrollment ${assessment.enrollmentId}; rerun dry-run before retrying.`,
      );
    }
  }

  const post = await auditRollingScheduleRepairState(db, {
    anchorYmd,
    maxEnrollments,
    mode: 'DRY_RUN',
  });
  const summary = preflight.summary;
  summary.sessionsCreated = sessionsCreated;
  summary.metadataUpdates = metadataUpdates;
  summary.postRepair = {
    expectedOccurrences: post.summary.expectedOccurrences,
    existingSessionsPreserved: post.summary.existingSessionsPreserved,
    missingSessions: post.summary.missingSessions,
    affectedEnrollments: post.summary.affectedEnrollments,
    metadataNeedingInitialization: post.summary.metadataNeedingInitialization,
    sundayExpected: post.summary.sundayExpected,
    sundayExisting: post.summary.sundayExisting,
    sundayMissing: post.summary.sundayMissing,
  };

  logger.info('rollingScheduleRepair: apply complete', summary);
  return summary;
}

export const adminRepairRollingScheduleMaterialization = onCall(
  {
    region: ROLLING_SCHEDULE_REPAIR_REGION,
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    return runRollingScheduleRepairInternal(
      admin.firestore(),
      (request.data || {}) as RepairInput,
    );
  },
);
