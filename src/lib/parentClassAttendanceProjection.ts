import { selectCanonicalChildRow } from './parentDashboardDataContract';

export type ParentChildMonthClassAttendance = {
  kidId?: string;
  monthKey?: string;
  totalSessions?: number;
  completedSessions?: number;
  scheduledSessions?: number;
  inProgressSessions?: number;
  cancelledSessions?: number;
  noShowSessions?: number;
  rescheduleRequestedSessions?: number;
  rescheduledSessions?: number;
  otherSessions?: number;
  upcomingSessions?: number;
  unresolvedPastSessions?: number;
  pendingTimeUnknownSessions?: number;
  presentSessions?: number;
  lateSessions?: number;
  absentSessions?: number;
  attendanceMarkedSessions?: number;
  attendanceUnmarkedCompletedSessions?: number;
  attendancePct?: number;
  pendingSessionStartAtMs?: number[];
};

export type ParentClassAttendanceReadModel = {
  schemaVersion?: number;
  modelType?: string;
  childRowsAuthoritative?: boolean;
  timeClassificationAsOfMs?: number;
  timeBucketsRecomputableFromPendingStarts?: boolean;
  byKid?: Record<string, ParentChildMonthClassAttendance>;
  totals?: ParentChildMonthClassAttendance;
};

export type MaterializedParentChildMonthClassAttendance = Required<
  Pick<
    ParentChildMonthClassAttendance,
    | 'totalSessions'
    | 'completedSessions'
    | 'scheduledSessions'
    | 'inProgressSessions'
    | 'cancelledSessions'
    | 'noShowSessions'
    | 'rescheduleRequestedSessions'
    | 'rescheduledSessions'
    | 'otherSessions'
    | 'upcomingSessions'
    | 'unresolvedPastSessions'
    | 'pendingTimeUnknownSessions'
    | 'presentSessions'
    | 'lateSessions'
    | 'absentSessions'
    | 'attendanceMarkedSessions'
    | 'attendanceUnmarkedCompletedSessions'
    | 'attendancePct'
    | 'pendingSessionStartAtMs'
  >
> & {
  kidId: string;
  monthKey: string;
};

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function pct(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function pendingStarts(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .sort((a, b) => a - b);
}

/**
 * Materializes the time-sensitive pending-session buckets from the same Firestore read model.
 * No session query is needed and no screen is allowed to invent a different definition.
 */
export function materializeParentChildMonthClassAttendance(
  row: ParentChildMonthClassAttendance,
  nowMs: number,
): MaterializedParentChildMonthClassAttendance {
  const starts = pendingStarts(row.pendingSessionStartAtMs);
  const upcomingSessions = starts.filter((startMs) => startMs >= nowMs).length;
  const unresolvedPastSessions = starts.length - upcomingSessions;
  const attendanceMarkedSessions = count(row.attendanceMarkedSessions);
  const presentSessions = count(row.presentSessions);
  const lateSessions = count(row.lateSessions);
  const absentSessions = count(row.absentSessions);
  const derivedAttendanceMarked = presentSessions + lateSessions + absentSessions;
  const normalizedMarked = derivedAttendanceMarked || attendanceMarkedSessions;
  const attendancePct = normalizedMarked > 0
    ? Math.round(((presentSessions + lateSessions) / normalizedMarked) * 100)
    : pct(row.attendancePct);

  return {
    kidId: String(row.kidId || '').trim(),
    monthKey: String(row.monthKey || '').trim(),
    totalSessions: count(row.totalSessions),
    completedSessions: count(row.completedSessions),
    scheduledSessions: count(row.scheduledSessions),
    inProgressSessions: count(row.inProgressSessions),
    cancelledSessions: count(row.cancelledSessions),
    noShowSessions: count(row.noShowSessions),
    rescheduleRequestedSessions: count(row.rescheduleRequestedSessions),
    rescheduledSessions: count(row.rescheduledSessions),
    otherSessions: count(row.otherSessions),
    upcomingSessions,
    unresolvedPastSessions,
    pendingTimeUnknownSessions: count(row.pendingTimeUnknownSessions),
    presentSessions,
    lateSessions,
    absentSessions,
    attendanceMarkedSessions: normalizedMarked,
    attendanceUnmarkedCompletedSessions: count(row.attendanceUnmarkedCompletedSessions),
    attendancePct,
    pendingSessionStartAtMs: starts,
  };
}

/**
 * Strict selected-child selector. Missing `byKid[kidId]` means unavailable.
 * It must never fall back to parent/family totals.
 */
export function selectCanonicalParentChildMonthClassAttendance(
  model: ParentClassAttendanceReadModel | null | undefined,
  kidId: string | null | undefined,
  nowMs: number,
): MaterializedParentChildMonthClassAttendance | null {
  if (!model || model.schemaVersion !== 3 || model.modelType !== 'class_attendance_v3') {
    return null;
  }
  if (model.childRowsAuthoritative !== true) return null;
  const row = selectCanonicalChildRow(model.byKid, kidId);
  if (!row) return null;
  return materializeParentChildMonthClassAttendance(row, nowMs);
}

export function parentChildClassAttendanceInvariantErrors(
  row: MaterializedParentChildMonthClassAttendance,
): string[] {
  const errors: string[] = [];
  const lifecycleTotal =
    row.completedSessions +
    row.scheduledSessions +
    row.inProgressSessions +
    row.cancelledSessions +
    row.noShowSessions +
    row.rescheduleRequestedSessions +
    row.rescheduledSessions +
    row.otherSessions;
  if (lifecycleTotal !== row.totalSessions) {
    errors.push('class lifecycle states must sum to totalSessions');
  }

  const pendingTotal = row.scheduledSessions + row.inProgressSessions;
  if (
    row.upcomingSessions + row.unresolvedPastSessions + row.pendingTimeUnknownSessions !==
    pendingTotal
  ) {
    errors.push('pending time buckets must sum to scheduled + inProgress sessions');
  }
  if (row.pendingSessionStartAtMs.length !== row.upcomingSessions + row.unresolvedPastSessions) {
    errors.push('pendingSessionStartAtMs must cover every time-resolved pending session');
  }

  if (row.presentSessions + row.lateSessions + row.absentSessions !== row.attendanceMarkedSessions) {
    errors.push('attendance statuses must sum to attendanceMarkedSessions');
  }
  if (
    row.attendanceMarkedSessions + row.attendanceUnmarkedCompletedSessions !==
    row.completedSessions
  ) {
    errors.push('completed sessions must reconcile to marked + unmarked attendance');
  }
  return errors;
}
