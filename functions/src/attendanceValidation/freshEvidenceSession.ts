import type {
  AttendanceValidationEvidenceDocument,
  CanonicalAttendanceStatus,
  ExpectedClassSessionSnapshot,
} from './teamsEvidenceCollector';
import { normalizeTinyStepsAttendance } from './reconciliationEngine';

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function firstText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const normalized = text(item);
    if (normalized) return normalized;
  }
  return null;
}

function dateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof candidate.toDate === 'function') {
    const date = candidate.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  const seconds = typeof candidate.seconds === 'number'
    ? candidate.seconds
    : candidate._seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function attendanceEntryForKid(
  session: Record<string, unknown>,
  kidId: string | null,
): unknown {
  if (!kidId) return null;
  const attendance = session.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) {
    return null;
  }
  return (attendance as Record<string, unknown>)[kidId] ?? null;
}

export function buildFreshEvidenceSessionSnapshot(
  classSessionId: string,
  session: Record<string, unknown>,
  previousEvidence: AttendanceValidationEvidenceDocument,
): ExpectedClassSessionSnapshot {
  const prior = previousEvidence.session;
  const kidId = text(session.kidId)
    || firstText(session.kidIds)
    || text(session.studentId)
    || text(session.childId)
    || prior.kidId;

  const startAt = dateFromUnknown(session.startAt);
  const endAt = dateFromUnknown(session.endAt);
  const scheduledStartDateTime = startAt?.toISOString()
    ?? prior.scheduledStartDateTime;
  const scheduledEndDateTime = endAt?.toISOString()
    ?? prior.scheduledEndDateTime;

  const joinUrl = text(session.joinUrl)
    || text(session.meetingLink)
    || text(session.classLink);

  const existingAttendanceStatus = normalizeTinyStepsAttendance(
    attendanceEntryForKid(session, kidId),
  ) as CanonicalAttendanceStatus | null;

  return {
    classSessionId,
    enrollmentId: text(session.enrollmentId) || prior.enrollmentId,
    teacherId: text(session.teacherId) || prior.teacherId,
    kidId,
    courseId: text(session.courseId) || prior.courseId,
    scheduledStartDateTime,
    scheduledEndDateTime,
    joinUrl,
    existingAttendanceStatus,
  };
}

function firstString(value: unknown): string | null {
  return Array.isArray(value) ? firstText(value) : null;
}

function canonicalTeacherId(session: Record<string, unknown>): string | null {
  return text(session.teacherId)
    || text(session.assignedTeacherId)
    || text(session.primaryTeacherId)
    || text(session.teacherUid)
    || text(session.teacher_id)
    || firstString(session.teacherIds);
}

function timeParts(value: unknown): { hour: number; minute: number } | null {
  const normalized = text(value);
  const match = normalized ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(normalized) : null;
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function istDateTimeFromYmdAndTime(
  ymd: unknown,
  hhmm: unknown,
): Date | null {
  const date = text(ymd);
  const parts = timeParts(hhmm);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !parts) return null;

  const midnightUtc = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(midnightUtc)) return null;
  const dateCheck = new Date(midnightUtc).toISOString().slice(0, 10);
  if (dateCheck !== date) return null;

  const utcMs = midnightUtc
    + (parts.hour * 60 + parts.minute) * 60_000
    - (5.5 * 60 * 60 * 1000);
  const parsed = new Date(utcMs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function positiveMinutes(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function baselineWindow(
  session: Record<string, unknown>,
): { start: Date; end: Date } {
  let start = dateFromUnknown(session.startAt);
  let end = dateFromUnknown(session.endAt);

  if (!start) {
    start = istDateTimeFromYmdAndTime(
      session.date ?? session.serviceDateYmd,
      session.startTime,
    );
  }
  if (!end) {
    end = istDateTimeFromYmdAndTime(
      session.date ?? session.serviceDateYmd,
      session.endTime,
    );
  }

  const durationMinutes =
    positiveMinutes(session.durationMinutes)
    ?? positiveMinutes(session.durationMins);

  if (start && !end && durationMinutes) {
    end = new Date(start.getTime() + durationMinutes * 60_000);
  }
  if (!start && end && durationMinutes) {
    start = new Date(end.getTime() - durationMinutes * 60_000);
  }

  if (start && end && end.getTime() <= start.getTime()) {
    const startParts = timeParts(session.startTime);
    const endParts = timeParts(session.endTime);
    if (startParts && endParts) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  if (!start || !end || end.getTime() <= start.getTime()) {
    throw new RangeError(
      'Session does not contain a valid scheduled start/end window.',
    );
  }

  return { start, end };
}

export function buildBaselineEvidenceSessionSnapshot(
  classSessionId: string,
  session: Record<string, unknown>,
): ExpectedClassSessionSnapshot {
  const kidId = text(session.kidId)
    || firstText(session.kidIds)
    || text(session.studentId)
    || text(session.childId);
  const { start, end } = baselineWindow(session);

  return {
    classSessionId,
    enrollmentId: text(session.enrollmentId),
    teacherId: canonicalTeacherId(session),
    kidId,
    courseId: text(session.courseId),
    scheduledStartDateTime: start.toISOString(),
    scheduledEndDateTime: end.toISOString(),
    joinUrl: text(session.joinUrl)
      || text(session.meetingLink)
      || text(session.classLink),
    existingAttendanceStatus: normalizeTinyStepsAttendance(
      attendanceEntryForKid(session, kidId),
    ) as CanonicalAttendanceStatus | null,
  };
}

export function resolveBaselineOrganizerCandidate(
  session: Record<string, unknown>,
  teacherUser?: Record<string, unknown> | null,
): string | null {
  return text(session.teamsOrganizerUserId)
    || text(session.organizerUserId)
    || text(session.teacherEmail)
    || text(teacherUser?.email);
}

