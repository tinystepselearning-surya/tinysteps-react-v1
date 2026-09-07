import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(join(process.cwd(), 'functions/src/index.ts'), 'utf8');
const payoutSource = readFileSync(join(process.cwd(), 'functions/src/recordTeacherPayoutV2.ts'), 'utf8');
const helperSource = readFileSync(join(process.cwd(), 'functions/src/helpers/teacherPayoutPeriod.ts'), 'utf8');

describe('Brick 5 teacher payout period routing', () => {
  it('exports a versioned payout callable while leaving the legacy callable available', () => {
    expect(indexSource).toContain('export { recordTeacherPayoutV2 } from "./recordTeacherPayoutV2";');
    expect(indexSource).toContain('recordTeacherPayout,');
  });

  it('requires an explicit earning month and actual paidAt date', () => {
    expect(payoutSource).toContain('earningMonthKey: request.data?.earningMonthKey');
    expect(payoutSource).toContain('paidAt: request.data?.paidAt');
    expect(payoutSource).toContain("'earningMonthKey (YYYY-MM) and a valid actual paidAt date are required'");
  });

  it('allocates only within the requested earning month, independent of cash month', () => {
    expect(payoutSource).toContain(".where('monthKey', '==', period.earningMonthKey)");
    expect(payoutSource).toContain('earningMonthKey: period.earningMonthKey');
    expect(payoutSource).toContain('monthKey: period.monthKey');
    expect(payoutSource).toContain('paymentMonthKey: period.paymentMonthKey');
    expect(helperSource).toContain('monthKey: earningMonthKey');
  });

  it('uses Brick 4 net entitlement instead of paying the stale raw earning amount', () => {
    expect(payoutSource).toContain('resolveTeacherEarningNetEntitlementAmount');
    expect(payoutSource).not.toContain('const due = Math.max(amount - currentCashAllocated, 0)');
    expect(payoutSource).toContain('const due = Math.max(entitlement - currentCashAllocated, 0)');
  });

  it('completes transaction reads before payout allocation writes', () => {
    const readSetIndex = payoutSource.indexOf('const [existingPayoutSnap, earningsSnap] = await Promise.all([');
    const firstWriteIndex = payoutSource.indexOf('tx.set(earning.ref');
    expect(readSetIndex).toBeGreaterThanOrEqual(0);
    expect(firstWriteIndex).toBeGreaterThan(readSetIndex);
    expect(payoutSource.slice(firstWriteIndex)).not.toContain('await tx.get(earning.ref)');
  });

  it('stores real cash date metadata without changing the legacy earning-month grouping', () => {
    expect(payoutSource).toContain('paidAt,');
    expect(payoutSource).toContain('date: period.paymentDate');
    expect(payoutSource).toContain('payoutSchemaVersion: TEACHER_PAYOUT_SCHEMA_VERSION');
    expect(payoutSource).toContain('periodSemantics: TEACHER_PAYOUT_PERIOD_SEMANTICS');
  });
});
