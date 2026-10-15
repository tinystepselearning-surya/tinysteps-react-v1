import {describe, expect, it} from 'vitest';
import {collectFinance, DEFAULT_LIMITS} from './support/financeReadPagination';
import {fixture, key} from './support/financeSyntheticSource';
import {previewSelectionWithoutWriteAuthority as select} from './support/financeSelectionCompatibility';

const limits = {...DEFAULT_LIMITS, pageSize: 2, durationMs: 3000};
const withoutDates = (n: number, parents = ['parent-a']) => {
  const source = fixture(n, parents);
  for (const parent of parents) {
    for (const row of source.tables.get(key({parent, kind: 'payments'})) || []) {
      delete row.data.paidAt;
    }
  }
  return source;
};

describe('Step 7 offline integration selection compatibility gate', () => {
  it('requires complete paginated parent scope, including beyond first page', async () => {
    const source = withoutDates(5);
    const full = await collectFinance(source, ['parent-a'], {...limits, pageSize: 2});
    expect(full.state).toBe('COMPLETE');
    expect(source.requests.filter(r => r.query.kind === 'payments').length).toBeGreaterThan(2);
    const outcome = select(full, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 5});
    expect(outcome.decision).toBe('COMPLETE_PREVIEW_ONLY');
    expect(outcome.orderedPaymentIds).toEqual(['parent-a-p000', 'parent-a-p001',
      'parent-a-p002', 'parent-a-p003', 'parent-a-p004']);
    expect(outcome.writeAuthorized).toBe(false);
    expect(outcome.reportHash).toBeNull();
    expect(outcome.billedReads).toBeNull();
  });

  it('does not silently truncate a completely read source to an output limit', async () => {
    const full = await collectFinance(withoutDates(3), ['parent-a'], limits);
    expect(full.state).toBe('COMPLETE');
    const out = select(full, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 2});
    expect(out.decision).toBe('INCOMPLETE_SELECTION_LIMIT');
    expect(out.checkedRows).toBe(3);
    expect(out.orderedPaymentIds).toEqual([]);
    expect(out.writeAuthorized).toBe(false);
  });

  it('does not certify a pinned adapter ISO timestamp as the original live Timestamp type', async () => {
    const source = fixture(2);
    const full = await collectFinance(source, ['parent-a'], limits);
    expect(full.state).toBe('COMPLETE');
    const out = select(full, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 2});
    expect(out.decision).toBe('CONTRACT_DECISION_REQUIRED');
    expect(out.reason).toBe('paidAt_sdk_type_provenance_lost_in_serialization');
    expect(out.orderedPaymentIds).toEqual([]);
  });

  it('even a numeric, malformed or legacy string date cannot bypass the provenance decision', async () => {
    for (const input of [12345, '2026-01-01', {seconds: 100}, 'not-a-date']) {
      const source = withoutDates(1);
      source.tables.get(key({parent: 'parent-a', kind: 'payments'}))![0].data.paidAt = input;
      const full = await collectFinance(source, ['parent-a'], limits);
      const out = select(full, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 1});
      expect(out.decision).toBe('CONTRACT_DECISION_REQUIRED');
    }
  });

  it('global unordered-prelimit selection requires a separate finance-owner decision', async () => {
    const source = withoutDates(1, ['parent-a', 'parent-b']);
    const full = await collectFinance(source, ['parent-a', 'parent-b'], limits);
    expect(full.state).toBe('COMPLETE');
    const before = source.requests.length;
    const out = select(full, {scope: 'global', maxPayments: 1});
    expect(out.decision).toBe('CONTRACT_DECISION_REQUIRED');
    expect(out.reason).toBe('global_prelimit_chronology_unapproved');
    expect(out.orderedPaymentIds).toEqual([]);
    expect(source.requests).toHaveLength(before);
  });

  it('never treats an overflowed or incomplete collector as a complete audit', async () => {
    const out = await collectFinance(withoutDates(3), ['parent-a'], {...limits, queryRows: 1});
    expect(out.state).toBe('INCOMPLETE_BUDGET');
    const reviewed = select(out, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 3});
    expect(reviewed.decision).toBe('INCOMPLETE_SOURCE');
    expect(reviewed.orderedPaymentIds).toEqual([]);
  });

  it('forbids scope mismatch, additional unapproved parents and invalid selection bounds', async () => {
    const two = await collectFinance(withoutDates(1, ['parent-a', 'parent-b']),
      ['parent-a', 'parent-b'], limits);
    expect(two.state).toBe('COMPLETE');
    const out = select(two, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 5});
    expect(out.decision).toBe('INVALID_SCOPE');
    expect(out.orderedPaymentIds).toEqual([]);
    for (const maxPayments of [0, -1, 1001, 1.5, Number.POSITIVE_INFINITY]) {
      expect(select(two, {scope: 'named-parent', parentId: 'parent-a', maxPayments}).decision)
        .toBe('INVALID_SCOPE');
    }
  });

  it('rejects forged or cloned COMPLETE results without a verified collector capability', async () => {
    const full = await collectFinance(withoutDates(1), ['parent-a'], limits);
    expect(full.state).toBe('COMPLETE');
    const forged = structuredClone(full);
    expect(select(forged, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 1}).decision)
      .toBe('INCOMPLETE_SOURCE');
  });

  it('empty named-parent history can be verified, but never authorizes writes', async () => {
    const source = withoutDates(0);
    const result = await collectFinance(source, ['parent-a'], limits);
    const out = select(result, {scope: 'named-parent', parentId: 'parent-a', maxPayments: 1});
    expect(out.decision).toBe('COMPLETE_PREVIEW_ONLY');
    expect(out.orderedPaymentIds).toEqual([]);
    expect(out.writeAuthorized).toBe(false);
  });
});
