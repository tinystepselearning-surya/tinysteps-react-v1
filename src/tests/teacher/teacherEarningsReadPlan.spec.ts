import { describe, expect, it } from 'vitest';
import { shouldUseMonthBoundTeacherEarningsRead } from '../../pages/teacher/components/earnings/teacherEarningsReadPlan';

describe('B6 teacher earnings read plan', () => {
  it('month-bounds every valid selected month', () => {
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2026-08' }),
    ).toBe(true);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2025-01' }),
    ).toBe(true);
    expect(
      shouldUseMonthBoundTeacherEarningsRead({ filterPreset: 'month', selectedMonth: '2027-01' }),
    ).toBe(true);
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
