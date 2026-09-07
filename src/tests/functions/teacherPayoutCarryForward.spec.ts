import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const payoutSource = readFileSync(join(process.cwd(), 'functions/src/recordTeacherPayoutV2.ts'), 'utf8');
const adjustmentSource = readFileSync(join(process.cwd(), 'functions/src/teacherEarningAdjustmentSync.ts'), 'utf8');

describe('Brick 5 carry-forward routing', () => {
  it('writes immutable offsets separately from cash payouts', () => {
    expect(payoutSource).toContain("collection('teacherPaymentOffsets')");
    expect(payoutSource).toContain('recordType: TEACHER_PAYMENT_OFFSET_RECORD_TYPE');
    expect(payoutSource).toContain('ledgerImmutable: true');
    expect(payoutSource).toContain('cashAmount: amount');
    expect(payoutSource).not.toContain("status: 'refunded',\n            source: TEACHER_PAYMENT_OFFSET_SOURCE");
  });

  it('uses one read-before-write transaction and deterministic create semantics', () => {
    const readIndex = payoutSource.indexOf('const [existingPayoutSnap, earningsSnap, teacherEarningsSnap');
    const firstCreateIndex = payoutSource.indexOf('tx.create(offsetRef');
    expect(readIndex).toBeGreaterThanOrEqual(0);
    expect(firstCreateIndex).toBeGreaterThan(readIndex);
    expect(payoutSource.slice(firstCreateIndex)).not.toContain('await tx.get(');
    expect(payoutSource).toContain('idempotencyKey,');
  });

  it('never changes source cash history while applying carry', () => {
    const sourceUpdate = payoutSource.slice(
      payoutSource.indexOf('for (const [sourceId] of newOffsetBySource)'),
      payoutSource.indexOf('const appliedAmount = amount - remaining'),
    );
    expect(sourceUpdate).toContain('teacherPayOffsetConsumedAmount');
    expect(sourceUpdate).toContain('teacherPayOffsetRemainingAmount');
    expect(sourceUpdate).not.toContain('paidAmount:');
    expect(sourceUpdate).not.toContain('paidAt:');
  });

  it('fails closed when a Brick 4 restoration conflicts with consumed carry', () => {
    expect(adjustmentSource).toContain('validateTeacherOffsetRestoration');
    expect(adjustmentSource).toContain("'offset_consumed_before_entitlement_restoration'");
    expect(adjustmentSource).toContain("financialOutcome: 'finance_repair_required'");
  });

  it('does not fabricate a payout for carry and retains real earning/payment periods', () => {
    expect(payoutSource).toContain('targetEarningMonthKey: period.earningMonthKey');
    expect(payoutSource).toContain('paymentMonthKey: period.paymentMonthKey');
    expect(payoutSource).not.toContain('`${payoutMonth}-01`');
    expect(payoutSource.match(/tx\.create\(payoutRef/g)).toHaveLength(1);
  });
});
