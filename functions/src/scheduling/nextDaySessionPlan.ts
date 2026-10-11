/**
 * Tiny Steps daily scheduling contract.
 *
 * Pure planner: active enrollments + active students + recurring slots ->
 * occurrences for tomorrow only. No Firestore reads, history or repairs here.
 */
import {resolveCanonicalTeacherIdForWrite} from '../helpers/teacherIdentity';

export type NextDayOccurrence = {
  enrollmentId: string;
  kidId: string;
  teacherId: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startAtUtcMs: number;
  endAtUtcMs: number;
  sessionId: string;
};

export type NextDayIssue = {
  enrollmentId: string;
  reason: string;
};

type EnrollmentRow = {id: string; data: Record<string, unknown>};
type Slot = {weekday: number; time: string; durationMinutes: number};

const IST_OFFSET_MS = 330 * 60 * 1000;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseYmd(value: string): number {
  const match = YMD.exec(value);
  if (!match) throw new Error('Date must be YYYY-MM-DD');
  const [year, month, day] = match.slice(1).map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('Invalid calendar date');
  }
  return ms;
}

function formatYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function nextDayYmd(todayYmd: string): string {
  return formatYmd(parseYmd(todayYmd) + 24 * 60 * 60 * 1000);
}

export function indiaTodayYmd(now = new Date()): string {
  return formatYmd(now.getTime() + IST_OFFSET_MS);
}

function dateLikeToIndiaYmd(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' && YMD.test(value)) {
    try {
      parseYmd(value);
      return value;
    } catch {
      return null;
    }
  }
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'string') date = new Date(value);
  else if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const method = (value as {toDate?: () => Date}).toDate;
    if (typeof method === 'function') date = method.call(value);
  }
  if (!date || !Number.isFinite(date.getTime())) return null;
  return indiaTodayYmd(date);
}

function slotsFromSchedule(value: unknown): Slot[] {
  const schedule = (value || {}) as Record<string, unknown>;
  const timezone = text(schedule.timezone) || 'Asia/Kolkata';
  if (timezone !== 'Asia/Kolkata') throw new Error('Unsupported schedule timezone');
  const raw: Array<{weekday: unknown; time: unknown; durationMinutes: unknown}> =
    Array.isArray(schedule.weeklySlots) && schedule.weeklySlots.length > 0
      ? schedule.weeklySlots.map((slot) => ({
        weekday: (slot as Record<string, unknown>)?.weekday,
        time: (slot as Record<string, unknown>)?.time,
        durationMinutes: (slot as Record<string, unknown>)?.durationMinutes ??
          (slot as Record<string, unknown>)?.durationMins ?? 35,
      }))
      : Array.isArray(schedule.weekdays)
        ? schedule.weekdays.map((weekday) => ({
          weekday,
          time: schedule.timeHHmm,
          durationMinutes: schedule.durationMins ?? 35,
        }))
        : [];
  const seen = new Set<string>();
  return raw.map((slot) => {
    const weekday = Number(slot.weekday);
    const time = text(slot.time);
    const durationMinutes = Number(slot.durationMinutes);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 ||
        !HHMM.test(time) || !Number.isInteger(durationMinutes) ||
        durationMinutes < 10 || durationMinutes > 180) {
      throw new Error('Invalid recurring slot');
    }
    const key = `${weekday}|${time}`;
    if (seen.has(key)) throw new Error('Duplicate recurring slot');
    seen.add(key);
    return {weekday, time, durationMinutes};
  });
}

export function buildNextDaySessionPlan(args: {
  todayYmd: string;
  /** Only used for the October 12 first-run bootstrap. Default is tomorrow. */
  targetYmd?: string;
  enrollments: EnrollmentRow[];
  activeKidIds: ReadonlySet<string>;
}): {
  targetYmd: string;
  occurrences: NextDayOccurrence[];
  issues: NextDayIssue[];
} {
  const tomorrow = nextDayYmd(args.todayYmd);
  const targetYmd = args.targetYmd || tomorrow;
  // The October 12 launch is the single exception to the tomorrow-only rule:
  // its first run must materialize both October 12 and October 13.
  if (targetYmd !== tomorrow && !(args.todayYmd === '2026-10-12' && targetYmd === args.todayYmd)) {
    throw new Error('Only tomorrow (or the October 12 bootstrap date) may be materialized');
  }
  const targetDayMs = parseYmd(targetYmd);
  const targetWeekday = new Date(targetDayMs).getUTCDay();
  const occurrences: NextDayOccurrence[] = [];
  const issues: NextDayIssue[] = [];
  const logicalSessions = new Set<string>();

  for (const {id: enrollmentId, data} of args.enrollments) {
    if (text(data.status).toLowerCase() !== 'active' ||
        data.archived === true || data.isArchived === true || data.archivedAt) continue;

    const kidId = text(data.kidId) || text(data.studentId) || text(data.childId);
    if (!kidId || !args.activeKidIds.has(kidId)) {
      issues.push({enrollmentId, reason: 'student_not_active'});
      continue;
    }

    const classStart = dateLikeToIndiaYmd(data.classesStartDateYmd) ||
      dateLikeToIndiaYmd(data.classesStartDate) ||
      dateLikeToIndiaYmd(data.startDateYmd) ||
      dateLikeToIndiaYmd(data.startDate);
    if (classStart && classStart > targetYmd) continue;

    let slots: Slot[];
    try {
      slots = slotsFromSchedule(data.schedule);
    } catch {
      issues.push({enrollmentId, reason: 'invalid_recurrence'});
      continue;
    }
    if (!slots.length) {
      issues.push({enrollmentId, reason: 'missing_recurrence'});
      continue;
    }
    const targetSlots = slots.filter((slot) => slot.weekday === targetWeekday);
    if (!targetSlots.length) continue;

    const teacher = resolveCanonicalTeacherIdForWrite(data);
    const teacherId = teacher.teacherId || '';
    const courseId = text(data.courseId);
    if (!teacherId || teacher.source === 'ambiguous_legacy' || !courseId) {
      issues.push({enrollmentId, reason: 'missing_teacher_or_course'});
      continue;
    }

    for (const slot of targetSlots) {
      const logicalKey = `${kidId}|${targetYmd}|${slot.time}`;
      if (logicalSessions.has(logicalKey)) {
        issues.push({enrollmentId, reason: 'duplicate_student_time'});
        continue;
      }
      logicalSessions.add(logicalKey);

      const [hh, mm] = slot.time.split(':').map(Number);
      const startAtUtcMs = targetDayMs + (hh * 60 + mm) * 60000 - IST_OFFSET_MS;
      const endAtUtcMs = startAtUtcMs + slot.durationMinutes * 60000;
      const endMinutes = (hh * 60 + mm + slot.durationMinutes) % 1440;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:` +
        `${String(endMinutes % 60).padStart(2, '0')}`;
      occurrences.push({
        enrollmentId,
        kidId,
        teacherId,
        courseId,
        date: targetYmd,
        startTime: slot.time,
        endTime,
        durationMinutes: slot.durationMinutes,
        startAtUtcMs,
        endAtUtcMs,
        sessionId: `${enrollmentId}_${targetYmd.replace(/-/g, '')}_${slot.time.replace(':', '')}`,
      });
    }
  }
  return {
    targetYmd,
    occurrences: occurrences.sort((a, b) =>
      a.startTime.localeCompare(b.startTime) || a.sessionId.localeCompare(b.sessionId)),
    issues,
  };
}
