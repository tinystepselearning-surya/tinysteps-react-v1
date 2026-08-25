import * as admin from 'firebase-admin';
import {
  computeTeacherMonthlyRollupPayload,
  type TeacherEarningsLedgerRow,
  type TeacherPayoutLedgerRow,
} from './teacherEarningsAuthoritativeRollup';
import {
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
} from './teacherEarningsIncrementalProtocol';
import { TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE } from './teacherEarningsRecomputeCoordination';

const IST_OFFSET_MINUTES = 330;

export type TeacherEarningsRecomputeTarget = {
  teacherId: string;
  monthKey: string;
};

export type TeacherEarningsCoordinatedRecomputeResult = {
  targetCount: number;
  finalizedCount: number;
  supersededCount: number;
  allFinalized: boolean;
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const nonNegativeInteger = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed) ? parsed : fallback;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value) {
    const row = value as { toDate?: () => Date };
    if (typeof row.toDate === 'function') {
      const date = row.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
  }
  if (typeof value === 'string') {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00+05:30`)
      : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const monthKeyFromTimestampIST = (value: unknown): string | null => {
  const baseDate = toDate(value);
  if (!baseDate) return null;
  const istDate = new Date(baseDate.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const resolveTeacherEarningsRecomputeTarget = (
  data: Record<string, unknown> | null | undefined,
): TeacherEarningsRecomputeTarget | null => {
  if (!data) return null;
  const teacherId = normalizeText(data.teacherId);
  if (!teacherId) return null;

  const explicitMonthKey = normalizeText(data.monthKey);
  const monthKey = /^\d{4}-\d{2}$/.test(explicitMonthKey)
    ? explicitMonthKey
    : monthKeyFromTimestampIST(data.earnedAt || data.createdAt || data.updatedAt || null);
  if (!monthKey) return null;

  return { teacherId, monthKey };
};

export const resolveTeacherEarningsRecomputeTargets = (input: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): TeacherEarningsRecomputeTarget[] => {
  const targets = new Map<string, TeacherEarningsRecomputeTarget>();
  [resolveTeacherEarningsRecomputeTarget(input.before), resolveTeacherEarningsRecomputeTarget(input.after)]
    .filter((target): target is TeacherEarningsRecomputeTarget => Boolean(target))
    .forEach((target) => targets.set(`${target.teacherId}__${target.monthKey}`, target));
  return Array.from(targets.values());
};

const teacherRollupRef = (
  db: admin.firestore.Firestore,
  target: TeacherEarningsRecomputeTarget,
) => db.collection('teachers').doc(target.teacherId).collection('earnings').doc(target.monthKey);

const earningsQueryFor = (
  db: admin.firestore.Firestore,
  target: TeacherEarningsRecomputeTarget,
) =>
  db
    .collection('teacherEarnings')
    .where('teacherId', '==', target.teacherId)
    .where('monthKey', '==', target.monthKey);

const payoutsQueryFor = (
  db: admin.firestore.Firestore,
  target: TeacherEarningsRecomputeTarget,
) =>
  db
    .collection('teacherPayouts')
    .where('teacherId', '==', target.teacherId)
    .where('monthKey', '==', target.monthKey);

async function recomputeOneTargetAtomic(input: {
  db: admin.firestore.Firestore;
  eventId: string;
  target: TeacherEarningsRecomputeTarget;
}): Promise<void> {
  const { db, eventId, target } = input;
  const rollupRef = teacherRollupRef(db, target);
  const earningsQuery = earningsQueryFor(db, target);
  const payoutsQuery = payoutsQueryFor(db, target);

  await db.runTransaction(async (tx) => {
    // Firestore server transactions are serializable by commit time. Keep every authoritative
    // source read in this transaction so the published rollup corresponds to one atomic ledger
    // snapshot. Reads intentionally happen before the rollup write.
    const rollupSnap = await tx.get(rollupRef);
    const earningsSnap = await tx.get(earningsQuery);
    const payoutsSnap = await tx.get(payoutsQuery);

    const earnings: TeacherEarningsLedgerRow[] = earningsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      data: (docSnap.data() || {}) as Record<string, unknown>,
    }));
    const payouts: TeacherPayoutLedgerRow[] = payoutsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      data: (docSnap.data() || {}) as Record<string, unknown>,
    }));
    const payload = computeTeacherMonthlyRollupPayload({
      monthKey: target.monthKey,
      earnings,
      payouts,
    });

    const currentRollup = rollupSnap.exists
      ? ((rollupSnap.data() || {}) as Record<string, unknown>)
      : {};
    const currentEpoch = nonNegativeInteger(currentRollup.incrementalRecomputeEpoch, 0);
    const currentRevision = nonNegativeInteger(currentRollup.incrementalRevision, 0);

    tx.set(
      rollupRef,
      {
        ...payload,
        monthKey: target.monthKey,
        incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
        incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
        incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE,
        incrementalRecomputeClaimId: null,
        incrementalRecomputeEpoch: currentEpoch + 1,
        incrementalRevision: currentRevision + 1,
        incrementalLastAuthoritativeEventId: eventId,
        // Resolved by Firestore to the transaction commit time. Future incremental events compare
        // their source document updateTime against this watermark to prove inclusion/non-inclusion.
        incrementalAuthoritativeCommittedAt: admin.firestore.FieldValue.serverTimestamp(),
        incrementalRecomputeCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        analyticsProjectionVersion: 0,
        analyticsProjectionInvalidReason: 'authoritative_recompute_transaction',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/**
 * Brick 7C1 atomic authoritative replacement for the Brick 7B2 claim/scan/finalize runner.
 *
 * The expensive month-bounded ledger scan is intentionally retained. The safety improvement is
 * that the rollup read, teacherEarnings query, teacherPayouts query, and authoritative rollup write
 * now share one Firestore transaction. This gives the rollup a precise commit-time baseline that a
 * future Brick 7C incremental transaction can compare against without guessing whether a delayed
 * CloudEvent was already included by a full recompute.
 *
 * Incremental money deltas are still disabled at this checkpoint.
 */
export const recomputeTeacherEarningsEventCoordinated = async (input: {
  db: admin.firestore.Firestore;
  eventId: unknown;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): Promise<TeacherEarningsCoordinatedRecomputeResult> => {
  const eventId = normalizeText(input.eventId);
  if (!eventId) throw new Error('teacher earnings recompute requires CloudEvent identity');

  const targets = resolveTeacherEarningsRecomputeTargets({ before: input.before, after: input.after });
  for (const target of targets) {
    await recomputeOneTargetAtomic({ db: input.db, eventId, target });
  }

  return {
    targetCount: targets.length,
    finalizedCount: targets.length,
    supersededCount: 0,
    allFinalized: true,
  };
};
