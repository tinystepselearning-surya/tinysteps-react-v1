import { describe, expect, it } from 'vitest';
import { computeTeacherMonthlyRollupPayload } from '../src/helpers/teacherEarningsAuthoritativeRollup';

describe('B6 Brick 7B2 authoritative teacher-month rollup calculator', () => {
  it('preserves session dedupe, void, demo, paid and archived semantics', () => {
    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [
        {
          id: 'session-1',
          data: {
            amount: 175,
            status: 'unpaid',
            source: 'session_present_completed',
            sessionId: 'session-1',
            updatedAt: '2026-08-10T10:00:00+05:30',
          },
        },
        {
          id: 'legacy-session-1',
          data: {
            amount: 999,
            status: 'unpaid',
            source: 'session_present_completed',
            sessionId: 'session-1',
            updatedAt: '2026-08-11T10:00:00+05:30',
          },
        },
        {
          id: 'session-2',
          data: {
            amount: 175,
            paidAmount: 75,
            status: 'partial',
            source: 'session_present_completed',
            sessionId: 'session-2',
          },
        },
        {
          id: 'demo-1',
          data: { amount: 100, status: 'unpaid', source: 'demo_completed' },
        },
        {
          id: 'demo-bonus-1',
          data: { amount: 100, status: 'paid', source: 'demo_enrolled_bonus' },
        },
        {
          id: 'void-1',
          data: { amount: 500, status: 'void', source: 'demo_completed' },
        },
        {
          id: 'archived-1',
          data: { amount: 800, status: 'unpaid', source: 'demo_completed', archived: true },
        },
      ],
      payouts: [],
    });

    expect(result).toMatchObject({
      month: '2026-08',
      totalEarnings: 550,
      pendingEarnings: 375,
      totalSessions: 2,
      sessionsCompleted: 2,
      demoEarnings: 200,
      demoCompletedCount: 1,
      demoEnrollmentBonusCount: 1,
      rollupSource: 'teacherEarnings_events_v1',
      rollupVersion: 1,
    });
  });

  it('prefers a non-void session duplicate before timestamp recency', () => {
    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [
        {
          id: 'legacy-a',
          data: {
            amount: 175,
            status: 'unpaid',
            sessionId: 'session-x',
            updatedAt: '2026-08-10T10:00:00+05:30',
          },
        },
        {
          id: 'legacy-b',
          data: {
            amount: 999,
            status: 'void',
            sessionId: 'session-x',
            updatedAt: '2026-08-12T10:00:00+05:30',
          },
        },
      ],
      payouts: [],
    });

    expect(result.totalEarnings).toBe(175);
    expect(result.totalSessions).toBe(1);
  });

  it('keeps only the five most recent active payouts and preserves IST date fallback', () => {
    const payouts = Array.from({ length: 7 }, (_, index) => ({
      id: `payout-${index + 1}`,
      data: {
        amount: 100 + index,
        status: 'completed',
        paidAt: `2026-08-${String(index + 1).padStart(2, '0')}T20:00:00Z`,
      },
    }));
    payouts.push({
      id: 'archived-payout',
      data: {
        amount: 999,
        status: 'completed',
        paidAt: '2026-08-31T20:00:00Z',
        archived: true,
      },
    });

    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [],
      payouts,
    });

    expect(result.payments.map((payment) => payment.id)).toEqual([
      'payout-7',
      'payout-6',
      'payout-5',
      'payout-4',
      'payout-3',
    ]);
    expect(result.payments[0]?.date).toBe('2026-08-08');
  });

  it('preserves legacy numeric coercion behavior from the authoritative recompute', () => {
    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [
        {
          id: 'string-amount',
          data: { amount: '175', status: 'unpaid', source: 'demo_completed' },
        },
      ],
      payouts: [],
    });

    expect(result.totalEarnings).toBe(0);
    expect(result.demoEarnings).toBe(0);
    expect(result.demoCompletedCount).toBe(1);
  });

  it('uses Brick 4 posted net entitlement without rewriting paid cash history', () => {
    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [
        {
          id: 'session-adjusted',
          data: {
            amount: 175,
            paidAmount: 175,
            status: 'paid',
            source: 'session_present_completed',
            sessionId: 'session-adjusted',
            teacherPayAdjustmentRequired: false,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayNetEntitlementAmount: 0,
          },
        },
      ],
      payouts: [
        {
          id: 'payout-1',
          data: {
            amount: 175,
            status: 'completed',
            paidAt: '2026-08-31T12:00:00+05:30',
          },
        },
      ],
    });

    expect(result.totalEarnings).toBe(0);
    expect(result.pendingEarnings).toBe(0);
    expect(result.totalSessions).toBe(1);
    expect(result.payments[0]?.amount).toBe(175);
  });

  it('ignores incomplete adjustment projections and keeps the original earning amount', () => {
    const result = computeTeacherMonthlyRollupPayload({
      monthKey: '2026-08',
      earnings: [
        {
          id: 'session-pending-adjustment',
          data: {
            amount: 175,
            paidAmount: 175,
            status: 'paid',
            source: 'session_present_completed',
            sessionId: 'session-pending-adjustment',
            teacherPayAdjustmentRequired: true,
            teacherPayAdjustmentStatus: 'posted',
            teacherPayNetEntitlementAmount: 0,
          },
        },
      ],
      payouts: [],
    });

    expect(result.totalEarnings).toBe(175);
  });
});
