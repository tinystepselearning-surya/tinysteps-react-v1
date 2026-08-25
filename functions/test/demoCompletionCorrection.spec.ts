import { describe, expect, it } from 'vitest';
import {
  buildDemoCorrectionCycleKey,
  isDemoCorrectionEarningSource,
  resolveDemoCorrectionPaidAmount,
} from '../src/helpers/demoCompletionCorrection';

describe('demo completion correction policy', () => {
  it('touches only demo-specific earning sources', () => {
    expect(isDemoCorrectionEarningSource('demo_completed')).toBe(true);
    expect(isDemoCorrectionEarningSource('demo_enrolled_bonus')).toBe(true);
    expect(isDemoCorrectionEarningSource('session_present_completed')).toBe(false);
  });

  it('uses explicit partial paid amount when present', () => {
    expect(resolveDemoCorrectionPaidAmount({ status: 'partial', paidAmount: 40 }, 100)).toBe(40);
  });

  it('treats settled earnings as fully paid when paidAmount is absent', () => {
    expect(resolveDemoCorrectionPaidAmount({ status: 'settled' }, 100)).toBe(100);
  });

  it('creates a stable correction cycle key per completion timestamp', () => {
    expect(buildDemoCorrectionCycleKey('demo/one', 1234)).toBe('demo_one_1234');
    expect(buildDemoCorrectionCycleKey('demo/one', 1234)).toBe(buildDemoCorrectionCycleKey('demo/one', 1234));
    expect(buildDemoCorrectionCycleKey('demo/one', 5678)).not.toBe(buildDemoCorrectionCycleKey('demo/one', 1234));
  });
});
