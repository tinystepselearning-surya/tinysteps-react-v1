import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
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
  sessionStartMs: number | null;
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
  if (input.sessionStartMs === null || input.sessionStartMs > nowMs) {
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

async function hasPendingRescheduleCredit(
  db: admin.firestore.Firestore,
  sessionId: string,
): Promise<boolean> {
  const snap = await db
    .collection('rescheduleCredits')
    .where('sourceSessionId', '==', sessionId)
    .limit(50)
    .get();

  return snap.docs.some((docSnap) => {
    const status = normalizeStatus(docSnap.data()?.status);
    return status === 'open' || status === 'scheduled';
  });
}

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
    const kidId = String(correction.kidId || '').trim();
    if (!sessionId || !kidId) return;

    const db = admin.firestore();
    const sessionRef = db.collection('classSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return;

    const session = (sessionSnap.data() || {}) as Record<string, unknown>;

    // A later admin correction may have superseded this audit event before the
    // trigger ran. Never complete unless the session currently still says Present.
    if (resolveKidAttendanceStatus(session, kidId) !== 'present') {
      logger.info('Attendance correction completion bridge skipped stale correction', {
        sessionId,
        kidId,
        correctionId: event.params.correctionId,
      });
      return;
    }

    const plan = planAdminPresentCorrectionCompletion({
      newStatus: correction.newStatus,
      currentSessionStatus: session.status,
      sessionStartMs: resolveSessionStartMsForAttendanceCorrection(session),
    });

    if (!plan.shouldComplete) {
      logger.info('Attendance correction completion bridge not required', {
        sessionId,
        kidId,
        correctionId: event.params.correctionId,
        reason: plan.reason,
        currentStatus: normalizeStatus(session.status),
      });
      return;
    }

    if (await hasPendingRescheduleCredit(db, sessionId)) {
      logger.warn('Attendance correction completion bridge blocked by pending reschedule credit', {
        sessionId,
        kidId,
        correctionId: event.params.correctionId,
      });
      await correctionSnap.ref.set(
        {
          completionBridge: {
            status: 'blocked',
            reason: 'pending_reschedule_credit',
            checkedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true },
      );
      return;
    }

    await sessionRef.set(
      {
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: 'adminAttendanceCorrectionCompletionBridge',
        attendanceCorrectionCompletionBridge: {
          correctionId: event.params.correctionId,
          kidId,
          appliedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    await correctionSnap.ref.set(
      {
        completionBridge: {
          status: 'completed',
          reason: 'corrected_present_past_session',
          checkedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    logger.info('Attendance correction completion bridge applied', {
      sessionId,
      kidId,
      correctionId: event.params.correctionId,
    });
  },
);
