const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export const ATTENDANCE_FINALISED_MESSAGE =
  'Attendance for this month was finalised on the 5th of the following month. Further corrections are not permitted.';

type SessionDateFields = {
  date?: unknown;
  startAt?: unknown;
};

function toDateMaybe(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      if (!Number.isNaN(date.getTime())) return date;
    }
    if (typeof timestamp.seconds === 'number') {
      const date = new Date(timestamp.seconds * 1000);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function isValidYmd(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;
}

export function resolveSessionScheduledDateYmdIST(session: SessionDateFields): string | null {
  const explicitDate = typeof session.date === 'string' ? session.date.trim() : '';
  if (isValidYmd(explicitDate)) return explicitDate;

  const startAt = toDateMaybe(session.startAt);
  if (!startAt) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(startAt);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';
  const ymd = `${get('year')}-${get('month')}-${get('day')}`;
  return isValidYmd(ymd) ? ymd : null;
}

export function getTeacherAttendanceCorrectionCutoffMillis(
  session: SessionDateFields,
): number | null {
  const dateYmd = resolveSessionScheduledDateYmdIST(session);
  if (!dateYmd) return null;
  const [year, month] = dateYmd.split('-').map(Number);
  const nextMonthIndex = month;
  return Date.UTC(year, nextMonthIndex, 6, 0, 0, 0) - IST_OFFSET_MS;
}

export function isTeacherAttendanceCorrectionAllowed(
  session: SessionDateFields,
  nowMs = Date.now(),
): boolean {
  const cutoffMs = getTeacherAttendanceCorrectionCutoffMillis(session);
  return cutoffMs !== null && nowMs < cutoffMs;
}
