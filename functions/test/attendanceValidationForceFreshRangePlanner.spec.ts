import { describe, expect, it } from 'vitest';
import {
  AVS_FORCE_FRESH_RANGE_CONCURRENCY,
  AVS_FORCE_FRESH_RANGE_MAX_CASES,
  AVS_FORCE_FRESH_RANGE_QUERY_LIMIT,
  avsForceFreshRangeId,
  forceFreshRangeBatchFromQueryRows,
  mapWithConcurrency,
  normalizeAvsForceFreshRange,
} from '../src/attendanceValidation/forceFreshRangePlanner';

function rows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `case-${String(index + 1).padStart(3, '0')}`,
    serviceDateYmd: '2026-09-01',
  }));
}

describe('AVS Force Fresh selected-range planner', () => {
  it('uses the permanent validation start and 31-day range cap', () => {
    expect(normalizeAvsForceFreshRange('2026-09-01', '2026-09-30'))
      .toEqual({ fromDate: '2026-09-01', toDate: '2026-09-30' });
    expect(() =>
      normalizeAvsForceFreshRange('2026-08-31', '2026-09-01'))
      .toThrow('cannot be before 2026-09-01');
  });

  it('finishes ranges with at most 100 cases in one batch', () => {
    const plan = forceFreshRangeBatchFromQueryRows(rows(66));
    expect(plan.batch).toHaveLength(66);
    expect(plan.hasMore).toBe(false);
    expect(plan.nextCursor).toEqual({
      serviceDateYmd: '2026-09-01',
      caseId: 'case-066',
    });
  });

  it('caps a click at 100 and exposes continuation for larger ranges', () => {
    const plan = forceFreshRangeBatchFromQueryRows(
      rows(AVS_FORCE_FRESH_RANGE_QUERY_LIMIT),
    );
    expect(AVS_FORCE_FRESH_RANGE_MAX_CASES).toBe(100);
    expect(plan.batch).toHaveLength(100);
    expect(plan.hasMore).toBe(true);
    expect(plan.nextCursor?.caseId).toBe('case-100');
  });

  it('skips checkpointed cases after a partial timeout without repeating them', () => {
    const plan = forceFreshRangeBatchFromQueryRows(
      rows(8),
      new Set(['case-001', 'case-003']),
    );
    expect(plan.batch.map((item) => item.id)).toEqual([
      'case-002',
      'case-004',
      'case-005',
      'case-006',
      'case-007',
      'case-008',
    ]);
  });

  it('never exceeds the configured internal concurrency', async () => {
    let active = 0;
    let peak = 0;
    const result = await mapWithConcurrency(
      rows(20),
      AVS_FORCE_FRESH_RANGE_CONCURRENCY,
      async (item) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
        return item.id;
      },
    );

    expect(AVS_FORCE_FRESH_RANGE_CONCURRENCY).toBe(5);
    expect(peak).toBe(5);
    expect(result).toHaveLength(20);
  });

  it('uses a stable range progress id', () => {
    const range = { fromDate: '2026-09-01', toDate: '2026-09-01' };
    expect(avsForceFreshRangeId(range)).toBe(avsForceFreshRangeId(range));
    expect(avsForceFreshRangeId(range)).toMatch(
      /^range_20260901_20260901_[a-f0-9]{20}$/,
    );
  });
});
