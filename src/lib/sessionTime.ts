export const INDIA_TIME_ZONE = 'Asia/Kolkata';

const DEFAULT_LOCALE = 'en-GB';
const IST_OFFSET_MINUTES = 5.5 * 60;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export type SessionTimeLike = {
  date?: unknown;
  localDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  scheduledStartAt?: unknown;
  scheduledEndAt?: unknown;
  durationMins?: unknown;
  durationMinutes?: unknown;
};

export type SessionTimeSource =
  | 'timestamp'
  | 'scheduled_timestamp'
  | 'legacy_fields'
  | 'missing';

export type SessionTimeRange = {
  startAt: Date | null;
  endAt: Date | null;
  source: SessionTimeSource;
};

export type SessionFormatOptions = {
  timeZone?: string;
  locale?: string;
  dateOptions?: Intl.DateTimeFormatOptions;
  timeOptions?: Intl.DateTimeFormatOptions;
  includeTimeZone?: boolean;
  includeLegacyLabel?: boolean;
  fallbackText?: string;
};

type TimestampLike = {
  seconds?: number;
  _seconds?: number;
  nanoseconds?: number;
  _nanoseconds?: number;
  toDate?: () => Date;
  toMillis?: () => number;
};

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

function normalizeYmd(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return YMD_RE.test(text) ? text : '';
}

function parseTimeToMinutes(value: unknown): number | null {
  const text = typeof value === 'string' ? value.trim() : '';
  const match = TIME_RE.exec(text);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'object') {
    const timestamp = value as TimestampLike;

    if (typeof timestamp.toDate === 'function') {
      const asDate = timestamp.toDate();
      if (asDate instanceof Date && !Number.isNaN(asDate.getTime())) return asDate;
    }

    if (typeof timestamp.toMillis === 'function') {
      const millis = Number(timestamp.toMillis());
      if (Number.isFinite(millis)) return new Date(millis);
    }

    const seconds =
      Number.isFinite(timestamp.seconds) ? Number(timestamp.seconds) :
      Number.isFinite(timestamp._seconds) ? Number(timestamp._seconds) :
      null;
    const nanoseconds =
      Number.isFinite(timestamp.nanoseconds) ? Number(timestamp.nanoseconds) :
      Number.isFinite(timestamp._nanoseconds) ? Number(timestamp._nanoseconds) :
      0;

    if (seconds !== null) {
      const millis =
        seconds * 1000 +
        Math.floor(nanoseconds / 1_000_000);
      return new Date(millis);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text || YMD_RE.test(text)) return null;
    const asDate = new Date(text);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }

  return null;
}

function buildUtcDateFromIndiaFields(dateKey: string, minutesSinceMidnight: number): Date | null {
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;

  const utcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    IST_OFFSET_MINUTES * 60 * 1000 +
    minutesSinceMidnight * 60 * 1000;

  return new Date(utcMs);
}

function formatInTimeZone(
  date: Date,
  timeZone: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options,
  }).format(date);
}

function formatYmdInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';

  return year && month && day ? `${year}-${month}-${day}` : '';
}

function getLegacyDateKey(session: SessionTimeLike): string {
  const explicitKey = normalizeYmd(session.localDate) || normalizeYmd(session.date);
  if (explicitKey) return explicitKey;

  const dateValue = toDateMaybe(session.date);
  if (dateValue) return formatYmdInTimeZone(dateValue, INDIA_TIME_ZONE);

  const scheduledStart = toDateMaybe(session.scheduledStartAt);
  if (scheduledStart) return formatYmdInTimeZone(scheduledStart, INDIA_TIME_ZONE);

  const start = toDateMaybe(session.startAt);
  if (start) return formatYmdInTimeZone(start, INDIA_TIME_ZONE);

  return '';
}

function deriveEndAt(
  session: SessionTimeLike,
  startAt: Date | null,
  legacyDateKey: string,
): Date | null {
  const endAtFromTimestamp =
    toDateMaybe(session.endAt) ||
    toDateMaybe(session.scheduledEndAt);

  if (endAtFromTimestamp) return endAtFromTimestamp;
  if (!startAt) return null;

  const endMinutes = parseTimeToMinutes(session.endTime);
  if (endMinutes !== null) {
    const endAtFromFields = buildUtcDateFromIndiaFields(
      legacyDateKey || formatYmdInTimeZone(startAt, INDIA_TIME_ZONE),
      endMinutes,
    );

    if (endAtFromFields) {
      if (endAtFromFields.getTime() <= startAt.getTime()) {
        return new Date(endAtFromFields.getTime() + 24 * 60 * 60 * 1000);
      }
      return endAtFromFields;
    }
  }

  const durationMinutes = Number(session.durationMins ?? session.durationMinutes);
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  }

  return null;
}

function getTimeZoneLabel(date: Date, timeZone: string, locale: string): string {
  if (timeZone === INDIA_TIME_ZONE) return 'IST';

  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date);

  return parts.find((part) => part.type === 'timeZoneName')?.value || '';
}

export function getViewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function resolveSessionTimeRange(session: SessionTimeLike): SessionTimeRange {
  const startAtFromTimestamp = toDateMaybe(session.startAt);
  const scheduledStartAt = toDateMaybe(session.scheduledStartAt);
  const legacyDateKey = getLegacyDateKey(session);
  const startMinutes = parseTimeToMinutes(session.startTime);

  let startAt: Date | null = null;
  let source: SessionTimeSource = 'missing';

  if (startAtFromTimestamp) {
    startAt = startAtFromTimestamp;
    source = 'timestamp';
  } else if (scheduledStartAt) {
    startAt = scheduledStartAt;
    source = 'scheduled_timestamp';
  } else if (legacyDateKey && startMinutes !== null) {
    startAt = buildUtcDateFromIndiaFields(legacyDateKey, startMinutes);
    source = startAt ? 'legacy_fields' : 'missing';
  }

  return {
    startAt,
    endAt: deriveEndAt(session, startAt, legacyDateKey),
    source,
  };
}

export function isSessionTimeFallback(session: SessionTimeLike): boolean {
  return resolveSessionTimeRange(session).source === 'legacy_fields';
}

export function formatSessionDate(
  session: SessionTimeLike,
  options: SessionFormatOptions = {},
): string {
  const {
    timeZone = getViewerTimeZone(),
    locale = DEFAULT_LOCALE,
    dateOptions = DEFAULT_DATE_OPTIONS,
    fallbackText,
  } = options;

  const { startAt } = resolveSessionTimeRange(session);
  if (startAt) {
    return formatInTimeZone(startAt, timeZone, locale, dateOptions);
  }

  const dateKey = getLegacyDateKey(session);
  if (!dateKey) return fallbackText || '';

  const dateAtMidnightIndia = buildUtcDateFromIndiaFields(dateKey, 0);
  if (!dateAtMidnightIndia) return fallbackText || dateKey;

  return formatInTimeZone(dateAtMidnightIndia, INDIA_TIME_ZONE, locale, dateOptions);
}

export function formatSessionTimeRange(
  session: SessionTimeLike,
  options: SessionFormatOptions = {},
): string {
  const {
    timeZone = getViewerTimeZone(),
    locale = DEFAULT_LOCALE,
    timeOptions = DEFAULT_TIME_OPTIONS,
    includeTimeZone = false,
    includeLegacyLabel = false,
    fallbackText = 'Time TBD',
  } = options;

  const { startAt, endAt, source } = resolveSessionTimeRange(session);
  if (!startAt) return fallbackText;

  const startLabel = formatInTimeZone(startAt, timeZone, locale, timeOptions);
  const endLabel = endAt ? formatInTimeZone(endAt, timeZone, locale, timeOptions) : '';
  const zoneLabel = includeTimeZone ? getTimeZoneLabel(startAt, timeZone, locale) : '';
  const legacyLabel = includeLegacyLabel && source === 'legacy_fields' ? ' (legacy schedule)' : '';

  const timeLabel = endLabel ? `${startLabel} - ${endLabel}` : startLabel;
  if (zoneLabel) return `${timeLabel} ${zoneLabel}${legacyLabel}`;
  return `${timeLabel}${legacyLabel}`;
}

export function formatSessionDateTimeRange(
  session: SessionTimeLike,
  options: SessionFormatOptions = {},
): string {
  const dateLabel = formatSessionDate(session, options);
  const timeLabel = formatSessionTimeRange(session, options);

  if (dateLabel && timeLabel && timeLabel !== 'Time TBD') {
    return `${dateLabel} · ${timeLabel}`;
  }

  return dateLabel || timeLabel;
}

export function formatIndiaTimeRange(
  session: SessionTimeLike,
  options: SessionFormatOptions = {},
): string {
  return formatSessionTimeRange(session, {
    ...options,
    timeZone: INDIA_TIME_ZONE,
    includeTimeZone: true,
  });
}

export function getSessionStartDate(session: SessionTimeLike): Date | null {
  return resolveSessionTimeRange(session).startAt;
}

export function getSessionEndDate(session: SessionTimeLike): Date | null {
  return resolveSessionTimeRange(session).endAt;
}
