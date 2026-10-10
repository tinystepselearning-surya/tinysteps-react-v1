import {describe, expect, it, vi} from 'vitest';
import {buildParentPaymentBackfillDryRunReport as report} from '../src/parentPaymentBackfillAudit';
import {createParentPaymentBackfillReportHash as hash} from '../src/parentPaymentBackfillHash';
import {buildParentPaymentBackfillWritePlan} from '../src/parentPaymentBackfillWrite';
import {collectFinance, DEFAULT_LIMITS, evaluateComplete, TransientReadError, type Json, type Limits, type Page, type Result} from './support/financeReadPagination';
import {auditInput, fixture, key, SyntheticFinanceSource} from './support/financeSyntheticSource';

const limits = (overrides: Partial<Limits> = {}): Limits => ({...DEFAULT_LIMITS, pageSize: 2, ...overrides});
const withoutClock = <T extends {generatedAtMs: number}>(value: T) => ({...value, generatedAtMs: 0});
const evaluate = (result: Result) => evaluateComplete(result, rows => report(auditInput(rows)), hash);
function noAuthority(result: Result) {
  const calculate = vi.fn(), makeHash = vi.fn();
  const out = evaluateComplete(result, calculate, makeHash);
  expect(out.report).toBeNull(); expect(out.reportHash).toBeNull();
  expect(out.writeAuthorized).toBe(false);
  expect(calculate).not.toHaveBeenCalled(); expect(makeHash).not.toHaveBeenCalled();
}

describe('offline complete-scope differential reference', () => {
  it.each([0, 1, 2, 3, 4, 7, 12])('matches exhaustive report and hash with %i payments per parent', async count => {
    const source = fixture(count, ['parent-a', 'parent-b']);
    const input = auditInput(source.exhaustive(['parent-a', 'parent-b']));
    const before = JSON.stringify(input);
    const expected = report(input);
    const result = await collectFinance(source, ['parent-b', 'parent-a'], limits());
    expect(result.state).toBe('COMPLETE');
    const actual = evaluate(result);
    expect(withoutClock(actual.report!)).toEqual(withoutClock(expected));
    expect(actual.reportHash).toBe(hash(expected));
    expect(JSON.stringify(input)).toBe(before);
    expect(source.requests.every(r => r.limit <= 2)).toBe(true);
    expect(result.productionBilledReads).toBeNull();
  });

  it('fully exhausts an entirely empty approved scope', async () => {
    const source = new SyntheticFinanceSource();
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('COMPLETE');
    expect(result.metrics).toMatchObject({sourceCalls: 8, pageAttempts: 6, documentsReturned: 0});
    const actual = evaluateComplete(result, rows => report(auditInput(rows, {parentId: 'parent-a'})), hash);
    expect(actual.report!.parents).toHaveLength(1);
    expect(actual.report!.parents[0].payments).toHaveLength(0);
  });

  it('preserves receipt-month filtering without truncating historical charges or ledger', async () => {
    const source = fixture(3), parent = 'parent-a';
    const rows = source.tables.get(key({parent, kind: 'payments'}))!;
    for (const [i, month] of ['2026-05', '2026-06', '2026-07'].entries()) rows[i].data.receiptMonthKey = month;
    const options = {parentId: parent, fromMonth: '2026-06', toMonth: '2026-06'};
    const result = await collectFinance(source, [parent], limits());
    const actual = evaluateComplete(result, all => report(auditInput(all, options)), hash).report!;
    expect(withoutClock(actual)).toEqual(withoutClock(report(auditInput(source.exhaustive([parent]), options))));
    expect(actual.parents[0].payments.map(p => p.paymentId)).toEqual(['parent-a-p001']);
    expect(actual.parents[0].summary).toMatchObject({totalActiveBilledCharges: 175, derivedLedgerBalance: 140});
  });

  it('preserves signed refund/reversal ledger entries and non-positive payment diagnostics', async () => {
    const source = fixture(0), parent = 'parent-a';
    source.add({parent, kind: 'transactions'}, 'reversed-credit', {amount: 12.25, direction: 'credit'});
    source.add({parent, kind: 'transactions'}, 'reversal-debit', {amount: 12.25, direction: 'debit'});
    source.add({parent, kind: 'payments'}, 'refund-payment', {parentId: parent, amount: -10, allocationModeUsed: 'wallet_only'});
    source.add({parent, kind: 'payments'}, 'zero-payment', {parentId: parent, amount: 0, allocationModeUsed: 'wallet_only'});
    const result = await collectFinance(source, [parent], limits());
    const actual = evaluate(result).report!;
    expect(withoutClock(actual)).toEqual(withoutClock(report(auditInput(source.exhaustive([parent])))));
    expect(actual.parents[0].summary.derivedLedgerBalance).toBe(20);
    expect(actual.parents[0].payments.every(p => p.warnings.includes('payment amount <= 0'))).toBe(true);
  });

  it('matches all classifications, archived/refunded/reversed charges and legacy timestamp forms', async () => {
    const source = fixture(0);
    const parent = 'parent-a';
    for (const [index, data] of ([
      {amount: 10, allocationModeUsed: 'wallet_only'},
      {amount: 20, paidAt: '', allocationModeUsed: 'wallet_only'},
      {amount: 30, paidAt: 'bad-date', allocationModeUsed: 'wallet_only'},
      {amount: 40, paidAt: '2026-06-01', archived: true},
      {amount: 50, allocationModeUsed: 'fifo_then_wallet', allocatedAmount: 10},
      {amount: 60, appliedAmount: 10, appliedChargeIds: ['charge-old']},
      {amount: 70, allocationModeUsed: 'fifo_then_wallet', allocatedAmount: 70},
    ] as Record<string, Json>[]).entries()) {
      const id = 'p' + index;
      source.add({parent, kind: 'payments'}, id, {parentId: parent, reference: id, ...data});
    }
    source.add({parent, kind: 'allocations', payment: 'p6'}, 'allocation', {chargeId: 'charge-old', allocatedAmount: 70});
    for (const status of ['refunded', 'reversed', 'void', 'cancelled']) {
      source.add({parent, kind: 'charges'}, 'excluded-' + status, {parentId: parent, amount: 999, status, monthKey: '2026-05'});
    }
    for (const includeArchived of [false, true]) {
      const expected = report(auditInput(source.exhaustive([parent]), {includeArchived}));
      const result = await collectFinance(source, [parent], limits());
      const actual = evaluateComplete(result, rows => report(auditInput(rows, {includeArchived})), hash);
      expect(result.state).toBe('COMPLETE');
      expect(withoutClock(actual.report!)).toEqual(withoutClock(expected));
      expect(actual.reportHash).toBe(hash(expected));
      expect(actual.report!.parents[0].summary.totalActiveBilledCharges).toBe(175);
    }
  });

  it('keeps repeated transport pages distinct from duplicate financial transactions', async () => {
    const source = fixture(3);
    source.add({parent: 'parent-a', kind: 'transactions'}, 'duplicate-event', {signedAmount: 40, transactionId: 'tx-parent-a-p000'});
    let first: Page | undefined, repeated = false;
    source.hook = async (req, normal) => {
      if (req.query.kind === 'payments') {
        if (!req.cursor) first = normal;
        else if (!repeated) { repeated = true; return first!; }
      }
      return normal;
    };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('COMPLETE'); expect(result.metrics.duplicatePages).toBe(1);
    const actual = evaluate(result).report!;
    expect(actual.parents[0].anomalies.some(a => a.code === 'DUPLICATE_WALLET_TRANSACTION_ID')).toBe(true);
    expect(withoutClock(actual)).toEqual(withoutClock(report(auditInput(source.exhaustive(['parent-a'])))));
  });

  it('agrees with an independent integer-cent FIFO oracle for 32 deterministic datasets', async () => {
    for (let seed = 0; seed < 32; seed++) {
      const source = fixture(0), parent = 'parent-a';
      source.tables.set(key({parent, kind: 'payments'}), []);
      const amounts = [seed * 7 + 1.25, seed * 3 + 11.5, 25.75];
      for (const [i, amount] of amounts.entries()) source.add({parent, kind: 'payments'}, 'oracle-' + i,
        {parentId: parent, amount, allocationModeUsed: 'wallet_only', reference: 'oracle-' + i, paidAt: '2026-06-20'});
      // Independent cents-only shadow ledger for this deliberately simple domain.
      let may = 7500, june = 10000, allocated = 0, advance = 0;
      for (const amount of amounts) {
        let available = Math.round(amount * 100);
        const first = Math.min(may, available); may -= first; available -= first; allocated += first;
        const second = Math.min(june, available); june -= second; available -= second; allocated += second;
        advance += available;
      }
      const result = await collectFinance(source, [parent], limits({pageSize: (seed % 4) + 1}));
      const summary = evaluate(result).report!.parents[0].summary;
      expect(summary.totalWouldAllocate).toBe(allocated / 100);
      expect(summary.totalWouldRemainAdvance).toBe(advance / 100);
      expect(summary.existingWalletBalance).toBe(20);
      expect(summary.derivedLedgerBalance).toBe(20); // opening + refund retained
    }
  });

  it('preserves write-plan/hash compatibility and does not claim write authorization', async () => {
    const source = fixture(3);
    const expectedInput = auditInput(source.exhaustive(['parent-a']));
    const expected = buildParentPaymentBackfillWritePlan({...expectedInput, mode: 'write', parentIds: ['parent-a'], runId: 'synthetic-run'});
    const result = await collectFinance(source, ['parent-a'], limits());
    const actual = evaluateComplete(result, rows => buildParentPaymentBackfillWritePlan({
      ...auditInput(rows), mode: 'write', parentIds: ['parent-a'], runId: 'synthetic-run',
    }), value => hash(value.beforeReport));
    expect(actual.report!.parentPlans).toEqual(expected.parentPlans);
    expect(actual.reportHash).toBe(hash(expected.beforeReport));
    expect(actual.writeAuthorized).toBe(false);
  });
});

describe('fail-closed traversal contracts', () => {
  it.each([
    {queryRows: 1}, {parentRows: 2}, {runRows: 2}, {queryAttempts: 1},
    {parentAttempts: 1}, {runOperations: 1},
  ])('blocks authoritative output when budget is exhausted: %j', async cap => {
    const result = await collectFinance(fixture(3), ['parent-a'], limits(cap));
    expect(result.state).toBe('INCOMPLETE_BUDGET'); noAuthority(result);
  });
  it('requires terminal empty-page evidence even at an exact row boundary', async () => {
    const result = await collectFinance(fixture(2), ['parent-a'], limits({queryRows: 2}));
    expect(result.state).toBe('INCOMPLETE_BUDGET'); noAuthority(result);
  });
  it('has independently bounded allocation concurrency and deterministic financial output', async () => {
    for (const concurrency of [1, 2, 3]) {
      const source = fixture(7);
      source.hook = async (_, normal) => { await new Promise(resolve => setTimeout(resolve, 1)); return normal; };
      const result = await collectFinance(source, ['parent-a'], limits({allocationConcurrency: concurrency}));
      expect(result.state).toBe('COMPLETE'); expect(source.peak).toBe(concurrency);
      expect(result.metrics.peakAllocationRequests).toBe(concurrency);
      expect(evaluate(result).reportHash).toBe(hash(report(auditInput(source.exhaustive(['parent-a'])))));
    }
  });
  it('bounds concurrent row reservations across allocation queries', async () => {
    const source = fixture(6);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) source.add(
      {parent: 'parent-a', kind: 'allocations', payment: 'parent-a-p00' + i}, 'a' + j, {chargeId: 'charge-old', amount: 1});
    const result = await collectFinance(source, ['parent-a'], limits({runRows: 30}));
    expect(result.state).toBe('INCOMPLETE_BUDGET'); expect(result.metrics.documentsReturned).toBeLessThanOrEqual(30);
    noAuthority(result);
  });
  it('records exact injected operation counts, never billed reads', async () => {
    const result = await collectFinance(fixture(3), ['parent-a'], limits());
    expect(result.state).toBe('COMPLETE');
    expect(result.metrics).toEqual({sourceCalls: 20, pageAttempts: 18, documentsReturned: 13,
      uniqueRows: 13, retries: 0, duplicatePages: 0, peakAllocationRequests: 3});
    expect(result.productionBilledReads).toBeNull();
  });
  it('classifies exhausted transient retries as incomplete and suppresses calculation', async () => {
    const source = fixture();
    source.hook = async () => { throw new TransientReadError('synthetic'); };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INCOMPLETE_BUDGET');
    expect(result.reason).toBe('transient_retry_exhausted'); noAuthority(result);
  });
  it('retries transient errors without skipping or double-counting a page', async () => {
    const source = fixture(3); let thrown = false;
    source.hook = async (_, normal) => { if (!thrown) { thrown = true; throw new TransientReadError('synthetic'); } return normal; };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('COMPLETE'); expect(result.metrics.retries).toBe(1);
    expect(evaluate(result).reportHash).toBe(hash(report(auditInput(source.exhaustive(['parent-a'])))));
  });
  it.each(['insert', 'delete', 'update', 'empty-scope'] as const)('detects concurrent %s via whole-scope revision', async mode => {
    const source = fixture(3);
    source.endHook = () => source.change(() => {
      if (mode === 'delete') source.tables.delete(key({parent: 'parent-a', kind: 'payments'}));
      else if (mode === 'update') source.tables.get(key({parent: 'parent-a', kind: 'payments'}))![0].data.amount = 999;
      else if (mode === 'insert') source.add({parent: 'parent-a', kind: 'payments'}, 'new-payment', {parentId: 'parent-a', amount: 1});
      else source.add({parent: 'parent-a', kind: 'allocations', payment: 'parent-a-p000'}, 'mutation', {mode});
    });
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INCOMPLETE_CONCURRENT_CHANGE'); noAuthority(result);
  });
  it('rejects per-page revision drift before producing a report', async () => {
    const source = fixture(); source.hook = async (_, normal) => ({...normal, revision: 'changed'});
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INCOMPLETE_CONCURRENT_CHANGE'); noAuthority(result);
  });
  it.each(['scope', 'oversize', 'order', 'cursor', 'data'] as const)('rejects invalid source %s without leaking raw errors', async mode => {
    const source = fixture(3);
    source.hook = async (_, normal) => {
      if (!normal.rows.length) return normal;
      if (mode === 'scope') normal.rows[0].parent = 'unapproved';
      if (mode === 'oversize') normal.rows.push(normal.rows[0]);
      if (mode === 'order') normal.rows.reverse();
      if (mode === 'cursor') normal.next = 'private-path';
      if (mode === 'data') normal.rows[0].data.amount = NaN;
      return normal;
    };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INVALID_SOURCE'); noAuthority(result);
    expect(JSON.stringify(result)).not.toMatch(/unapproved|private-path/);
  });
  it('rejects malformed manifests before any injected read', async () => {
    const source = fixture(); const begin = vi.spyOn(source, 'begin');
    for (const parents of [[], ['bad/path'], ['parent-a', 'parent-a'], Array(13).fill('parent-a')]) {
      noAuthority(await collectFinance(source, parents, limits()));
    }
    expect(begin).not.toHaveBeenCalled();
  });
  it('stops non-progressing replay and never exposes partial rows', async () => {
    const source = fixture(3); let first: Page;
    source.hook = async (_, normal) => { first ||= normal; return first; };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INCOMPLETE_BUDGET'); expect(result).not.toHaveProperty('rows'); noAuthority(result);
  });
  it('rejects altered duplicates even without revision change', async () => {
    const source = fixture(3); let first: Page;
    source.hook = async (req, normal) => {
      if (!req.cursor) { first = structuredClone(normal); return normal; }
      first.rows[0].data.amount = 999; return first;
    };
    const result = await collectFinance(source, ['parent-a'], limits());
    expect(result.state).toBe('INCOMPLETE_CONCURRENT_CHANGE'); noAuthority(result);
  });
  it('times out, aborts the source and ignores late results', async () => {
    const source = fixture(); let aborted = false;
    source.hook = (req, normal) => new Promise(resolve => {
      req.signal.addEventListener('abort', () => { aborted = true; resolve(normal); }, {once: true});
    });
    const result = await collectFinance(source, ['parent-a'], limits({requestMs: 10}));
    expect(result.state).toBe('INCOMPLETE_BUDGET'); expect(aborted).toBe(true); noAuthority(result);
  });
  it('rejects forged completion capabilities and isolates repeated evaluator mutations', async () => {
    const result = await collectFinance(fixture(), ['parent-a'], limits());
    noAuthority({...result});
    const first = evaluate(result);
    evaluateComplete(result, rows => { rows.length = 0; return {}; }, () => 'synthetic');
    expect(evaluate(result).reportHash).toBe(first.reportHash);
  });
  it('binds opaque deterministic source cursors to scope and revision', async () => {
    const source = fixture(3, ['parent-a', 'parent-b']);
    const revision = await source.begin(['parent-a', 'parent-b']);
    const req = {query: {parent: 'parent-a', kind: 'payments' as const}, cursor: null, limit: 1, revision, signal: new AbortController().signal};
    const first = await source.page(req);
    expect((await source.page(req)).next).toBe(first.next);
    expect(first.next).toMatch(/^[a-f0-9]{64}$/);
    await expect(source.page({...req, cursor: first.next, query: {...req.query, parent: 'parent-b'}})).rejects.toThrow('invalid_cursor');
    await expect(source.page({...req, cursor: first.next, revision: 'r99'})).rejects.toThrow('invalid_cursor');
  });
});
