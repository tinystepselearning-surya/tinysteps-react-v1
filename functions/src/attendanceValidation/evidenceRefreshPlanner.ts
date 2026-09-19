import { createHash } from 'node:crypto';
import type {
  CanonicalAttendanceStatus,
  ExpectedClassSessionSnapshot,
} from './teamsEvidenceCollector';

export const AVS_EVIDENCE_REFRESH_MAX_RANGE_DAYS = 31;
export const AVS_EVIDENCE_REFRESH_DISCOVERY_LIMIT = 500;
export const AVS_EVIDENCE_REFRESH_GRAPH_BATCH_LIMIT = 10;

export type AvsEvidenceRefreshMode = 'missing_only' | 'force_fresh';

export type AvsEvidenceSessionSkipReason =
  | 'service_date_unresolved'
  | 'session_start_unresolved'
  | 'session_end_unresolved'
  | 'session_not_finished'
  | 'cancelled_or_rescheduled';

export type AvsEvidenceSessionSnapshotResult =
  | {
    kind: 'eligible';
    serviceDateYmd: string;
    snapshot: ExpectedClassSessionSnapshot;
  }
  | {
    kind: 'skip';
    reason: AvsEvidenceSessionSkipReason;
    serviceDateYmd: string | null;
  };

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function validYmd(value: unknown): string | null {
  const normalized = text(value);
  if (!normalized || !YMD_RE.test(normalized)) return null;
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function dateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof candidate.toDate === 'function') {
    const parsed = candidate.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime())
      ? parsed
      : null;
  }

  const seconds = typeof candidate.seconds === 'number'
    ? candidate.seconds
    : candidate._seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;

  const parsed = new Date(seconds * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function istYmd(value: unknown): string | null {
  const parsed = dateFromUnknown(value);
  if (!parsed) return null;
  return new Date(parsed.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function parseIstDateTime(dateYmd: string | null, rawTime: unknown): Date | null {
  if (!dateYmd) return null;
  const time = text(rawTime);
  const match = time ? TIME_RE.exec(time) : null;
  if (!match) return null;
  const normalizedTime =
    `${String(Number(match[1])).padStart(2, '0')}:${match[2]}:${match[3] || '00'}`;
  const parsed = new Date(`${dateYmd}T${normalizedTime}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function durationMinutes(session: Record<string, unknown>): number | null {
  const value = Number(session.durationMins ?? session.durationMinutes);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.max(1, Math.min(240, value));
}

function sessionKidId(session: Record<string, unknown>): string | null {
  const direct = text(session.kidId)
    || text(session.studentId)
    || text(session.childId);
  if (direct) return direct;
  if (!Array.isArray(session.kidIds)) return null;
  for (const value of session.kidIds) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return null;
}

function canonicalAttendance(value: unknown): CanonicalAttendanceStatus | null {
  const raw = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>).status
      : null;
  const normalized = String(raw ?? '').trim().toLowerCase().replace(/-/g, '_');

  if (normalized === 'present' || normalized === 'late') return 'present';
  if (
    normalized === 'absent'
    || normalized === 'no_show'
    || normalized === 'noshow'
  ) return 'absent';
  if (
    normalized === 'rescheduled'
    || normalized === 'reschedule'
    || normalized === 'reschedule_requested'
  ) return 'rescheduled';
  return null;
}

function existingAttendance(
  session: Record<string, unknown>,
  kidId: string | null,
): CanonicalAttendanceStatus | null {
  if (
    !kidId
    || !session.attendance
    || typeof session.attendance !== 'object'
    || Array.isArray(session.attendance)
  ) return null;

  return canonicalAttendance(
    (session.attendance as Record<string, unknown>)[kidId],
  );
}

function sessionServiceDateYmd(session: Record<string, unknown>): string | null {
  return validYmd(session.date)
    || validYmd(session.serviceDateYmd)
    || istYmd(session.startAt);
}

function sessionStart(session: Record<string, unknown>, serviceDateYmd: string | null): Date | null {
  return dateFromUnknown(session.startAt)
    || parseIstDateTime(serviceDateYmd, session.startTime);
}

function sessionEnd(
  session: Record<string, unknown>,
  serviceDateYmd: string | null,
  start: Date | null,
): Date | null {
  const explicitEnd = dateFromUnknown(session.endAt)
    || parseIstDateTime(serviceDateYmd, session.endTime);
  if (explicitEnd && (!start || explicitEnd.getTime() > start.getTime())) {
    return explicitEnd;
  }

  const duration = durationMinutes(session);
  if (!start || duration === null) return null;
  return new Date(start.getTime() + duration * 60_000);
}

export function buildAvsEvidenceSessionSnapshot(
  classSessionId: string,
  session: Record<string, unknown>,
  nowMs = Date.now(),
): AvsEvidenceSessionSnapshotResult {
  const serviceDateYmd = sessionServiceDateYmd(session);
  if (!serviceDateYmd) {
    return { kind: 'skip', reason: 'service_date_unresolved', serviceDateYmd: null };
  }

  const lifecycleStatus = String(session.status ?? '').trim().toLowerCase();
  if (
    lifecycleStatus === 'cancelled'
    || lifecycleStatus === 'canceled'
    || lifecycleStatus === 'rescheduled'
  ) {
    return {
      kind: 'skip',
      reason: 'cancelled_or_rescheduled',
      serviceDateYmd,
    };
  }

  const start = sessionStart(session, serviceDateYmd);
  if (!start) {
    return {
      kind: 'skip',
      reason: 'session_start_unresolved',
      serviceDateYmd,
    };
  }

  const end = sessionEnd(session, serviceDateYmd, start);
  if (!end) {
    return {
      kind: 'skip',
      reason: 'session_end_unresolved',
      serviceDateYmd,
    };
  }
  if (end.getTime() > nowMs) {
    return {
      kind: 'skip',
      reason: 'session_not_finished',
      serviceDateYmd,
    };
  }

  const kidId = sessionKidId(session);
  return {
    kind: 'eligible',
    serviceDateYmd,
    snapshot: {
      classSessionId: String(classSessionId || '').trim(),
      enrollmentId: text(session.enrollmentId),
      teacherId: text(session.teacherId),
      kidId,
      courseId: text(session.courseId),
      scheduledStartDateTime: start.toISOString(),
      scheduledEndDateTime: end.toISOString(),
      joinUrl:
        text(session.joinUrl)
        || text(session.meetingLink)
        || text(session.classLink),
      existingAttendanceStatus: existingAttendance(session, kidId),
    },
  };
}

export function stableAvsEvidenceRunId(classSessionId: string): string {
  const normalized = String(classSessionId || '').trim();
  if (!normalized) throw new TypeError('classSessionId is required.');
  const digest = createHash('sha256').update(normalized).digest('hex');
  return `avs_evidence_${digest.slice(0, 40)}`;
}

export function stableAvsEvidenceRefreshStateId(
  mode: AvsEvidenceRefreshMode,
  fromDate: string,
  toDate: string,
): string {
  const digest = createHash('sha256')
    .update(`${mode}\n${fromDate}\n${toDate}`)
    .digest('hex');
  return `avs_refresh_${digest.slice(0, 40)}`;
}
