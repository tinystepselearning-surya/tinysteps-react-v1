import { isScheduleExceptionSession } from '../sessionScheduleIntegrity';
import { resolveEnrollmentRollingScheduleContract } from './enrollmentRollingScheduleContract';
import {
  enumerateRollingScheduleOccurrences,
  ROLLING_SCHEDULE_UTC_OFFSET_MINUTES,
  type RollingScheduleOccurrence,
} from './rollingScheduleRecurrence';

type RecordLike = Record<string, unknown>;

export type RollingScheduleAnalyticsProjectionInput = {
  monthKey: string;
  enrollments: readonly RecordLike[];
  realSessions: readonly RecordLike[];
  courses: readonly RecordLike[];
  todayYmd?: string;
};

export type RollingScheduleAnalyticsProjection = {
  plannedSessions: number;
  remainingScheduledSessions: number;
  scheduleDrivenEnrollments: number;
  projectedRevenue: number;
  avgProjectedRevenuePerSession: number;
  missingFeeSessions: number;
  realPlannedSessions: number;
  recurrenceProjectedSessions: number;
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

const CANCELLED_SESSION_STATUSES = new Set(['cancelled', 'canceled']);
const NON_PLANNED_SESSION_STATUSES = new Set([
  'reschedule_requested',
  'rescheduled',
  'no_show',
  'noshow',
  'consumed',
  'settled',
  'paid',
  'locked',
]);
const UPCOMING_SESSION_STATUSES = new Set(['scheduled', 'open', 'upcoming']);
const REGULAR_SCHEDULE_SOURCES = new Set([
  '',
  'enrollmentschedule',
  'enrollmentschedulereplace',
  'enrollmentschedulerepair',
  'rolling_schedule',
]);

const text = (value: unknown): string => (
  typeof value === 'string'
    ? value.trim()
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : ''
);

const normalizeStatus = (value: unknown): string => text(value).toLowerCase();

const isValidYmd = (value: string): boolean => {
  if (!YMD_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
};

const monthRangeFromKey = (monthKey: string): { startYmd: string; endYmd: string } => {
  const raw = String(monthKey || '').trim();
  if (!MONTH_KEY_RE.test(raw)) throw new Error('monthKey must be YYYY-MM');
  const [year, month] = raw.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('monthKey must be a valid YYYY-MM month');
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    startYmd: `${raw}-01`,
    endYmd: `${raw}-${String(lastDay).padStart(2, '0')}`,
  };
};

const addDaysYmd = (ymd: string, days: number): string => {
  if (!isValidYmd(ymd)) throw new Error('todayYmd must be YYYY-MM-DD');
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + Math.trunc(days)));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const indiaYmd = (date = new Date()): string => {
  const shifted = new Date(date.getTime() + ROLLING_SCHEDULE_UTC_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
};

const normalizeTime = (value: unknown): string => {
  const raw = text(value);
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (!match) return '';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const dateLikeToMs = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'object' && value !== null) {
    const row = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof row.toMillis === 'function') {
      const ms = Number(row.toMillis());
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof row.toDate === 'function') {
      const date = row.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    }
    const seconds = Number(row.seconds ?? row._seconds);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

const ymdAndTimeFromUtcMs = (utcMs: number): { ymd: string; time: string } => {
  const shifted = new Date(utcMs + ROLLING_SCHEDULE_UTC_OFFSET_MINUTES * 60 * 1000);
  return {
    ymd: `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`,
    time: `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`,
  };
};

const enrollmentIdFromSession = (session: RecordLike): string => {
  const direct = text(session.enrollmentId);
  if (direct) return direct;
  const id = text(session.id);
  const match = /^(.+)_\d{8}_\d{4}$/.exec(id);
  return match?.[1] || '';
};

const sessionYmdAndTime = (session: RecordLike): { ymd: string; time: string } | null => {
  const directYmd = text(session.date);
  const directTime = normalizeTime(session.startTime);
  if (isValidYmd(directYmd) && directTime) return { ymd: directYmd, time: directTime };
  const startMs = dateLikeToMs(session.startAt);
  return startMs === null ? null : ymdAndTimeFromUtcMs(startMs);
};

const sessionYmd = (session: RecordLike): string | null => {
  const directYmd = text(session.date);
  if (isValidYmd(directYmd)) return directYmd;
  const startMs = dateLikeToMs(session.startAt);
  return startMs === null ? null : ymdAndTimeFromUtcMs(startMs).ymd;
};

const occurrenceIdentity = (enrollmentId: string, ymd: string, startTime: string): string => (
  `${enrollmentId}|${ymd}|${startTime}`
);

const sessionOccurrenceIdentity = (session: RecordLike): string | null => {
  const enrollmentId = enrollmentIdFromSession(session);
  const dateAndTime = sessionYmdAndTime(session);
  if (!enrollmentId || !dateAndTime) return null;
  return occurrenceIdentity(enrollmentId, dateAndTime.ymd, dateAndTime.time);
};

const resolvePositiveNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
};

const isRegularScheduleSession = (session: RecordLike): boolean => {
  if (isScheduleExceptionSession(session)) return false;
  return REGULAR_SCHEDULE_SOURCES.has(normalizeStatus(session.source));
};

const isCountedPlannedRealSession = (session: RecordLike): boolean => {
  if (!isRegularScheduleSession(session)) return false;
  const status = normalizeStatus(session.status);
  if (CANCELLED_SESSION_STATUSES.has(status)) return false;
  if (NON_PLANNED_SESSION_STATUSES.has(status)) return false;
  return true;
};

const isRemainingRealSession = (session: RecordLike): boolean => (
  isCountedPlannedRealSession(session)
  && UPCOMING_SESSION_STATUSES.has(normalizeStatus(session.status))
);

const courseIndex = (courses: readonly RecordLike[]): Map<string, RecordLike> => {
  const map = new Map<string, RecordLike>();
  courses.forEach((course) => {
    [course.id, course.courseId, course.slug, course.code]
      .map(text)
      .filter(Boolean)
      .forEach((key) => {
        if (!map.has(key)) map.set(key, course);
      });
  });
  return map;
};

const resolveOccurrenceFee = (
  enrollment: RecordLike,
  courseById: Map<string, RecordLike>,
  session?: RecordLike,
): number => {
  const course = courseById.get(text(session?.courseId) || text(enrollment.courseId));
  return resolvePositiveNumber(
    session?.billingRateSnapshot,
    session?.feeAmount,
    session?.feePerClass,
    session?.feePerSession,
    session?.ratePerSession,
    enrollment.billingRateSnapshot,
    enrollment.feePerClass,
    enrollment.feePerSession,
    enrollment.ratePerSession,
    enrollment.parentRate,
    enrollment.parentClassRate,
    enrollment.classFee,
    enrollment.feeAmount,
    course?.feePerClass,
    course?.feePerSession,
    course?.ratePerSession,
  );
};

/**
 * Builds the management "scheduled month" forecast without requiring physical classSessions
 * for the whole month. Historical dates remain actual-session based. Current/future recurrence
 * comes only from active canonical rolling enrollments, with persisted regular sessions acting
 * as occurrence-level overrides. Legacy/unconverted enrollments remain actual-session-only.
 *
 * This helper is pure and performs no Firestore reads or writes.
 */
export const buildRollingScheduleAnalyticsProjection = (
  input: RollingScheduleAnalyticsProjectionInput,
): RollingScheduleAnalyticsProjection => {
  const { startYmd, endYmd } = monthRangeFromKey(input.monthKey);
  const todayYmd = input.todayYmd || indiaYmd();
  if (!isValidYmd(todayYmd)) throw new Error('todayYmd must be YYYY-MM-DD');

  const currentMonthKey = todayYmd.slice(0, 7);
  const selectedMonthIsPast = input.monthKey < currentMonthKey;
  const selectedMonthIsFuture = input.monthKey > currentMonthKey;
  const courseById = courseIndex(input.courses);

  const enrollmentById = new Map<string, RecordLike>();
  input.enrollments.forEach((enrollment) => {
    const id = text(enrollment.id);
    if (id) enrollmentById.set(id, enrollment);
  });

  const regularRealSessions = input.realSessions.filter((session) => {
    const date = sessionYmd(session);
    return Boolean(date && date >= startYmd && date <= endYmd && isRegularScheduleSession(session));
  });
  const realSessionsByEnrollment = new Map<string, RecordLike[]>();
  const realRegularById = new Map<string, RecordLike>();
  const realRegularByOccurrence = new Map<string, RecordLike>();

  regularRealSessions.forEach((session) => {
    const enrollmentId = enrollmentIdFromSession(session);
    if (!enrollmentId) return;
    const rows = realSessionsByEnrollment.get(enrollmentId) || [];
    rows.push(session);
    realSessionsByEnrollment.set(enrollmentId, rows);
    const id = text(session.id);
    if (id) realRegularById.set(id, session);
    const identity = sessionOccurrenceIdentity(session);
    if (identity && !realRegularByOccurrence.has(identity)) realRegularByOccurrence.set(identity, session);
  });

  let plannedSessions = 0;
  let remainingScheduledSessions = 0;
  let projectedRevenue = 0;
  let missingFeeSessions = 0;
  let realPlannedSessions = 0;
  let recurrenceProjectedSessions = 0;
  const scheduleEnrollmentIds = new Set<string>();

  const addCountedOccurrence = (
    enrollmentId: string,
    enrollment: RecordLike,
    session: RecordLike | undefined,
    projected: boolean,
  ) => {
    if (session && !isCountedPlannedRealSession(session)) return;
    plannedSessions += 1;
    scheduleEnrollmentIds.add(enrollmentId);
    if (projected || (session && isRemainingRealSession(session))) remainingScheduledSessions += 1;
    if (projected) recurrenceProjectedSessions += 1;
    else realPlannedSessions += 1;

    const fee = resolveOccurrenceFee(enrollment, courseById, session);
    if (fee > 0) projectedRevenue += fee;
    else missingFeeSessions += 1;
  };

  const addActualSessions = (
    enrollmentId: string,
    enrollment: RecordLike,
    predicate: (session: RecordLike) => boolean,
  ) => {
    (realSessionsByEnrollment.get(enrollmentId) || []).forEach((session) => {
      if (!predicate(session) || !isCountedPlannedRealSession(session)) return;
      addCountedOccurrence(enrollmentId, enrollment, session, false);
    });
  };

  const realOverrideFor = (
    enrollmentId: string,
    occurrence: RollingScheduleOccurrence,
  ): RecordLike | undefined => {
    if (occurrence.sessionId) {
      const deterministic = realRegularById.get(occurrence.sessionId);
      if (deterministic) return deterministic;
    }
    return realRegularByOccurrence.get(
      occurrenceIdentity(enrollmentId, occurrence.date, occurrence.startTime),
    );
  };

  enrollmentById.forEach((enrollment, enrollmentId) => {
    const contract = resolveEnrollmentRollingScheduleContract(enrollment);
    const isCanonicalRolling = contract.source === 'canonical_rolling' && Boolean(contract.schedule);

    if (selectedMonthIsPast) {
      addActualSessions(enrollmentId, enrollment, () => true);
      return;
    }

    if (!isCanonicalRolling) {
      if (contract.lifecycleState !== 'active') return;
      addActualSessions(enrollmentId, enrollment, () => true);
      return;
    }

    if (!selectedMonthIsFuture) {
      addActualSessions(
        enrollmentId,
        enrollment,
        (session) => (sessionYmd(session) || '') <= todayYmd,
      );
    }

    if (contract.lifecycleState !== 'active' || !contract.schedule) return;

    const recurrenceFromYmd = selectedMonthIsFuture
      ? startYmd
      : addDaysYmd(todayYmd, 1) > startYmd
        ? addDaysYmd(todayYmd, 1)
        : startYmd;
    if (recurrenceFromYmd > endYmd) return;

    const occurrences = enumerateRollingScheduleOccurrences({
      enrollmentId,
      schedule: contract.schedule,
      classesStartDateYmd: contract.classesStartDateYmd,
      fromYmd: recurrenceFromYmd,
      toYmd: endYmd,
    });

    occurrences.forEach((occurrence) => {
      const override = realOverrideFor(enrollmentId, occurrence);
      if (override) {
        addCountedOccurrence(enrollmentId, enrollment, override, false);
      } else {
        addCountedOccurrence(enrollmentId, enrollment, undefined, true);
      }
    });
  });

  return {
    plannedSessions,
    remainingScheduledSessions,
    scheduleDrivenEnrollments: scheduleEnrollmentIds.size,
    projectedRevenue,
    avgProjectedRevenuePerSession: plannedSessions > 0 ? projectedRevenue / plannedSessions : 0,
    missingFeeSessions,
    realPlannedSessions,
    recurrenceProjectedSessions,
  };
};
