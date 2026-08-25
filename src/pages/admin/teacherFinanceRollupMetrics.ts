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
  analyticsProjectionPreparedSessionEarnings?: unknown;
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
 * B6 Brick 6A/6B2 projection contract.
 *
 * The authoritative rollup already owns totalEarnings and demoEarnings. Once Brick 6B1 proves
 * that the month contains only canonical session/demo earnings, session earnings are safely the
 * remainder: totalEarnings - demoEarnings. This avoids maintaining a second live money total that
 * could drift after later canonical earning/payout events.
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
    const totalEarningsRaw = Number(row.totalEarnings);
    const demoEarningsRaw = Number(row.demoEarnings);
    const unclassifiedEarnings = toMoney(row.unclassifiedEarnings);
    const projectionSafe =
      Number.isFinite(projectionVersion) &&
      projectionVersion >= 1 &&
      Number.isFinite(totalEarningsRaw) &&
      totalEarningsRaw >= 0 &&
      Number.isFinite(demoEarningsRaw) &&
      demoEarningsRaw >= 0 &&
      demoEarningsRaw <= totalEarningsRaw + 0.01 &&
      unclassifiedEarnings <= 0.001;

    if (!projectionSafe) {
      unsafeRollupCount += 1;
      continue;
    }

    const totalEarnings = Math.max(totalEarningsRaw, 0);
    const demoEarnings = Math.max(demoEarningsRaw, 0);
    const sessionEarnings = Math.max(totalEarnings - demoEarnings, 0);
    totalSessionEarned += sessionEarnings;
    totalDemoEarned += demoEarnings;
    totalCombinedEarned += totalEarnings;
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
