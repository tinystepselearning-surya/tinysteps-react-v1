import { isScheduleExceptionSession } from '../sessionScheduleIntegrity';
import {
  ROLLING_SCHEDULE_CONTRACT_VERSION,
  ROLLING_SCHEDULE_DELIVERY_MODE,
  ROLLING_SCHEDULE_HORIZON_DAYS,
} from './enrollmentRollingScheduleContract';
import { ROLLING_SCHEDULE_TIME_ZONE, ROLLING_SCHEDULE_UTC_OFFSET_MINUTES } from './rollingScheduleRecurrence';

type RecordLike = Record<string, unknown>;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (value: unknown): string => (
  typeof value === 'string' ? value.trim() : ''
);

const validYmd = (value: string): boolean => {
  if (!YMD_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
};

const addDaysYmd = (ymd: string, days: number): string => {
  if (!validYmd(ymd)) throw new Error('todayYmd must be YYYY-MM-DD');
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const indiaYmd = (date = new Date()): string => {
  const shifted = new Date(date.getTime() + ROLLING_SCHEDULE_UTC_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
};

const dateLikeToMs = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'object' && value !== null) {
    const row = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
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

export const resolveRealSessionYmd = (session: RecordLike): string | null => {
  const direct = text(session.date);
  if (validYmd(direct)) return direct;
  const startMs = dateLikeToMs(session.startAt);
  if (startMs === null) return null;
  const shifted = new Date(startMs + ROLLING_SCHEDULE_UTC_OFFSET_MINUTES * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
};

export const isCanonicalRollingScheduleLike = (enrollment: RecordLike | undefined): boolean => {
  if (!enrollment || !enrollment.schedule || typeof enrollment.schedule !== 'object' || Array.isArray(enrollment.schedule)) {
    return false;
  }
  const schedule = enrollment.schedule as RecordLike;
  return Number(schedule.schemaVersion) === ROLLING_SCHEDULE_CONTRACT_VERSION
    && text(schedule.deliveryMode).toLowerCase() === ROLLING_SCHEDULE_DELIVERY_MODE
    && text(schedule.timezone) === ROLLING_SCHEDULE_TIME_ZONE;
};

/**
 * Determines whether a persisted classSession should remain operational calendar authority.
 *
 * Legacy/unconverted enrollments keep their established real-session behavior. For canonical
 * rolling enrollments, ordinary recurring documents are authoritative only through the exact
 * physical horizon (today..today+14). Old finite-generator documents beyond that boundary are
 * deliberately ignored so they cannot suppress or duplicate recurrence projections after cutover.
 * Explicit schedule exceptions (manual/makeup/reschedule/replacement) remain real authority.
 */
export const isRealSessionAuthoritativeForRollingCalendar = (args: {
  session: RecordLike;
  enrollment: RecordLike | undefined;
  todayYmd?: string;
}): boolean => {
  if (!isCanonicalRollingScheduleLike(args.enrollment)) return true;
  if (isScheduleExceptionSession(args.session)) return true;

  const sessionYmd = resolveRealSessionYmd(args.session);
  if (!sessionYmd) return false;
  const todayYmd = args.todayYmd || indiaYmd();
  const horizonEndYmd = addDaysYmd(todayYmd, ROLLING_SCHEDULE_HORIZON_DAYS);
  return sessionYmd <= horizonEndYmd;
};
