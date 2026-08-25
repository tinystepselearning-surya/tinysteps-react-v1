import * as admin from 'firebase-admin';
import {
  computeTeacherMonthlyRollupPayload,
  type TeacherEarningsLedgerRow,
  type TeacherPayoutLedgerRow,
} from './teacherEarningsAuthoritativeRollup';
import {
  planTeacherEarningsRecomputeClaim,
  planTeacherEarningsRecomputeFinalize,
} from './teacherEarningsRecomputeCoordination';

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

const claimIdFor = (eventId: string, target: TeacherEarningsRecomputeTarget): string =>
  `${eventId}__${target.teacherId}__${target.monthKey}`;

const scanTargetLedger = async (
  db: admin.firestore.Firestore,
  target: TeacherEarningsRecomputeTarget,
) => {
  const [earningsSnap, payoutsSnap] = await Promise.all([
    db
      .collection('teacherEarnings')
      .where('teacherId', '==', target.teacherId)
      .where('monthKey', '==', target.monthKey)
      .get(),
    db
      .collection('teacherPayouts')
      .where('teacherId', '==', target.teacherId)
      .where('monthKey', '==', target.monthKey)
      .get(),
  ]);

  const earnings: TeacherEarningsLedgerRow[] = earningsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    data: (docSnap.data() || {}) as Record<string, unknown>,
  }));
  const payouts: TeacherPayoutLedgerRow[] = payoutsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    data: (docSnap.data() || {}) as Record<string, unknown>,
  }));

  return computeTeacherMonthlyRollupPayload({ monthKey: target.monthKey, earnings, payouts });
};

async function recomputeOneTarget(input: {
  db: admin.firestore.Firestore;
  eventId: string;
  target: TeacherEarningsRecomputeTarget;
}): Promise<'finalized' | 'superseded'> {
  const { db, eventId, target } = input;
  const rollupRef = teacherRollupRef(db, target);
  const claimId = claimIdFor(eventId, target);

  const claim = await db.runTransaction(async (tx) => {
    const rollupSnap = await tx.get(rollupRef);
    const decision = planTeacherEarningsRecomputeClaim({
      claimId,
      rollup: rollupSnap.exists
        ? ((rollupSnap.data() || {}) as Record<string, unknown>)
        : null,
    });
    if (decision.mode !== 'claim') {
      throw new Error(`teacher earnings recompute claim rejected: ${decision.reason}`);
    }

    tx.set(
      rollupRef,
      {
        ...decision.patch,
        analyticsProjectionVersion: 0,
        analyticsProjectionInvalidReason: 'authoritative_recompute_in_progress',
        incrementalRecomputeClaimedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return decision;
  });

  const payload = await scanTargetLedger(db, target);

  return db.runTransaction(async (tx) => {
    const rollupSnap = await tx.get(rollupRef);
    const decision = planTeacherEarningsRecomputeFinalize({
      claimId,
      claimEpoch: claim.claimEpoch,
      rollup: rollupSnap.exists
        ? ((rollupSnap.data() || {}) as Record<string, unknown>)
        : null,
    });

    if (decision.mode === 'superseded') return 'superseded';
    if (decision.mode !== 'finalize') {
      throw new Error(`teacher earnings recompute finalize rejected: ${decision.reason}`);
    }

    tx.set(
      rollupRef,
      {
        ...payload,
        ...decision.patch,
        incrementalRecomputeCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return 'finalized';
  });
}

/**
 * Brick 7B2 coordinated replacement for the legacy teacherEarnings full-recompute handler.
 *
 * The expensive ledger scan still happens and retains the same authoritative arithmetic. The
 * safety change is sequencing: each target is claimed transactionally before scanning, and only
 * the latest claim epoch may finalize. A newer earning event therefore supersedes any stale scan
 * instead of allowing it to overwrite newer finance state.
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
  let finalizedCount = 0;
  let supersededCount = 0;

  for (const target of targets) {
    const outcome = await recomputeOneTarget({ db: input.db, eventId, target });
    if (outcome === 'finalized') finalizedCount += 1;
    else supersededCount += 1;
  }

  return {
    targetCount: targets.length,
    finalizedCount,
    supersededCount,
    allFinalized: targets.length === finalizedCount,
  };
};
