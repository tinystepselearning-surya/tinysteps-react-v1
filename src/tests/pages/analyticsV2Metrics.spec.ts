import { describe, expect, it } from 'vitest';
import {
  aggregateTeacherEarnings,
  analyticsMonthKeyFromDate,
  summarizeSessionCharges,
  summarizeTeacherEarnings,
} from '../../pages/admin/analyticsV2Metrics';

describe('Analytics V2 metric contracts', () => {
  it('chooses the default month in Asia/Kolkata at the UTC month boundary', () => {
    expect(analyticsMonthKeyFromDate(new Date('2026-07-31T18:29:59.999Z'))).toBe('2026-07');
    expect(analyticsMonthKeyFromDate(new Date('2026-07-31T18:30:00.000Z'))).toBe('2026-08');
  });

  it('keeps teacher KPI totals complete when more than 40 teacher rows exist', () => {
    const entries = Array.from({ length: 41 }, (_, index) => ({
      id: `earning-${index}`,
      teacherId: `teacher-${index}`,
      source: 'session_present_completed',
      sessionId: `session-${index}`,
      amount: 100,
      status: 'pending',
    }));

    const rows = aggregateTeacherEarnings(entries);
    const totals = summarizeTeacherEarnings(rows);

    expect(rows).toHaveLength(41);
    expect(totals.totalSessionCount).toBe(41);
    expect(totals.totalSessionEarned).toBe(4100);
    expect(totals.totalCombinedEarned).toBe(4100);
  });

  it('deduplicates completed billed sessions by canonical session identity', () => {
    expect(summarizeSessionCharges([
      { id: 'a', sessionId: 'session-1', source: 'session_present_completed', amount: 700 },
      { id: 'duplicate', sessionId: 'session-1', source: 'session_present_completed', amount: 700 },
      { id: 'b', sessionId: 'session-2', source: 'session_present_completed', amount: 900 },
    ])).toEqual({ sessionChargesCount: 2, sessionChargesTotal: 1600 });
  });
});
