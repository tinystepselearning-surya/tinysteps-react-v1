import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {writeFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildParentPaymentBackfillDryRunReport as report} from '../src/parentPaymentBackfillAudit';
import {createParentPaymentBackfillReportHash as hash} from '../src/parentPaymentBackfillHash';
import {fixture, auditInput, key} from './support/financeSyntheticSource';
import {evaluateComplete, TransientReadError, type Result, type Page} from './support/financeReadPagination';
import {HOST, openEmulator, PROJECT, type Connection} from './firestoreFinance/emulatorGuard';
import {readPinned, type SDKMetrics} from './firestoreFinance/pinnedSource';
import {runId, seed} from './firestoreFinance/fixtures';
const enabled = process.env.M3_FINANCE_EMULATOR_ONLY === '1';
const limits = {pageSize: 2, requestMs: 3000, durationMs: 15000};
const withoutClock = <T extends {generatedAtMs: number}>(r: T) => ({...r, generatedAtMs: 0});
const evaluate = (result: Result) => evaluateComplete(result, rows => report(auditInput(rows)), hash);
const deny = (result: Result) => {
  let called = false;
  const out = evaluateComplete(result, () => { called = true; return {}; }, () => 'bad');
  expect(called).toBe(false); expect(out.reportHash).toBeNull(); expect(out.report).toBeNull(); expect(out.writeAuthorized).toBe(false);
};
const measurements: {scenario: string; state: string; sdk: SDKMetrics; rows: number; collection: Result['metrics']}[] = [];

describe.skipIf(!enabled)('actual Firestore SDK pinned finance source (synthetic emulator only)', () => {
  let c: Connection;
  beforeAll(async () => {
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe(HOST); expect(process.env.GCLOUD_PROJECT).toBe(PROJECT);
    c = await openEmulator();
  });
  afterAll(async () => {
    await c?.close();
    if (process.env.M3_FINANCE_EVIDENCE_DIR) {
      const dir = resolve(process.env.M3_FINANCE_EVIDENCE_DIR); mkdirSync(dir, {recursive: true});
      writeFileSync(resolve(dir, 'emulator-operations.json'), JSON.stringify({productionBilledReads: 'NOT MEASURED', measurements}, null, 2));
    }
  });
  it.each([0, 1, 2, 3, 9])('completes %i payments with exact page limits and matching complete-source finances', async n => {
    const run = runId(), source = fixture(n); await seed(c, run, source, ['parent-a']);
    const out = await readPinned(c, run, ['parent-a'], limits);
    expect(out.result.state).toBe('COMPLETE');
    const expected = report(auditInput(source.exhaustive(['parent-a'])));
    // Charge document IDs are scoped in the fixture; update the exhaustive identity to match.
    const expectedInput = auditInput(source.exhaustive(['parent-a']));
    expectedInput.charges.forEach(row => row.id += '-parent-a');
    expect(withoutClock(evaluate(out.result).report!)).toEqual(withoutClock(report(expectedInput)));
    expect(out.sdk.maxBufferedDocuments).toBeLessThanOrEqual(2);
    expect(out.sdk.failed).toBe(0); expect(expected.parents).toHaveLength(1);
    measurements.push({scenario: 'payments-' + n, state: out.result.state, sdk: out.sdk, rows: out.result.metrics.uniqueRows, collection: out.result.metrics});
  });
  it('completes empty selected parent scopes with no inferred global population', async () => {
    const out = await readPinned(c, runId(), ['parent-empty'], limits);
    expect(out.result.state).toBe('COMPLETE'); expect(out.result.metrics.uniqueRows).toBe(0);
    expect(out.sdk.attempted).toBe(7); // anchor + four empty collection queries + two absent point reads
  });
  it('isolates equal child IDs across parents and distinct payment allocations', async () => {
    const run = runId(), source = fixture(2, ['parent-a', 'parent-b']);
    for (const parent of ['parent-a', 'parent-b']) for (const payment of [parent + '-p000', parent + '-p001']) {
      source.add({parent, kind: 'allocations', payment}, 'same-id', {chargeId: 'charge-old-' + parent, allocatedAmount: 1});
    }
    await seed(c, run, source, ['parent-a', 'parent-b']);
    const out = await readPinned(c, run, ['parent-b'], limits);
    expect(out.result.state).toBe('COMPLETE');
    expect(evaluate(out.result).report!.parents.map(p => p.summary.parentId)).toEqual(['parent-b']);
    expect(out.result.metrics.uniqueRows).toBe(13);
  });
  it.each(['payment-insert', 'payment-delete', 'payment-update', 'charge-insert', 'ledger-update', 'allocation-insert'] as const)(
    'retains the audit snapshot during %s; a fresh snapshot observes the change', async mutation => {
      const run = runId(), source = fixture(3); await seed(c, run, source, ['parent-a']);
      const baseline = await readPinned(c, run, ['parent-a'], limits);
      let changed = false;
      const mutate = async () => {
        const root = c.db.doc(`financeExperiments/${run}`);
        if (mutation === 'payment-insert') await root.collection('payments').doc('inserted').set({parentId: 'parent-a', amount: 99, allocationModeUsed: 'wallet_only'});
        if (mutation === 'payment-delete') await root.collection('payments').doc('parent-a-p002').delete();
        if (mutation === 'payment-update') await root.collection('payments').doc('parent-a-p002').update({amount: 99});
        if (mutation === 'charge-insert') await root.collection('billingCharges').doc('inserted').set({parentId: 'parent-a', amount: 99, monthKey: '2026-05'});
        if (mutation === 'ledger-update') await root.collection('parentWallets').doc('parent-a').collection('transactions').doc('opening').update({signedAmount: 999});
        if (mutation === 'allocation-insert') await root.collection('payments').doc('parent-a-p000').collection('allocations').doc('inserted').set({allocatedAmount: 99, chargeId: 'charge-old-parent-a'});
      };
      const out = await readPinned(c, run, ['parent-a'], limits, {after: async (req, page) => {
        if (!changed && req.query.kind === (mutation.startsWith('payment-') ? 'payments' : 'charges')) { changed = true; await mutate(); }
        return page;
      }});
      expect(changed).toBe(true); expect(out.result.state).toBe('COMPLETE');
      expect(evaluate(out.result).reportHash).toBe(evaluate(baseline.result).reportHash);
      const fresh = await readPinned(c, run, ['parent-a'], limits);
      expect(fresh.result.state).toBe('COMPLETE');
      expect(evaluate(fresh.result).reportHash).not.toBe(evaluate(baseline.result).reportHash);
      expect(out.result.writeAuthorized).toBe(false);
    });
  it.each([{queryRows: 2}, {parentRows: 3}, {runRows: 3}, {queryAttempts: 1}, {parentAttempts: 1}, {runOperations: 2}])(
    'enforces independent budget %j and blocks all financial output', async budget => {
      const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
      const out = await readPinned(c, run, ['parent-a'], {...limits, ...budget});
      expect(out.result.state).toBe('INCOMPLETE_BUDGET'); deny(out.result);
      expect(out.sdk.attempted).toBeLessThanOrEqual(budget.runOperations || 800);
    });
  it('cancels waiting work on timeout and does not dispatch after abort', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const out = await readPinned(c, run, ['parent-a'], {...limits, requestMs: 100}, {before: req => new Promise(resolve => {
      req.signal.addEventListener('abort', () => resolve(), {once: true});
    })});
    expect(out.result.state).toBe('INCOMPLETE_BUDGET'); deny(out.result); expect(out.sdk.attempted).toBe(1);
  });
  it('fails closed at the byte cap instead of retaining arbitrarily large documents', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const out = await readPinned(c, run, ['parent-a'], limits, {}, 50);
    expect(out.result.state).toBe('INCOMPLETE_BUDGET'); expect(out.result.reason).toBe('byte_budget'); deny(out.result);
  });
  it('retries injected transient failure while maintaining the same real snapshot', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']); let failures = 0;
    const out = await readPinned(c, run, ['parent-a'], limits, {before: async () => {
      if (failures++ < 1) throw new TransientReadError('injected-before-dispatch');
    }});
    expect(out.result.state).toBe('COMPLETE'); expect(out.result.metrics.retries).toBe(1);
    expect(out.sdk.failed).toBe(0); // Injected failure was not an SDK dispatch.
  });
  it('rejects exhausted retries and concurrent allocation worker failure', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    for (const kind of ['payments', 'allocations']) {
      const out = await readPinned(c, run, ['parent-a'], limits, {before: async req => {
        if (req.query.kind === kind) throw new TransientReadError('injected');
      }});
      expect(out.result.state).toBe('INCOMPLETE_BUDGET'); deny(out.result);
    }
  });
  it('deduplicates a replayed real page; invalid cursor/snapshot evidence fail closed', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    let first: Page | undefined, replayed = false;
    const replay = await readPinned(c, run, ['parent-a'], limits, {after: async (req, page) => {
      if (req.query.kind === 'payments') {
        if (!req.cursor) first = page;
        else if (!replayed) { replayed = true; return first!; }
      }
      return page;
    }});
    expect(replay.result.state).toBe('COMPLETE'); expect(replay.result.metrics.duplicatePages).toBe(1);
    for (const field of ['cursor', 'revision']) {
      const out = await readPinned(c, run, ['parent-a'], limits, {after: async (_, page) =>
        field === 'cursor' ? {...page, next: 'invalid'} : {...page, revision: 'different-snapshot'}});
      expect(out.result.state).toBe(field === 'cursor' ? 'INVALID_SOURCE' : 'INCOMPLETE_CONCURRENT_CHANGE'); deny(out.result);
    }
  });
  it('keeps the snapshot while mutations repeat between controlled retries', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const initial = await readPinned(c, run, ['parent-a'], limits); let attempts = 0;
    const out = await readPinned(c, run, ['parent-a'], limits, {before: async req => {
      if (req.query.kind === 'payments' && attempts++ < 2) {
        await c.db.doc(`financeExperiments/${run}/payments/parent-a-p002`).update({amount: 700 + attempts});
        throw new TransientReadError('injected-between-real-mutations');
      }
    }});
    expect(out.result.state).toBe('COMPLETE'); expect(out.result.metrics.retries).toBe(2);
    expect(evaluate(out.result).reportHash).toBe(evaluate(initial.result).reportHash);
  });
  it('bounds the emulator malformed-query timeout without producing a report', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const original = c.rpc.runQuery.bind(c.rpc);
    const spy = vi.spyOn(c.rpc, 'runQuery').mockImplementationOnce((req, options) => original({...req,
      structuredQuery: {...req!.structuredQuery, from: [{collectionId: 'invalid/path'}]}}, options));
    try {
      const out = await readPinned(c, run, ['parent-a'], limits);
      expect(out.result.state).toBe('INCOMPLETE_BUDGET'); expect(out.sdk.failed).toBe(1);
      expect(out.sdk.timeouts + out.sdk.cancelled).toBeGreaterThan(0); deny(out.result);
    } finally { spy.mockRestore(); }
  });
  it('accounts for documents received before an injected mid-stream SDK error and bounds retry reads', async () => {
    const {PassThrough} = await import('node:stream');
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const original = c.rpc.runQuery.bind(c.rpc);
    const spy = vi.spyOn(c.rpc, 'runQuery').mockImplementationOnce((request, options) => {
      const upstream = original(request, options);
      const relay = Object.assign(new PassThrough({objectMode: true}), {cancel: () => upstream.cancel()});
      let failed = false;
      upstream.on('data', chunk => {
        if (failed) return;
        relay.emit('data', chunk);
        if (chunk.document) { failed = true; upstream.cancel(); relay.emit('error', {code: 14}); }
      });
      upstream.on('error', error => { if (!failed) relay.emit('error', error); });
      upstream.on('end', () => { if (!failed) relay.emit('end'); });
      return relay as ReturnType<typeof original>;
    });
    try {
      const out = await readPinned(c, run, ['parent-a'], {...limits, runRows: 2});
      expect(out.result.state).toBe('INCOMPLETE_BUDGET');
      expect(out.sdk.returnedDocuments).toBe(1); expect(out.sdk.failed).toBe(1);
      expect(out.result.metrics.retries).toBe(1); expect(out.sdk.attempted).toBe(2); deny(out.result);
    } finally { spy.mockRestore(); }
  });
  it('exercises installed SDK read-only transactions and readTime across collections', async () => {
    const run = runId(), a = c.db.doc(`financeExperiments/${run}/probes/a`), b = c.db.doc(`financeExperiments/${run}/other/b`);
    await a.set({n: 1}); await b.set({n: 1});
    await c.db.runTransaction(async tx => {
      const initial = await tx.get(a); await a.update({n: 2}); await b.update({n: 2});
      expect((await tx.get(a)).get('n')).toBe(1);
      expect((await tx.get(b)).get('n')).toBe(1);
      expect((await tx.get(b)).readTime.isEqual(initial.readTime)).toBe(true);
    }, {readOnly: true});
    const time = (await a.get()).readTime; await a.update({n: 3});
    await c.db.runTransaction(async tx => expect((await tx.get(a)).get('n')).toBe(2), {readOnly: true, readTime: time});
  });
  it.each([
    {name: 'many-payments', payments: 80, history: 0, allocations: 0, parents: 1, concurrency: 3, runRows: 4000},
    {name: 'many-allocations', payments: 8, history: 0, allocations: 30, parents: 1, concurrency: 2, runRows: 4000},
    {name: 'long-histories', payments: 2, history: 100, allocations: 0, parents: 1, concurrency: 3, runRows: 4000},
    {name: 'unequal-parents', payments: 10, history: 20, allocations: 4, parents: 3, concurrency: 3, runRows: 4000},
    {name: 'high-concurrency', payments: 16, history: 0, allocations: 3, parents: 1, concurrency: 8, runRows: 4000},
    {name: 'over-budget', payments: 80, history: 40, allocations: 2, parents: 1, concurrency: 3, runRows: 35},
  ])('measures bounded SDK work for $name', async scenario => {
    const parents = Array.from({length: scenario.parents}, (_, i) => 'parent-' + i), source = fixture(0, parents), run = runId();
    for (const [i, parent] of parents.entries()) {
      const count = scenario.payments + i;
      for (let p = 0; p < count; p++) {
        const id = parent + '-payment-' + String(p).padStart(3, '0');
        source.add({parent, kind: 'payments'}, id, {parentId: parent, amount: 1, allocationModeUsed: 'wallet_only'});
        for (let a = 0; a < scenario.allocations; a++) source.add({parent, kind: 'allocations', payment: id}, 'a' + String(a).padStart(3, '0'), {amount: 1});
      }
      for (let h = 0; h < scenario.history; h++) {
        source.add({parent, kind: 'transactions'}, 'history-' + h, {signedAmount: 1});
        source.add({parent, kind: 'months'}, 'month-' + h, {billedAmount: 1});
      }
      // The malformed month IDs deliberately exercise transport scale only, not approved financial eligibility.
      expect(source.tables.get(key({parent, kind: 'payments'}))).toHaveLength(count);
    }
    await seed(c, run, source, parents);
    const out = await readPinned(c, run, parents, {...limits, pageSize: 10, allocationConcurrency: scenario.concurrency, runRows: scenario.runRows});
    expect(out.result.state).toBe(scenario.name === 'over-budget' ? 'INCOMPLETE_BUDGET' : 'COMPLETE');
    expect(out.sdk.returnedDocuments).toBeLessThanOrEqual(scenario.runRows);
    expect(out.sdk.maxBufferedDocuments).toBeLessThanOrEqual(10);
    expect(out.sdk.peakAllocationRequests).toBeLessThanOrEqual(scenario.concurrency);
    if (out.result.state !== 'COMPLETE') deny(out.result);
    measurements.push({scenario: scenario.name, state: out.result.state, sdk: out.sdk, rows: out.result.metrics.uniqueRows, collection: out.result.metrics});
  });

});
