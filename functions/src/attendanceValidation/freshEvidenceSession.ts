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
