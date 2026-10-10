import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import type * as admin from 'firebase-admin';
import {buildParentPaymentBackfillDryRunReport as report} from '../src/parentPaymentBackfillAudit';
import {createParentPaymentBackfillReportHash as hash} from '../src/parentPaymentBackfillHash';
import {buildParentPaymentBackfillWritePlan as plan} from '../src/parentPaymentBackfillWrite';
import {fixture, auditInput, key, type SyntheticFinanceSource} from './support/financeSyntheticSource';
import {evaluateComplete, type Result} from './support/financeReadPagination';
import {openEmulator, type Connection} from './firestoreFinance/emulatorGuard';
import {readPinned} from './firestoreFinance/pinnedSource';
import {offlineIssuer} from './firestoreFinance/certificate';
import {path, runId, seed} from './firestoreFinance/fixtures';
const enabled = process.env.M3_FINANCE_EMULATOR_ONLY === '1';
const limits = {pageSize: 2, requestMs: 3000, durationMs: 15000};
const withoutClock = <T extends {generatedAtMs: number}>(r: T) => ({...r, generatedAtMs: 0});
function reference(source: SyntheticFinanceSource, parents = ['parent-a']) {
  const input = auditInput(source.exhaustive(parents));
  input.charges.forEach(row => row.id += '-' + String(row.data.parentId)); return input;
}
const calc = (r: Result) => evaluateComplete(r, rows => report(auditInput(rows)), hash);

describe.skipIf(!enabled)('Firestore financial compatibility and offline certificate', () => {
  let c: Connection;
  beforeAll(async () => { c = await openEmulator(); }); afterAll(async () => { await c?.close(); });
  it.each([40, 175, 250])('preserves partial/full/overpayment totals and write plans for amount %i', async amount => {
    const run = runId(), source = fixture(1);
    source.tables.get(key({parent: 'parent-a', kind: 'payments'}))![0].data.amount = amount;
    source.tables.get(key({parent: 'parent-a', kind: 'wallet'}))![0].data.currentBalance = amount + 20;
    source.tables.get(key({parent: 'parent-a', kind: 'transactions'}))!.find(r => r.id.startsWith('tx-'))!.data.signedAmount = amount;
    await seed(c, run, source, ['parent-a']);
    const {result} = await readPinned(c, run, ['parent-a'], limits);
    const expected = reference(source);
    expect(calc(result).reportHash).toBe(hash(report(expected)));
    const actualPlan = evaluateComplete(result, rows => plan({...auditInput(rows), mode: 'write', parentIds: ['parent-a'], runId: 'test'}), p => hash(p.beforeReport));
    expect(actualPlan.report!.parentPlans).toEqual(plan({...expected, mode: 'write', parentIds: ['parent-a'], runId: 'test'}).parentPlans);
    expect(calc(result).report!.parents[0].summary.totalWouldAllocate).toBe(Math.min(amount, 175));
    expect(calc(result).report!.parents[0].summary.totalWouldRemainAdvance).toBe(Math.max(0, amount - 175));
  });
  it('normalizes stored Timestamp/Date with toDate rounding, while preserving numeric/string/invalid/missing timestamps', async () => {
    const {Timestamp} = await import('@google-cloud/firestore');
    const {loadParentPaymentBackfillPayments: legacyLoad} = await import('../src/parentPaymentBackfillDryRun');
    const source = fixture(8), run = runId(); await seed(c, run, source, ['parent-a']);
    const expected = reference(source);
    const stamps = [undefined, Timestamp.fromDate(new Date('2026-05-01')), new Date('2026-06-01'),
      Date.parse('2026-06-02'), '2026-06-03', 'invalid', new Timestamp(1781917200, 123800000), Timestamp.fromDate(new Date('2026-05-01'))];
    for (let i = 0; i < stamps.length; i++) {
      const data = {...expected.payments[i].data}; delete data.paidAt; delete data.createdAt;
      if (stamps[i] !== undefined) data.paidAt = stamps[i];
      expected.payments[i].data = data;
      await c.db.doc(path(run, {parent: 'parent-a', kind: 'payments'}, expected.payments[i].id)).set(data);
    }
    const out = await readPinned(c, run, ['parent-a'], limits);
    expect(out.result.state).toBe('COMPLETE'); expect(calc(out.result).reportHash).toBe(hash(report(expected)));
    const root = c.db.doc(`financeExperiments/${run}`);
    expect((await root.collection('payments').orderBy('paidAt').limit(20).get()).size).toBe(7); // Missing sort field excluded.
    const db = {collection: (name: string) => root.collection(name)} as unknown as admin.firestore.Firestore;
    const legacy = await legacyLoad(db, 'parent-a', null, null, 8);
    expect(legacy[0].id).toBe('parent-a-p000'); // Missing -> zero in loader, last in pure report.
    expect(calc(out.result).report!.parents[0].payments.at(-1)!.paymentId).toBe('parent-a-p005');
  });
  it('preserves cross-month, archive/refund/reversal, duplicate-event and existing allocation semantics', async () => {
    const source = fixture(4, ['parent-a', 'parent-b']), run = runId();
    for (const parent of ['parent-a', 'parent-b']) {
      const payments = source.tables.get(key({parent, kind: 'payments'}))!;
      payments[0].data.archived = true; payments[1].data.receiptMonthKey = '2026-07';
      payments[2].data.allocationModeUsed = 'fifo_then_wallet'; payments[2].data.allocatedAmount = 10;
      payments[2].data.allocations = [{chargeId: 'inline-wrong', allocatedAmount: 9}];
      source.add({parent, kind: 'allocations', payment: payments[2].id}, 'existing', {chargeId: 'charge-old-' + parent, allocatedAmount: 10});
      source.add({parent, kind: 'transactions'}, 'duplicate-event', {transactionId: 'tx-' + payments[3].id, signedAmount: 40});
      source.add({parent, kind: 'transactions'}, 'reversal-credit', {amount: 5, direction: 'credit'});
      source.add({parent, kind: 'transactions'}, 'reversal-debit', {amount: 5, direction: 'debit'});
      for (const status of ['refunded', 'reversed', 'void', 'cancelled']) source.add({parent, kind: 'charges'}, status, {parentId: parent, amount: 999, status, monthKey: '2026-05'});
    }
    await seed(c, run, source, ['parent-a', 'parent-b']);
    const {result} = await readPinned(c, run, ['parent-a', 'parent-b'], limits);
    const expected = reference(source, ['parent-a', 'parent-b']);
    expect(withoutClock(calc(result).report!)).toEqual(withoutClock(report(expected)));
    expect(calc(result).reportHash).toBe(hash(report(expected)));
    expect(calc(result).report!.parents.every(p => p.anomalies.some(a => a.code === 'DUPLICATE_WALLET_TRANSACTION_ID'))).toBe(true);
  });
  it('preserves wallet-only allocation and rejects certificate issuance from instrumented sources', async () => {
    const source = fixture(1), run = runId();
    source.tables.get(key({parent: 'parent-a', kind: 'payments'}))![0].data.allocationModeUsed = 'wallet_only';
    await seed(c, run, source, ['parent-a']);
    const out = await readPinned(c, run, ['parent-a'], limits);
    expect(calc(out.result).reportHash).toBe(hash(report(reference(source))));
    const instrumented = await readPinned(c, run, ['parent-a'], limits, {after: async (_request, page) => page});
    expect(instrumented.result.state).toBe('COMPLETE');
    expect(() => offlineIssuer(['parent-a']).issue(instrumented.result, 'untrusted-hook')).toThrow('UNVERIFIED_SOURCE');
  });
  it('is idempotent after applying a plan only to synthetic emulator records', async () => {
    const source = fixture(3), run = runId(); source.tables.set(key({parent: 'parent-a', kind: 'months'}), []);
    await seed(c, run, source, ['parent-a']);
    const first = await readPinned(c, run, ['parent-a'], limits);
    const p = evaluateComplete(first.result, rows => plan({...auditInput(rows), mode: 'write', parentIds: ['parent-a'], runId: 'synthetic'}), v => hash(v.beforeReport)).report!;
    const root = c.db.doc(`financeExperiments/${run}`), batch = c.db.batch();
    for (const pp of p.parentPlans) {
      for (const patch of pp.paymentPatches) batch.set(root.collection('payments').doc(patch.paymentId), patch.data, {merge: true});
      for (const patch of pp.allocationDocPatches) batch.set(root.collection('payments').doc(patch.paymentId).collection('allocations').doc(patch.allocationDocId), patch.data);
      for (const patch of pp.chargePatches) batch.set(root.collection('billingCharges').doc(patch.chargeId), {...patch.data,
        lastAllocatedAt: patch.lastAllocatedAtIso, paidAt: patch.paidAtIso}, {merge: true});
    }
    await batch.commit();
    const second = await readPinned(c, run, ['parent-a'], limits);
    const rerun = evaluateComplete(second.result, rows => plan({...auditInput(rows), mode: 'write', parentIds: ['parent-a']}), v => hash(v.beforeReport)).report!;
    expect(rerun.parentPlans[0].status).toBe('skip'); expect(rerun.parentPlans[0].paymentPatches).toHaveLength(0);
    expect(rerun.parentPlans[0].chargePatches).toHaveLength(0);
  });
  it('rejects a stale document updateTime, but it cannot protect another initially empty scope', async () => {
    const run = runId(), ref = c.db.doc(`financeExperiments/${run}/payments/p`);
    await ref.set({amount: 1}); const old = await ref.get(); await ref.update({amount: 2});
    await expect(ref.update({amount: 3}, {lastUpdateTime: old.updateTime!})).rejects.toMatchObject({code: 9});
    const current = await ref.get(); await ref.collection('allocations').doc('new').set({amount: 1});
    await expect(ref.update({amount: 4}, {lastUpdateTime: current.updateTime!})).resolves.toBeDefined();
  });
  it('issues only from an attested full source; rejects tampering, forged completion and foreign scopes', async () => {
    const source = fixture(3), run = runId(); await seed(c, run, source, ['parent-a']);
    const {result} = await readPinned(c, run, ['parent-a'], limits);
    const issuer = offlineIssuer(['parent-a']); const token = issuer.issue(result, 'approval-1');
    expect(() => issuer.issue({...result}, 'forged')).toThrow('UNVERIFIED_SOURCE');
    expect(() => offlineIssuer(['parent-b']).issue(result, 'foreign')).toThrow('UNVERIFIED_SOURCE');
    expect(() => issuer.consumeForOfflinePlanning(token + '0', result)).toThrow('UNTRUSTED_CERTIFICATE');
    expect(() => issuer.issue(result, 'approval-1')).toThrow('IDEMPOTENCY_REUSE');
    const fresh = await readPinned(c, run, ['parent-a'], limits);
    const proposal = issuer.consumeForOfflinePlanning(token, fresh.result);
    expect(proposal.writeAuthorized).toBe(false); expect(proposal.requiresAtomicRevalidation).toBe(true);
    expect(() => issuer.consumeForOfflinePlanning(token, fresh.result)).toThrow('REPLAY_OR_UNKNOWN');
  });
  it('rejects expired certificates, incomplete results and changed sources before planning', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const {result} = await readPinned(c, run, ['parent-a'], limits);
    let clock = Date.parse('2026-06-25'); const issuer = offlineIssuer(['parent-a'], () => clock);
    const expired = issuer.issue(result, 'expired'); clock += 60000;
    expect(() => issuer.consumeForOfflinePlanning(expired, result)).toThrow('CERTIFICATE_EXPIRED');
    const bounded = await readPinned(c, run, ['parent-a'], {...limits, runRows: 1});
    expect(() => issuer.issue(bounded.result, 'incomplete')).toThrow('UNVERIFIED_SOURCE');
    const token = issuer.issue(result, 'change');
    await c.db.doc(`financeExperiments/${run}/parentWallets/parent-a/transactions/opening`).update({signedAmount: 99});
    const fresh = await readPinned(c, run, ['parent-a'], limits);
    expect(() => issuer.consumeForOfflinePlanning(token, fresh.result)).toThrow('SOURCE_CHANGED');
  });
  it('demonstrates the race after separate revalidation: a proposal cannot authorize a later write', async () => {
    const run = runId(); await seed(c, run, fixture(3), ['parent-a']);
    const first = await readPinned(c, run, ['parent-a'], limits), issuer = offlineIssuer(['parent-a']);
    const token = issuer.issue(first.result, 'race');
    const fresh = await readPinned(c, run, ['parent-a'], limits);
    const proposal = issuer.consumeForOfflinePlanning(token, fresh.result);
    await c.db.doc(`financeExperiments/${run}/payments/parent-a-p000`).update({amount: 999});
    const changed = await readPinned(c, run, ['parent-a'], limits);
    expect(calc(changed.result).reportHash).not.toBe(calc(fresh.result).reportHash);
    expect(proposal.writeAuthorized).toBe(false);
  });
});
