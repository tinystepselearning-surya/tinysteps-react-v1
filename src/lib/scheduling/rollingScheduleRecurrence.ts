export const ROLLING_SCHEDULE_TIME_ZONE = 'Asia/Kolkata';
export const ROLLING_SCHEDULE_UTC_OFFSET_MINUTES = 330;
export const DEFAULT_ROLLING_SESSION_DURATION_MINUTES = 35;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type RollingScheduleSlotInput = {
  weekday?: number;
  time?: string;
  durationMinutes?: number;
  durationMins?: number;
};

export type RollingScheduleConfigInput = {
  timezone?: string;
  weeklySlots?: RollingScheduleSlotInput[];
  weekdays?: number[];
  timeHHmm?: string;
  durationMins?: number;
};

export type NormalizedRollingScheduleSlot = {
  weekday: number;
  time: string;
  hour: number;
  minute: number;
  durationMinutes: number;
};

export type RollingScheduleOccurrence = {
  date: string;
  weekday: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startAtUtcMs: number;
  endAtUtcMs: number;
  occurrenceKey: string;
  sessionId: string | null;
};

export type EnumerateRollingScheduleOccurrencesInput = {
  schedule: RollingScheduleConfigInput;
  fromYmd: string;
  toYmd: string;
  classesStartDateYmd?: string | null;
  enrollmentId?: string | null;
  timezone?: string | null;
};

type ParsedYmd = {
  year: number;
  month: number;
  day: number;
  utcMs: number;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

const parseYmdStrict = (value: string, fieldName: string): ParsedYmd => {
  const raw = String(value || '').trim();
  if (!YMD_RE.test(raw)) {
    throw new Error(`${fieldName} must be YYYY-MM-DD`);
  }

  const [yearText, monthText, dayText] = raw.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const parsed = new Date(utcMs);

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error(`${fieldName} is not a valid calendar date`);
  }

  return { year, month, day, utcMs };
};

const ymdFromUtcMs = (utcMs: number): string => {
  const date = new Date(utcMs);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

const parseTime = (value: unknown, fieldName: string): { time: string; hour: number; minute: number } => {
  const raw = typeof value === 'string' ? value.trim() : '';
  const match = HHMM_RE.exec(raw);
  if (!match) {
    throw new Error(`${fieldName} must be HH:MM in 24-hour time`);
  }
  return {
    time: raw,
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

const normalizeDurationMinutes = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return Math.max(10, Math.min(180, Math.floor(parsed)));
};

const assertWeekday = (value: unknown, fieldName: string): number => {
  const weekday = Number(value);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error(`${fieldName} must be an integer from 0 (Sunday) to 6 (Saturday)`);
  }
  return weekday;
};

const compareSlots = (a: NormalizedRollingScheduleSlot, b: NormalizedRollingScheduleSlot): number => {
  if (a.weekday !== b.weekday) return a.weekday - b.weekday;
  if (a.time !== b.time) return a.time.localeCompare(b.time, undefined, { numeric: true });
  return a.durationMinutes - b.durationMinutes;
};

export const normalizeRollingScheduleSlots = (
  schedule: RollingScheduleConfigInput | null | undefined,
): NormalizedRollingScheduleSlot[] => {
  if (!schedule) return [];

  if (Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0) {
    const result: NormalizedRollingScheduleSlot[] = [];
    const exactKeys = new Set<string>();
    const occurrenceIdentityKeys = new Set<string>();

    schedule.weeklySlots.forEach((rawSlot, index) => {
      const weekday = assertWeekday(rawSlot?.weekday, `schedule.weeklySlots[${index}].weekday`);
      const parsedTime = parseTime(rawSlot?.time, `schedule.weeklySlots[${index}].time`);
      const durationMinutes = normalizeDurationMinutes(
        rawSlot?.durationMinutes ?? rawSlot?.durationMins,
        `schedule.weeklySlots[${index}].durationMinutes`,
      );

      const exactKey = `${weekday}|${parsedTime.time}|${durationMinutes}`;
      if (exactKeys.has(exactKey)) {
        throw new Error('Duplicate schedule.weeklySlots entry');
      }
      exactKeys.add(exactKey);

      // Session IDs are date + start time. Two slots at the same weekday/time would
      // therefore target the same deterministic session document even if duration differs.
      const identityKey = `${weekday}|${parsedTime.time}`;
      if (occurrenceIdentityKeys.has(identityKey)) {
        throw new Error('Conflicting schedule.weeklySlots entries share the same weekday and start time');
      }
      occurrenceIdentityKeys.add(identityKey);

      result.push({
        weekday,
        time: parsedTime.time,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        durationMinutes,
      });
    });

    return result.sort(compareSlots);
  }

  if (!Array.isArray(schedule.weekdays) || schedule.weekdays.length === 0) return [];

  const parsedTime = parseTime(schedule.timeHHmm, 'schedule.timeHHmm');
  const durationMinutes = normalizeDurationMinutes(
    schedule.durationMins ?? DEFAULT_ROLLING_SESSION_DURATION_MINUTES,
    'schedule.durationMins',
  );
  const seenWeekdays = new Set<number>();
  const result: NormalizedRollingScheduleSlot[] = [];

  schedule.weekdays.forEach((rawWeekday, index) => {
    const weekday = assertWeekday(rawWeekday, `schedule.weekdays[${index}]`);
    if (seenWeekdays.has(weekday)) return;
    seenWeekdays.add(weekday);
    result.push({
      weekday,
      time: parsedTime.time,
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      durationMinutes,
    });
  });

  return result.sort(compareSlots);
};

export const getRollingScheduleOccurrenceKey = (
  date: string,
  startTime: string,
  durationMinutes: number,
): string => `${date}|${startTime}|${durationMinutes}`;

export const getRollingScheduleSessionId = (
  enrollmentId: string,
  date: string,
  startTime: string,
): string => {
  const safeEnrollmentId = String(enrollmentId || '').trim();
  if (!safeEnrollmentId) throw new Error('enrollmentId is required to build a sessionId');
  parseYmdStrict(date, 'date');
  const parsedTime = parseTime(startTime, 'startTime');
  return `${safeEnrollmentId}_${date.replace(/-/g, '')}_${parsedTime.time.replace(':', '')}`;
};

export const enumerateRollingScheduleOccurrences = (
  input: EnumerateRollingScheduleOccurrencesInput,
): RollingScheduleOccurrence[] => {
  const timezone = String(input.timezone || input.schedule?.timezone || ROLLING_SCHEDULE_TIME_ZONE).trim();
  if (timezone !== ROLLING_SCHEDULE_TIME_ZONE) {
    throw new Error(`Unsupported rolling schedule timezone: ${timezone}`);
  }

  const from = parseYmdStrict(input.fromYmd, 'fromYmd');
  const to = parseYmdStrict(input.toYmd, 'toYmd');
  if (to.utcMs < from.utcMs) {
    throw new Error('toYmd must be on or after fromYmd');
  }

  let effectiveStartMs = from.utcMs;
  if (input.classesStartDateYmd) {
    const classesStart = parseYmdStrict(input.classesStartDateYmd, 'classesStartDateYmd');
    effectiveStartMs = Math.max(effectiveStartMs, classesStart.utcMs);
  }
  if (effectiveStartMs > to.utcMs) return [];

  const slots = normalizeRollingScheduleSlots(input.schedule);
  if (slots.length === 0) return [];

  const slotsByWeekday = new Map<number, NormalizedRollingScheduleSlot[]>();
  slots.forEach((slot) => {
    const rows = slotsByWeekday.get(slot.weekday) || [];
    rows.push(slot);
    slotsByWeekday.set(slot.weekday, rows);
  });

  const enrollmentId = String(input.enrollmentId || '').trim();
  const occurrences: RollingScheduleOccurrence[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  for (let dayUtcMs = effectiveStartMs; dayUtcMs <= to.utcMs; dayUtcMs += dayMs) {
    const day = new Date(dayUtcMs);
    const weekday = day.getUTCDay();
    const daySlots = slotsByWeekday.get(weekday);
    if (!daySlots?.length) continue;

    const date = ymdFromUtcMs(dayUtcMs);
    const year = day.getUTCFullYear();
    const monthIndex = day.getUTCMonth();
    const dayOfMonth = day.getUTCDate();

    daySlots.forEach((slot) => {
      const istContextStartMs = Date.UTC(
        year,
        monthIndex,
        dayOfMonth,
        slot.hour,
        slot.minute,
        0,
        0,
      );
      const startAtUtcMs = istContextStartMs - ROLLING_SCHEDULE_UTC_OFFSET_MINUTES * 60 * 1000;
      const endAtUtcMs = startAtUtcMs + slot.durationMinutes * 60 * 1000;
      const endMinutes = (slot.hour * 60 + slot.minute + slot.durationMinutes) % (24 * 60);
      const endTime = `${pad2(Math.floor(endMinutes / 60))}:${pad2(endMinutes % 60)}`;

      occurrences.push({
        date,
        weekday,
        startTime: slot.time,
        endTime,
        durationMinutes: slot.durationMinutes,
        startAtUtcMs,
        endAtUtcMs,
        occurrenceKey: getRollingScheduleOccurrenceKey(date, slot.time, slot.durationMinutes),
        sessionId: enrollmentId ? getRollingScheduleSessionId(enrollmentId, date, slot.time) : null,
      });
    });
  }

  return occurrences.sort((a, b) => {
    if (a.startAtUtcMs !== b.startAtUtcMs) return a.startAtUtcMs - b.startAtUtcMs;
    return a.durationMinutes - b.durationMinutes;
  });
};
