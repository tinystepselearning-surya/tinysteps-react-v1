import { describe, expect, it } from 'vitest';
import { resolvePresentFinanceReplayPlan } from '../src/helpers/attendanceFinanceIdempotency';

describe('attendance correction finance idempotency', () => {
  it('performs no ledger writes for present to present with existing open canonical records', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      chargeExists: true,
      chargeStatus: 'open',
      earningExists: true,
      earningStatus: 'unpaid',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, conflict: null });
  });

  it('performs no ledger writes for present to present with a settled charge', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      chargeExists: true,
      chargeStatus: 'paid',
      earningExists: true,
      earningStatus: 'paid',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, conflict: null });
  });

  it('repairs only the missing canonical ledger document on present replay', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      chargeExists: false,
      chargeStatus: '',
      earningExists: true,
      earningStatus: 'unpaid',
    })).toEqual({ shouldWriteCharge: true, shouldWriteEarning: false, conflict: null });
  });

  it('creates one charge and earning for absent to present', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: false,
      chargeExists: false,
      chargeStatus: '',
      earningExists: false,
      earningStatus: '',
    })).toEqual({ shouldWriteCharge: true, shouldWriteEarning: true, conflict: null });
  });

  it('fails closed instead of reactivating a void financial record during present replay', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      chargeExists: true,
      chargeStatus: 'void',
      earningExists: true,
      earningStatus: 'unpaid',
    }).conflict).toBe('charge_void');
  });
});
