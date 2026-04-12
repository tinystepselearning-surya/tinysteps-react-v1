import { addDays, format, startOfDay } from 'date-fns';
import type { TeacherSession } from '../types/Teacher';
import type { DemoSession } from '../types/models';

export type SlotStatus = 'unavailable' | 'available' | 'class' | 'demo' | 'blocked' | 'conflict';

export interface TeacherAvailabilityWindow {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface TeacherAvailabilityConfig {
  timezone: string;
  slotIntervalMinutes: number;
  minimumNoticeMinutes: number;
  bufferBetweenSessionsMinutes: number;
  weeklyWindows: TeacherAvailabilityWindow[];
  updatedAt?: unknown;
  updatedBy?: string | null;
}

export interface TeacherBlockedSlotLite {
  id: string;
  startAt: Date;
  endAt: Date;
  reason?: string;
}

export interface ScheduleInterval {
  id: string;
  startAt: Date;
  endAt: Date;
  kind: 'availability' | 'class' | 'demo' | 'blocked' | 'open';
  label: string;
  sourceId?: string;
}

export interface ScheduleDaySnapshot {
  date: Date;
  dateKey: string;
  availabilityIntervals: ScheduleInterval[];
  classIntervals: ScheduleInterval[];
  demoIntervals: ScheduleInterval[];
  blockedIntervals: ScheduleInterval[];
  openIntervals: ScheduleInterval[];
}

export interface ScheduleGridCell {
  slotStart: Date;
  slotEnd: Date;
  status: SlotStatus;
  labels: string[];
  conflictReasons: string[];
  sources: Array<{
    kind: 'availability' | 'class' | 'demo' | 'blocked';
    id: string;
    label: string;
    sourceId?: string;
  }>;
}

export const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
export const DEFAULT_DEMO_DURATION_MINUTES = 35;
export const DEFAULT_MINIMUM_NOTICE_MINUTES = 0;
export const DEFAULT_BUFFER_BETWEEN_SESSIONS_MINUTES = 0;

export const WEEKDAY_OPTIONS: Array<{ value: number; label: string; shortLabel: string }> = [
  { value: 1, label: 'Monday', shortLabel: 'Mon' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 4, label: 'Thursday', shortLabel: 'Thu' },
  { value: 5, label: 'Friday', shortLabel: 'Fri' },
  { value: 6, label: 'Saturday', shortLabel: 'Sat' },
  { value: 0, label: 'Sunday', shortLabel: 'Sun' },
];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function uniqueId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') {
      const date = maybe.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
    }
    if (typeof maybe.seconds === 'number') {
      const date = new Date(maybe.seconds * 1000);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function parseTimeHHmm(value: string): number | null {
  const normalized = String(value || '').trim();
  const match = TIME_RE.exec(normalized);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export function formatMinutesAsTimeHHmm(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.floor(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatTimeLabel(value: string): string {
  const minutes = parseTimeHHmm(value);
  if (minutes === null) return value;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function formatIntervalLabel(startAt: Date, endAt: Date): string {
  return `${formatTimeLabel(format(startAt, 'HH:mm'))} - ${formatTimeLabel(format(endAt, 'HH:mm'))}`;
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function dateKeyToDate(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function buildDateAtTime(date: Date, timeHHmm: string): Date | null {
  const minutes = parseTimeHHmm(timeHHmm);
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    mins,
    0,
    0,
  );
}

export function createAvailabilityWindow(
  weekday: number,
  startTime = '17:00',
  endTime = '21:00',
): TeacherAvailabilityWindow {
  return {
    id: uniqueId(`availability_${weekday}`),
    weekday,
    startTime,
    endTime,
  };
}

function isValidWeekday(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;
}

export function normalizeTeacherAvailabilityConfig(raw: unknown): TeacherAvailabilityConfig {
  const source = (raw || {}) as Record<string, unknown>;
  const weeklyWindowsSource = Array.isArray(source.weeklyWindows) ? source.weeklyWindows : [];

  const weeklyWindows = weeklyWindowsSource
    .map((window) => {
      const entry = (window || {}) as Record<string, unknown>;
      const weekday = Number(entry.weekday);
      const startTime = String(entry.startTime || '').trim();
      const endTime = String(entry.endTime || '').trim();
      const startMinutes = parseTimeHHmm(startTime);
      const endMinutes = parseTimeHHmm(endTime);
      if (
        !isValidWeekday(weekday) ||
        startMinutes === null ||
        endMinutes === null ||
        endMinutes <= startMinutes
      ) {
        return null;
      }
      return {
        id: String(entry.id || uniqueId(`availability_${weekday}`)),
        weekday,
        startTime,
        endTime,
      } as TeacherAvailabilityWindow;
    })
    .filter((window): window is TeacherAvailabilityWindow => Boolean(window))
    .sort((a, b) => {
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      const startDiff = (parseTimeHHmm(a.startTime) || 0) - (parseTimeHHmm(b.startTime) || 0);
      if (startDiff !== 0) return startDiff;
      return (parseTimeHHmm(a.endTime) || 0) - (parseTimeHHmm(b.endTime) || 0);
    });

  const slotIntervalMinutes = Number(source.slotIntervalMinutes);
  const minimumNoticeMinutes = Number(source.minimumNoticeMinutes);
  const bufferBetweenSessionsMinutes = Number(source.bufferBetweenSessionsMinutes);
  const timezone = String(
    source.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  );

  return {
    timezone,
    slotIntervalMinutes:
      Number.isFinite(slotIntervalMinutes) && slotIntervalMinutes >= 15 && slotIntervalMinutes <= 120
        ? Math.round(slotIntervalMinutes)
        : DEFAULT_SLOT_INTERVAL_MINUTES,
    minimumNoticeMinutes:
      Number.isFinite(minimumNoticeMinutes) && minimumNoticeMinutes >= 0 && minimumNoticeMinutes <= 1440
        ? Math.round(minimumNoticeMinutes)
        : DEFAULT_MINIMUM_NOTICE_MINUTES,
    bufferBetweenSessionsMinutes:
      Number.isFinite(bufferBetweenSessionsMinutes) && bufferBetweenSessionsMinutes >= 0 && bufferBetweenSessionsMinutes <= 180
        ? Math.round(bufferBetweenSessionsMinutes)
        : DEFAULT_BUFFER_BETWEEN_SESSIONS_MINUTES,
    weeklyWindows,
    updatedAt: source.updatedAt,
    updatedBy: typeof source.updatedBy === 'string' ? source.updatedBy : null,
  };
}

export function validateTeacherAvailabilityWindows(
  windows: TeacherAvailabilityWindow[],
): { ok: true; windows: TeacherAvailabilityWindow[] } | { ok: false; message: string } {
  const normalized = normalizeTeacherAvailabilityConfig({
    weeklyWindows: windows,
    slotIntervalMinutes: DEFAULT_SLOT_INTERVAL_MINUTES,
    minimumNoticeMinutes: DEFAULT_MINIMUM_NOTICE_MINUTES,
    bufferBetweenSessionsMinutes: DEFAULT_BUFFER_BETWEEN_SESSIONS_MINUTES,
    timezone: 'Asia/Kolkata',
  }).weeklyWindows;

  if (normalized.length !== windows.length) {
    return { ok: false, message: 'Each availability window needs a valid weekday and start/end time.' };
  }

  const byWeekday = new Map<number, TeacherAvailabilityWindow[]>();
  normalized.forEach((window) => {
    const list = byWeekday.get(window.weekday) || [];
    list.push(window);
    byWeekday.set(window.weekday, list);
  });

  for (const [weekday, dayWindows] of byWeekday.entries()) {
    const sorted = [...dayWindows].sort(
      (a, b) => (parseTimeHHmm(a.startTime) || 0) - (parseTimeHHmm(b.startTime) || 0),
    );
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      const currentEnd = parseTimeHHmm(current.endTime) || 0;
      const nextStart = parseTimeHHmm(next.startTime) || 0;
      if (nextStart < currentEnd) {
        const dayLabel =
          WEEKDAY_OPTIONS.find((option) => option.value === weekday)?.label || `Day ${weekday}`;
        return {
          ok: false,
          message: `${dayLabel} has overlapping availability windows. Adjust them before saving.`,
        };
      }
    }
  }

  return { ok: true, windows: normalized };
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

function mergeIntervals(intervals: Array<{ startAt: Date; endAt: Date }>): Array<{ startAt: Date; endAt: Date }> {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const merged: Array<{ startAt: Date; endAt: Date }> = [
    { startAt: sorted[0].startAt, endAt: sorted[0].endAt },
  ];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];
    if (current.startAt <= last.endAt) {
      if (current.endAt > last.endAt) {
        last.endAt = current.endAt;
      }
      continue;
    }
    merged.push({ startAt: current.startAt, endAt: current.endAt });
  }

  return merged;
}

function subtractIntervals(
  base: { startAt: Date; endAt: Date },
  exclusions: Array<{ startAt: Date; endAt: Date }>,
): Array<{ startAt: Date; endAt: Date }> {
  let segments: Array<{ startAt: Date; endAt: Date }> = [
    { startAt: base.startAt, endAt: base.endAt },
  ];

  exclusions.forEach((exclusion) => {
    const nextSegments: Array<{ startAt: Date; endAt: Date }> = [];
    segments.forEach((segment) => {
      if (!overlaps(segment.startAt, segment.endAt, exclusion.startAt, exclusion.endAt)) {
        nextSegments.push(segment);
        return;
      }

      if (exclusion.startAt > segment.startAt) {
        nextSegments.push({ startAt: segment.startAt, endAt: exclusion.startAt });
      }
      if (exclusion.endAt < segment.endAt) {
        nextSegments.push({ startAt: exclusion.endAt, endAt: segment.endAt });
      }
    });
    segments = nextSegments.filter((segment) => segment.endAt > segment.startAt);
  });

  return segments;
}

function sessionToInterval(session: TeacherSession): ScheduleInterval | null {
  const sessionDay = dateKeyToDate(session.date || '');
  const startAt = toDateMaybe(session.startAt) || (sessionDay ? buildDateAtTime(sessionDay, session.startTime) : null);
  if (!startAt) return null;

  const endAt =
    toDateMaybe(session.endAt) ||
    (sessionDay ? buildDateAtTime(sessionDay, session.endTime) : null) ||
    new Date(
      startAt.getTime() +
        Math.max(
          15,
          Number(session.durationMinutes || session.durationMins || DEFAULT_DEMO_DURATION_MINUTES),
        ) *
          60 *
          1000,
    );

  if (!(endAt > startAt)) return null;

  return {
    id: session.id,
    sourceId: session.id,
    startAt,
    endAt,
    kind: 'class',
    label: session.courseName || session.courseId || 'Class Session',
  };
}

export function demoSessionToInterval(
  demo: DemoSession,
  durationMinutes = DEFAULT_DEMO_DURATION_MINUTES,
): ScheduleInterval | null {
  const dateValue = String(demo.teacherConfirmedDate || '').trim();
  const timeValue = String(demo.teacherConfirmedTime || '').trim();
  if (!dateValue || !timeValue) return null;

  const demoDay = dateKeyToDate(dateValue);
  const startAt = demoDay ? buildDateAtTime(demoDay, timeValue) : null;
  if (!startAt) return null;

  const endAt = new Date(startAt.getTime() + Math.max(15, durationMinutes) * 60 * 1000);
  return {
    id: demo.id,
    sourceId: demo.id,
    startAt,
    endAt,
    kind: 'demo',
    label: `${demo.childName || 'Demo'} Demo`,
  };
}

function filterIntervalsForDay<T extends ScheduleInterval | TeacherBlockedSlotLite>(
  items: T[],
  dayStart: Date,
  dayEnd: Date,
): T[] {
  return items.filter((item) => overlaps(item.startAt, item.endAt, dayStart, dayEnd));
}

export function buildDayScheduleSnapshot(input: {
  date: Date;
  availabilityConfig: TeacherAvailabilityConfig | null | undefined;
  sessions?: TeacherSession[];
  demos?: DemoSession[];
  blockedSlots?: TeacherBlockedSlotLite[];
  demoDurationMinutes?: number;
  now?: Date;
}): ScheduleDaySnapshot {
  const {
    date,
    availabilityConfig,
    sessions = [],
    demos = [],
    blockedSlots = [],
    demoDurationMinutes = DEFAULT_DEMO_DURATION_MINUTES,
    now = new Date(),
  } = input;

  const config = normalizeTeacherAvailabilityConfig(availabilityConfig || {});
  const day = startOfDay(date);
  const dayStart = new Date(day);
  const dayEnd = addDays(dayStart, 1);
  const dateKey = toDateKey(dayStart);
  const weekday = dayStart.getDay();

  const availabilityIntervals = config.weeklyWindows
    .filter((window) => window.weekday === weekday)
    .map((window) => {
      const startAt = buildDateAtTime(dayStart, window.startTime);
      const endAt = buildDateAtTime(dayStart, window.endTime);
      if (!startAt || !endAt || endAt <= startAt) return null;
      return {
        id: window.id,
        sourceId: window.id,
        startAt,
        endAt,
        kind: 'availability',
        label: formatIntervalLabel(startAt, endAt),
      } as ScheduleInterval;
    })
    .filter((window): window is ScheduleInterval => Boolean(window));

  const classIntervals = filterIntervalsForDay(
    sessions.map((session) => sessionToInterval(session)).filter((item): item is ScheduleInterval => Boolean(item)),
    dayStart,
    dayEnd,
  );

  const demoIntervals = filterIntervalsForDay(
    demos
      .map((demo) => demoSessionToInterval(demo, demoDurationMinutes))
      .filter((item): item is ScheduleInterval => Boolean(item)),
    dayStart,
    dayEnd,
  );

  const normalizedBlockedIntervals = filterIntervalsForDay(blockedSlots, dayStart, dayEnd).map((slot) => ({
    id: slot.id,
    sourceId: slot.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
    kind: 'blocked' as const,
    label: slot.reason?.trim() || formatIntervalLabel(slot.startAt, slot.endAt),
  }));

  const bufferMinutes = Math.max(0, config.bufferBetweenSessionsMinutes || 0);
  const bufferedSessionIntervals =
    bufferMinutes > 0
      ? [...classIntervals, ...demoIntervals]
          .map((interval) => {
            const startAt = new Date(
              Math.max(dayStart.getTime(), interval.startAt.getTime() - bufferMinutes * 60 * 1000),
            );
            const endAt = new Date(
              Math.min(dayEnd.getTime(), interval.endAt.getTime() + bufferMinutes * 60 * 1000),
            );
            if (!(endAt > startAt)) return null;
            return { startAt, endAt };
          })
          .filter((interval): interval is { startAt: Date; endAt: Date } => Boolean(interval))
      : [];

  const minimumNoticeMinutes = Math.max(0, config.minimumNoticeMinutes || 0);
  const noticeCutoff = new Date(now.getTime() + minimumNoticeMinutes * 60 * 1000);
  const noticeIntervals: Array<{ startAt: Date; endAt: Date }> = [];
  if (minimumNoticeMinutes > 0 && noticeCutoff > dayStart) {
    const endAt = noticeCutoff < dayEnd ? noticeCutoff : dayEnd;
    if (endAt > dayStart) {
      noticeIntervals.push({ startAt: dayStart, endAt });
    }
  }

  const occupiedUnion = mergeIntervals([
    ...classIntervals,
    ...demoIntervals,
    ...normalizedBlockedIntervals,
    ...bufferedSessionIntervals,
    ...noticeIntervals,
  ]);

  const openIntervals = availabilityIntervals.flatMap((interval, index) =>
    subtractIntervals(interval, occupiedUnion).map((segment, segmentIndex) => ({
      id: `open_${dateKey}_${index}_${segmentIndex}`,
      sourceId: interval.sourceId,
      startAt: segment.startAt,
      endAt: segment.endAt,
      kind: 'open' as const,
      label: formatIntervalLabel(segment.startAt, segment.endAt),
    })),
  );

  return {
    date: dayStart,
    dateKey,
    availabilityIntervals,
    classIntervals,
    demoIntervals,
    blockedIntervals: normalizedBlockedIntervals,
    openIntervals,
  };
}

export function buildScheduleRangeSnapshots(input: {
  startDate: Date;
  days: number;
  availabilityConfig: TeacherAvailabilityConfig | null | undefined;
  sessions?: TeacherSession[];
  demos?: DemoSession[];
  blockedSlots?: TeacherBlockedSlotLite[];
  demoDurationMinutes?: number;
  now?: Date;
}): ScheduleDaySnapshot[] {
  const { startDate, days, availabilityConfig, sessions, demos, blockedSlots, demoDurationMinutes, now } = input;
  const start = startOfDay(startDate);
  return Array.from({ length: Math.max(0, days) }, (_, index) =>
    buildDayScheduleSnapshot({
      date: addDays(start, index),
      availabilityConfig,
      sessions,
      demos,
      blockedSlots,
      demoDurationMinutes,
      now,
    }),
  );
}

export function buildDayGridCells(input: {
  day: ScheduleDaySnapshot;
  slotIntervalMinutes?: number;
  startMinutes?: number;
  endMinutes?: number;
}): ScheduleGridCell[] {
  const {
    day,
    slotIntervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES,
    startMinutes = 6 * 60,
    endMinutes = 22 * 60,
  } = input;

  const cells: ScheduleGridCell[] = [];
  const intervalMinutes = Math.max(15, slotIntervalMinutes);
  const totalMinutes = Math.max(startMinutes + intervalMinutes, endMinutes);

  for (let minutes = startMinutes; minutes < totalMinutes; minutes += intervalMinutes) {
    const slotStart = buildDateAtTime(day.date, formatMinutesAsTimeHHmm(minutes));
    const slotEnd = buildDateAtTime(day.date, formatMinutesAsTimeHHmm(minutes + intervalMinutes));
    if (!slotStart || !slotEnd) continue;

    const overlapsAvailability = day.availabilityIntervals.filter((interval) =>
      overlaps(slotStart, slotEnd, interval.startAt, interval.endAt),
    );
    const overlapsClasses = day.classIntervals.filter((interval) =>
      overlaps(slotStart, slotEnd, interval.startAt, interval.endAt),
    );
    const overlapsDemos = day.demoIntervals.filter((interval) =>
      overlaps(slotStart, slotEnd, interval.startAt, interval.endAt),
    );
    const overlapsBlocked = day.blockedIntervals.filter((interval) =>
      overlaps(slotStart, slotEnd, interval.startAt, interval.endAt),
    );

    const hasAvailability = overlapsAvailability.length > 0;
    const hasOpen = day.openIntervals.some((interval) =>
      overlaps(slotStart, slotEnd, interval.startAt, interval.endAt),
    );
    const hasClass = overlapsClasses.length > 0;
    const hasDemo = overlapsDemos.length > 0;
    const hasBlocked = overlapsBlocked.length > 0;

    const occupancyCount = [hasClass, hasDemo, hasBlocked].filter(Boolean).length;
    const hasConflict =
      occupancyCount > 1 ||
      ((hasClass || hasDemo) && !hasAvailability) ||
      (hasBlocked && (hasClass || hasDemo));

    let status: SlotStatus = 'unavailable';
    if (hasConflict) status = 'conflict';
    else if (hasBlocked) status = 'blocked';
    else if (hasClass) status = 'class';
    else if (hasDemo) status = 'demo';
    else if (hasAvailability && hasOpen) status = 'available';

    const labels = [
      ...overlapsClasses.map((interval) => interval.label),
      ...overlapsDemos.map((interval) => interval.label),
      ...overlapsBlocked.map((interval) => interval.label),
    ];

    const conflictReasons: string[] = [];
    if (hasClass && hasDemo) conflictReasons.push('Class overlaps a demo.');
    if (hasClass && hasBlocked) conflictReasons.push('Class overlaps a manual block.');
    if (hasDemo && hasBlocked) conflictReasons.push('Demo overlaps a manual block.');
    if (hasClass && !hasAvailability) conflictReasons.push('Class is outside published availability.');
    if (hasDemo && !hasAvailability) conflictReasons.push('Demo is outside published availability.');

    const sources = [
      ...overlapsAvailability.map((interval) => ({
        kind: 'availability' as const,
        id: interval.id,
        label: interval.label,
        sourceId: interval.sourceId,
      })),
      ...overlapsClasses.map((interval) => ({
        kind: 'class' as const,
        id: interval.id,
        label: interval.label,
        sourceId: interval.sourceId,
      })),
      ...overlapsDemos.map((interval) => ({
        kind: 'demo' as const,
        id: interval.id,
        label: interval.label,
        sourceId: interval.sourceId,
      })),
      ...overlapsBlocked.map((interval) => ({
        kind: 'blocked' as const,
        id: interval.id,
        label: interval.label,
        sourceId: interval.sourceId,
      })),
    ];

    cells.push({
      slotStart,
      slotEnd,
      status,
      labels,
      conflictReasons,
      sources,
    });
  }

  return cells;
}

export function summarizeScheduleRange(input: {
  days: ScheduleDaySnapshot[];
  slotIntervalMinutes?: number;
  startMinutes?: number;
  endMinutes?: number;
}): Record<SlotStatus, number> {
  const counts: Record<SlotStatus, number> = {
    unavailable: 0,
    available: 0,
    class: 0,
    demo: 0,
    blocked: 0,
    conflict: 0,
  };

  input.days.forEach((day) => {
    buildDayGridCells({
      day,
      slotIntervalMinutes: input.slotIntervalMinutes,
      startMinutes: input.startMinutes,
      endMinutes: input.endMinutes,
    }).forEach((cell) => {
      counts[cell.status] += 1;
    });
  });

  return counts;
}

export function flattenOpenIntervals(days: ScheduleDaySnapshot[]): ScheduleInterval[] {
  return days.flatMap((day) => day.openIntervals).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function getTimelineBounds(days: ScheduleDaySnapshot[]): { startMinutes: number; endMinutes: number } {
  const relevantMinutes: number[] = [];

  days.forEach((day) => {
    [
      ...day.availabilityIntervals,
      ...day.classIntervals,
      ...day.demoIntervals,
      ...day.blockedIntervals,
    ].forEach((interval) => {
      relevantMinutes.push(interval.startAt.getHours() * 60 + interval.startAt.getMinutes());
      relevantMinutes.push(interval.endAt.getHours() * 60 + interval.endAt.getMinutes());
    });
  });

  if (relevantMinutes.length === 0) {
    return { startMinutes: 8 * 60, endMinutes: 22 * 60 };
  }

  const minMinutes = Math.max(6 * 60, Math.floor(Math.min(...relevantMinutes) / 60) * 60 - 60);
  const maxMinutes = Math.min(23 * 60, Math.ceil(Math.max(...relevantMinutes) / 60) * 60 + 60);
  return {
    startMinutes: minMinutes,
    endMinutes: Math.max(minMinutes + DEFAULT_SLOT_INTERVAL_MINUTES, maxMinutes),
  };
}
