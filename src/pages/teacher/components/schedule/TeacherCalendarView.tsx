import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { INDIA_TIME_ZONE, formatSessionTimeRange, getSessionStartDate } from '../../../../lib/sessionTime';

type CalendarViewMode = 'day' | 'week' | 'month';

type SlotRow = {
  key: string;
  label: string;
  startMinutes?: number;
  endMinutes?: number;
};

type MergedSegment = {
  key: string;
  kind: 'available' | 'booked';
  startLabel: string;
  endLabel: string;
  slotCount: number;
  sessions: any[];
};

interface TeacherCalendarViewProps {
  viewMode: CalendarViewMode;
  selectedDate: Date;
  selectedTeacherId?: string;
  sessions: any[];
  slotRows?: SlotRow[];
  emptyLabel?: string;
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

function toDateKey(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
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

function getMinutesInTimeZone(date: Date, timeZone: string): number | null {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function getSessionStartLabel(session: any): string {
  const fromText = toCleanText(session?.startTime);
  if (fromText) return fromText;
  const startAt = getSessionStartDate(session);
  if (!startAt) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(startAt);
}

function parseTimeToMinutes(value: string): number | null {
  const text = String(value || '').trim();
  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }
  const ampm = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(text);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = ampm[3].toLowerCase();
      if (suffix === 'pm' && hours < 12) hours += 12;
      if (suffix === 'am' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
  }
  const asDate = toDateMaybe(text);
  if (asDate) return asDate.getHours() * 60 + asDate.getMinutes();
  return null;
}

function toHHmm(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toCleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function isLikelyHumanLabel(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (/[{}[\]]/.test(text)) return false;
  if (/^[a-z0-9_-]{12,}$/i.test(text)) return false;
  return /[a-z]/i.test(text);
}

function getNameFromObject(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  const first = toCleanText(row.firstName);
  const last = toCleanText(row.lastName);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return (
    toCleanText(row.name) ||
    toCleanText(row.fullName) ||
    toCleanText(row.displayName) ||
    toCleanText(row.studentName) ||
    toCleanText(row.childName) ||
    combined
  );
}

function namesFromCollection(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const fromPrimitive = toCleanText(item);
      if (fromPrimitive) return fromPrimitive;
      return getNameFromObject(item);
    })
    .map((name) => name.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getSessionDateKey(session: any): string {
  const resolvedStart = getSessionStartDate(session);
  if (resolvedStart) return formatDateKeyInTimeZone(resolvedStart, INDIA_TIME_ZONE);
  const dateText = toCleanText(session?.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
  const parsedDate = toDateMaybe(dateText);
  if (parsedDate) return toDateKey(parsedDate);
  const startAtDate = toDateMaybe(session?.startAt);
  return startAtDate ? toDateKey(startAtDate) : '';
}

function getSessionStartMinutes(session: any): number | null {
  const resolvedStart = getSessionStartDate(session);
  if (resolvedStart) return getMinutesInTimeZone(resolvedStart, INDIA_TIME_ZONE);
  const startTimeText = toCleanText(session?.startTime);
  const fromText = parseTimeToMinutes(startTimeText);
  if (fromText !== null) return fromText;
  const startAtDate = toDateMaybe(session?.startAt);
  if (!startAtDate) return null;
  return startAtDate.getHours() * 60 + startAtDate.getMinutes();
}

function getSessionSlotKeys(session: any): string[] {
  return [
    toCleanText(session?.slotKey),
    toCleanText(session?.timeSlotKey),
    toCleanText(session?.startTime),
  ].filter(Boolean);
}

function getSessionTeacherId(session: any): string {
  return (
    toCleanText(session?.teacherId) ||
    toCleanText(session?.assignedTeacherId) ||
    toCleanText(session?.teacherUid) ||
    toCleanText(session?.teacher_id) ||
    ''
  );
}

function getSessionStudentNames(session: any): string[] {
  const direct = [
    toCleanText(session?.studentName),
    getNameFromObject(session?.student),
    toCleanText(session?.kidName),
    toCleanText(session?.childName),
    toCleanText(session?.studentNames?.[0]),
  ];

  const fromArrays = [
    ...namesFromCollection(session?.studentNames),
    ...namesFromCollection(session?.kidNames),
    ...namesFromCollection(session?.childNames),
    ...namesFromCollection(session?.students),
    ...namesFromCollection(session?.kids),
    ...namesFromCollection(session?.children),
  ];

  const fromIds = [
    ...namesFromCollection(session?.kidIds),
    ...namesFromCollection(session?.childIds),
  ].filter((value) => isLikelyHumanLabel(value));

  return dedupe([...direct, ...fromArrays, ...fromIds]);
}

function getStudentLabel(session: any): string {
  return getSessionStudentNames(session)[0] || 'Student';
}

function getProgramLabel(session: any): string {
  return (
    toCleanText(session?.courseLabel) ||
    toCleanText(session?.courseName) ||
    toCleanText(session?.courseTitle) ||
    toCleanText(session?.course?.label) ||
    toCleanText(session?.course?.name) ||
    toCleanText(session?.course?.title) ||
    toCleanText(session?.programLabel) ||
    toCleanText(session?.programName) ||
    toCleanText(session?.program?.label) ||
    toCleanText(session?.program?.name) ||
    toCleanText(session?.subject) ||
    ''
  );
}

function getMetaLabel(session: any): string {
  const status = toCleanText(session?.status).toLowerCase();
  if (!status || status === 'scheduled') return '';
  return status.replace(/_/g, ' ');
}

function getStatusToneClass(status: string): string {
  if (!status) return '';
  if (status.includes('cancel')) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status.includes('reschedule')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status.includes('late')) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (status.includes('complete')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status.includes('absent')) return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

function getTimeRangeLabel(session: any): string {
  return formatSessionTimeRange(session, {
    timeZone: INDIA_TIME_ZONE,
    fallbackText: '',
  });
}

function matchSessionToRow(session: any, row: SlotRow): boolean {
  const keys = getSessionSlotKeys(session);
  if (keys.includes(toCleanText(row.key))) return true;
  if (typeof row.startMinutes === 'number') {
    const sessionMinutes = getSessionStartMinutes(session);
    return sessionMinutes !== null && sessionMinutes === row.startMinutes;
  }
  return false;
}

function buildRowsForDay(daySessions: any[], slotRows: SlotRow[]): SlotRow[] {
  if (slotRows.length > 0) return slotRows;
  if (daySessions.length === 0) return [];

  const rowMap = new Map<string, SlotRow>();

  daySessions.forEach((session, index) => {
    const sessionStart = getSessionStartMinutes(session);
    const sessionStartLabel = getSessionStartLabel(session);
    const key =
      toCleanText(session?.slotKey) ||
      toCleanText(session?.timeSlotKey) ||
      sessionStartLabel ||
      `session-${index}`;

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        key,
        label: sessionStartLabel || `Session ${index + 1}`,
        ...(sessionStart !== null ? { startMinutes: sessionStart } : {}),
      });
    }
  });

  return Array.from(rowMap.values()).sort(
    (a, b) => (a.startMinutes ?? Number.MAX_SAFE_INTEGER) - (b.startMinutes ?? Number.MAX_SAFE_INTEGER),
  );
}

function buildRowSessionMap(rows: SlotRow[], daySessions: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>();
  rows.forEach((row) => {
    const matches = daySessions
      .filter((session) => matchSessionToRow(session, row))
      .sort((a, b) => (getSessionStartMinutes(a) ?? 0) - (getSessionStartMinutes(b) ?? 0));
    map.set(row.key, matches);
  });
  return map;
}

function formatMinutesToLabel(minutes: number): string {
  const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60));
  const date = new Date(2026, 0, 1, Math.floor(safeMinutes / 60), safeMinutes % 60);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getRowEndLabel(row: SlotRow): string {
  if (typeof row.endMinutes === 'number') return formatMinutesToLabel(row.endMinutes);
  return row.label;
}

function canMergeAvailableRows(current: SlotRow, next: SlotRow): boolean {
  if (typeof current.endMinutes !== 'number' || typeof next.startMinutes !== 'number') return false;
  return current.endMinutes === next.startMinutes;
}

function buildMergedSegments(rows: SlotRow[], rowSessionMap: Map<string, any[]>): MergedSegment[] {
  const segments: MergedSegment[] = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index];
    const rowSessions = rowSessionMap.get(row.key) || [];

    if (rowSessions.length > 0) {
      segments.push({
        key: `booked_${row.key}`,
        kind: 'booked',
        startLabel: row.label,
        endLabel: getRowEndLabel(row),
        slotCount: 1,
        sessions: rowSessions,
      });
      index += 1;
      continue;
    }

    let endIndex = index;
    while (endIndex + 1 < rows.length) {
      const nextRow = rows[endIndex + 1];
      const nextRowSessions = rowSessionMap.get(nextRow.key) || [];
      if (nextRowSessions.length > 0) break;
      if (!canMergeAvailableRows(rows[endIndex], nextRow)) break;
      endIndex += 1;
    }

    const endRow = rows[endIndex];
    segments.push({
      key: `available_${row.key}_${endRow.key}`,
      kind: 'available',
      startLabel: row.label,
      endLabel: getRowEndLabel(endRow),
      slotCount: endIndex - index + 1,
      sessions: [],
    });

    index = endIndex + 1;
  }

  return segments;
}

function getSessionCountFromRowMap(rowMap: Map<string, any[]>): number {
  return Array.from(rowMap.values()).reduce((count, sessions) => count + sessions.length, 0);
}

function getWeekDates(selectedDate: Date): Date[] {
  const base = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const dayIndex = base.getDay();
  const daysFromMonday = (dayIndex + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - daysFromMonday);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    return date;
  });
}

function getMonthDates(selectedDate: Date): Date[] {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
}

function getWeekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

function getCompactDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export default function TeacherCalendarView({
  viewMode,
  selectedDate,
  selectedTeacherId,
  sessions,
  slotRows = [],
  emptyLabel,
}: TeacherCalendarViewProps): React.ReactElement {
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const teacherSessions = useMemo(
    () =>
      (sessions || []).filter((session) => {
        const teacherId = getSessionTeacherId(session);
        return Boolean(teacherId && teacherId === selectedTeacherId);
      }),
    [selectedTeacherId, sessions],
  );

  const daySessions = useMemo(
    () => teacherSessions.filter((session) => getSessionDateKey(session) === selectedDateKey),
    [selectedDateKey, teacherSessions],
  );

  const rows = useMemo<SlotRow[]>(() => buildRowsForDay(daySessions, slotRows), [daySessions, slotRows]);

  const rowSessionMap = useMemo(() => buildRowSessionMap(rows, daySessions), [daySessions, rows]);

  const weekSections = useMemo(
    () =>
      getWeekDates(selectedDate).map((date) => {
        const dateKey = toDateKey(date);
        const sessionsForDay = teacherSessions.filter((session) => getSessionDateKey(session) === dateKey);
        const rowsForDay = buildRowsForDay(sessionsForDay, slotRows);
        const rowMapForDay = buildRowSessionMap(rowsForDay, sessionsForDay);
        return {
          date,
          dateKey,
          rows: rowsForDay,
          rowSessionMap: rowMapForDay,
          sessionCount: getSessionCountFromRowMap(rowMapForDay),
        };
      }),
    [selectedDate, slotRows, teacherSessions],
  );

  const monthSections = useMemo(
    () =>
      getMonthDates(selectedDate).map((date) => {
        const dateKey = toDateKey(date);
        const sessionsForDay = teacherSessions.filter((session) => getSessionDateKey(session) === dateKey);
        const previews = sessionsForDay.slice(0, 2).map((session) => ({
          student: getStudentLabel(session),
          program: getProgramLabel(session),
        }));
        return {
          date,
          dateKey,
          count: sessionsForDay.length,
          previews,
        };
      }),
    [selectedDate, teacherSessions],
  );

  const weekHasRows = useMemo(
    () => weekSections.some((section) => section.rows.length > 0),
    [weekSections],
  );
  const weekSessionCount = useMemo(
    () => weekSections.reduce((count, section) => count + section.sessionCount, 0),
    [weekSections],
  );
  const monthBookedCount = useMemo(
    () => monthSections.reduce((count, section) => count + section.count, 0),
    [monthSections],
  );

  const [collapsedByDay, setCollapsedByDay] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsedByDay((current) => {
      const next: Record<string, boolean> = {};
      weekSections.forEach((section) => {
        const existing = current[section.dateKey];
        if (typeof existing === 'boolean') {
          next[section.dateKey] = existing;
          return;
        }
        const weekday = section.date.getDay();
        const isWeekend = weekday === 0 || weekday === 6;
        next[section.dateKey] = isWeekend && section.sessionCount === 0;
      });
      return next;
    });
  }, [weekSections]);

  const toggleDayCollapse = (dateKey: string) => {
    setCollapsedByDay((current) => ({
      ...current,
      [dateKey]: !current[dateKey],
    }));
  };

  const renderAgendaRows = (renderRowsData: SlotRow[], renderRowSessionMap: Map<string, any[]>) => {
    const bookedSegments = buildMergedSegments(renderRowsData, renderRowSessionMap).filter(
      (segment) => segment.kind === 'booked',
    );

    if (bookedSegments.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No blocked timings for this period.
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {bookedSegments.map((segment) => (
          <div
            key={segment.key}
            className="rounded-2xl border border-sky-200/80 bg-white px-4 py-3 shadow-sm"
          >
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3">
              <div className="pt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {segment.startLabel}
                {segment.endLabel !== segment.startLabel ? ` - ${segment.endLabel}` : ''}
              </div>
              <div className="min-w-0">
                <div className="space-y-2.5">
                  {segment.sessions.slice(0, 2).map((session, sessionIndex) => {
                    const studentLabel = getStudentLabel(session);
                    const programLabel = getProgramLabel(session);
                    const timeLabel = getTimeRangeLabel(session);
                    const statusLabel = getMetaLabel(session);
                    return (
                      <div
                        key={`${segment.key}_session_${session.id || sessionIndex}`}
                        className={`rounded-xl border px-3 py-2.5 ${
                          sessionIndex === 0 ? 'border-sky-200 bg-sky-50/40' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="truncate text-sm font-semibold text-slate-900">{studentLabel}</div>
                        {programLabel ? (
                          <div className="mt-0.5 truncate text-xs text-slate-500">{programLabel}</div>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {timeLabel ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              {timeLabel}
                            </span>
                          ) : null}
                          {statusLabel ? (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusToneClass(statusLabel)}`}
                            >
                              {statusLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {segment.sessions.length > 2 ? (
                    <div className="text-xs text-slate-500">
                      +{segment.sessions.length - 2} more in this slot
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!selectedTeacherId) {
    return (
      <Card className="border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Select a teacher to view the schedule.
        </div>
      </Card>
    );
  }

  if (viewMode === 'day' && rows.length === 0) {
    const noSlots = slotRows.length === 0 && daySessions.length === 0;
    return (
      <Card className="border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          {noSlots ? 'No time slots available for this day.' : emptyLabel || 'No sessions for this day.'}
        </div>
      </Card>
    );
  }

  if (viewMode === 'day') {
    const dayBookedSegments = buildMergedSegments(rows, rowSessionMap).filter(
      (segment) => segment.kind === 'booked',
    );

    return (
      <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
          <div className="text-sm font-semibold text-slate-900">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(selectedDate)}
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
          </div>
        </div>
        {dayBookedSegments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No blocked timings for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-3 pb-1">
              {dayBookedSegments.map((segment) => (
                <div
                  key={`day_${segment.key}`}
                  className="w-[230px] shrink-0 rounded-2xl border border-sky-200 bg-white px-3.5 py-3 shadow-sm"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {segment.startLabel}
                    {segment.endLabel !== segment.startLabel ? ` - ${segment.endLabel}` : ''}
                  </div>
                  <div className="mt-2 space-y-2">
                    {segment.sessions.slice(0, 2).map((session, sessionIndex) => {
                      const studentLabel = getStudentLabel(session);
                      const programLabel = getProgramLabel(session);
                      const timeLabel = getTimeRangeLabel(session);
                      const statusLabel = getMetaLabel(session);
                      return (
                        <div
                          key={`day_${segment.key}_session_${session.id || sessionIndex}`}
                          className={`rounded-xl border px-3 py-2 ${
                            sessionIndex === 0 ? 'border-sky-200 bg-sky-50/40' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="truncate text-sm font-semibold text-slate-900">{studentLabel}</div>
                          {programLabel ? (
                            <div className="mt-0.5 truncate text-[11px] text-slate-500">{programLabel}</div>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {timeLabel ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                {timeLabel}
                              </span>
                            ) : null}
                            {statusLabel ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getStatusToneClass(statusLabel)}`}
                              >
                                {statusLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {segment.sessions.length > 2 ? (
                      <div className="text-[11px] text-slate-500">+{segment.sessions.length - 2} more</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (viewMode === 'week') {
    if (!weekHasRows) {
      return (
        <Card className="border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No time slots available for this week.
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5">
        {weekSessionCount === 0 ? (
          <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            No blocked timings this week.
          </div>
        ) : null}
        <div className="space-y-3.5">
          {weekSections.map((section) => {
            const isCollapsed = Boolean(collapsedByDay[section.dateKey]);
            const sectionBookedSegments = buildMergedSegments(section.rows, section.rowSessionMap).filter(
              (segment) => segment.kind === 'booked',
            );
            const sessionsLabel =
              section.sessionCount === 0
                ? 'No sessions'
                : `${section.sessionCount} ${section.sessionCount === 1 ? 'session' : 'sessions'}`;

            return (
              <section key={section.dateKey} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{getWeekdayLabel(section.date)}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>{getCompactDateLabel(section.date)}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{sessionsLabel}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDayCollapse(section.dateKey)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                  >
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>

                {!isCollapsed ? (
                  <div className="mt-3">
                    {section.rows.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-4 text-sm text-slate-500">
                        No blocked timings.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex min-w-max gap-2.5 pb-1">
                          {sectionBookedSegments.map((segment) => {
                            const firstSession = segment.sessions[0];
                            const slotWidth = 168;
                            const studentLabel = firstSession ? getStudentLabel(firstSession) : '';
                            const programLabel = firstSession ? getProgramLabel(firstSession) : '';
                            return (
                              <div
                                key={`${section.dateKey}_${segment.key}`}
                                style={{ width: `${slotWidth}px` }}
                                className="shrink-0 rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2.5"
                              >
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  {segment.startLabel}
                                  {segment.endLabel !== segment.startLabel ? ` - ${segment.endLabel}` : ''}
                                </div>
                                <div className="mt-1.5 min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{studentLabel}</div>
                                  {programLabel ? (
                                    <div className="mt-0.5 truncate text-[11px] text-slate-500">{programLabel}</div>
                                  ) : null}
                                  {segment.sessions.length > 1 ? (
                                    <div className="mt-1 text-[11px] text-slate-500">
                                      +{segment.sessions.length - 1} more
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                          {sectionBookedSegments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-4 text-sm text-slate-500">
                              No blocked timings.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </Card>
    );
  }

  if (viewMode === 'month') {
    if (monthBookedCount === 0) {
      return (
        <Card className="border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No sessions scheduled for this month.
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
          <div className="text-sm font-semibold text-slate-900">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate)}
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {monthBookedCount} {monthBookedCount === 1 ? 'session' : 'sessions'}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthSections.map((section) => (
            <div
              key={section.dateKey}
              className={`rounded-xl border p-3 ${
                section.count > 0 ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  {new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(section.date)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(section.date)}
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                {section.count} {section.count === 1 ? 'session' : 'sessions'}
              </div>

              {section.count > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {section.previews.map((preview, previewIndex) => (
                    <div
                      key={`${section.dateKey}_${preview.student}_${previewIndex}`}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5"
                    >
                      <div className="truncate text-sm font-medium text-slate-800">{preview.student}</div>
                      {preview.program ? (
                        <div className="mt-0.5 truncate text-[11px] text-slate-500">{preview.program}</div>
                      ) : null}
                    </div>
                  ))}
                  {section.count > section.previews.length ? (
                    <div className="text-[11px] text-slate-500">
                      +{section.count - section.previews.length} more
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">No sessions</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm">
      {renderAgendaRows(rows, rowSessionMap)}
    </Card>
  );
}
