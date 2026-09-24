import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export const ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION =
  'attendanceValidationDirtySessions';
export const ATTENDANCE_VALIDATION_DIRTY_SCHEMA_VERSION = 1;
export const ATTENDANCE_VALIDATION_DIRTY_START_YMD = '2026-09-01';

export type AttendanceValidationDirtyReason =
  | 'teacher_attendance_changed'
  | 'admin_attendance_correction'
  | 'historical_session_created'
  | 'validation_infrastructure_retry';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAttendanceStatus(value: unknown): string | null {
  const raw = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { status?: unknown }).status
      : null;
  const status = text(raw).toLowerCase().replace(/-/g, '_');

  if (status === 'present' || status === 'late') return 'present';
  if (status === 'absent' || status === 'no_show' || status === 'noshow') {
    return 'absent';
  }
  if (
    status === 'rescheduled'
    || status === 'reschedule'
    || status === 'reschedule_requested'
  ) {
    return 'rescheduled';
  }
  return null;
}

function attendanceStatusMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([kidId, entry]) => [text(kidId), normalizeAttendanceStatus(entry)] as const)
      .filter(([kidId, status]) => Boolean(kidId && status))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kidId, status]) => [kidId, status as string]),
  );
}

export function hasAttendanceValidationAttendanceChange(
  beforeAttendance: unknown,
  afterAttendance: unknown,
): boolean {
  return JSON.stringify(attendanceStatusMap(beforeAttendance))
    !== JSON.stringify(attendanceStatusMap(afterAttendance));
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const timestamp = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  const seconds = typeof timestamp.seconds === 'number'
    ? timestamp.seconds
    : timestamp._seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;

  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveAttendanceValidationServiceDateYmd(
  session: Record<string, unknown>,
): string | null {
  const direct = text(session.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;

  const startAt = toDate(session.startAt);
  if (!startAt) return null;
  return new Date(startAt.getTime() + (5.5 * 60 * 60 * 1000))
    .toISOString()
    .slice(0, 10);
}

export async function markAttendanceValidationDirtySession(
  db: Firestore,
  args: {
    sessionId: string;
    session: Record<string, unknown>;
    reason: AttendanceValidationDirtyReason;
  },
): Promise<{ written: boolean; serviceDateYmd: string | null }> {
  const sessionId = text(args.sessionId);
  if (!sessionId || sessionId.includes('/')) {
    throw new TypeError('sessionId must be a Firestore document id.');
  }

  const serviceDateYmd = resolveAttendanceValidationServiceDateYmd(args.session);
  if (
    !serviceDateYmd
    || serviceDateYmd < ATTENDANCE_VALIDATION_DIRTY_START_YMD
  ) {
    return { written: false, serviceDateYmd };
  }

  await db
    .collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION)
    .doc(sessionId)
    .set({
      schemaVersion: ATTENDANCE_VALIDATION_DIRTY_SCHEMA_VERSION,
      sessionId,
      serviceDateYmd,
      reason: args.reason,
      dirtyAt: FieldValue.serverTimestamp(),
      operationalMutationAllowed: false,
    }, { merge: true });

  return { written: true, serviceDateYmd };
}
