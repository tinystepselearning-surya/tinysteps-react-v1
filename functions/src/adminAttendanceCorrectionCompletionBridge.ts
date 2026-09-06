import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DEFAULT_DURATION_MINS = 35;
const COMPLETION_BRIDGE_ALLOWED_STATUSES = new Set([
  '',
  'scheduled',
  'in_progress',
  'no_show',
  'noshow',
  'absent',
]);

function normalizeStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function toDateMaybe(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof timestamp.toDate === 'function') {
      const parsed = timestamp.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    const seconds = Number(timestamp.seconds ?? timestamp._seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  return null;
}

function normalizeTime(value: unknown): string | null {
  const raw = String(value || '').trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return null;
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}:${match[3] || '00'}`;
}

function resolveDurationMins(session: Record<string, unknown>): number {
  const parsed = Number(session.durationMins ?? session.durationMinutes ?? DEFAULT_DURATION_MINS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DURATION_MINS;
  return Math.max(10, Math.min(180, Math.round(parsed)));
}

export function resolveSessionStartMsForAttendanceCorrection(
  session: Record<string, unknown>,
): number | null {
  const startAt = toDateMaybe(session.startAt);
  if (startAt) return startAt.getTime();

  const date = String(session.date || '').trim();
  const time = normalizeTime(session.startTime);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !time) return null;
  const parsed = Date.parse(`${date}T${time}+05:30`);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveSessionEndMsForAttendanceCorrection(
  session: Record<string, unknown>,
): number | null {
  const startMs = resolveSessionStartMsForAttendanceCorrection(session);
  if (startMs === null) return null;
  return startMs + resolveDurationMins(session) * 60 * 1000;
}

export type AdminPresentCompletionBridgePlan = {
  shouldComplete: boolean;
  reason:
    | 'eligible'
    | 'not_present'
    | 'already_completed'
    | 'future_or_unresolved_session'
    | 'blocked_lifecycle_status';
};

export function planAdminPresentCorrectionCompletion(input: {
  newStatus: unknown;
  currentSessionStatus: unknown;
  sessionEndMs: number | null;
  nowMs?: number;
}): AdminPresentCompletionBridgePlan {
  if (normalizeStatus(input.newStatus) !== 'present') {
    return { shouldComplete: false, reason: 'not_present' };
  }

  const currentStatus = normalizeStatus(input.currentSessionStatus);
  if (currentStatus === 'completed') {
    return { shouldComplete: false, reason: 'already_completed' };
  }

  const nowMs = Number.isFinite(input.nowMs) ? Number(input.nowMs) : Date.now();
  if (input.sessionEndMs === null || input.sessionEndMs > nowMs) {
    return { shouldComplete: false, reason: 'future_or_unresolved_session' };
  }

  if (!COMPLETION_BRIDGE_ALLOWED_STATUSES.has(currentStatus)) {
    return { shouldComplete: false, reason: 'blocked_lifecycle_status' };
  }

  return { shouldComplete: true, reason: 'eligible' };
}

function resolveKidAttendanceStatus(session: Record<string, unknown>, kidId: string): string {
  const attendance = session.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) return '';
  const entry = (attendance as Record<string, unknown>)[kidId];
  if (typeof entry === 'string') return normalizeStatus(entry);
  if (entry && typeof entry === 'object') {
    return normalizeStatus((entry as Record<string, unknown>).status);
  }
  return '';
}

type CompletionBridgeOutcome = {
  status: 'completed' | 'blocked' | 'stale' | 'not_required' | 'session_missing';
  reason: string;
  currentStatus?: string;
};

export const onAdminAttendanceCorrectionCompletionBridge = onDocumentCreated(
  {
    document: 'classSessions/{sessionId}/attendanceCorrections/{correctionId}',
    region: REGION,
  },
  async (event) => {
    const correctionSnap = event.data;
    if (!correctionSnap) return;

    const correction = (correctionSnap.data() || {}) as Record<string, unknown>;
    if (normalizeStatus(correction.source) !== 'admin-attendance-correction') return;
    if (normalizeStatus(correction.newStatus) !== 'present') return;

    const sessionId = String(event.params.sessionId || '').trim();
    const correctionId = String(event.params.correctionId || '').trim();
    const kidId = String(correction.kidId || '').trim();
    if (!sessionId || !correctionId || !kidId) return;

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const pendingCreditsQuery = db
      .collection('rescheduleCredits')
      .where('sourceSessionId', '==', sessionId)
      .limit(50);

    const outcome = await db.runTransaction<CompletionBridgeOutcome>(async (tx) => {
      const currentSessionSnap = await tx.get(sessionRef);
      if (!currentSessionSnap.exists) {
        return { status: 'session_missing', reason: 'session_missing' };
      }

      const session = (currentSessionSnap.data() || {}) as Record<string, unknown>;

      // The audit event may run after a newer admin correction. Re-check the
      // authoritative session inside this transaction so a stale Present event
      // can never complete a session that is now Absent/Cancelled/etc.
      if (resolveKidAttendanceStatus(session, kidId) !== 'present') {
        return {
          status: 'stale',
          reason: 'attendance_no_longer_present',
          currentStatus: normalizeStatus(session.status),
        };
      }

      const plan = planAdminPresentCorrectionCompletion({
        newStatus: correction.newStatus,
        currentSessionStatus: session.status,
        sessionEndMs: resolveSessionEndMsForAttendanceCorrection(session),
      });

      if (!plan.shouldComplete) {
        return {
          status: 'not_required',
          reason: plan.reason,
          currentStatus: normalizeStatus(session.status),
        };
      }

      // Keep reschedule-chain protection in the same transaction as the final
      // lifecycle write. This prevents an eligible Present correction from
      // completing a session while an active replacement credit already exists.
      const pendingCreditSnap = await tx.get(pendingCreditsQuery);
      const hasPendingCredit = pendingCreditSnap.docs.some((docSnap) => {
        const status = normalizeStatus(docSnap.data()?.status);
        return status === 'open' || status === 'scheduled';
      });

      if (hasPendingCredit) {
        tx.set(
          correctionSnap.ref,
          {
            completionBridge: {
              status: 'blocked',
              reason: 'pending_reschedule_credit',
              checkedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true },
        );
        return {
          status: 'blocked',
          reason: 'pending_reschedule_credit',
          currentStatus: normalizeStatus(session.status),
        };
      }

      tx.set(
        sessionRef,
        {
          status: 'completed',
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: 'adminAttendanceCorrectionCompletionBridge',
          attendanceCorrectionCompletionBridge: {
            correctionId,
            kidId,
            appliedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );

      tx.set(
        correctionSnap.ref,
        {
          completionBridge: {
            status: 'completed',
            reason: 'corrected_present_past_session',
            checkedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );

      return {
        status: 'completed',
        reason: 'corrected_present_past_session',
        currentStatus: normalizeStatus(session.status),
      };
    });

    if (outcome.status === 'completed') {
      logger.info('Attendance correction completion bridge applied', {
        sessionId,
        kidId,
        correctionId,
        previousSessionStatus: outcome.currentStatus || null,
      });
      return;
    }

    const logPayload = {
      sessionId,
      kidId,
      correctionId,
      reason: outcome.reason,
      currentStatus: outcome.currentStatus || null,
    };

    if (outcome.status === 'blocked') {
      logger.warn('Attendance correction completion bridge blocked', logPayload);
    } else if (outcome.status === 'stale') {
      logger.info('Attendance correction completion bridge skipped stale correction', logPayload);
    } else {
      logger.info('Attendance correction completion bridge not required', logPayload);
    }
  },
);
