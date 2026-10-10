import {describe, expect, it} from 'vitest';
import {loadParentPaymentBackfillPayments as load, loadParentPaymentBackfillParentScopedData as scoped} from '../src/parentPaymentBackfillDryRun';
import {buildParentPaymentBackfillDryRunReport as report} from '../src/parentPaymentBackfillAudit';
import {createParentPaymentBackfillReportHash as hash} from '../src/parentPaymentBackfillHash';
import {buildParentPaymentBackfillWritePlan as plan} from '../src/parentPaymentBackfillWrite';
import {legacyDb, type Document} from './support/financeLegacyDb';
import {fixture, auditInput} from './support/financeSyntheticSource';

const payment = (id: string, time: number, parentId = 'parent-a'): Document => ({id,
  data: {parentId, amount: 40, paidAt: {toMillis: () => time}, allocationModeUsed: 'wallet_only', reference: id}});

describe('existing loaders: executable synthetic defect characterization', () => {
  it('retrieves every named-parent row before applying the payment output limit', async () => {
    const mock = legacyDb({payments: [payment('late', 30), payment('early', 10), payment('middle', 20), payment('foreign', 1, 'parent-b')]});
    const result = await load(mock.db, 'parent-a', null, null, 1);
    expect(result.map(p => p.id)).toEqual(['early']);
    expect(mock.calls.map(c => [c.path, c.cap, c.returned])).toEqual([
      ['payments', null, 3], ['payments/early/allocations', null, 0],
    ]);
  });
  it('globally caps an unordered subset before sorting, omitting the earliest payment and parent', async () => {
    const mock = legacyDb({payments: [payment('late', 30), payment('middle', 20), payment('early', 10, 'parent-b')]});
    const result = await load(mock.db, null, null, null, 2);
    expect(result.map(p => p.id)).toEqual(['middle', 'late']);
    expect(result.some(p => p.data.parentId === 'parent-b')).toBe(false);
    expect(mock.calls[0]).toMatchObject({cap: 2, returned: 2});
  });
  it('applies neither month predicate when an explicit parent is selected', async () => {
    const mock = legacyDb({payments: [payment('historical', 1)]});
    await load(mock.db, 'parent-a', '2026-06', '2026-06', 1);
    expect(mock.calls[0].filters).toEqual([{field: 'parentId', op: '==', value: 'parent-a'}]);
  });
  it('treats missing and string timestamps as zero; equal numeric times use ID ordering', async () => {
    const mock = legacyDb({payments: [payment('z', 10), payment('a', 10),
      {id: 'missing', data: {parentId: 'parent-a'}},
      {id: 'iso', data: {parentId: 'parent-a', paidAt: '2099-01-01'}}]});
    expect((await load(mock.db, 'parent-a', null, null, 4)).map(p => p.id)).toEqual(['iso', 'missing', 'a', 'z']);
  });
  it('launches one allocation request per selected payment with no independent concurrency cap', async () => {
    const payments = Array.from({length: 9}, (_, n) => payment('p' + n, n));
    const mock = legacyDb({payments, 'payments/p0/allocations': Array.from({length: 25}, (_, n) => ({id: 'a' + n, data: {amount: 1}}))});
    const result = await load(mock.db, 'parent-a', null, null, 9);
    expect(mock.peakAllocations()).toBe(9);
    expect(result[0].allocationDocs).toHaveLength(25);
    expect(mock.calls).toHaveLength(10);
    expect(mock.calls.every(c => c.cap === null)).toBe(true);
    expect(mock.calls.reduce((n, c) => n + c.returned, 0)).toBe(34);
  });
  it('fetches all charge, ledger and month rows with two point reads for each parent', async () => {
    const history = Array.from({length: 31}, (_, n) => ({id: 'history-' + n, data: {parentId: 'parent-a'}}));
    const mock = legacyDb({billingCharges: history, 'parentWallets/parent-a/transactions': history,
      'parentMonthlyReadModels/parent-a/months': history});
    const data = await scoped(mock.db, ['parent-a', 'parent-b']);
    expect(data.charges).toHaveLength(31); expect(data.walletTransactions).toHaveLength(31);
    expect(data.monthlyReadModels).toHaveLength(31);
    expect(mock.calls).toHaveLength(10); expect(mock.calls.every(c => c.cap === null)).toBe(true);
    expect(mock.calls.reduce((n, c) => n + c.returned, 0)).toBe(93);
  });
  it('hash compatibility requires matching report filters, even for identical parent documents', () => {
    const input = auditInput(fixture(3).exhaustive(['parent-a']));
    const parentFiltered = report({...input, parentId: 'parent-a'});
    const writePlan = plan({...input, mode: 'write', parentIds: ['parent-a']});
    expect(parentFiltered.parents).toEqual(writePlan.beforeReport.parents);
    expect(parentFiltered.filters).not.toEqual(writePlan.beforeReport.filters);
    expect(hash(parentFiltered)).not.toBe(hash(writePlan.beforeReport));
  });
  it('a sliced payment set can pass the existing plan limit and acquire a hash without completeness evidence', () => {
    const source = fixture(3), all = auditInput(source.exhaustive(['parent-a']));
    const truncated = {...all, payments: all.payments.slice(0, 1)};
    const partial = plan({...truncated, mode: 'write', parentIds: ['parent-a'], maxPaymentsPerParent: 1, runId: 'synthetic'});
    expect(partial.parentPlans[0].paymentPatches).toHaveLength(1);
    expect(hash(partial.beforeReport)).toMatch(/^[a-f0-9]{64}$/);
    expect(hash(report(all))).not.toBe(hash(report(truncated)));
    expect(() => plan({...all, mode: 'write', parentIds: ['parent-a'], maxPaymentsPerParent: 1})).toThrow();
  });
});
