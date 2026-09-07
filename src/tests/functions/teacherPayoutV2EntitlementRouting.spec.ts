import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'functions/src/recordTeacherPayoutV2.ts'), 'utf8');

describe('Brick 5 teacher payout V2 entitlement allocation', () => {
  it('uses canonical Brick 4 net entitlement for positive cash allocation', () => {
    expect(source).toContain('resolveTeacherEarningNetEntitlementAmount');
    expect(source).toContain('const entitlement = resolveTeacherEarningNetEntitlementAmount(current);');
    expect(source).toContain('const due = Math.max(entitlement - currentCashAllocated, 0);');
  });

  it('keeps negative cash reversals explicit instead of treating a Brick 4 adjustment as cash', () => {
    expect(source).toContain("status: amount < 0 ? 'refunded' : 'completed'");
    expect(source).toContain('cashAmount: amount');
    expect(source).not.toContain('teacherPayAdjustmentNetAmount: amount');
  });

  it('records cash payment timing separately on earning settlement', () => {
    expect(source).toContain('lastPayoutAt: paidAt');
    expect(source).toContain('lastPayoutPaymentMonthKey: period.paymentMonthKey');
    expect(source).toContain('updates.paidAt = paidAt');
  });
});
