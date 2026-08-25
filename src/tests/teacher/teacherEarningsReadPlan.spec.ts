import { describe, expect, it } from 'vitest';
import {
  TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH,
  shouldUseMonthBoundTeacherEarningsRead,
} from '@/pages/teacher/components/earnings/teacherEarningsReadPlan';

describe('B6 teacher earnings read plan', () => {
  it('month-bounds the B6 cutover month and future months', () => {
    expect(TEACHER_EARNINGS_MONTH_BOUND_CUTOVER_MONTH).toBe('2026-08');
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-08' }),
    ).toBe(true);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2027-01' }),
    ).toBe(true);
  });

  it('preserves the historical full-ledger compatibility path before cutover', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-07' }),
    ).toBe(false);
  });

  it('keeps week and custom presets on the existing history query', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'week', selectedMonth: '2026-08' }),
    ).toBe(false);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'custom', selectedMonth: '2026-08' }),
    ).toBe(false);
  });

  it('rejects malformed month keys', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-8' }),
    ).toBe(false);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '' }),
    ).toBe(false);
  });
});
