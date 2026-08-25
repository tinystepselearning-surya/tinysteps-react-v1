export type EarningsFilterPreset = 'week' | 'month' | 'custom';

const isMonthKey = (value: string): boolean => /^\d{4}-\d{2}$/.test(value.trim());

/**
 * B6 Brick 3 read boundary.
 *
 * Every valid Month view reads the teacherEarnings ledger by canonical teacherId + selected
 * monthKey. Week and Custom intentionally retain the existing teacher-history query because their
 * ranges can span month boundaries and are separate optimization work.
 */
export function shouldUseMonthBoundTeacherEarningsRead(input: {
  filterPreset: EarningsFilterPreset;
  selectedMonth: string;
}): boolean {
  return input.filterPreset === 'month' && isMonthKey(input.selectedMonth.trim());
}
