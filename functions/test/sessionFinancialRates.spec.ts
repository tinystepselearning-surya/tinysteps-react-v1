import { describe, expect, it } from 'vitest';
import {
  buildSessionFinancialTermsSnapshot,
  hasCompleteSessionFinancialTermsSnapshot,
  resolveSessionBillingRate,
  resolveSessionFinancialCurrency,
  resolveSessionTeacherPayRate,
} from '../src/helpers/sessionFinancialRates';

describe('session financial terms snapshots', () => {
  it('keeps immutable session snapshots when enrollment rates later change', () => {
    const session = {
      financialTermsSnapshotVersion: 1,
      billingRateSnapshot: 350,
      teacherPayRateSnapshot: 150,
      financialTermsCurrency: 'INR',
      feeAmount: 350,
      teacherPayPerSession: 150,
    };
    const enrollment = {
      ratePerSession: 400,
      teacherPayPerSession: 175,
      currency: 'INR',
    };

    expect(resolveSessionBillingRate(session, enrollment)).toBe(350);
    expect(resolveSessionTeacherPayRate(session, enrollment)).toBe(150);
    expect(resolveSessionFinancialCurrency(session, enrollment)).toBe('INR');
  });

  it('prefers legacy session-side financial evidence over mutable enrollment values', () => {
    const session = {
      feeAmount: 350,
      teacherPayPerSession: 150,
      currency: 'INR',
    };
    const enrollment = {
      ratePerSession: 400,
      teacherPayPerSession: 175,
      currency: 'INR',
    };

    expect(resolveSessionBillingRate(session, enrollment)).toBe(350);
    expect(resolveSessionTeacherPayRate(session, enrollment)).toBe(150);
  });

  it('uses enrollment values only when the session has no financial-rate evidence', () => {
    const enrollment = {
      ratePerSession: 400,
      teacherPayPerSession: 175,
      currency: 'INR',
    };

    expect(resolveSessionBillingRate({}, enrollment)).toBe(400);
    expect(resolveSessionTeacherPayRate({}, enrollment)).toBe(175);
  });

  it('preserves an explicit zero teacher-pay snapshot', () => {
    const session = {
      financialTermsSnapshotVersion: 1,
      billingRateSnapshot: 400,
      teacherPayRateSnapshot: 0,
      financialTermsCurrency: 'INR',
    };
    const enrollment = {
      teacherPayPerSession: 175,
    };

    expect(resolveSessionTeacherPayRate(session, enrollment)).toBe(0);
    expect(hasCompleteSessionFinancialTermsSnapshot(session)).toBe(true);
  });

  it('builds a complete immutable snapshot from session-first evidence', () => {
    const snapshot = buildSessionFinancialTermsSnapshot(
      {
        feeAmount: 350,
        teacherPayPerSession: 150,
        currency: 'INR',
      },
      {
        ratePerSession: 400,
        teacherPayPerSession: 175,
        currency: 'USD',
      },
    );

    expect(snapshot).toEqual({
      financialTermsSnapshotVersion: 1,
      billingRateSnapshot: 350,
      teacherPayRateSnapshot: 150,
      financialTermsCurrency: 'INR',
    });
    expect(hasCompleteSessionFinancialTermsSnapshot(snapshot || {})).toBe(true);
  });

  it('fails closed when a billing rate cannot be resolved', () => {
    expect(buildSessionFinancialTermsSnapshot({}, { teacherPayPerSession: 175 })).toBeNull();
    expect(hasCompleteSessionFinancialTermsSnapshot({
      financialTermsSnapshotVersion: 1,
      teacherPayRateSnapshot: 175,
      financialTermsCurrency: 'INR',
    })).toBe(false);
  });
});
