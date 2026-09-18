/**
 * Brick 2: read-only, pointer-independent rolling schedule integrity audit.
 * This module must never create, update, or delete enrollment/session data.
 */
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {Timestamp} from 'firebase-admin/firestore';
import {HttpsError, onCall} from 'firebase-functions/v2/https';
import {ensureAdmin} from '../helpers/adminGuard';
import {isEnrollmentOperationallyActive, normalizeSessionStatus} from '../helpers/status';
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  addDaysYmd,
  buildRollingMaterializationPlan,
  normalizeRollingMaterializerSlots,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const SCHEDULE_INTEGRITY_REGION = 'asia-south1';
export const MAX_SCHEDULE_INTEGRITY_ENROLLMENTS = 500;
export const MAX_SCHEDULE_INTEGRITY_DETAIL_ROWS = 200;

const IST_OFFSET_MINUTES = 330;
const READ_BATCH_SIZE = 300;

const VALID_EXCEPTION_STATUSES = new Set([
  'cancelled',
  'paused',
  'reschedule_requested',
  'rescheduled',
]);

const SCHEDULE_EXCEPTION_SOURCE_TOKENS = [
  'ad_hoc',
  'adhoc',
  'makeup',
  'reschedule',
  'manual_one_off',
  'approved_request',
  'one_off',
  'replacement',
];

const EXCEPTION_BACK_REFERENCE_FIELDS = [
  'replacementForSessionId',
  'originalSessionId',
  'makeupForSessionId',
  'rescheduledFromSessionId',
] as const;

const EXCEPTION_MARKER_FIELDS = [
  ...EXCEPTION_BACK_REFERENCE_FIELDS,
  'replacementSessionId',
] as const;

export type ScheduleIntegrityOccurrenceState =
  | 'healthy'
  | 'missing'
  | 'schedule_exception'
  | 'identity_mismatch'
  | 'schedule_mismatch'
  | 'stale_revision';

export type ScheduleIntegrityInvalidReason =
  | 'invalid_schedule'
  | 'missing_teacher'
  | 'ambiguous_teacher'
  | 'missing_child_identity';

export type ScheduleIntegrityEnrollmentRow = {
  enrollmentId: string;
  expected: number;
  healthy: number;
  exceptions: number;
  missing: number;
  identityMismatches: number;
  scheduleMismatches: number;
  staleRevision: number;
  missingToday: number;
  materializationMetadataPresent: boolean;
};

export type ScheduleIntegrityInvalidEnrollment = {
  enrollmentId: string;
  reason: ScheduleIntegrityInvalidReason;
};

export type ScheduleIntegritySummary = {
  mode: 'READ_ONLY';
  pointerIndependentScan: true;
  anchorYmd: string;
  horizonEndYmd: string;
  horizonDays: typeof ROLLING_SCHEDULE_HORIZON_DAYS;
  operationalEnrollments: number;
  eligibleEnrollments: number;
  invalidEnrollments: number;
  expectedOccurrences: number;
  healthyOccurrences: number;
  scheduleExceptions: number;
  missingOccurrences: number;
  identityMismatches: number;
  scheduleMismatches: number;
  staleRevisionOccurrences: number;
  missingToday: number;
  affectedEnrollments: number;
  zeroCoveredEnrollments: number;
  enrollmentsMissingMaterializationMetadata: number;
  invalidByReason: Record<ScheduleIntegrityInvalidReason, number>;
  defectsByDate: Record<string, number>;
  details: ScheduleIntegrityEnrollmentRow[];
  invalidDetails: ScheduleIntegrityInvalidEnrollment[];
};

type EnrollmentRow = {
  id: string;
  data: Record<string, unknown>;
};

export type ScheduleIntegrityStore = {
  listEnrollments: () => Promise<EnrollmentRow[]>;
  getSessionsByIds: (
    sessionIds: string[],
  ) => Promise<Map<string, Record<string, unknown>>>;
  listSessionsInWindow: (
    fromYmd: string,
    toYmd: string,
  ) => Promise<Map<string, Record<string, unknown>>>;
};

type PreparedEnrollment = {
  id: string;
  data: Record<string, unknown>;
  scheduleRevision: number;
  occurrences: RollingMaterializationOccurrence[];
  materializationMetadataPresent: boolean;
};

export type ScheduleIntegrityOccurrenceClassification = {
  state: ScheduleIntegrityOccurrenceState;
  relatedExceptionSessionId?: string;
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => text(item)).filter(Boolean)),
  );
};

const collectIdentityIds = (
  row: Record<string, unknown>,
  pluralField: string,
  singleFields: string[],
): string[] => {
  const plural = stringList(row[pluralField]);
  const singles = singleFields.map((field) => text(row[field])).filter(Boolean);
  return Array.from(new Set([...plural, ...singles]));
};

const collectEnrollmentKidIds = (enrollment: Record<string, unknown>): string[] =>
  collectIdentityIds(
    enrollment,
    'kidIds',
    ['kidId', 'studentId', 'childId'],
  );

const collectSessionKidIds = (session: Record<string, unknown>): string[] =>
  collectIdentityIds(
    session,
    'kidIds',
    ['kidId', 'studentId', 'childId'],
  );

const collectSessionTeacherIds = (session: Record<string, unknown>): string[] =>
  collectIdentityIds(
    session,
    'teacherIds',
    [
      'teacherId',
      'assignedTeacherId',
      'primaryTeacherId',
      'teacherUid',
      'teacher_id',
    ],
  );

const toDateMaybe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const maybeTimestamp = value as {toDate?: () => Date};
    if (typeof maybeTimestamp.toDate === 'function') {
      const parsed = maybeTimestamp.toDate();
      if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const sessionYmd = (session: Record<string, unknown>): string => {
  const direct = text(session.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const startAt = toDateMaybe(session.startAt);
  if (!startAt) return '';
  const shifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const sessionStartTime = (session: Record<string, unknown>): string => {
  const direct = text(session.startTime);
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(direct)) return direct;
  const startAt = toDateMaybe(session.startAt);
  if (!startAt) return '';
  const shifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return [
    String(shifted.getUTCHours()).padStart(2, '0'),
    String(shifted.getUTCMinutes()).padStart(2, '0'),
  ].join(':');
};

const sessionDurationMinutes = (session: Record<string, unknown>): number | null => {
  const explicit = Number(session.durationMinutes ?? session.durationMins);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

  const start = sessionStartTime(session);
  const end = text(session.endTime);
  if (!start || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end)) return null;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes;
};

const isScheduleExceptionSession = (session: Record<string, unknown>): boolean => {
  if (session.isAdHoc === true || session.isMakeup === true) return true;
  if (EXCEPTION_MARKER_FIELDS.some((field) => Boolean(text(session[field])))) {
    return true;
  }
  const adHocType = text(session.adHocType).toLowerCase();
  if (
    adHocType.includes('adhoc') ||
    adHocType.includes('ad_hoc') ||
    adHocType.includes('one_off')
  ) {
    return true;
  }
  const tokens = [session.source, session.sessionType, session.createdByFlow]
    .map((value) => text(value).toLowerCase())
    .filter(Boolean);
  return tokens.some((token) =>
    SCHEDULE_EXCEPTION_SOURCE_TOKENS.some((needle) => token.includes(needle)),
  );
};

const sessionMatchesEnrollmentIdentity = (
  session: Record<string, unknown>,
  enrollmentId: string,
  enrollment: Record<string, unknown>,
): boolean => {
  if (text(session.enrollmentId) !== enrollmentId) return false;

  const enrollmentCourseId = text(enrollment.courseId);
  const sessionCourseId = text(session.courseId);
  if (enrollmentCourseId && sessionCourseId !== enrollmentCourseId) return false;

  const teacherResolution = resolveCanonicalTeacherIdForWrite(enrollment);
  if (!teacherResolution.teacherId) return false;
  const sessionTeacherIds = collectSessionTeacherIds(session);
  if (!sessionTeacherIds.includes(teacherResolution.teacherId)) return false;

  const enrollmentKidIds = collectEnrollmentKidIds(enrollment);
  const sessionKidIds = collectSessionKidIds(session);
  if (!enrollmentKidIds.length || !sessionKidIds.length) return false;
  return sessionKidIds.every((kidId) => enrollmentKidIds.includes(kidId));
};

const sessionMatchesOccurrence = (
  session: Record<string, unknown>,
  occurrence: RollingMaterializationOccurrence,
): boolean => (
  sessionYmd(session) === occurrence.date &&
  sessionStartTime(session) === occurrence.startTime &&
  sessionDurationMinutes(session) === occurrence.durationMinutes
);

const sessionHasStaleRevision = (
  session: Record<string, unknown>,
  scheduleRevision: number,
): boolean => {
  const raw = Number(session.scheduleRevision);
  return Number.isFinite(raw) && raw > 0 && Math.floor(raw) !== scheduleRevision;
};

export const buildScheduleIntegrityExceptionRelationIndex = (
  sessions: Map<string, Record<string, unknown>>,
): Map<string, string> => {
  const related = new Map<string, string>();
  sessions.forEach((session, sessionId) => {
    if (!isScheduleExceptionSession(session)) return;
    EXCEPTION_BACK_REFERENCE_FIELDS.forEach((field) => {
      const expectedSessionId = text(session[field]);
      if (expectedSessionId && !related.has(expectedSessionId)) {
        related.set(expectedSessionId, sessionId);
      }
    });
  });
  return related;
};

const sessionOccurrenceLookupKey = (
  enrollmentId: string,
  date: string,
  startTime: string,
): string => `${enrollmentId}|${date}|${startTime}`;

export const buildScheduleIntegrityOccurrenceSessionIndex = (
  sessions: Map<string, Record<string, unknown>>,
): Map<string, Array<{sessionId: string; session: Record<string, unknown>}>> => {
  const index = new Map<
    string,
    Array<{sessionId: string; session: Record<string, unknown>}>
  >();
  sessions.forEach((session, sessionId) => {
    const enrollmentId = text(session.enrollmentId);
    const date = sessionYmd(session);
    const startTime = sessionStartTime(session);
    if (!enrollmentId || !date || !startTime) return;
    const key = sessionOccurrenceLookupKey(enrollmentId, date, startTime);
    const rows = index.get(key) || [];
    rows.push({sessionId, session});
    index.set(key, rows);
  });
  return index;
};

export const resolveScheduleIntegrityExistingOccurrenceSession = (args: {
  enrollmentId: string;
  occurrence: RollingMaterializationOccurrence;
  deterministicSession?: Record<string, unknown>;
  occurrenceIndex: Map<
    string,
    Array<{sessionId: string; session: Record<string, unknown>}>
  >;
}): Record<string, unknown> | undefined => {
  if (args.deterministicSession) return args.deterministicSession;
  const key = sessionOccurrenceLookupKey(
    args.enrollmentId,
    args.occurrence.date,
    args.occurrence.startTime,
  );
  const candidates = args.occurrenceIndex.get(key) || [];
  if (!candidates.length) return undefined;

  const exactDuration = candidates.find(
    ({session}) =>
      sessionDurationMinutes(session) === args.occurrence.durationMinutes,
  );
  return (exactDuration || candidates[0]).session;
};

export const classifyScheduleIntegrityOccurrence = (args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  occurrence: RollingMaterializationOccurrence;
  scheduleRevision: number;
  existingSession?: Record<string, unknown>;
  relatedExceptionSessionId?: string;
}): ScheduleIntegrityOccurrenceClassification => {
  const {
    enrollmentId,
    enrollment,
    occurrence,
    scheduleRevision,
    existingSession,
    relatedExceptionSessionId,
  } = args;

  if (!existingSession) {
    return relatedExceptionSessionId ?
      {state: 'schedule_exception', relatedExceptionSessionId} :
      {state: 'missing'};
  }

  const status = normalizeSessionStatus(existingSession.status);
  if (VALID_EXCEPTION_STATUSES.has(status) || isScheduleExceptionSession(existingSession)) {
    return {state: 'schedule_exception'};
  }
  if (!sessionMatchesEnrollmentIdentity(existingSession, enrollmentId, enrollment)) {
    return {state: 'identity_mismatch'};
  }
  if (!sessionMatchesOccurrence(existingSession, occurrence)) {
    return {state: 'schedule_mismatch'};
  }
  if (sessionHasStaleRevision(existingSession, scheduleRevision)) {
    return {state: 'stale_revision'};
  }
  return {state: 'healthy'};
};

export const classifyScheduleIntegrityEnrollmentCandidate = (
  enrollment: Record<string, unknown>,
): ScheduleIntegrityInvalidReason | null => {
  try {
    if (!normalizeRollingMaterializerSlots(enrollment.schedule).length) {
      return 'invalid_schedule';
    }
  } catch {
    return 'invalid_schedule';
  }

  const teacher = resolveCanonicalTeacherIdForWrite(enrollment);
  if (teacher.source === 'ambiguous_legacy') return 'ambiguous_teacher';
  if (!teacher.teacherId) return 'missing_teacher';
  if (!collectEnrollmentKidIds(enrollment).length) return 'missing_child_identity';
  return null;
};

const emptyInvalidCounts = (): Record<ScheduleIntegrityInvalidReason, number> => ({
  invalid_schedule: 0,
  missing_teacher: 0,
  ambiguous_teacher: 0,
  missing_child_identity: 0,
});

const occurrenceDefect = (state: ScheduleIntegrityOccurrenceState): boolean =>
  state === 'missing' ||
  state === 'identity_mismatch' ||
  state === 'schedule_mismatch' ||
  state === 'stale_revision';

const validateYmd = (value: string): string => {
  const normalized = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'anchorYmd must use YYYY-MM-DD.');
  }
  try {
    addDaysYmd(normalized, 0);
  } catch {
    throw new HttpsError('invalid-argument', 'anchorYmd must be a valid date.');
  }
  return normalized;
};

const todayInIndiaYmd = (now = new Date()): string => {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const normalizeMaxEnrollments = (value: unknown): number => {
  const parsed = Number(value ?? MAX_SCHEDULE_INTEGRITY_ENROLLMENTS);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_SCHEDULE_INTEGRITY_ENROLLMENTS
  ) {
    throw new HttpsError(
      'invalid-argument',
      `maxEnrollments must be between 1 and ${MAX_SCHEDULE_INTEGRITY_ENROLLMENTS}.`,
    );
  }
  return parsed;
};

export async function runScheduleIntegrityEngineWithStore(
  store: ScheduleIntegrityStore,
  input: {anchorYmd?: string; maxEnrollments?: number} = {},
): Promise<ScheduleIntegritySummary> {
  const anchorYmd = validateYmd(input.anchorYmd || todayInIndiaYmd());
  const horizonEndYmd = addDaysYmd(anchorYmd, ROLLING_SCHEDULE_HORIZON_DAYS);
  const maxEnrollments = normalizeMaxEnrollments(input.maxEnrollments);

  const enrollments = await store.listEnrollments();
  const operational = enrollments.filter((row) =>
    isEnrollmentOperationallyActive(row.data),
  );

  if (operational.length > maxEnrollments) {
    throw new HttpsError(
      'failed-precondition',
      `Safety stop: ${operational.length} operational enrollments exceeds cap ${maxEnrollments}.`,
    );
  }

  const prepared: PreparedEnrollment[] = [];
  const invalidDetails: ScheduleIntegrityInvalidEnrollment[] = [];
  const invalidByReason = emptyInvalidCounts();

  operational.forEach((row) => {
    const invalidReason = classifyScheduleIntegrityEnrollmentCandidate(row.data);
    if (invalidReason) {
      invalidByReason[invalidReason] += 1;
      invalidDetails.push({enrollmentId: row.id, reason: invalidReason});
      return;
    }

    try {
      const plan = buildRollingMaterializationPlan({
        enrollmentId: row.id,
        enrollment: row.data,
        anchorYmd,
      });
      prepared.push({
        id: row.id,
        data: row.data,
        scheduleRevision: plan.scheduleRevision,
        occurrences: plan.occurrences,
        materializationMetadataPresent: Boolean(
          row.data.scheduleMaterialization &&
          typeof row.data.scheduleMaterialization === 'object' &&
          !Array.isArray(row.data.scheduleMaterialization),
        ),
      });
    } catch {
      invalidByReason.invalid_schedule += 1;
      invalidDetails.push({
        enrollmentId: row.id,
        reason: 'invalid_schedule',
      });
    }
  });

  const expectedIds = Array.from(new Set(
    prepared.flatMap((row) => row.occurrences.map((item) => item.sessionId)),
  ));
  const [existingById, windowSessions] = await Promise.all([
    store.getSessionsByIds(expectedIds),
    store.listSessionsInWindow(anchorYmd, horizonEndYmd),
  ]);
  const exceptionRelationIndex = buildScheduleIntegrityExceptionRelationIndex(windowSessions);
  const occurrenceSessionIndex = buildScheduleIntegrityOccurrenceSessionIndex(windowSessions);

  const summary: ScheduleIntegritySummary = {
    mode: 'READ_ONLY',
    pointerIndependentScan: true,
    anchorYmd,
    horizonEndYmd,
    horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
    operationalEnrollments: operational.length,
    eligibleEnrollments: prepared.length,
    invalidEnrollments: invalidDetails.length,
    expectedOccurrences: 0,
    healthyOccurrences: 0,
    scheduleExceptions: 0,
    missingOccurrences: 0,
    identityMismatches: 0,
    scheduleMismatches: 0,
    staleRevisionOccurrences: 0,
    missingToday: 0,
    affectedEnrollments: 0,
    zeroCoveredEnrollments: 0,
    enrollmentsMissingMaterializationMetadata: 0,
    invalidByReason,
    defectsByDate: {},
    details: [],
    invalidDetails: invalidDetails
      .sort((left, right) => left.enrollmentId.localeCompare(right.enrollmentId))
      .slice(0, MAX_SCHEDULE_INTEGRITY_DETAIL_ROWS),
  };

  prepared.forEach((row) => {
    const detail: ScheduleIntegrityEnrollmentRow = {
      enrollmentId: row.id,
      expected: row.occurrences.length,
      healthy: 0,
      exceptions: 0,
      missing: 0,
      identityMismatches: 0,
      scheduleMismatches: 0,
      staleRevision: 0,
      missingToday: 0,
      materializationMetadataPresent: row.materializationMetadataPresent,
    };

    row.occurrences.forEach((occurrence) => {
      const classification = classifyScheduleIntegrityOccurrence({
        enrollmentId: row.id,
        enrollment: row.data,
        occurrence,
        scheduleRevision: row.scheduleRevision,
        existingSession: resolveScheduleIntegrityExistingOccurrenceSession({
          enrollmentId: row.id,
          occurrence,
          deterministicSession: existingById.get(occurrence.sessionId),
          occurrenceIndex: occurrenceSessionIndex,
        }),
        relatedExceptionSessionId: exceptionRelationIndex.get(occurrence.sessionId),
      });

      summary.expectedOccurrences += 1;
      if (classification.state === 'healthy') {
        summary.healthyOccurrences += 1;
        detail.healthy += 1;
      } else if (classification.state === 'schedule_exception') {
        summary.scheduleExceptions += 1;
        detail.exceptions += 1;
      } else if (classification.state === 'missing') {
        summary.missingOccurrences += 1;
        detail.missing += 1;
        if (occurrence.date === anchorYmd) {
          summary.missingToday += 1;
          detail.missingToday += 1;
        }
      } else if (classification.state === 'identity_mismatch') {
        summary.identityMismatches += 1;
        detail.identityMismatches += 1;
      } else if (classification.state === 'schedule_mismatch') {
        summary.scheduleMismatches += 1;
        detail.scheduleMismatches += 1;
      } else if (classification.state === 'stale_revision') {
        summary.staleRevisionOccurrences += 1;
        detail.staleRevision += 1;
      }

      if (occurrenceDefect(classification.state)) {
        summary.defectsByDate[occurrence.date] =
          (summary.defectsByDate[occurrence.date] || 0) + 1;
      }
    });

    const defects =
      detail.missing +
      detail.identityMismatches +
      detail.scheduleMismatches +
      detail.staleRevision;
    if (defects > 0) summary.affectedEnrollments += 1;
    if (detail.expected > 0 && detail.healthy + detail.exceptions === 0) {
      summary.zeroCoveredEnrollments += 1;
    }
    if (!row.materializationMetadataPresent) {
      summary.enrollmentsMissingMaterializationMetadata += 1;
    }

    if (defects > 0 || !row.materializationMetadataPresent) {
      summary.details.push(detail);
    }
  });

  summary.details.sort((left, right) => {
    const leftDefects =
      left.missing +
      left.identityMismatches +
      left.scheduleMismatches +
      left.staleRevision;
    const rightDefects =
      right.missing +
      right.identityMismatches +
      right.scheduleMismatches +
      right.staleRevision;
    return rightDefects - leftDefects ||
      Number(left.materializationMetadataPresent) -
        Number(right.materializationMetadataPresent) ||
      left.enrollmentId.localeCompare(right.enrollmentId);
  });
  summary.details = summary.details.slice(0, MAX_SCHEDULE_INTEGRITY_DETAIL_ROWS);

  return summary;
}

const ymdToIstMidnightMs = (ymd: string): number => {
  const [year, month, day] = ymd.split('-').map(Number);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    IST_OFFSET_MINUTES * 60 * 1000;
};

export class FirestoreScheduleIntegrityStore implements ScheduleIntegrityStore {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async listEnrollments(): Promise<EnrollmentRow[]> {
    const snap = await this.db.collection('enrollments').get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      data: (doc.data() || {}) as Record<string, unknown>,
    }));
  }

  async getSessionsByIds(
    sessionIds: string[],
  ): Promise<Map<string, Record<string, unknown>>> {
    const result = new Map<string, Record<string, unknown>>();
    for (let offset = 0; offset < sessionIds.length; offset += READ_BATCH_SIZE) {
      const ids = sessionIds.slice(offset, offset + READ_BATCH_SIZE);
      const refs = ids.map((id) => this.db.collection('classSessions').doc(id));
      const snaps = refs.length ? await this.db.getAll(...refs) : [];
      snaps.forEach((snap) => {
        if (snap.exists) {
          result.set(
            snap.id,
            (snap.data() || {}) as Record<string, unknown>,
          );
        }
      });
    }
    return result;
  }

  async listSessionsInWindow(
    fromYmd: string,
    toYmd: string,
  ): Promise<Map<string, Record<string, unknown>>> {
    const result = new Map<string, Record<string, unknown>>();

    const byDate = await this.db.collection('classSessions')
      .where('date', '>=', fromYmd)
      .where('date', '<=', toYmd)
      .get();
    byDate.docs.forEach((doc) => {
      result.set(doc.id, (doc.data() || {}) as Record<string, unknown>);
    });

    const fromMs = ymdToIstMidnightMs(fromYmd);
    const exclusiveEndMs = ymdToIstMidnightMs(addDaysYmd(toYmd, 1));
    const byStartAt = await this.db.collection('classSessions')
      .where('startAt', '>=', Timestamp.fromMillis(fromMs))
      .where('startAt', '<', Timestamp.fromMillis(exclusiveEndMs))
      .get();
    byStartAt.docs.forEach((doc) => {
      result.set(doc.id, (doc.data() || {}) as Record<string, unknown>);
    });

    return result;
  }
}

export const adminAuditScheduleIntegrity = onCall(
  {
    region: SCHEDULE_INTEGRITY_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);
    const input = (request.data || {}) as {
      anchorYmd?: string;
      maxEnrollments?: number;
    };
    const summary = await runScheduleIntegrityEngineWithStore(
      new FirestoreScheduleIntegrityStore(admin.firestore()),
      input,
    );
    logger.info('scheduleIntegrityEngine: read-only audit complete', {
      anchorYmd: summary.anchorYmd,
      horizonEndYmd: summary.horizonEndYmd,
      operationalEnrollments: summary.operationalEnrollments,
      eligibleEnrollments: summary.eligibleEnrollments,
      invalidEnrollments: summary.invalidEnrollments,
      missingOccurrences: summary.missingOccurrences,
      affectedEnrollments: summary.affectedEnrollments,
      missingToday: summary.missingToday,
    });
    return summary;
  },
);
