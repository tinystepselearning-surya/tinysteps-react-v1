import { describe, expect, it } from 'vitest';
import {
  isPayableDemoCompletionOutcome,
  shouldCreditDemoEnrollmentBonus,
} from '../src/helpers/demoEarningPolicy';

describe('canonical demo earning policy', () => {
  it('credits delivered demo outcomes and rejects no-shows/reschedule-only outcomes', () => {
    expect(isPayableDemoCompletionOutcome('completed')).toBe(true);
    expect(isPayableDemoCompletionOutcome('not_interested')).toBe(true);
    expect(isPayableDemoCompletionOutcome('follow_up_needed')).toBe(true);
    expect(isPayableDemoCompletionOutcome('parent_no_show')).toBe(false);
    expect(isPayableDemoCompletionOutcome('teacher_no_show')).toBe(false);
    expect(isPayableDemoCompletionOutcome('reschedule_requested')).toBe(false);
  });

  it('credits enrollment only for a completed demo and remains retry-safe', () => {
    expect(shouldCreditDemoEnrollmentBonus({
      beforeStatus: 'completed',
      afterStatus: 'completed',
      beforeConversion: 'interested',
      afterConversion: 'enrolled',
      outcome: 'completed',
    })).toBe(true);
    expect(shouldCreditDemoEnrollmentBonus({
      beforeStatus: 'assigned',
      afterStatus: 'assigned',
      beforeConversion: 'interested',
      afterConversion: 'enrolled',
      outcome: 'completed',
    })).toBe(false);
    expect(shouldCreditDemoEnrollmentBonus({
      beforeStatus: 'completed',
      afterStatus: 'completed',
      beforeConversion: 'enrolled',
      afterConversion: 'enrolled',
      outcome: 'completed',
    })).toBe(false);
  });

  it('credits an enrollment already recorded before the completion transition', () => {
    expect(shouldCreditDemoEnrollmentBonus({
      beforeStatus: 'assigned',
      afterStatus: 'completed',
      beforeConversion: 'enrolled',
      afterConversion: 'enrolled',
      outcome: 'completed',
    })).toBe(true);
  });

  it('does not credit enrollment for a no-show or reschedule-only attempt', () => {
    expect(shouldCreditDemoEnrollmentBonus({
      beforeStatus: 'completed',
      afterStatus: 'completed',
      beforeConversion: 'interested',
      afterConversion: 'enrolled',
      outcome: 'reschedule_requested',
    })).toBe(false);
  });
});
