import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {auditInput, fixture} from './support/financeSyntheticSource';
import {buildParentPaymentBackfillWritePlan} from '../src/parentPaymentBackfillWrite';
import {createParentPaymentBackfillReportHash} from '../src/parentPaymentBackfillHash';

// No SDK client, credentials or real write implementation exists in this test.
// Stop at the first attempted run-log write. This tests preflight ordering, not
// production authorization, transaction isolation or successful commit behavior.
const mocks = vi.hoisted(() => {
  const set = vi.fn(async () => { throw new Error('OFFLINE_WRITE_BOUNDARY'); });
  const ref = {set, collection: vi.fn(), doc: vi.fn()};
  ref.collection.mockReturnValue(ref); ref.doc.mockReturnValue(ref);
  return {guard: vi.fn(), payments: vi.fn(), scoped: vi.fn(), set,
    firestore: Object.assign(vi.fn(() => ({collection: () => ref})),
      {FieldValue: {serverTimestamp: () => 'synthetic-timestamp'}})};
});
vi.mock('firebase-admin', () => ({apps: [{}], firestore: mocks.firestore}));
vi.mock('../src/helpers/canonicalAdminGuard', () => ({ensureCanonicalAdmin: mocks.guard}));
vi.mock('../src/parentMonthlyReadModels', () => ({recomputeParentMonthBillingReadModel: vi.fn()}));
vi.mock('../src/parentPaymentBackfillDryRun', async importOriginal => ({
  ...await importOriginal<typeof import('../src/parentPaymentBackfillDryRun')>(),
  loadParentPaymentBackfillPayments: mocks.payments,
  loadParentPaymentBackfillParentScopedData: mocks.scoped,
}));
import {applyParentPaymentBackfillForSafeParents} from '../src/parentPaymentBackfillWriteMode';

const valid = {mode: 'write', parentIds: ['parent-a'], confirmationText: 'APPLY_SAFE_PARENT_PAYMENT_BACKFILL'};
const invoke = (data: Record<string, unknown>) => applyParentPaymentBackfillForSafeParents.run({
  data, auth: {uid: 'synthetic-admin', token: {}},
} as Parameters<typeof applyParentPaymentBackfillForSafeParents.run>[0]);

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-06-25T00:00:00Z'));
  vi.clearAllMocks(); mocks.guard.mockResolvedValue(undefined);
  const input = auditInput(fixture(3).exhaustive(['parent-a']));
  mocks.payments.mockResolvedValue(input.payments); mocks.scoped.mockResolvedValue(input);
});

afterEach(() => { vi.useRealTimers(); });

describe('offline write callable preflight boundary', () => {
  it('honors a rejected authorization guard before any finance load or write attempt', async () => {
    mocks.guard.mockRejectedValueOnce(new Error('synthetic-denied'));
    await expect(invoke(valid)).rejects.toThrow('synthetic-denied');
    expect(mocks.firestore).not.toHaveBeenCalled(); expect(mocks.payments).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each([{mode: 'dry_run'}, {confirmationText: 'wrong'}, {includeArchived: true},
    {allowWalletDrift: true}, {allowAnomalies: true}, {parentIds: []}])('retains validation before finance reads: %j', async override => {
    await expect(invoke({...valid, ...override})).rejects.toThrow();
    expect(mocks.payments).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
  });
  it('rejects a supplied incompatible report hash before any write attempt', async () => {
    await expect(invoke({...valid, dryRunReportHash: 'mismatch'})).rejects.toThrow('does not match');
    expect(mocks.payments).toHaveBeenCalledTimes(1); expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each(['omitted', 'compatible'])('characterizes the %s hash reaching the simulated write boundary', async mode => {
    const input = auditInput(fixture(3).exhaustive(['parent-a']));
    const plan = buildParentPaymentBackfillWritePlan({...input, mode: 'write', parentIds: ['parent-a']});
    const data = mode === 'compatible' ? {...valid, dryRunReportHash: createParentPaymentBackfillReportHash(plan.beforeReport)} : valid;
    await expect(invoke(data)).rejects.toThrow('OFFLINE_WRITE_BOUNDARY');
    expect(mocks.set).toHaveBeenCalledTimes(1);
  });
});
