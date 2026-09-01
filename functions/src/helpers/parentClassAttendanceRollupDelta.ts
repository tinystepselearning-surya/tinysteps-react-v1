import {
  buildParentMonthClassAttendanceProjection,
  classAttendanceProjectionInvariantErrors,
  resolveSessionClassAttendanceTarget,
  type ClassAttendanceProjectionKidBucket,
  type ClassAttendanceProjectionTotals,
  type ParentMonthClassAttendanceProjection,
  type ParentMonthClassAttendanceTarget,
} from '../parentMonthlyClassAttendanceProjectionV3';

export type ParentClassAttendanceRollupTarget = Pick<
  ParentMonthClassAttendanceTarget,
  'parentId' | 'monthKey'
>;

export type ParentClassAttendanceContribution = ParentMonthClassAttendanceProjection;

export type ParentClassAttendanceRollupOperation = {
  target: ParentClassAttendanceRollupTarget;
  beforeContribution: ParentClassAttendanceContribution | null;
  afterContribution: ParentClassAttendanceContribution | null;
};

export type ParentClassAttendanceRollupPlan =
  | { mode: 'noop'; targets: ParentClassAttendanceRollupTarget[] }
  | { mode: 'delta'; operations: ParentClassAttendanceRollupOperation[] }
  | { mode: 'recompute'; targets: ParentClassAttendanceRollupTarget[]; reason: string };

type MutableAttendanceRow = {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  inProgressSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  rescheduleRequestedSessions: number;
  rescheduledSessions: number;
  otherSessions: number;
  pendingTimeUnknownSessions: number;
  presentSessions: number;
  lateSessions: number;
  absentSessions: number;
  pendingSessionStartAtMs: number[];
};

const COUNT_FIELDS: Array<keyof Omit<MutableAttendanceRow, 'pendingSessionStartAtMs'>> = [
  'totalSessions',
  'completedSessions',
  'scheduledSessions',
  'inProgressSessions',
  'cancelledSessions',
  'noShowSessions',
  'rescheduleRequestedSessions',
  'rescheduledSessions',
  'otherSessions',
  'pendingTimeUnknownSessions',
  'presentSessions',
  'lateSessions',
  'absentSessions',
];

const normalizeCount = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) return null;
  return parsed;
};

const normalizePendingStarts = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];
  for (const raw of value) {
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    out.push(parsed);
  }
  return out.sort((a, b) => a - b);
};

const emptyMutableRow = (): MutableAttendanceRow => ({
  totalSessions: 0,
  completedSessions: 0,
  scheduledSessions: 0,
  inProgressSessions: 0,
  cancelledSessions: 0,
  noShowSessions: 0,
  rescheduleRequestedSessions: 0,
  rescheduledSessions: 0,
  otherSessions: 0,
  pendingTimeUnknownSessions: 0,
  presentSessions: 0,
  lateSessions: 0,
  absentSessions: 0,
  pendingSessionStartAtMs: [],
});

const readMutableRow = (
  row: Partial<ClassAttendanceProjectionTotals> | null | undefined,
): MutableAttendanceRow | null => {
  if (!row) return emptyMutableRow();
  const out = emptyMutableRow();
  for (const field of COUNT_FIELDS) {
    const parsed = normalizeCount(row[field]);
    if (parsed == null) return null;
    out[field] = parsed;
  }
  const pending = normalizePendingStarts(row.pendingSessionStartAtMs);
  if (!pending) return null;
  out.pendingSessionStartAtMs = pending;
  return out;
};

const removePendingStarts = (base: number[], toRemove: number[]): number[] | null => {
  const next = [...base];
  for (const value of toRemove) {
    const index = next.indexOf(value);
    if (index < 0) return null;
    next.splice(index, 1);
  }
  return next;
};

const applyMutableDelta = (
  base: MutableAttendanceRow,
  before: MutableAttendanceRow,
  after: MutableAttendanceRow,
): MutableAttendanceRow | null => {
  const next = emptyMutableRow();
  for (const field of COUNT_FIELDS) {
    const value = base[field] - before[field] + after[field];
    if (!Number.isInteger(value) || value < 0) return null;
    next[field] = value;
  }

  const withoutBefore = removePendingStarts(base.pendingSessionStartAtMs, before.pendingSessionStartAtMs);
  if (!withoutBefore) return null;
  next.pendingSessionStartAtMs = [...withoutBefore, ...after.pendingSessionStartAtMs]
    .sort((a, b) => a - b);
  return next;
};

const finalizeRow = (
  source: MutableAttendanceRow,
  nowMs: number,
): ClassAttendanceProjectionTotals | null => {
  const lifecycleTotal =
    source.completedSessions +
    source.scheduledSessions +
    source.inProgressSessions +
    source.cancelledSessions +
    source.noShowSessions +
    source.rescheduleRequestedSessions +
    source.rescheduledSessions +
    source.otherSessions;
  if (lifecycleTotal !== source.totalSessions) return null;

  const pendingStarts = [...source.pendingSessionStartAtMs].sort((a, b) => a - b);
  const pendingResolvedCount = pendingStarts.length;
  const pendingLifecycleCount = source.scheduledSessions + source.inProgressSessions;
  if (pendingResolvedCount + source.pendingTimeUnknownSessions !== pendingLifecycleCount) return null;

  const attendanceMarkedSessions =
    source.presentSessions + source.lateSessions + source.absentSessions;
  if (attendanceMarkedSessions > source.completedSessions) return null;
  const attendanceUnmarkedCompletedSessions = source.completedSessions - attendanceMarkedSessions;
  const attendancePct = attendanceMarkedSessions > 0
    ? Math.round(((source.presentSessions + source.lateSessions) / attendanceMarkedSessions) * 100)
    : 0;
  const upcomingSessions = pendingStarts.filter((startMs) => startMs >= nowMs).length;
  const unresolvedPastSessions = pendingStarts.length - upcomingSessions;

  const canonical = {
    ...source,
    pendingSessionStartAtMs: pendingStarts,
    upcomingSessions,
    unresolvedPastSessions,
    attendanceMarkedSessions,
    attendanceUnmarkedCompletedSessions,
    attendancePct,
  };

  return {
    ...canonical,
    total: canonical.totalSessions,
    completed: canonical.completedSessions,
    scheduled: canonical.scheduledSessions,
    in_progress: canonical.inProgressSessions,
    cancelled: canonical.cancelledSessions,
    no_show: canonical.noShowSessions,
    reschedule_requested: canonical.rescheduleRequestedSessions,
    rescheduled: canonical.rescheduledSessions,
    other: canonical.otherSessions,
    upcoming: canonical.upcomingSessions,
    unresolvedPast: canonical.unresolvedPastSessions,
    present: canonical.presentSessions,
    late: canonical.lateSessions,
    absent: canonical.absentSessions,
    attendanceMarked: canonical.attendanceMarkedSessions,
  };
};

const sameTarget = (
  a: ParentClassAttendanceRollupTarget | null,
  b: ParentClassAttendanceRollupTarget | null,
): boolean => Boolean(a && b && a.parentId === b.parentId && a.monthKey === b.monthKey);

const uniqueTargets = (
  ...values: Array<ParentClassAttendanceRollupTarget | null>
): ParentClassAttendanceRollupTarget[] => {
  const map = new Map<string, ParentClassAttendanceRollupTarget>();
  values.forEach((value) => {
    if (!value) return;
    map.set(`${value.parentId}__${value.monthKey}`, value);
  });
  return Array.from(map.values());
};

const targetFor = (
  data: Record<string, unknown> | null,
): ParentClassAttendanceRollupTarget | null => {
  const target = resolveSessionClassAttendanceTarget(data);
  return target ? { parentId: target.parentId, monthKey: target.monthKey } : null;
};

const contributionFor = (
  data: Record<string, unknown> | null,
  target: ParentClassAttendanceRollupTarget,
  nowMs: number,
): ParentClassAttendanceContribution | null => {
  if (!data) return null;
  const resolved = targetFor(data);
  if (!sameTarget(resolved, target)) return null;
  return buildParentMonthClassAttendanceProjection([data], target.monthKey, nowMs);
};

const contributionSignature = (
  contribution: ParentClassAttendanceContribution | null,
): string => {
  if (!contribution) return 'null';
  const canonicalByKid = Object.fromEntries(
    Object.entries(contribution.byKid)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kidId, row]) => [
        kidId,
        {
          totalSessions: row.totalSessions,
          completedSessions: row.completedSessions,
          scheduledSessions: row.scheduledSessions,
          inProgressSessions: row.inProgressSessions,
          cancelledSessions: row.cancelledSessions,
          noShowSessions: row.noShowSessions,
          rescheduleRequestedSessions: row.rescheduleRequestedSessions,
          rescheduledSessions: row.rescheduledSessions,
          otherSessions: row.otherSessions,
          pendingTimeUnknownSessions: row.pendingTimeUnknownSessions,
          presentSessions: row.presentSessions,
          lateSessions: row.lateSessions,
          absentSessions: row.absentSessions,
          pendingSessionStartAtMs: row.pendingSessionStartAtMs,
        },
      ]),
  );
  return JSON.stringify({
    totals: {
      totalSessions: contribution.totals.totalSessions,
      completedSessions: contribution.totals.completedSessions,
      scheduledSessions: contribution.totals.scheduledSessions,
      inProgressSessions: contribution.totals.inProgressSessions,
      cancelledSessions: contribution.totals.cancelledSessions,
      noShowSessions: contribution.totals.noShowSessions,
      rescheduleRequestedSessions: contribution.totals.rescheduleRequestedSessions,
      rescheduledSessions: contribution.totals.rescheduledSessions,
      otherSessions: contribution.totals.otherSessions,
      pendingTimeUnknownSessions: contribution.totals.pendingTimeUnknownSessions,
      presentSessions: contribution.totals.presentSessions,
      lateSessions: contribution.totals.lateSessions,
      absentSessions: contribution.totals.absentSessions,
      pendingSessionStartAtMs: contribution.totals.pendingSessionStartAtMs,
    },
    byKid: canonicalByKid,
    sourceSessionRecords: contribution.sourceSessionRecords,
    unassignedSessionRecords: contribution.unassignedSessionRecords,
    legacyKidAliasOnlySessionRecords: contribution.legacyKidAliasOnlySessionRecords,
  });
};

/**
 * Pure planner for the parent class-attendance fast path.
 *
 * It deliberately does not write Firestore. It proves whether one classSessions change can be
 * expressed as exact per-parent-month contribution deltas. Missing scheduled month/parent
 * identity fails closed to the existing authoritative recompute path.
 */
export const planParentClassAttendanceRollupChange = (input: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  nowMs?: number;
}): ParentClassAttendanceRollupPlan => {
  const nowMs = input.nowMs ?? Date.now();
  const beforeTarget = targetFor(input.before);
  const afterTarget = targetFor(input.after);
  const targets = uniqueTargets(beforeTarget, afterTarget);

  if (!input.before && !input.after) return { mode: 'noop', targets: [] };
  if (input.before && !beforeTarget) {
    return { mode: 'recompute', targets, reason: 'before_target_unresolved' };
  }
  if (input.after && !afterTarget) {
    return { mode: 'recompute', targets, reason: 'after_target_unresolved' };
  }
  if (targets.length === 0) return { mode: 'noop', targets: [] };

  const operations = targets.map((target) => ({
    target,
    beforeContribution: contributionFor(input.before, target, nowMs),
    afterContribution: contributionFor(input.after, target, nowMs),
  }));

  if (
    operations.every(
      (operation) =>
        contributionSignature(operation.beforeContribution) ===
        contributionSignature(operation.afterContribution),
    )
  ) {
    return { mode: 'noop', targets };
  }

  return { mode: 'delta', operations };
};

/**
 * Applies one exact operation to an already-authoritative parent-month projection.
 * Returns null rather than guessing whenever the existing aggregate cannot support the subtraction.
 */
export const applyParentClassAttendanceRollupOperation = (input: {
  base: ParentMonthClassAttendanceProjection;
  operation: ParentClassAttendanceRollupOperation;
  nowMs?: number;
}): ParentMonthClassAttendanceProjection | null => {
  const nowMs = input.nowMs ?? Date.now();
  const { base, operation } = input;
  const before = operation.beforeContribution;
  const after = operation.afterContribution;

  const baseTotals = readMutableRow(base.totals);
  const beforeTotals = readMutableRow(before?.totals);
  const afterTotals = readMutableRow(after?.totals);
  if (!baseTotals || !beforeTotals || !afterTotals) return null;
  const nextMutableTotals = applyMutableDelta(baseTotals, beforeTotals, afterTotals);
  if (!nextMutableTotals) return null;
  const nextTotals = finalizeRow(nextMutableTotals, nowMs);
  if (!nextTotals) return null;

  const nextByKid: Record<string, ClassAttendanceProjectionKidBucket> = {};
  for (const [kidId, row] of Object.entries(base.byKid)) {
    const mutable = readMutableRow(row);
    if (!mutable) return null;
    const finalized = finalizeRow(mutable, nowMs);
    if (!finalized) return null;
    nextByKid[kidId] = {
      kidId,
      monthKey: operation.target.monthKey,
      ...finalized,
    };
  }

  const affectedKidIds = new Set<string>([
    ...Object.keys(before?.byKid || {}),
    ...Object.keys(after?.byKid || {}),
  ]);
  for (const kidId of affectedKidIds) {
    const baseMutable = readMutableRow(nextByKid[kidId]);
    const beforeMutable = readMutableRow(before?.byKid[kidId]);
    const afterMutable = readMutableRow(after?.byKid[kidId]);
    if (!baseMutable || !beforeMutable || !afterMutable) return null;
    const nextMutable = applyMutableDelta(baseMutable, beforeMutable, afterMutable);
    if (!nextMutable) return null;
    const finalized = finalizeRow(nextMutable, nowMs);
    if (!finalized) return null;
    if (finalized.totalSessions === 0) {
      delete nextByKid[kidId];
      continue;
    }
    nextByKid[kidId] = {
      kidId,
      monthKey: operation.target.monthKey,
      ...finalized,
    };
  }

  const nextSourceSessionRecords =
    base.sourceSessionRecords - (before?.sourceSessionRecords || 0) + (after?.sourceSessionRecords || 0);
  const nextUnassignedSessionRecords =
    base.unassignedSessionRecords -
    (before?.unassignedSessionRecords || 0) +
    (after?.unassignedSessionRecords || 0);
  const nextLegacyKidAliasOnlySessionRecords =
    base.legacyKidAliasOnlySessionRecords -
    (before?.legacyKidAliasOnlySessionRecords || 0) +
    (after?.legacyKidAliasOnlySessionRecords || 0);

  if (
    !Number.isInteger(nextSourceSessionRecords) ||
    !Number.isInteger(nextUnassignedSessionRecords) ||
    !Number.isInteger(nextLegacyKidAliasOnlySessionRecords) ||
    nextSourceSessionRecords < 0 ||
    nextUnassignedSessionRecords < 0 ||
    nextLegacyKidAliasOnlySessionRecords < 0
  ) {
    return null;
  }

  const next: ParentMonthClassAttendanceProjection = {
    totals: nextTotals,
    byKid: nextByKid,
    sourceSessionRecords: nextSourceSessionRecords,
    unassignedSessionRecords: nextUnassignedSessionRecords,
    legacyKidAliasOnlySessionRecords: nextLegacyKidAliasOnlySessionRecords,
  };

  return classAttendanceProjectionInvariantErrors(next).length === 0 ? next : null;
};
