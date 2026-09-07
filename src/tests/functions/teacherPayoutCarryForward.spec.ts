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

  it('limits the bounded carry-source scan to Brick 4 adjusted earnings rather than lifetime classes', () => {
    expect(payoutSource).toContain(".where('teacherPayAdjustmentStatus', '==', 'posted')");
    expect(payoutSource).toContain('for (const docSnap of [...earningsSnap.docs, ...teacherEarningsSnap.docs])');
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

  it('requires immutable Brick 4 evidence before creating a carry offset', () => {
    expect(payoutSource).toContain('!sourceAdjustmentId || !sourceAdjustment || !sourceCorrectionId || !sourceTeacherPayDecisionId');
    expect(payoutSource).toContain('Carry source is missing immutable Brick 4 adjustment evidence; finance repair required');
  });

  it('fails closed when cash exceeds the entitlement that remains after carry', () => {
    expect(payoutSource).toContain('Actual cash amount exceeds outstanding teacher entitlement after carry. Record only the cash actually due.');
    expect(payoutSource).toContain('Cash refund exceeds the reversible cash allocated to this earning month.');
  });

  it('recomputes carry-aware settlement metadata after an actual cash refund', () => {
    const refundSection = payoutSource.slice(
      payoutSource.indexOf('} else if (remaining < 0) {'),
      payoutSource.indexOf('if (remaining > 0.01)'),
    );
    expect(refundSection).toContain('resolveTeacherEarningSettlement');
    expect(refundSection).toContain('settlementStatus: settlement.settlementStatus');
    expect(refundSection).toContain('settledBy: settlement.settledBy');
    expect(refundSection).toContain("settlement.settlementStatus === 'settled' ? 'paid' : settlement.settlementStatus");
  });

  it('fails closed when a Brick 4 restoration conflicts with consumed carry', () => {
    expect(adjustmentSource).toContain('validateTeacherOffsetRestoration');
    expect(adjustmentSource).toContain("'offset_consumed_before_entitlement_restoration'");
    expect(adjustmentSource).toContain("financialOutcome: 'finance_repair_required'");
  });

  it('fails closed when later entitlement changes would invalidate carry already applied to the target', () => {
    expect(adjustmentSource).toContain(".where('targetEarningId', '==', earningId)");
    expect(adjustmentSource).toContain("'target_entitlement_change_after_carry_applied'");
    expect(adjustmentSource).toContain('validateTargetCarry');
    expect(adjustmentSource).toContain('markTargetCarryRepair');
  });

  it('does not fabricate a payout for carry and retains real earning/payment periods', () => {
    expect(payoutSource).toContain('targetEarningMonthKey: period.earningMonthKey');
    expect(payoutSource).toContain('paymentMonthKey: period.paymentMonthKey');
    expect(payoutSource).not.toContain('`${payoutMonth}-01`');
    expect(payoutSource.match(/tx\.create\(payoutRef/g)).toHaveLength(1);
  });
});
