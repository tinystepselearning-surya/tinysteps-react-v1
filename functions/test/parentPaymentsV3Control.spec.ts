import { describe, expect, it } from 'vitest';
import { resolveParentPaymentsV3Cutover } from '../src/parentPaymentsV3Control';

const complete = {
  phase: 'active',
  migrationVerified: true,
  billingPreservationVerified: true,
  legacyPaymentWritersDisabled: true,
  receiptWritesEnabled: true,
  cutoverRunId: 'migration_20261019_run01',
};

describe('Parent Payments V3 financial cutover guard', () => {
  it('is closed when no configuration is present', () => {
    expect(resolveParentPaymentsV3Cutover(null)).toBeNull();
    expect(resolveParentPaymentsV3Cutover(undefined, true)).toBeNull();
    expect(resolveParentPaymentsV3Cutover({}, true)).toBeNull();
  });

  it('only opens after all migration preservation and legacy-writer controls are verified', () => {
    expect(resolveParentPaymentsV3Cutover(complete, true)).toBe(complete.cutoverRunId);
    for (const key of ['phase', 'migrationVerified', 'billingPreservationVerified', 'legacyPaymentWritersDisabled', 'cutoverRunId'] as const) {
      expect(resolveParentPaymentsV3Cutover({ ...complete, [key]: key === 'phase' ? 'draft' : false }, true)).toBeNull();
    }
    expect(resolveParentPaymentsV3Cutover({ ...complete, cutoverRunId: 'a/b' }, true)).toBeNull();
  });

  it('requires an extra explicit switch for receipt writes even if statement reads are enabled', () => {
    const statementsOnly = { ...complete, receiptWritesEnabled: false };
    expect(resolveParentPaymentsV3Cutover(statementsOnly)).toBe(complete.cutoverRunId);
    expect(resolveParentPaymentsV3Cutover(statementsOnly, true)).toBeNull();
  });
});
