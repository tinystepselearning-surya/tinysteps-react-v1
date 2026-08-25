export type TeacherFinanceProjectionEarningRow = Record<string, unknown> & { id: string };

export type TeacherFinanceAnalyticsProjection = {
  totalEarnings: number;
  pendingEarnings: number;
  totalSessions: number;
  demoEarnings: number;
  demoCompletedCount: number;
  demoEnrollmentBonusCount: number;
  sessionEarnings: number;
  unclassifiedEarnings: number;
  unclassifiedEarningCount: number;
  classificationConflictCount: number;
  activeEarningCount: number;
  selectedEarningCount: number;
  safeForAnalyticsProjection: boolean;
};

export type TeacherFinanceRollupParity = {
  safeToPrepare: boolean;
  reasons: string[];
  deltas: {
    totalEarnings: number;
    pendingEarnings: number;
    totalSessions: number;
    demoEarnings: number;
    demoCompletedCount: number;
    demoEnrollmentBonusCount: number;
  };
};

const normalizeText = (value: unknown): string => String(value || '').trim();
const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const normalizeMoney = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const row = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toDate === 'function') {
      const parsed = row.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
    }
    const seconds = Number(row.seconds ?? row._seconds);
    const nanoseconds = Number(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      return seconds * 1000 + (Number.isFinite(nanoseconds) ? nanoseconds / 1_000_000 : 0);
    }
  }
  return 0;
};

const resolvePaidAmount = (row: TeacherFinanceProjectionEarningRow, amount: number): number => {
  const explicit = Number(row.paidAmount);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.min(Math.max(explicit, 0), Math.max(amount, 0));
  }
  const status = normalizeStatus(row.status);
  return status === 'paid' || status === 'settled' ? Math.max(amount, 0) : 0;
};

const isSessionLinked = (row: TeacherFinanceProjectionEarningRow): boolean =>
  normalizeStatus(row.source) === 'session_present_completed' || Boolean(normalizeText(row.sessionId));

const isDemoSource = (row: TeacherFinanceProjectionEarningRow): boolean => {
  const source = normalizeStatus(row.source);
  return source === 'demo_completed' || source === 'demo_enrolled_bonus';
};

type Candidate = {
  id: string;
  row: TeacherFinanceProjectionEarningRow;
  status: string;
  source: string;
  sessionId: string;
  sortMs: number;
};

const pickPreferredSessionCandidate = (current: Candidate, incoming: Candidate): Candidate => {
  const currentCanonical = current.id === current.sessionId;
  const incomingCanonical = incoming.id === incoming.sessionId;
  if (currentCanonical !== incomingCanonical) return incomingCanonical ? incoming : current;

  if ((current.status === 'void') !== (incoming.status === 'void')) {
    return incoming.status === 'void' ? current : incoming;
  }

  return incoming.sortMs > current.sortMs ? incoming : current;
};

/**
 * B6 Brick 6B1.
 *
 * Builds the analytics-only projection from the same teacherEarnings ledger shape used by the
 * authoritative monthly rollup. It deliberately does not write anything and does not decide
 * whether an existing rollup may be migrated; callers must also pass the projection through the
 * parity gate below.
 */
export function buildTeacherFinanceAnalyticsProjection(
  rows: TeacherFinanceProjectionEarningRow[],
): TeacherFinanceAnalyticsProjection {
  const activeRows = rows.filter((row) => row.archived !== true);
  const standaloneCandidates: Candidate[] = [];
  const sessionCandidates = new Map<string, Candidate>();

  for (const row of activeRows) {
    const sessionId = normalizeText(row.sessionId);
    const candidate: Candidate = {
      id: normalizeText(row.id),
      row,
      status: normalizeStatus(row.status),
      source: normalizeStatus(row.source),
      sessionId,
      sortMs: toMillis(row.updatedAt) || toMillis(row.earnedAt) || toMillis(row.createdAt),
    };

    if (sessionId && isSessionLinked(row)) {
      const existing = sessionCandidates.get(sessionId);
      sessionCandidates.set(
        sessionId,
        existing ? pickPreferredSessionCandidate(existing, candidate) : candidate,
      );
      continue;
    }

    standaloneCandidates.push(candidate);
  }

  const selected = [
    ...standaloneCandidates,
    ...Array.from(sessionCandidates.values()),
  ].filter((candidate) => candidate.status !== 'void');

  let totalEarnings = 0;
  let pendingEarnings = 0;
  let totalSessions = 0;
  let demoEarnings = 0;
  let demoCompletedCount = 0;
  let demoEnrollmentBonusCount = 0;
  let sessionEarnings = 0;
  let unclassifiedEarnings = 0;
  let unclassifiedEarningCount = 0;
  let classificationConflictCount = 0;

  for (const candidate of selected) {
    const amount = normalizeMoney(candidate.row.amount);
    const paidAmount = resolvePaidAmount(candidate.row, amount);
    const sessionLinked = isSessionLinked(candidate.row);
    const demoSource = isDemoSource(candidate.row);

    totalEarnings += amount;
    pendingEarnings += Math.max(amount - paidAmount, 0);

    if (sessionLinked) totalSessions += 1;

    if (demoSource) {
      demoEarnings += amount;
      if (candidate.source === 'demo_completed') demoCompletedCount += 1;
      if (candidate.source === 'demo_enrolled_bonus') demoEnrollmentBonusCount += 1;
      if (sessionLinked) classificationConflictCount += 1;
      continue;
    }

    if (sessionLinked) {
      sessionEarnings += amount;
      continue;
    }

    unclassifiedEarnings += amount;
    unclassifiedEarningCount += 1;
  }

  const partitionDelta = Math.abs(totalEarnings - sessionEarnings - demoEarnings - unclassifiedEarnings);
  const safeForAnalyticsProjection =
    unclassifiedEarningCount === 0 &&
    unclassifiedEarnings <= 0.001 &&
    classificationConflictCount === 0 &&
    partitionDelta <= 0.01;

  return {
    totalEarnings,
    pendingEarnings,
    totalSessions,
    demoEarnings,
    demoCompletedCount,
    demoEnrollmentBonusCount,
    sessionEarnings,
    unclassifiedEarnings,
    unclassifiedEarningCount,
    classificationConflictCount,
    activeEarningCount: activeRows.length,
    selectedEarningCount: selected.length,
    safeForAnalyticsProjection,
  };
}

const finiteOrNaN = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const moneyDelta = (actual: unknown, expected: number): number => {
  const parsed = finiteOrNaN(actual);
  return Number.isFinite(parsed) ? Math.round((parsed - expected) * 100) / 100 : Number.NaN;
};

const countDelta = (actual: unknown, expected: number): number => {
  const parsed = finiteOrNaN(actual);
  return Number.isFinite(parsed) ? parsed - expected : Number.NaN;
};

/**
 * A projection is only migration-safe when it reproduces the already-authoritative rollup.
 * Missing rollups, legacy/unknown rollup versions, unclassified ledger events, or any material
 * total/count mismatch fail closed.
 */
export function evaluateTeacherFinanceRollupParity(
  projection: TeacherFinanceAnalyticsProjection,
  rollup: Record<string, unknown> | null | undefined,
): TeacherFinanceRollupParity {
  const reasons: string[] = [];
  const existing = rollup || {};
  const deltas = {
    totalEarnings: moneyDelta(existing.totalEarnings, projection.totalEarnings),
    pendingEarnings: moneyDelta(existing.pendingEarnings, projection.pendingEarnings),
    totalSessions: countDelta(
      existing.totalSessions ?? existing.sessionsCompleted,
      projection.totalSessions,
    ),
    demoEarnings: moneyDelta(existing.demoEarnings, projection.demoEarnings),
    demoCompletedCount: countDelta(existing.demoCompletedCount, projection.demoCompletedCount),
    demoEnrollmentBonusCount: countDelta(
      existing.demoEnrollmentBonusCount,
      projection.demoEnrollmentBonusCount,
    ),
  };

  const rollupVersion = Number(existing.rollupVersion);
  if (!rollup) reasons.push('rollup_missing');
  if (!Number.isFinite(rollupVersion) || rollupVersion < 1) {
    reasons.push('rollup_version_missing_or_legacy');
  }
  if (!projection.safeForAnalyticsProjection) reasons.push('projection_contains_unclassified_or_conflicting_earnings');

  const moneyFields: Array<keyof typeof deltas> = [
    'totalEarnings',
    'pendingEarnings',
    'demoEarnings',
  ];
  for (const field of moneyFields) {
    const delta = deltas[field];
    if (!Number.isFinite(delta) || Math.abs(delta) > 0.01) reasons.push(`${field}_mismatch`);
  }

  const countFields: Array<keyof typeof deltas> = [
    'totalSessions',
    'demoCompletedCount',
    'demoEnrollmentBonusCount',
  ];
  for (const field of countFields) {
    const delta = deltas[field];
    if (!Number.isFinite(delta) || Math.abs(delta) > 0) reasons.push(`${field}_mismatch`);
  }

  return {
    safeToPrepare: reasons.length === 0,
    reasons,
    deltas,
  };
}
