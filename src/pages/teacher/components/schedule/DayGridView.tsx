import React, { useMemo } from 'react';
import { Card } from '@components/ui/card';
import { INDIA_TIME_ZONE, getSessionStartDate } from '../../../../lib/sessionTime';

type TeacherRow = {
  id: string;
  name: string;
};

type TimeSlot = {
  key: string;
  label: string;
  startMinutes?: number;
  endMinutes?: number;
};

interface DayGridViewProps {
  teachers: TeacherRow[];
  sessions: any[];
  selectedDate: Date;
  timeSlots: TimeSlot[];
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

function toCleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
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
      const direct = toCleanText(item);
      if (direct) return direct;
      return getNameFromObject(item);
    })
    .map((name) => name.trim())
    .filter(Boolean);
}

function getStudentLabel(session: any): string {
  const fromList = [
    ...namesFromCollection(session?.studentNames),
    ...namesFromCollection(session?.kidNames),
    ...namesFromCollection(session?.childNames),
  ].join(', ');

  return (
    toCleanText(session?.studentName) ||
    getNameFromObject(session?.student) ||
    toCleanText(session?.kidName) ||
    toCleanText(session?.childName) ||
    fromList ||
    'Student'
  );
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

function getSessionTeacherId(session: any): string {
  return (
    toCleanText(session?.teacherId) ||
    toCleanText(session?.assignedTeacherId) ||
    toCleanText(session?.teacherUid) ||
    toCleanText(session?.teacher_id) ||
    ''
  );
}

function getSlotMinutes(slot: TimeSlot): number | null {
  if (typeof slot.startMinutes === 'number') return slot.startMinutes;
  const slotKey = toCleanText(slot.key);
  const fromKey = /^slot_(\d+)$/.exec(slotKey);
  if (fromKey) return Number(fromKey[1]);
  return parseTimeToMinutes(toCleanText(slot.label));
}

function sessionMatchesSlot(session: any, slot: TimeSlot): boolean {
  const slotKey = toCleanText(slot.key);
  const slotMinutes = getSlotMinutes(slot);
  const sessionKeys = [
    toCleanText(session?.slotKey),
    toCleanText(session?.timeSlotKey),
    toCleanText(session?.startTime),
  ].filter(Boolean);

  if (slotKey && sessionKeys.includes(slotKey)) return true;

  if (typeof slotMinutes === 'number') {
    const sessionMinutes = getSessionStartMinutes(session);
    return sessionMinutes !== null && sessionMinutes === slotMinutes;
  }

  return false;
}

export default function DayGridView({
  teachers,
  sessions,
  selectedDate,
  timeSlots,
}: DayGridViewProps): React.ReactElement {
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const daySessions = useMemo(
    () => (sessions || []).filter((session) => getSessionDateKey(session) === selectedDateKey),
    [selectedDateKey, sessions],
  );

  const cellByKey = useMemo(() => {
    const map = new Map<string, any[]>();
    teachers.forEach((teacher) => {
      const teacherSessions = daySessions.filter(
        (session) => getSessionTeacherId(session) === String(teacher.id || '').trim(),
      );
      timeSlots.forEach((slot) => {
        const matches = teacherSessions.filter((session) => sessionMatchesSlot(session, slot));
        if (matches.length > 0) map.set(`${teacher.id}__${slot.key}`, matches);
      });
    });
    return map;
  }, [daySessions, teachers, timeSlots]);

  if (teachers.length === 0) {
    return (
      <Card className="border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No teachers available.
        </div>
      </Card>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card className="border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No time slots available for this day.
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
        <div className="text-sm font-semibold text-slate-900">
          {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(selectedDate)}
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
        </div>
      </div>
      {daySessions.length === 0 ? (
        <div className="mb-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          No sessions scheduled for this day.
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-max border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 min-w-[176px] border-b border-r border-slate-200 bg-white px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Teacher
              </th>
              {timeSlots.map((slot) => (
                <th
                  key={slot.key}
                  className="min-w-[144px] border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                >
                  {slot.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900">
                  {teacher.name}
                </td>
                {timeSlots.map((slot) => {
                  const sessionsForCell = cellByKey.get(`${teacher.id}__${slot.key}`) || [];
                  const session = sessionsForCell[0];
                  const isBooked = sessionsForCell.length > 0;
                  const studentLabel = isBooked ? getStudentLabel(session) : '';
                  const programLabel = isBooked ? getProgramLabel(session) : '';
                  return (
                    <td
                      key={`${teacher.id}_${slot.key}`}
                      className={`h-[72px] min-w-[144px] border-t border-slate-200 px-3 py-2 text-center text-xs ${
                        isBooked
                          ? 'bg-sky-50/65 text-sky-900'
                          : 'bg-slate-50/35 text-slate-400'
                      }`}
                    >
                      {isBooked ? (
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{studentLabel}</div>
                          {programLabel ? (
                            <div className="mt-0.5 truncate text-[11px] text-slate-600">{programLabel}</div>
                          ) : null}
                          {sessionsForCell.length > 1 ? (
                            <div className="mt-0.5 text-[11px] text-slate-500">+{sessionsForCell.length - 1} more</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          Available
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
