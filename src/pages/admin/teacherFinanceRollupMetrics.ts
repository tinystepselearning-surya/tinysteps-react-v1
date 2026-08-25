export type TeacherFinanceMonthlyRollup = {
  id?: string;
  month?: unknown;
  monthKey?: unknown;
  totalEarnings?: unknown;
  pendingEarnings?: unknown;
  totalSessions?: unknown;
  sessionsCompleted?: unknown;
  demoEarnings?: unknown;
  demoCompletedCount?: unknown;
  demoEnrollmentBonusCount?: unknown;
  rollupSource?: unknown;
  rollupVersion?: unknown;
  analyticsProjectionVersion?: unknown;
  sessionEarnings?: unknown;
  unclassifiedEarnings?: unknown;
};

export type TeacherFinanceRollupSummary = {
  totalCombinedEarned: number;
  totalSessionEarned: number;
  totalDemoEarned: number;
  totalSessionCount: number;
  totalDemoCount: number;
  totalPending: number;
  rollupCount: number;
  unsafeRollupCount: number;
  safeForFinanceSummary: boolean;
};

const toMoney = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

const normalizedText = (value: unknown): string => String(value || '').trim();

const rollupMonthKey = (row: TeacherFinanceMonthlyRollup): string => {
  const explicit = normalizedText(row.monthKey);
  if (/^\d{4}-\d{2}$/.test(explicit)) return explicit;
  const legacy = normalizedText(row.month);
  if (/^\d{4}-\d{2}$/.test(legacy)) return legacy;
  const id = normalizedText(row.id);
  return /^\d{4}-\d{2}$/.test(id) ? id : '';
};

/**
 * B6 Brick 6A projection contract.
 *
 * The Finance view may use teacher-month rollups only when the rollup explicitly carries the
 * analytics projection fields produced by the B6 migration/canonical writer. Older v1 rollups
 * remain visible to the caller, but are marked unsafe so the UI can retain the raw-ledger
 * fallback rather than silently change financial totals.
 */
export function summarizeTeacherFinanceRollups(
  rows: TeacherFinanceMonthlyRollup[],
  monthKey: string,
): TeacherFinanceRollupSummary {
  const targetMonth = /^\d{4}-\d{2}$/.test(String(monthKey || '').trim())
    ? String(monthKey).trim()
    : '';

  let totalCombinedEarned = 0;
  let totalSessionEarned = 0;
  let totalDemoEarned = 0;
  let totalSessionCount = 0;
  let totalDemoCount = 0;
  let totalPending = 0;
  let rollupCount = 0;
  let unsafeRollupCount = 0;

  for (const row of rows) {
    if (!targetMonth || rollupMonthKey(row) !== targetMonth) continue;
    rollupCount += 1;

    const projectionVersion = Number(row.analyticsProjectionVersion);
    const unclassifiedEarnings = toMoney(row.unclassifiedEarnings);
    const sessionEarningsRaw = Number(row.sessionEarnings);
    const projectionSafe =
      Number.isFinite(projectionVersion) &&
      projectionVersion >= 1 &&
      Number.isFinite(sessionEarningsRaw) &&
      sessionEarningsRaw >= 0 &&
      unclassifiedEarnings <= 0.001;

    if (!projectionSafe) {
      unsafeRollupCount += 1;
      continue;
    }

    const sessionEarnings = Math.max(sessionEarningsRaw, 0);
    const demoEarnings = toMoney(row.demoEarnings);
    totalSessionEarned += sessionEarnings;
    totalDemoEarned += demoEarnings;
    totalCombinedEarned += sessionEarnings + demoEarnings;
    totalPending += toMoney(row.pendingEarnings);
    totalSessionCount += toCount(row.totalSessions ?? row.sessionsCompleted);
    totalDemoCount +=
      toCount(row.demoCompletedCount) + toCount(row.demoEnrollmentBonusCount);
  }

  return {
    totalCombinedEarned,
    totalSessionEarned,
    totalDemoEarned,
    totalSessionCount,
    totalDemoCount,
    totalPending,
    rollupCount,
    unsafeRollupCount,
    safeForFinanceSummary: rollupCount > 0 && unsafeRollupCount === 0,
  };
}
