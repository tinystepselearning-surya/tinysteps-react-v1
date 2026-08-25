import { normalizeFinancialStatus, normalizeLowerStatus } from './status';

export type TeacherOrphanEarningSkipReason =
  | 'already_void'
  | 'not_session_linked'
  | 'billable_session'
  | 'paid_or_settled'
  | null;

export interface TeacherOrphanEarningEvaluation {
  orphan: boolean;
  voidable: boolean;
  skipReason: TeacherOrphanEarningSkipReason;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function resolveAttendanceEntryStatus(entry: unknown): string | null {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (
    entry &&
    typeof entry === 'object' &&
    'status' in entry &&
    typeof (entry as { status?: unknown }).status === 'string'
  ) {
    return ((entry as { status: string }).status || '').trim().toLowerCase();
  }
  return null;
}

function resolveAttendanceStatus(session: Record<string, any>, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendance = session?.attendance || {};
  const entry = attendance?.[kidId];
  if (!entry) return null;
  return resolveAttendanceEntryStatus(entry);
}

function isBillableAttendance(status: string | null): boolean {
  return status === 'present';
}

function hasAnyBillableAttendance(session: Record<string, any>): boolean {
  const attendance = session?.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return false;
  return Object.values(attendance).some((entry) =>
    isBillableAttendance(resolveAttendanceEntryStatus(entry)),
  );
}

function isSessionBillableByAttendance(
  session: Record<string, any>,
  kidId: string | null,
): boolean {
  const attendance = session?.attendance;
  if (attendance && typeof attendance === 'object' && !Array.isArray(attendance)) {
    const hasTrackedStatuses = Object.values(attendance).some((entry) =>
      Boolean(resolveAttendanceEntryStatus(entry)),
    );
    if (hasTrackedStatuses) {
      return hasAnyBillableAttendance(session);
    }
  }

  const directStatus = resolveAttendanceStatus(session, kidId);
  return isBillableAttendance(directStatus);
}

function resolveKidId(data: Record<string, any> | null): string | null {
  if (!data) return null;
  return (
    data?.kidId ||
    data?.studentId ||
    (Array.isArray(data?.kidIds) ? data.kidIds[0] : null) ||
    null
  );
}

function resolveTeacherEarningPaidAmount(data: Record<string, any>, amount: number): number {
  const paidRaw = Number(data?.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }

  const status = normalizeFinancialStatus(data?.status);
  if (status === 'paid' || status === 'settled') {
    return Math.max(amount, 0);
  }
  return 0;
}

/**
 * Mirrors the existing voidTeacherOrphanEarnings financial safety semantics.
 * It deliberately does not decide query scope; Brick 4 narrows that at Firestore.
 */
export function evaluateTeacherOrphanEarning(input: {
  earning: Record<string, any>;
  sessionExists: boolean;
  sessionData: Record<string, any> | null;
}): TeacherOrphanEarningEvaluation {
  const { earning, sessionExists, sessionData } = input;
  const status = normalizeFinancialStatus(earning?.status);

  if (status === 'void') {
    return { orphan: false, voidable: false, skipReason: 'already_void' };
  }

  const sessionId = String(earning?.sessionId || '').trim();
  if (!sessionId) {
    return { orphan: false, voidable: false, skipReason: 'not_session_linked' };
  }

  const sessionStatus = normalizeLowerStatus(sessionData?.status);
  const earningKidId =
    String(earning?.kidId || resolveKidId(sessionData) || '').trim() || null;
  const isBillable =
    sessionExists &&
    sessionStatus === 'completed' &&
    isSessionBillableByAttendance(sessionData || {}, earningKidId);

  if (isBillable) {
    return { orphan: false, voidable: false, skipReason: 'billable_session' };
  }

  const amount = Math.max(normalizeNumber(earning?.amount, 0), 0);
  const paidAmount = resolveTeacherEarningPaidAmount(earning, amount);
  if (paidAmount > 0 || status === 'paid') {
    return { orphan: true, voidable: false, skipReason: 'paid_or_settled' };
  }

  return { orphan: true, voidable: true, skipReason: null };
}
