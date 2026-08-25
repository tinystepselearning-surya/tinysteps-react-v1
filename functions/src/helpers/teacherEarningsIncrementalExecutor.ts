import * as admin from 'firebase-admin';
import { planTeacherEarningsRollupChange } from './teacherEarningsRollupDelta';
import {
  evaluateTeacherEarningsIncrementalReplay,
  planTeacherEarningsIncrementalTransaction,
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  teacherEarningsIncrementalChangeSignature,
  teacherEarningsIncrementalMarkerId,
  type TeacherEarningsPreplannedIncrementalDelta,
} from './teacherEarningsIncrementalProtocol';
import {
  evaluateTeacherEarningsSessionCreateCertification,
  planTeacherEarningsSessionCreateCandidate,
} from './teacherEarningsSessionCreateFastPath';

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
 * Brick 7C2/7D2B transactional fast path for proven teacherEarnings deltas.
 *
 * This helper never reads teacherEarnings or teacherPayouts. Existing 7C deltas retain the exact
 * two-read transaction (rollup + event marker). A strict canonical session create may enter the
 * same protocol only after reading and validating its month-specific v2 production certification
 * inside that same transaction. Missing/stale/invalidated certification fails closed to the
 * authoritative full recompute.
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

  const initialPlan = planTeacherEarningsRollupChange({
    earningId,
    before: input.before,
    after: input.after,
  });
  const sessionCreateCandidate = planTeacherEarningsSessionCreateCandidate({
    earningId,
    before: input.before,
    after: input.after,
  });

  let target: { teacherId: string; monthKey: string };
  let preplannedDelta: TeacherEarningsPreplannedIncrementalDelta | null = null;
  let requiresSessionCreateCertification = false;

  if (initialPlan.mode === 'delta') {
    target = initialPlan.target;
  } else if (sessionCreateCandidate.eligible) {
    target = sessionCreateCandidate.target;
    preplannedDelta = {
      target: sessionCreateCandidate.target,
      delta: sessionCreateCandidate.delta,
    };
    requiresSessionCreateCertification = true;
  } else {
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

  const rollupRef = input.db
    .collection('teachers')
    .doc(target.teacherId)
    .collection('earnings')
    .doc(target.monthKey);
  const markerRef = rollupRef.collection('incrementalEvents').doc(markerId);
  const certificationRef = requiresSessionCreateCertification
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

    if (requiresSessionCreateCertification) {
      const certification = certificationSnap?.exists
        ? ((certificationSnap.data() || {}) as Record<string, unknown>)
        : null;
      const certificationDecision = evaluateTeacherEarningsSessionCreateCertification({
        certification,
        target,
      });
      if (!certificationDecision.ready) {
        return { mode: 'fallback' as const, reason: certificationDecision.reason };
      }
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
      preplannedDelta,
    });

    if (decision.mode === 'fallback') return { mode: 'fallback' as const, reason: decision.reason };
    if (decision.mode === 'conflict') return { mode: 'conflict' as const, reason: decision.reason };
    if (decision.mode === 'replay') {
      return {
        mode: 'replay' as const,
        teacherId: target.teacherId,
        monthKey: target.monthKey,
        markerId,
        previousOutcome: normalizeMarkerOutcome(existingMarker?.outcome),
      };
    }

    const fastPathKind = requiresSessionCreateCertification ? 'session_create_v2' : 'delta_v1';

    if (decision.mode === 'covered') {
      tx.set(markerRef, {
        eventId, earningId, teacherId: target.teacherId, monthKey: target.monthKey,
        changeSignature, protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        fastPathKind, outcome: 'covered', eventUpdateTime: input.eventUpdateTime,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: false });
      return { mode: 'covered' as const, teacherId: target.teacherId, monthKey: target.monthKey, markerId };
    }

    tx.set(rollupRef, {
      ...decision.nextTotals,
      incrementalProtocolVersion: decision.protocolVersion,
      incrementalRevision: decision.revisionAfter,
      incrementalLastEventId: eventId,
      incrementalLastEventUpdateTime: input.eventUpdateTime,
      incrementalLastAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
      incrementalLastFastPathKind: fastPathKind,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    tx.set(markerRef, {
      eventId, earningId, teacherId: target.teacherId, monthKey: target.monthKey,
      changeSignature, protocolVersion: decision.protocolVersion, fastPathKind, outcome: 'applied',
      eventUpdateTime: input.eventUpdateTime, revisionBefore: decision.revisionBefore,
      revisionAfter: decision.revisionAfter, recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: false });

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
