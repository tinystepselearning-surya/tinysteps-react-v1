export type EarningsFilterPreset = 'week' | 'month' | 'custom';

export const TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH = '2026-08';

const isMonthKey = (value: string): boolean => /^\d{4}-\d{2}$/.test(value.trim());

/**
 * B6 Brick 3 rollout boundary.
 *
 * Current/future monthly views use a teacher+month Firestore query. Historical months keep the
 * pre-B6 teacher-history query so older earnings that predate canonical monthKey coverage remain
 * visible until the production legacy-month audit proves they are safe to cut over as well.
 */
export function shouldUseMonthBoundTeacherEarningsRead(input: {
  filterPreset: EarningsFilterPreset;
  selectedMonth: string;
}): boolean {
  const selectedMonth = input.selectedMonth.trim();
  return (
    input.filterPreset === 'month' &&
    isMonthKey(selectedMonth) &&
    selectedMonth >= TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH
  );
}
