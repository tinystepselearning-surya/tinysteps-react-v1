import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {
  assessFutureScheduleEnrollmentSource,
  buildFutureScheduleWindowPlan,
  type FutureScheduleSourceAssessment,
  type FutureScheduleWindowPlan,
} from './futureScheduleReconciler';
import type {RollingMaterializationOccurrence} from './rollingScheduleMaterializer';

const IST_OFFSET_MINUTES = 330;
const ACTIVE_REGULAR_STATUSES = new Set(['', 'scheduled', 'upcoming', 'planned', 'open']);
const RESCHEDULE_STATUSES = new Set([
  'reschedule_requested',
  'rescheduled',
  'reschedule',
  'replacement',
  'approved_request',
]);
const VALID_LINKED_EXCEPTION_STATUSES = new Set([
  '',
  'scheduled',
  'open',
  'upcoming',
  'in_progress',
  'completed',
  'approved',
]);
const REGULAR_SCHEDULE_SOURCES = new Set([
  '',
  'enrollmentschedule',
  'enrollmentschedulereplace',
  'enrollmentschedulerepair',
  'rolling_schedule',
]);
const EXCEPTION_SOURCE_TOKENS = [
  'makeup',
  'manual',
  'one_off',
  'one-off',
  'adhoc',
  'ad_hoc',
  'reschedule',
  'replacement',
  'approved_request',
  'historical',
] as const;
const SYSTEM_CANCELLATION_REASONS = new Set([
  'rolling_schedule_reconciled',
  'schedule_repair_excess',
  'schedule_repair_old_time',
  'enrollment_paused',
  'rolling_schedule_pause',
  'rolling_schedule_reconciliation',
]);

export type FutureScheduleSessionEvidence = {
  id: string;
  data: Record<string, unknown>;
};

export type FutureScheduleOccurrenceState =
  | 'correct'
  | 'missing'
  | 'duplicate'
  | 'protected_exception'
  | 'blocked';

export type FutureScheduleOccurrenceInspection = {
  occurrence: RollingMaterializationOccurrence;
  state: FutureScheduleOccurrenceState;
  canonicalSessionId: string | null;
  relatedSessionIds: string[];
  reasons: string[];
};

export type FutureScheduleDuplicate = {
  occurrenceSessionId: string;
  canonicalSessionId: string;
  duplicateSessionIds: string[];
};

export type FutureScheduleUnexpectedRegularSession = {
  sessionId: string;
  date: string;
  startTime: string;
  reasons: string[];
};

export type FutureScheduleBlockedEvidence = {
  sessionId: string | null;
  occurrenceSessionId: string | null;
  reasons: string[];
};

export type FutureScheduleMetadataDrift = {
  sessionId: string;
  reasons: string[];
};

export type FutureScheduleInspectionSummary = {
  expectedOccurrences: number;
  correct: number;
  missing: number;
  duplicateOccurrences: number;
  protectedExceptions: number;
  blockedOccurrences: number;
  unexpectedRegularSessions: number;
  blockedEvidence: number;
  metadataDriftSessions: number;
};

export type FutureScheduleInspection = {
  plan: FutureScheduleWindowPlan;
  occurrences: FutureScheduleOccurrenceInspection[];
  duplicates: FutureScheduleDuplicate[];
  unexpectedRegularSessions: FutureScheduleUnexpectedRegularSession[];
  blockedEvidence: FutureScheduleBlockedEvidence[];
  metadataDrift: FutureScheduleMetadataDrift[];
  summary: FutureScheduleInspectionSummary;
  converged: boolean;
};

export type FutureScheduleEnrollmentInspection =
  | {
      kind: 'blocked_source';
      enrollmentId: string;
      assessment: FutureScheduleSourceAssessment;
    }
  | {
      kind: 'inspected';
      enrollmentId: string;
      assessment: FutureScheduleSourceAssessment;
      inspection: FutureScheduleInspection;
    };

export interface FutureScheduleEvidenceStore {
  getSessionsByIds(sessionIds: string[]): Promise<FutureScheduleSessionEvidence[]>;
  listSessionsForEnrollmentWindow(args: {
    enrollmentId: string;
    fromYmd: string;
    throughYmd: string;
  }): Promise<FutureScheduleSessionEvidence[]>;
  listExceptionSessionsReferencingIds(
    sessionIds: string[],
  ): Promise<FutureScheduleSessionEvidence[]>;
}

type CanonicalEnrollmentIdentity = {
  enrollmentId: string;
  childId: string;
  parentId: string;
  courseId: string;
  teacherId: string;
  joinUrl: string;
};

type IdentityCheck = {
  ok: boolean;
  reasons: string[];
};

const text = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalized = (value: unknown): string => text(value).toLowerCase();

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => text(entry)).filter(Boolean)));
};

const recordLike = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const collectLegacyChildIds = (row: Record<string, unknown>): string[] => Array.from(new Set([
  ...stringList(row.kidIds),
  text(row.studentId),
  ...stringList(row.studentIds),
  text(row.childId),
  ...stringList(row.childIds),
  ...stringList(row.childrenIds),
].filter(Boolean)));

const resolveCanonicalChildId = (row: Record<string, unknown>): string =>
  text(row.kidId) || collectLegacyChildIds(row)[0] || '';

const resolveCanonicalParentId = (row: Record<string, unknown>): string =>
  text(row.parentId) || stringList(row.parentIds)[0] || '';

const resolveCourseId = (row: Record<string, unknown>): string =>
  text(row.courseId) || text(row.course_id) || text(row.course);

const resolveEnrollmentIdentity = (
  enrollmentId: string,
  enrollment: Record<string, unknown>,
): CanonicalEnrollmentIdentity => {
  const teacher = resolveCanonicalTeacherIdForWrite(enrollment);
  return {
    enrollmentId,
    childId: resolveCanonicalChildId(enrollment),
    parentId: resolveCanonicalParentId(enrollment),
    courseId: resolveCourseId(enrollment),
    teacherId: teacher.teacherId || '',
    joinUrl: text(enrollment.joinUrl),
  };
};

const isValidYmd = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const asRecord = recordLike(value);
  if (asRecord && typeof asRecord.toDate === 'function') {
    try {
      const parsed = (asRecord.toDate as () => Date)();
      if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) return parsed;
    } catch {
      return null;
    }
  }
  if (asRecord) {
    const seconds = Number(asRecord.seconds ?? asRecord._seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const resolveSessionDateYmd = (session: Record<string, unknown>): string => {
  const direct = text(session.date);
  if (direct) {
    // Date-only values are authoritative when present. Malformed values fail
    // closed instead of being silently repaired from startAt.
    return isValidYmd(direct) ? direct : '';
  }
  const startAt = toDate(session.startAt);
  if (!startAt) return '';
  const shifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

const normalizeTime = (value: unknown): string => {
  const raw = text(value);
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return '';
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const resolveSessionStartTime = (session: Record<string, unknown>): string => {
  const direct = normalizeTime(session.startTime);
  if (direct) return direct;
  const startAt = toDate(session.startAt);
  if (!startAt) return '';
  const shifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
};

const sessionDateTimeTimestampMismatch = (
  session: Record<string, unknown>,
): boolean => {
  const startAt = toDate(session.startAt);
  if (!startAt) return false;

  const shifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const timestampDate = shifted.toISOString().slice(0, 10);
  const timestampTime =
    `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;

  const directDate = text(session.date);
  if (directDate && isValidYmd(directDate) && directDate !== timestampDate) {
    return true;
  }

  const directTime = normalizeTime(session.startTime);
  return Boolean(directTime && directTime !== timestampTime);
};

const resolveSessionDuration = (session: Record<string, unknown>): number | null => {
  const direct = Number(session.durationMinutes ?? session.durationMins);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const startTime = resolveSessionStartTime(session);
  const endTime = normalizeTime(session.endTime);
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let duration = eh * 60 + em - (sh * 60 + sm);
  if (duration <= 0) duration += 24 * 60;
  return duration;
};

const sessionSlotKey = (session: Record<string, unknown>): string => {
  const date = resolveSessionDateYmd(session);
  const startTime = resolveSessionStartTime(session);
  return date && startTime ? `${date}|${startTime}` : '';
};

const occurrenceSlotKey = (occurrence: RollingMaterializationOccurrence): string =>
  `${occurrence.date}|${occurrence.startTime}`;

const hasAttendance = (session: Record<string, unknown>): boolean => {
  const attendance = session.attendance;
  if (attendance === null || attendance === undefined || attendance === '') return false;
  if (Array.isArray(attendance)) return attendance.length > 0;
  const asRecord = recordLike(attendance);
  if (asRecord) return Object.keys(asRecord).length > 0;
  return true;
};

const hasFinanceOrLockMarkers = (session: Record<string, unknown>): boolean => Boolean(
  session.externallyFinanceLinked === true ||
  session.billingChargeId ||
  session.teacherEarningId ||
  session.financeLocked ||
  session.financeLock ||
  session.lockedAt ||
  session.paidAt ||
  session.settledAt ||
  session.billedAt ||
  session.invoicedAt ||
  session.billingProcessed === true ||
  session.revenueProcessed === true ||
  session.revenueAccrued === true ||
  session.teacherPayProcessed === true ||
  Number(session.accruedAmount || 0) > 0,
);

export const isFutureScheduleExceptionSession = (
  session: Record<string, unknown>,
): boolean => {
  if (
    session.historicalCorrection === true ||
    session.isAdHoc === true ||
    session.isManual === true ||
    session.isMakeup === true
  ) {
    return true;
  }
  if (
    session.manualSessionState != null ||
    session.makeupCreditId != null ||
    session.makeupForSessionId != null ||
    session.rescheduleCreditId != null ||
    session.rescheduledFromSessionId != null ||
    session.originalSessionId != null ||
    session.sourceSessionId != null ||
    session.replacementSessionId != null ||
    session.replacementForSessionId != null
  ) {
    return true;
  }
  const haystack = [
    session.source,
    session.sessionType,
    session.createdByFlow,
    session.adHocType,
    session.manualSessionType,
    session.rescheduleSource,
    session.replacementSource,
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join('|');
  return EXCEPTION_SOURCE_TOKENS.some((token) => haystack.includes(token));
};

export const isFutureScheduleRegularSession = (
  session: Record<string, unknown>,
): boolean => {
  if (isFutureScheduleExceptionSession(session)) return false;
  return REGULAR_SCHEDULE_SOURCES.has(normalized(session.source));
};

export const isFutureScheduleSystemCancellation = (
  session: Record<string, unknown>,
): boolean => {
  const lifecycle = recordLike(session.rollingLifecycleCancellation);
  if (normalized(lifecycle?.source) === 'rolling_schedule_lifecycle') return true;
  const reconciliation = recordLike(session.rollingScheduleReconciliationCancellation);
  if (normalized(reconciliation?.source) === 'rolling_schedule_reconciliation') return true;
  const reason = normalized(session.cancelledReason || session.canceledReason);
  return SYSTEM_CANCELLATION_REASONS.has(reason);
};

export const isFutureScheduleRestorableSystemCancellation = (
  session: Record<string, unknown>,
): boolean => {
  const lifecycle = recordLike(session.rollingLifecycleCancellation);
  if (normalized(lifecycle?.source) === 'rolling_schedule_lifecycle') {
    return normalized(lifecycle?.reason) === 'enrollment_paused';
  }
  const reconciliation = recordLike(session.rollingScheduleReconciliationCancellation);
  if (normalized(reconciliation?.source) === 'rolling_schedule_reconciliation') {
    return true;
  }
  const reason = normalized(session.cancelledReason || session.canceledReason);
  return SYSTEM_CANCELLATION_REASONS.has(reason);
};

const baseIdentityCheck = (
  session: Record<string, unknown>,
  identity: CanonicalEnrollmentIdentity,
): IdentityCheck => {
  const reasons: string[] = [];
  const enrollmentId = text(session.enrollmentId);
  if (!enrollmentId || enrollmentId !== identity.enrollmentId) {
    reasons.push('enrollment_identity_mismatch');
  }

  const courseId = resolveCourseId(session);
  if (
    identity.courseId &&
    (!courseId || courseId !== identity.courseId)
  ) {
    reasons.push('course_identity_mismatch');
  }

  const sessionChildId = resolveCanonicalChildId(session);
  if (!sessionChildId || sessionChildId !== identity.childId) {
    reasons.push('child_identity_mismatch');
  }

  return {ok: reasons.length === 0, reasons};
};

const regularIdentityCheck = (
  session: Record<string, unknown>,
  identity: CanonicalEnrollmentIdentity,
): IdentityCheck => {
  const base = baseIdentityCheck(session, identity);
  const reasons = [...base.reasons];
  const sessionTeacher = resolveCanonicalTeacherIdForWrite(session);
  if (
    !sessionTeacher.teacherId ||
    sessionTeacher.source === 'ambiguous_legacy' ||
    sessionTeacher.teacherId !== identity.teacherId
  ) {
    reasons.push('teacher_identity_mismatch');
  }
  return {ok: reasons.length === 0, reasons};
};

const exceptionLinkedOccurrenceIds = (
  session: Record<string, unknown>,
): string[] => Array.from(new Set([
  text(session.makeupForSessionId),
  text(session.rescheduledFromSessionId),
  text(session.originalSessionId),
  text(session.sourceSessionId),
  text(session.replacementForSessionId),
].filter(Boolean)));

const isIntentionalProtectedStatus = (
  session: Record<string, unknown>,
): boolean => {
  const status = normalized(session.status);
  if (RESCHEDULE_STATUSES.has(status)) return true;
  if (status === 'cancelled' || status === 'canceled') {
    return !isFutureScheduleSystemCancellation(session);
  }
  return false;
};

const stableSessionSort = (
  rows: FutureScheduleSessionEvidence[],
  expectedSessionId?: string,
): FutureScheduleSessionEvidence[] => [...rows].sort((a, b) => {
  if (expectedSessionId) {
    if (a.id === expectedSessionId && b.id !== expectedSessionId) return -1;
    if (b.id === expectedSessionId && a.id !== expectedSessionId) return 1;
  }
  return a.id.localeCompare(b.id);
});

const mergeEvidence = (
  groups: readonly FutureScheduleSessionEvidence[][],
): FutureScheduleSessionEvidence[] => {
  const byId = new Map<string, FutureScheduleSessionEvidence>();
  groups.flat().forEach((row) => {
    const id = text(row?.id);
    if (!id || byId.has(id)) return;
    byId.set(id, {id, data: row.data || {}});
  });
  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
};

export async function loadFutureScheduleEvidence(args: {
  store: FutureScheduleEvidenceStore;
  plan: FutureScheduleWindowPlan;
}): Promise<FutureScheduleSessionEvidence[]> {
  const expectedIds = args.plan.occurrences.map((occurrence) => occurrence.sessionId);
  const [expectedRows, windowRows, linkedExceptionRows] = await Promise.all([
    args.store.getSessionsByIds(expectedIds),
    args.store.listSessionsForEnrollmentWindow({
      enrollmentId: args.plan.enrollmentId,
      fromYmd: args.plan.managedFromYmd,
      throughYmd: args.plan.managedThroughYmd,
    }),
    args.store.listExceptionSessionsReferencingIds(expectedIds),
  ]);
  return mergeEvidence([expectedRows, windowRows, linkedExceptionRows]);
}

const addBlockedEvidence = (
  target: FutureScheduleBlockedEvidence[],
  row: FutureScheduleBlockedEvidence,
): void => {
  const key = `${row.sessionId || ''}|${row.occurrenceSessionId || ''}|${row.reasons.join(',')}`;
  if (target.some((existing) =>
    `${existing.sessionId || ''}|${existing.occurrenceSessionId || ''}|${existing.reasons.join(',')}` === key
  )) {
    return;
  }
  target.push(row);
};

export function inspectFutureScheduleEnrollment(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
  sessions: FutureScheduleSessionEvidence[];
}): FutureScheduleEnrollmentInspection {
  const enrollmentId = text(args.enrollmentId);
  const assessment = assessFutureScheduleEnrollmentSource(args.enrollment);
  if (!assessment.ready) {
    return {
      kind: 'blocked_source',
      enrollmentId,
      assessment,
    };
  }
  return {
    kind: 'inspected',
    enrollmentId,
    assessment,
    inspection: inspectFutureSchedule(args),
  };
}

export function inspectFutureSchedule(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
  sessions: FutureScheduleSessionEvidence[];
}): FutureScheduleInspection {
  const plan = buildFutureScheduleWindowPlan({
    enrollmentId: args.enrollmentId,
    enrollment: args.enrollment,
    todayYmd: args.todayYmd,
  });
  const identity = resolveEnrollmentIdentity(args.enrollmentId, args.enrollment);
  const sessions = mergeEvidence([args.sessions]);
  const sessionsById = new Map(sessions.map((row) => [row.id, row]));
  const expectedBySlot = new Map(
    plan.occurrences.map((occurrence) => [occurrenceSlotKey(occurrence), occurrence]),
  );
  const regularRowsBySlot = new Map<string, FutureScheduleSessionEvidence[]>();
  const protectedRegularRowsBySlot = new Map<string, FutureScheduleSessionEvidence[]>();
  const blockedEvidence: FutureScheduleBlockedEvidence[] = [];
  const unexpectedRegularSessions: FutureScheduleUnexpectedRegularSession[] = [];
  const metadataDrift: FutureScheduleMetadataDrift[] = [];

  const inManagedWindow = (session: Record<string, unknown>): boolean => {
    const date = resolveSessionDateYmd(session);
    return Boolean(
      date &&
      date >= plan.managedFromYmd &&
      date <= plan.managedThroughYmd,
    );
  };

  for (const row of sessions) {
    const source = normalized(row.data.source);
    const belongsByEnrollmentId = text(row.data.enrollmentId) === identity.enrollmentId;
    const resolvedDate = resolveSessionDateYmd(row.data);

    if (
      belongsByEnrollmentId &&
      isFutureScheduleRegularSession(row.data) &&
      sessionDateTimeTimestampMismatch(row.data)
    ) {
      addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: null,
        reasons: ['session_date_time_timestamp_mismatch'],
      });
      continue;
    }

    if (
      !resolvedDate &&
      belongsByEnrollmentId &&
      isFutureScheduleRegularSession(row.data)
    ) {
      addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: null,
        reasons: ['invalid_session_date_or_time'],
      });
      continue;
    }

    if (!inManagedWindow(row.data)) continue;
    const slotKey = sessionSlotKey(row.data);

    if (isIntentionalProtectedStatus(row.data) && isFutureScheduleRegularSession(row.data)) {
      if (slotKey) {
        const rows = protectedRegularRowsBySlot.get(slotKey) || [];
        rows.push(row);
        protectedRegularRowsBySlot.set(slotKey, rows);
      }
      continue;
    }

    if (isFutureScheduleExceptionSession(row.data)) {
      continue;
    }

    if (!isFutureScheduleRegularSession(row.data)) {
      if (belongsByEnrollmentId && source) {
        addBlockedEvidence(blockedEvidence, {
          sessionId: row.id,
          occurrenceSessionId: expectedBySlot.get(slotKey)?.sessionId || null,
          reasons: ['ambiguous_non_exception_session_source'],
        });
      }
      continue;
    }

    if (!slotKey) {
      if (belongsByEnrollmentId || sessionsById.has(row.id)) {
        addBlockedEvidence(blockedEvidence, {
          sessionId: row.id,
          occurrenceSessionId: null,
          reasons: ['invalid_session_date_or_time'],
        });
      }
      continue;
    }

    const expectedOccurrence = expectedBySlot.get(slotKey);
    if (expectedOccurrence) {
      const rowStatus = normalized(row.data.status);
      const isRetiredSystemRow =
        (rowStatus === 'cancelled' || rowStatus === 'canceled') &&
        isFutureScheduleSystemCancellation(row.data);

      // A non-canonical legacy row already retired by the reconciler must stay
      // retired and must not compete with the canonical expected occurrence on
      // the next run. The deterministic expected document itself is retained
      // so Brick 3 can plan an explicit RESTORE when needed.
      if (
        isRetiredSystemRow &&
        row.id !== expectedOccurrence.sessionId &&
        isFutureScheduleRestorableSystemCancellation(row.data)
      ) {
        continue;
      }

      const rows = regularRowsBySlot.get(slotKey) || [];
      rows.push(row);
      regularRowsBySlot.set(slotKey, rows);
      continue;
    }

    // A system-cancelled regular row outside the current expected recurrence is
    // already retired. It must not keep the reconciler permanently non-converged.
    if (
      (normalized(row.data.status) === 'cancelled' ||
        normalized(row.data.status) === 'canceled') &&
      isFutureScheduleSystemCancellation(row.data)
    ) {
      continue;
    }

    if (!belongsByEnrollmentId) continue;

    // An obsolete occurrence can legitimately still carry the previous teacher
    // after a Student Management reassignment. Enrollment/course/child identity
    // proves ownership; teacher identity is desired mutable state, not a reason
    // to strand an otherwise safe stale occurrence.
    const identityCheck = baseIdentityCheck(row.data, identity);
    if (!identityCheck.ok) {
      addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: null,
        reasons: identityCheck.reasons,
      });
      continue;
    }

    const unexpectedStatus = normalized(row.data.status);
    const unexpectedProtectionReasons: string[] = [];
    if (!ACTIVE_REGULAR_STATUSES.has(unexpectedStatus)) {
      unexpectedProtectionReasons.push('protected_or_invalid_future_status');
    }
    if (hasAttendance(row.data) || hasFinanceOrLockMarkers(row.data)) {
      unexpectedProtectionReasons.push('future_regular_session_contains_protected_state');
    }
    if (unexpectedProtectionReasons.length > 0) {
      addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: null,
        reasons: [
          'unexpected_regular_session_protected',
          ...unexpectedProtectionReasons,
        ],
      });
      continue;
    }

    unexpectedRegularSessions.push({
      sessionId: row.id,
      date: resolveSessionDateYmd(row.data),
      startTime: resolveSessionStartTime(row.data),
      reasons: ['unexpected_regular_session'],
    });
  }

  const occurrences: FutureScheduleOccurrenceInspection[] = [];
  const duplicates: FutureScheduleDuplicate[] = [];

  for (const occurrence of plan.occurrences) {
    const slotKey = occurrenceSlotKey(occurrence);
    const slotRows = stableSessionSort(
      regularRowsBySlot.get(slotKey) || [],
      occurrence.sessionId,
    );
    const protectedSlotRows = stableSessionSort(
      protectedRegularRowsBySlot.get(slotKey) || [],
      occurrence.sessionId,
    );
    const exactRow = sessionsById.get(occurrence.sessionId);
    const linkedRows = sessions.filter((row) =>
      isFutureScheduleExceptionSession(row.data) &&
      exceptionLinkedOccurrenceIds(row.data).includes(occurrence.sessionId)
    );
    const validLinkedRows: FutureScheduleSessionEvidence[] = [];
    const invalidLinkedRows: FutureScheduleSessionEvidence[] = [];

    linkedRows.forEach((row) => {
      const check = baseIdentityCheck(row.data, identity);
      const status = normalized(row.data.status);
      const manualState = normalized(row.data.manualSessionState);
      const reasons = [
        ...(check.ok ? [] : ['invalid_exception_identity', ...check.reasons]),
        ...(VALID_LINKED_EXCEPTION_STATUSES.has(status)
          ? []
          : ['linked_exception_not_operational']),
        ...(manualState === 'cancelled' ||
            manualState === 'canceled' ||
            manualState === 'withdrawn'
          ? ['linked_exception_not_operational']
          : []),
      ];
      if (reasons.length === 0) validLinkedRows.push(row);
      else {
        invalidLinkedRows.push(row);
        addBlockedEvidence(blockedEvidence, {
          sessionId: row.id,
          occurrenceSessionId: occurrence.sessionId,
          reasons,
        });
      }
    });

    if (invalidLinkedRows.length > 0) {
      occurrences.push({
        occurrence,
        state: 'blocked',
        canonicalSessionId: null,
        relatedSessionIds: invalidLinkedRows.map((row) => row.id),
        reasons: Array.from(new Set(
          invalidLinkedRows.flatMap((row) =>
            blockedEvidence
              .filter((item) =>
                item.sessionId === row.id &&
                item.occurrenceSessionId === occurrence.sessionId
              )
              .flatMap((item) => item.reasons),
          ),
        )),
      });
      continue;
    }

    if (validLinkedRows.length > 0 && slotRows.length > 0) {
      occurrences.push({
        occurrence,
        state: 'blocked',
        canonicalSessionId: null,
        relatedSessionIds: [...slotRows, ...validLinkedRows].map((row) => row.id),
        reasons: ['active_and_linked_exception_conflict'],
      });
      addBlockedEvidence(blockedEvidence, {
        sessionId: null,
        occurrenceSessionId: occurrence.sessionId,
        reasons: ['active_and_linked_exception_conflict'],
      });
      continue;
    }

    if (protectedSlotRows.length > 0) {
      if (slotRows.length > 0) {
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: null,
          relatedSessionIds: [...slotRows, ...protectedSlotRows].map((row) => row.id),
          reasons: ['active_and_protected_regular_conflict'],
        });
        addBlockedEvidence(blockedEvidence, {
          sessionId: null,
          occurrenceSessionId: occurrence.sessionId,
          reasons: ['active_and_protected_regular_conflict'],
        });
        continue;
      }

      const invalidProtected = protectedSlotRows
        .map((row) => ({row, check: baseIdentityCheck(row.data, identity)}))
        .filter(({check}) => !check.ok);

      if (invalidProtected.length > 0) {
        invalidProtected.forEach(({row, check}) => addBlockedEvidence(blockedEvidence, {
          sessionId: row.id,
          occurrenceSessionId: occurrence.sessionId,
          reasons: check.reasons,
        }));
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: null,
          relatedSessionIds: protectedSlotRows.map((row) => row.id),
          reasons: ['protected_regular_identity_mismatch'],
        });
        continue;
      }

      occurrences.push({
        occurrence,
        state: 'protected_exception',
        canonicalSessionId:
          protectedSlotRows.find((row) => row.id === occurrence.sessionId)?.id ||
          protectedSlotRows[0].id,
        relatedSessionIds: [
          ...protectedSlotRows.map((row) => row.id),
          ...validLinkedRows.map((row) => row.id),
        ],
        reasons: validLinkedRows.length
          ? ['protected_regular_occurrence', 'linked_schedule_exception']
          : ['protected_regular_occurrence'],
      });
      continue;
    }

    const identityFailures = slotRows
      .map((row) => {
        const check = regularIdentityCheck(row.data, identity);
        const reasons = [...check.reasons];
        if (!check.ok) {
          const status = normalized(row.data.status);
          const duration = resolveSessionDuration(row.data);
          if (status === 'cancelled' || status === 'canceled' || status === 'paused') {
            reasons.push(
              isFutureScheduleSystemCancellation(row.data)
                ? (
                    isFutureScheduleRestorableSystemCancellation(row.data)
                      ? 'system_cancelled_expected_session_requires_restore'
                      : 'non_restorable_system_cancelled_expected_session'
                  )
                : 'inactive_expected_regular_session',
            );
          } else if (!ACTIVE_REGULAR_STATUSES.has(status)) {
            reasons.push('protected_or_invalid_future_status');
          }
          if (duration !== occurrence.durationMinutes) {
            reasons.push('duration_mismatch');
          }
          if (hasAttendance(row.data) || hasFinanceOrLockMarkers(row.data)) {
            reasons.push('future_regular_session_contains_protected_state');
          }
        }
        return {row, check, reasons: Array.from(new Set(reasons))};
      })
      .filter(({check}) => !check.ok);

    if (identityFailures.length > 0) {
      identityFailures.forEach(({row, reasons}) => addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: occurrence.sessionId,
        reasons,
      }));
      occurrences.push({
        occurrence,
        state: 'blocked',
        canonicalSessionId: null,
        relatedSessionIds: identityFailures.map(({row}) => row.id),
        reasons: ['regular_session_identity_mismatch'],
      });
      continue;
    }

    const slotConflicts = slotRows
      .map((row) => {
        const reasons: string[] = [];
        const status = normalized(row.data.status);
        const duration = resolveSessionDuration(row.data);
        if (status === 'cancelled' || status === 'canceled' || status === 'paused') {
          reasons.push(
            isFutureScheduleSystemCancellation(row.data)
              ? (
                  isFutureScheduleRestorableSystemCancellation(row.data)
                    ? 'system_cancelled_expected_session_requires_restore'
                    : 'non_restorable_system_cancelled_expected_session'
                )
              : 'inactive_expected_regular_session',
          );
        } else if (!ACTIVE_REGULAR_STATUSES.has(status)) {
          reasons.push('protected_or_invalid_future_status');
        }
        if (duration !== occurrence.durationMinutes) {
          reasons.push('duration_mismatch');
        }
        if (hasAttendance(row.data) || hasFinanceOrLockMarkers(row.data)) {
          reasons.push('future_regular_session_contains_protected_state');
        }
        return {row, reasons};
      })
      .filter(({reasons}) => reasons.length > 0);

    if (slotConflicts.length > 0) {
      slotConflicts.forEach(({row, reasons}) => addBlockedEvidence(blockedEvidence, {
        sessionId: row.id,
        occurrenceSessionId: occurrence.sessionId,
        reasons,
      }));
      occurrences.push({
        occurrence,
        state: 'blocked',
        canonicalSessionId: null,
        relatedSessionIds: slotRows.map((row) => row.id),
        reasons: Array.from(new Set(slotConflicts.flatMap(({reasons}) => reasons))),
      });
      continue;
    }

    if (slotRows.length > 1) {
      const canonical = slotRows[0];
      duplicates.push({
        occurrenceSessionId: occurrence.sessionId,
        canonicalSessionId: canonical.id,
        duplicateSessionIds: slotRows.slice(1).map((row) => row.id),
      });
      occurrences.push({
        occurrence,
        state: 'duplicate',
        canonicalSessionId: canonical.id,
        relatedSessionIds: slotRows.map((row) => row.id),
        reasons: ['duplicate_regular_session'],
      });
      continue;
    }

    if (slotRows.length === 1) {
      const row = slotRows[0];
      const status = normalized(row.data.status);
      const duration = resolveSessionDuration(row.data);

      if (
        isIntentionalProtectedStatus(row.data) ||
        isFutureScheduleExceptionSession(row.data)
      ) {
        occurrences.push({
          occurrence,
          state: 'protected_exception',
          canonicalSessionId: row.id,
          relatedSessionIds: [row.id, ...validLinkedRows.map((linked) => linked.id)],
          reasons: ['protected_schedule_exception'],
        });
        continue;
      }

      if (status === 'cancelled' || status === 'canceled' || status === 'paused') {
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: row.id,
          relatedSessionIds: [row.id],
          reasons: [
            isFutureScheduleSystemCancellation(row.data)
              ? (
                  isFutureScheduleRestorableSystemCancellation(row.data)
                    ? 'system_cancelled_expected_session_requires_restore'
                    : 'non_restorable_system_cancelled_expected_session'
                )
              : 'inactive_expected_regular_session',
          ],
        });
        continue;
      }

      if (!ACTIVE_REGULAR_STATUSES.has(status)) {
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: row.id,
          relatedSessionIds: [row.id],
          reasons: ['protected_or_invalid_future_status'],
        });
        continue;
      }

      if (duration !== occurrence.durationMinutes) {
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: row.id,
          relatedSessionIds: [row.id],
          reasons: ['duration_mismatch'],
        });
        continue;
      }

      if (hasAttendance(row.data) || hasFinanceOrLockMarkers(row.data)) {
        occurrences.push({
          occurrence,
          state: 'blocked',
          canonicalSessionId: row.id,
          relatedSessionIds: [row.id],
          reasons: ['future_regular_session_contains_protected_state'],
        });
        continue;
      }

      const driftReasons: string[] = [];
      const revision = Number(row.data.scheduleRevision);
      if (
        Number.isFinite(revision) &&
        revision > 0 &&
        revision !== plan.scheduleRevision
      ) {
        driftReasons.push('stale_schedule_revision');
      }
      if (
        identity.parentId &&
        resolveCanonicalParentId(row.data) !== identity.parentId
      ) {
        driftReasons.push('parent_identity_drift');
      }
      if (text(row.data.joinUrl) !== identity.joinUrl) {
        driftReasons.push('join_url_drift');
      }
      const enrollmentTeacherName = text(args.enrollment.teacherName);
      if (
        enrollmentTeacherName &&
        text(row.data.teacherName) !== enrollmentTeacherName
      ) {
        driftReasons.push('teacher_name_drift');
      }
      if (driftReasons.length) {
        metadataDrift.push({sessionId: row.id, reasons: driftReasons});
      }

      occurrences.push({
        occurrence,
        state: 'correct',
        canonicalSessionId: row.id,
        relatedSessionIds: [row.id],
        reasons: driftReasons,
      });
      continue;
    }

    if (exactRow) {
      const exactBaseIdentity = baseIdentityCheck(exactRow.data, identity);
      if (
        isIntentionalProtectedStatus(exactRow.data) ||
        isFutureScheduleExceptionSession(exactRow.data)
      ) {
        if (exactBaseIdentity.ok) {
          occurrences.push({
            occurrence,
            state: 'protected_exception',
            canonicalSessionId: exactRow.id,
            relatedSessionIds: [exactRow.id, ...validLinkedRows.map((row) => row.id)],
            reasons: ['protected_schedule_exception'],
          });
        } else {
          addBlockedEvidence(blockedEvidence, {
            sessionId: exactRow.id,
            occurrenceSessionId: occurrence.sessionId,
            reasons: exactBaseIdentity.reasons,
          });
          occurrences.push({
            occurrence,
            state: 'blocked',
            canonicalSessionId: exactRow.id,
            relatedSessionIds: [exactRow.id],
            reasons: ['expected_document_identity_mismatch'],
          });
        }
        continue;
      }

      occurrences.push({
        occurrence,
        state: 'blocked',
        canonicalSessionId: exactRow.id,
        relatedSessionIds: [exactRow.id],
        reasons: ['expected_document_occupied_by_conflicting_session'],
      });
      continue;
    }

    if (validLinkedRows.length > 0) {
      occurrences.push({
        occurrence,
        state: 'protected_exception',
        canonicalSessionId: null,
        relatedSessionIds: validLinkedRows.map((row) => row.id),
        reasons: ['linked_schedule_exception'],
      });
      continue;
    }

    occurrences.push({
      occurrence,
      state: 'missing',
      canonicalSessionId: null,
      relatedSessionIds: [],
      reasons: ['missing_regular_session'],
    });
  }

  occurrences.sort((a, b) => a.occurrence.startAtUtcMs - b.occurrence.startAtUtcMs);
  duplicates.sort((a, b) => a.occurrenceSessionId.localeCompare(b.occurrenceSessionId));
  unexpectedRegularSessions.sort((a, b) =>
    a.date === b.date
      ? a.startTime === b.startTime
        ? a.sessionId.localeCompare(b.sessionId)
        : a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date)
  );
  blockedEvidence.sort((a, b) =>
    (a.occurrenceSessionId || a.sessionId || '').localeCompare(
      b.occurrenceSessionId || b.sessionId || '',
    )
  );
  metadataDrift.sort((a, b) => a.sessionId.localeCompare(b.sessionId));

  const summary: FutureScheduleInspectionSummary = {
    expectedOccurrences: occurrences.length,
    correct: occurrences.filter((row) => row.state === 'correct').length,
    missing: occurrences.filter((row) => row.state === 'missing').length,
    duplicateOccurrences: occurrences.filter((row) => row.state === 'duplicate').length,
    protectedExceptions: occurrences.filter((row) => row.state === 'protected_exception').length,
    blockedOccurrences: occurrences.filter((row) => row.state === 'blocked').length,
    unexpectedRegularSessions: unexpectedRegularSessions.length,
    blockedEvidence: blockedEvidence.length,
    metadataDriftSessions: metadataDrift.length,
  };

  return {
    plan,
    occurrences,
    duplicates,
    unexpectedRegularSessions,
    blockedEvidence,
    metadataDrift,
    summary,
    converged:
      summary.missing === 0 &&
      summary.duplicateOccurrences === 0 &&
      summary.blockedOccurrences === 0 &&
      summary.unexpectedRegularSessions === 0 &&
      summary.blockedEvidence === 0 &&
      summary.metadataDriftSessions === 0,
  };
}
