import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  addDaysYmd,
  buildRollingMaterializationPlan,
  normalizeRollingMaterializerSlots,
  type RollingMaterializationOccurrence,
} from './rollingScheduleMaterializer';
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';
import {buildSessionFinancialTermsSnapshot} from '../helpers/sessionFinancialRates';

export const FUTURE_SCHEDULE_WINDOW_DAYS = 14;
export const FUTURE_SCHEDULE_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MINUTES = 330;

const OPERATIONAL_STATUS_ALIASES = new Set([
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
  'pending_lp_assignment',
]);

export type FutureScheduleWindow = {
  todayYmd: string;
  managedFromYmd: string;
  managedThroughYmd: string;
};

export type FutureScheduleWindowPlan = FutureScheduleWindow & {
  enrollmentId: string;
  scheduleRevision: number;
  occurrences: RollingMaterializationOccurrence[];
};

export type FutureScheduleEligibility =
  | {eligible: true; normalizedStatus: string}
  | {
      eligible: false;
      normalizedStatus: string;
      reason: 'archived' | 'non_operational_status';
    };

export type FutureScheduleSourceIssueCode =
  | 'archived'
  | 'non_operational_status'
  | 'missing_child_identity'
  | 'ambiguous_legacy_child_identity'
  | 'invalid_classes_start_date'
  | 'missing_or_ambiguous_teacher'
  | 'invalid_recurring_schedule';

export type FutureScheduleSourceWarningCode =
  | 'missing_parent_identity'
  | 'missing_course_identity'
  | 'missing_classes_start_date'
  | 'missing_billing_rate';

export type FutureScheduleSourceAssessment = {
  ready: boolean;
  normalizedStatus: string;
  issues: FutureScheduleSourceIssueCode[];
  warnings: FutureScheduleSourceWarningCode[];
};

const normalizeStatus = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

const optionalText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => optionalText(entry))
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

const collectLegacyChildIdentityCandidates = (
  enrollment: Record<string, unknown>,
): string[] => Array.from(new Set([
  ...stringList(enrollment.kidIds),
  optionalText(enrollment.studentId),
  optionalText(enrollment.childId),
].filter((value): value is string => Boolean(value))));

const resolveChildIdentity = (
  enrollment: Record<string, unknown>,
): string | null =>
  optionalText(enrollment.kidId) ||
  collectLegacyChildIdentityCandidates(enrollment)[0] ||
  null;

const resolveParentIdentity = (
  enrollment: Record<string, unknown>,
): string | null =>
  optionalText(enrollment.parentId) ||
  stringList(enrollment.parentIds)[0];


const isValidYmd = (value: unknown): value is string => {
  const raw = optionalText(value);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [yearText, monthText, dayText] = raw.split('-');
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

const dateLikeToIndiaYmd = (value: unknown): string | null => {
  if (!value) return null;
  if (isValidYmd(value)) return String(value).trim();
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
  ) {
    // A malformed date-only value such as 2026-02-31 must fail closed.
    // JavaScript Date parsing would otherwise normalize it into March.
    return null;
  }

  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const toDate = record.toDate;
    if (typeof toDate === 'function') {
      try {
        const parsed = (toDate as () => Date)();
        if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) date = parsed;
      } catch {
        date = null;
      }
    }
    if (!date) {
      const seconds = Number(record.seconds ?? record._seconds);
      if (Number.isFinite(seconds)) date = new Date(seconds * 1000);
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

const resolveClassesStartDateYmd = (
  enrollment: Record<string, unknown>,
): string | null =>
  dateLikeToIndiaYmd(enrollment.classesStartDateYmd) ||
  dateLikeToIndiaYmd(enrollment.classesStartDate) ||
  dateLikeToIndiaYmd(enrollment.startDateYmd) ||
  dateLikeToIndiaYmd(enrollment.startDate);

export function resolveFutureScheduleTodayYmd(now = new Date()): string {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('now must be a valid Date');
  }
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function buildFutureScheduleWindow(todayYmd: string): FutureScheduleWindow {
  addDaysYmd(todayYmd, 0);
  return {
    todayYmd,
    managedFromYmd: addDaysYmd(todayYmd, 1),
    managedThroughYmd: addDaysYmd(todayYmd, FUTURE_SCHEDULE_WINDOW_DAYS),
  };
}

export function resolveFutureScheduleEligibility(
  enrollment: Record<string, unknown>,
): FutureScheduleEligibility {
  const normalizedStatus = normalizeStatus(enrollment.status);
  if (
    enrollment.archivedAt ||
    enrollment.archived === true ||
    enrollment.isArchived === true
  ) {
    return {
      eligible: false,
      normalizedStatus,
      reason: 'archived',
    };
  }

  if (!OPERATIONAL_STATUS_ALIASES.has(normalizedStatus)) {
    return {
      eligible: false,
      normalizedStatus,
      reason: 'non_operational_status',
    };
  }

  return {eligible: true, normalizedStatus};
}

/**
 * Structured, read-only source validation shared by later reconciliation bricks.
 *
 * An enrollment may be operational in lifecycle terms but still be unsafe to
 * materialize (for example pending teacher assignment or malformed recurrence).
 * Those rows are reported as blocked source configuration instead of silently
 * disappearing from the scheduling sweep.
 */
export function assessFutureScheduleEnrollmentSource(
  enrollment: Record<string, unknown>,
): FutureScheduleSourceAssessment {
  const eligibility = resolveFutureScheduleEligibility(enrollment);
  const issues: FutureScheduleSourceIssueCode[] = [];
  const warnings: FutureScheduleSourceWarningCode[] = [];

  if (!eligibility.eligible) {
    issues.push(eligibility.reason);
    return {
      ready: false,
      normalizedStatus: eligibility.normalizedStatus,
      issues,
      warnings,
    };
  }

  const canonicalChildId = optionalText(enrollment.kidId);
  const legacyChildIdentityCandidates = collectLegacyChildIdentityCandidates(enrollment);
  if (!resolveChildIdentity(enrollment)) {
    issues.push('missing_child_identity');
  } else if (!canonicalChildId && legacyChildIdentityCandidates.length > 1) {
    // Canonical kidId wins when present. Only a legacy-only disagreement is
    // ambiguous enough to block future scheduling.
    issues.push('ambiguous_legacy_child_identity');
  }
  if (!resolveParentIdentity(enrollment)) {
    warnings.push('missing_parent_identity');
  }
  if (!optionalText(enrollment.courseId)) {
    warnings.push('missing_course_identity');
  }
  const rawClassesStartDate =
    enrollment.classesStartDateYmd ??
    enrollment.classesStartDate ??
    enrollment.startDateYmd ??
    enrollment.startDate ??
    null;
  if (rawClassesStartDate == null || rawClassesStartDate === '') {
    // Active enrollments without a persisted start boundary still need their
    // future recurrence maintained; absence is metadata debt, not a reason to
    // omit tomorrow's classes.
    warnings.push('missing_classes_start_date');
  } else if (!resolveClassesStartDateYmd(enrollment)) {
    issues.push('invalid_classes_start_date');
  }

  const teacherResolution = resolveCanonicalTeacherIdForWrite(enrollment);
  if (
    !teacherResolution.teacherId ||
    teacherResolution.source === 'ambiguous_legacy'
  ) {
    issues.push('missing_or_ambiguous_teacher');
  }

  try {
    const slots = normalizeRollingMaterializerSlots(enrollment.schedule);
    if (!slots.length) issues.push('invalid_recurring_schedule');
  } catch {
    issues.push('invalid_recurring_schedule');
  }

  if (!buildSessionFinancialTermsSnapshot({}, enrollment)) {
    warnings.push('missing_billing_rate');
  }

  return {
    ready: issues.length === 0,
    normalizedStatus: eligibility.normalizedStatus,
    issues,
    warnings,
  };
}

/**
 * Brick 1 contract for the unified future schedule reconciler.
 *
 * It is deliberately read-only. The managed scheduling window begins tomorrow
 * in Asia/Kolkata and ends on today + 14, giving exactly fourteen mutable
 * calendar dates. Today and all historical dates are outside this contract.
 *
 * The existing rolling materializer remains the recurrence/identity source so
 * deterministic session IDs and recurrence semantics stay compatible with
 * production. Its native window is one date wider when anchored on tomorrow,
 * so the final occurrence set is explicitly clipped to managedThroughYmd.
 */
export function buildFutureScheduleWindowPlan(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
}): FutureScheduleWindowPlan {
  const enrollmentId = String(args.enrollmentId || '').trim();
  if (!enrollmentId) throw new Error('enrollmentId is required');

  const assessment = assessFutureScheduleEnrollmentSource(args.enrollment);
  if (!assessment.ready) {
    throw new Error(
      `Enrollment source is not ready for future scheduling: ${assessment.issues.join(',')}`,
    );
  }

  const window = buildFutureScheduleWindow(args.todayYmd);
  if (ROLLING_SCHEDULE_HORIZON_DAYS < FUTURE_SCHEDULE_WINDOW_DAYS) {
    throw new Error(
      'Existing rolling recurrence planner cannot cover the 14-day future schedule contract',
    );
  }

  const planningEnrollment: Record<string, unknown> = {
    ...args.enrollment,
    status: 'active',
    archived: false,
    isArchived: false,
    archivedAt: null,
  };

  const rolling = buildRollingMaterializationPlan({
    enrollmentId,
    enrollment: planningEnrollment,
    anchorYmd: window.managedFromYmd,
  });

  const occurrences = rolling.occurrences.filter(
    (occurrence) =>
      occurrence.date >= window.managedFromYmd &&
      occurrence.date <= window.managedThroughYmd,
  );

  if (
    occurrences.some(
      (occurrence) =>
        occurrence.date <= window.todayYmd ||
        occurrence.date > window.managedThroughYmd,
    )
  ) {
    throw new Error('Future schedule plan escaped its managed date boundary');
  }

  return {
    ...window,
    enrollmentId,
    scheduleRevision: rolling.scheduleRevision,
    occurrences,
  };
}
