import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  resolveEnrollmentRollingScheduleContract,
} from './enrollmentRollingScheduleContract';
import {
  enumerateRollingScheduleOccurrences,
  ROLLING_SCHEDULE_UTC_OFFSET_MINUTES,
} from './rollingScheduleRecurrence';

export const ROLLING_SCHEDULE_PROJECTION_SOURCE = 'rolling_schedule_projection' as const;

export type RollingScheduleCalendarProjection = {
  id: string;
  deterministicSessionId: string;
  enrollmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  durationMinutes: number;
  startAt: Date;
  endAt: Date;
  status: 'scheduled';
  source: typeof ROLLING_SCHEDULE_PROJECTION_SOURCE;
  isScheduleProjection: true;
  projectionOnly: true;
  occurrenceKey: string;
  kidId?: string;
  kidIds?: string[];
  studentId?: string;
  studentName?: string;
  kidName?: string;
  childName?: string;
  teacherId?: string;
  teacherName?: string;
  courseId?: string;
  courseName?: string;
  courseLabel?: string;
};

type RecordLike = Record<string, unknown>;

export type BuildRollingScheduleCalendarProjectionsInput = {
  enrollments: readonly RecordLike[];
  realSessions: readonly RecordLike[];
  fromYmd: string;
  toYmd: string;
  todayYmd?: string;
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (value: unknown): string => (
  typeof value === 'string' ? value.trim() : ''
);

const isValidYmd = (value: string): boolean => {
  if (!YMD_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
};

const addDaysYmd = (ymd: string, days: number): string => {
  if (!isValidYmd(ymd)) throw new Error('todayYmd must be YYYY-MM-DD');
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
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

const sessionOccurrenceIdentity = (session: RecordLike): string | null => {
  const enrollmentId = enrollmentIdFromSession(session);
  if (!enrollmentId) return null;

  let ymd = text(session.date);
  let time = normalizeTime(session.startTime);
  if (!isValidYmd(ymd) || !time) {
    const startMs = dateLikeToMs(session.startAt);
    if (startMs === null) return null;
    const derived = ymdAndTimeFromUtcMs(startMs);
    ymd = derived.ymd;
    time = derived.time;
  }
  return `${enrollmentId}|${ymd}|${time}`;
};

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }
  return '';
};

const enrollmentKidIds = (enrollment: RecordLike): string[] => {
  const ids = [
    ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds : []),
    enrollment.kidId,
    enrollment.studentId,
    enrollment.childId,
  ].map((value) => text(value)).filter(Boolean);
  return Array.from(new Set(ids));
};

/**
 * Builds display-only recurrence rows strictly beyond the physical classSession horizon.
 *
 * The function never reads or writes Firestore. Canonical rolling enrollments are the only
 * projection authority. Real classSession documents always win for an occurrence, including
 * cancelled or otherwise non-operational real documents, so a projection can never conceal
 * the persisted state that will become actionable inside the 14-day window.
 */
export const buildRollingScheduleCalendarProjections = (
  input: BuildRollingScheduleCalendarProjectionsInput,
): RollingScheduleCalendarProjection[] => {
  const todayYmd = input.todayYmd || indiaYmd();
  if (!isValidYmd(todayYmd)) throw new Error('todayYmd must be YYYY-MM-DD');
  if (!isValidYmd(input.fromYmd) || !isValidYmd(input.toYmd)) {
    throw new Error('Projection range must use YYYY-MM-DD');
  }
  if (input.toYmd < input.fromYmd) return [];

  const firstProjectionYmd = addDaysYmd(todayYmd, ROLLING_SCHEDULE_HORIZON_DAYS + 1);
  const fromYmd = input.fromYmd > firstProjectionYmd ? input.fromYmd : firstProjectionYmd;
  if (fromYmd > input.toYmd) return [];

  const realIds = new Set(input.realSessions.map((session) => text(session.id)).filter(Boolean));
  const realOccurrenceIdentities = new Set(
    input.realSessions
      .map(sessionOccurrenceIdentity)
      .filter((value): value is string => Boolean(value)),
  );

  const projections: RollingScheduleCalendarProjection[] = [];

  input.enrollments.forEach((enrollment) => {
    const enrollmentId = text(enrollment.id);
    if (!enrollmentId) return;

    const contract = resolveEnrollmentRollingScheduleContract(enrollment);
    if (contract.source !== 'canonical_rolling' || contract.lifecycleState !== 'active' || !contract.schedule) {
      return;
    }

    const occurrences = enumerateRollingScheduleOccurrences({
      enrollmentId,
      schedule: contract.schedule,
      fromYmd,
      toYmd: input.toYmd,
      classesStartDateYmd: contract.classesStartDateYmd,
    });

    const kidIds = enrollmentKidIds(enrollment);
    const studentName = firstText(
      enrollment.studentName,
      enrollment.kidName,
      enrollment.childName,
      (enrollment.studentSnapshot as RecordLike | undefined)?.name,
      (enrollment.kidSnapshot as RecordLike | undefined)?.name,
    );
    const teacherName = firstText(enrollment.teacherName, enrollment.teacherDisplayName);
    const courseName = firstText(
      enrollment.courseName,
      enrollment.courseLabel,
      (enrollment.course as RecordLike | undefined)?.title,
      (enrollment.course as RecordLike | undefined)?.name,
      enrollment.courseId,
    );

    occurrences.forEach((occurrence) => {
      if (!occurrence.sessionId) return;
      const occurrenceIdentity = `${enrollmentId}|${occurrence.date}|${occurrence.startTime}`;
      if (realIds.has(occurrence.sessionId) || realOccurrenceIdentities.has(occurrenceIdentity)) return;

      projections.push({
        id: `projection:${occurrence.sessionId}`,
        deterministicSessionId: occurrence.sessionId,
        enrollmentId,
        date: occurrence.date,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        durationMins: occurrence.durationMinutes,
        durationMinutes: occurrence.durationMinutes,
        startAt: new Date(occurrence.startAtUtcMs),
        endAt: new Date(occurrence.endAtUtcMs),
        status: 'scheduled',
        source: ROLLING_SCHEDULE_PROJECTION_SOURCE,
        isScheduleProjection: true,
        projectionOnly: true,
        occurrenceKey: occurrence.occurrenceKey,
        ...(kidIds[0] ? { kidId: kidIds[0], studentId: kidIds[0] } : {}),
        ...(kidIds.length ? { kidIds } : {}),
        ...(studentName ? { studentName, kidName: studentName, childName: studentName } : {}),
        ...(firstText(enrollment.teacherId, enrollment.teacherUid, enrollment.teacherUserId)
          ? { teacherId: firstText(enrollment.teacherId, enrollment.teacherUid, enrollment.teacherUserId) }
          : {}),
        ...(teacherName ? { teacherName } : {}),
        ...(text(enrollment.courseId) ? { courseId: text(enrollment.courseId) } : {}),
        ...(courseName ? { courseName, courseLabel: courseName } : {}),
      });
    });
  });

  return projections.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
};

export const isRollingScheduleProjection = (value: unknown): boolean => (
  Boolean(value)
  && typeof value === 'object'
  && (value as RecordLike).isScheduleProjection === true
  && (value as RecordLike).source === ROLLING_SCHEDULE_PROJECTION_SOURCE
);
