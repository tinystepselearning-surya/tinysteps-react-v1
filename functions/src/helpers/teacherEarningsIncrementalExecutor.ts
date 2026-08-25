import * as admin from 'firebase-admin';
import {
  isCanonicalSessionCreateFastPathCandidate,
  planTeacherEarningsRollupChange,
} from './teacherEarningsRollupDelta';
import {
  evaluateTeacherEarningsIncrementalReplay,
  planTeacherEarningsIncrementalTransaction,
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  teacherEarningsIncrementalChangeSignature,
  teacherEarningsIncrementalMarkerId,
} from './teacherEarningsIncrementalProtocol';
import {
  evaluateTeacherEarningsSessionCreateCertification,
  TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
} from './teacherEarningsSessionCreateCertification';

export type TeacherEarningsIncrementalExecutionResult =
  | {
      mode: 'applied';
      teacherId: string;
      monthKey: string;
      markerId: string;
      revisionBefore: number;
      revisionAfter: number;
    }
  | {
      mode: 'covered';
      teacherId: string;
      monthKey: string;
      markerId: string;
    }
  | {
      mode: 'replay';
      teacherId: string;
      monthKey: string;
      markerId: string;
      previousOutcome: 'applied' | 'covered' | 'unknown';
    }
  | { mode: 'fallback'; reason: string }
  | { mode: 'conflict'; reason: string };

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeMarkerOutcome = (value: unknown): 'applied' | 'covered' | 'unknown' => {
  const normalized = normalizeText(value);
  if (normalized === 'applied' || normalized === 'covered') return normalized;
  return 'unknown';
};

/**
 * Brick 7C2 transactional fast path for already-proven exact teacherEarnings deltas.
 *
 * This helper never reads teacherEarnings or teacherPayouts. Eligibility is decided by the pure
 * delta planner first. Only an eligible teacher-month then enters a Firestore transaction that
 * reads the derived rollup and one event-idempotency marker. A strictly canonical session-create
 * candidate additionally reads its month-level v2 certification in the same transaction. The
 * exact rollup totals/revision and marker are committed atomically.
 *
 * The authoritative full-recompute commit watermark is intentionally NOT advanced by a delta.
 * Only a transaction that scans the complete teacher-month ledgers may advance that watermark.
 */
export const tryApplyTeacherEarningsIncrementalEvent = async (input: {
  db: admin.firestore.Firestore;
  eventId: unknown;
  earningId: unknown;
  eventUpdateTime: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): Promise<TeacherEarningsIncrementalExecutionResult> => {
  const eventId = normalizeText(input.eventId);
  const earningId = normalizeText(input.earningId);
  if (!eventId || !earningId) return { mode: 'fallback', reason: 'missing_event_identity' };

  const sessionCreateCandidate = isCanonicalSessionCreateFastPathCandidate({
    earningId,
    before: input.before,
    after: input.after,
  });

  const initialPlan = planTeacherEarningsRollupChange({
    earningId,
    before: input.before,
    after: input.after,
    allowCertifiedSessionCreate: sessionCreateCandidate,
  });
  if (initialPlan.mode !== 'delta') {
    return {
      mode: 'fallback',
      reason: initialPlan.mode === 'recompute' ? `planner_${initialPlan.reason}` : 'planner_noop',
    };
  }
  if (!input.after) return { mode: 'fallback', reason: 'incremental_delete_requires_recompute' };

  const markerId = teacherEarningsIncrementalMarkerId(eventId);
  const changeSignature = teacherEarningsIncrementalChangeSignature({
    eventId,
    earningId,
    before: input.before,
    after: input.after,
  });
  if (!markerId || !changeSignature) {
    return { mode: 'fallback', reason: 'missing_event_identity' };
  }

  const target = initialPlan.target;
  const rollupRef = input.db
    .collection('teachers')
    .doc(target.teacherId)
    .collection('earnings')
    .doc(target.monthKey);
  const markerRef = rollupRef.collection('incrementalEvents').doc(markerId);
  const certificationRef = sessionCreateCandidate
    ? input.db
        .collection('adminStats')
        .doc('teacherEarningsSessionCreateFastPath')
        .collection('months')
        .doc(target.monthKey)
    : null;

  return input.db.runTransaction(async (tx) => {
    const rollupSnap = await tx.get(rollupRef);
    const markerSnap = await tx.get(markerRef);
    const certificationSnap = certificationRef ? await tx.get(certificationRef) : null;

    if (sessionCreateCandidate) {
      const certification =
        certificationSnap?.exists === true
          ? ((certificationSnap.data() || {}) as Record<string, unknown>)
          : null;
      const certificationDecision = evaluateTeacherEarningsSessionCreateCertification({
        targetMonthKey: target.monthKey,
        certification,
      });
      if (!certificationDecision.valid) {
        return { mode: 'fallback' as const, reason: certificationDecision.reason };
      }
    }

    const existingMarker = markerSnap.exists
      ? ((markerSnap.data() || {}) as Record<string, unknown>)
      : null;

    const replayDecision = evaluateTeacherEarningsIncrementalReplay({
      markerId,
      changeSignature,
      existingMarker,
    });
    if (replayDecision?.mode === 'replay') {
      return {
        mode: 'replay' as const,
        teacherId: target.teacherId,
        monthKey: target.monthKey,
        markerId,
        previousOutcome: normalizeMarkerOutcome(existingMarker?.outcome),
      };
    }
    if (replayDecision?.mode === 'conflict') {
      return { mode: 'conflict' as const, reason: replayDecision.reason };
    }

    const rollup = rollupSnap.exists
      ? ((rollupSnap.data() || {}) as Record<string, unknown>)
      : null;
    const decision = planTeacherEarningsIncrementalTransaction({
      eventId,
      earningId,
      eventUpdateTime: input.eventUpdateTime,
      before: input.before,
      after: input.after,
      rollup,
      allowCertifiedSessionCreate: sessionCreateCandidate,
    });

    if (decision.mode === 'fallback') {
      return { mode: 'fallback' as const, reason: decision.reason };
    }
    if (decision.mode === 'conflict') {
      return { mode: 'conflict' as const, reason: decision.reason };
    }
    if (decision.mode === 'replay') {
      return {
        mode: 'replay' as const,
        teacherId: target.teacherId,
        monthKey: target.monthKey,
        markerId,
        previousOutcome: normalizeMarkerOutcome(existingMarker?.outcome),
      };
    }

    if (decision.mode === 'covered') {
      tx.set(
        markerRef,
        {
          eventId,
          earningId,
          teacherId: target.teacherId,
          monthKey: target.monthKey,
          changeSignature,
          protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
          ...(sessionCreateCandidate
            ? {
                sessionCreateCertificationVersion:
                  TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
                sessionCreateSourceCodeContract:
                  TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
              }
            : {}),
          outcome: 'covered',
          eventUpdateTime: input.eventUpdateTime,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: false },
      );
      return {
        mode: 'covered' as const,
        teacherId: target.teacherId,
        monthKey: target.monthKey,
        markerId,
      };
    }

    tx.set(
      rollupRef,
      {
        ...decision.nextTotals,
        incrementalProtocolVersion: decision.protocolVersion,
        incrementalRevision: decision.revisionAfter,
        incrementalLastEventId: eventId,
        incrementalLastEventUpdateTime: input.eventUpdateTime,
        incrementalLastAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(
      markerRef,
      {
        eventId,
        earningId,
        teacherId: target.teacherId,
        monthKey: target.monthKey,
        changeSignature,
        protocolVersion: decision.protocolVersion,
        ...(sessionCreateCandidate
          ? {
              sessionCreateCertificationVersion:
                TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
              sessionCreateSourceCodeContract:
                TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
            }
          : {}),
        outcome: 'applied',
        eventUpdateTime: input.eventUpdateTime,
        revisionBefore: decision.revisionBefore,
        revisionAfter: decision.revisionAfter,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false },
    );

    return {
      mode: 'applied' as const,
      teacherId: target.teacherId,
      monthKey: target.monthKey,
      markerId,
      revisionBefore: decision.revisionBefore,
      revisionAfter: decision.revisionAfter,
    };
  });
};
