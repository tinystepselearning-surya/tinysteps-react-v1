export type EarningsFilterPreset = 'week' | 'month' | 'custom';

export const TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH = '2026-09';

const isMonthKey = (value: string): boolean => /^\d{4}-\d{2}$/.test(value.trim());

/**
 * B6 Brick 3 rollout boundary.
 *
 * September 2026 and future monthly views use a teacher+month Firestore query. August 2026 and
 * older months keep the pre-B6 teacher-history query so any earnings created before the B6
 * deployment remain visible until the production full-ledger legacy-month audit proves they are
 * safe to cut over as well.
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
