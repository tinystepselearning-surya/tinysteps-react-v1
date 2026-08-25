import { describe, expect, it } from 'vitest';
import {
  TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH,
  shouldUseMonthBoundTeacherEarningsRead,
} from '@/pages/teacher/components/earnings/teacherEarningsReadPlan';

describe('B6 teacher earnings read plan', () => {
  it('month-bounds September 2026 and future months', () => {
    expect(TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH).toBe('2026-09');
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-09' }),
    ).toBe(true);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2027-01' }),
    ).toBe(true);
  });

  it('preserves August 2026 and older months on the full-ledger compatibility path', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-08' }),
    ).toBe(false);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-07' }),
    ).toBe(false);
  });

  it('keeps week and custom presets on the existing history query', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'week', selectedMonth: '2026-09' }),
    ).toBe(false);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'custom', selectedMonth: '2026-09' }),
    ).toBe(false);
  });

  it('rejects malformed month keys', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-9' }),
    ).toBe(false);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '' }),
    ).toBe(false);
  });
});
