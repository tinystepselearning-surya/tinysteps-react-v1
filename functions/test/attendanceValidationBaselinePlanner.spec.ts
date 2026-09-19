import { describe, expect, it } from 'vitest';
import {
  AVS_BASELINE_MAX_SESSIONS_PER_RUN,
  AVS_BASELINE_QUERY_LIMIT,
  avsBaselineRangeId,
  baselineBatchFromQueryRows,
  normalizeAvsBaselineRange,
} from '../src/attendanceValidation/baselinePlanner';

describe('AVS first-time baseline planner', () => {
  it('inherits the permanent Sep-1 lower bound and 31-day range cap', () => {
    expect(normalizeAvsBaselineRange('2026-09-01', '2026-09-30')).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
    });
    expect(() =>
      normalizeAvsBaselineRange('2026-08-31', '2026-09-01'),
    ).toThrow('cannot be before 2026-09-01');
    expect(() =>
      normalizeAvsBaselineRange('2026-09-01', '2026-10-02'),
    ).toThrow('at most 31 calendar days');
  });

  it('uses a deterministic range state id without exposing mutable cursor state in the id', () => {
    const range = { fromDate: '2026-09-01', toDate: '2026-09-10' };
    expect(avsBaselineRangeId(range)).toMatch(
      /^range_20260901_20260910_[a-f0-9]{20}$/,
    );
    expect(avsBaselineRangeId(range)).toBe(avsBaselineRangeId(range));
  });

  it('processes at most ten sessions while keeping one lookahead row', () => {
    const rows = Array.from({ length: AVS_BASELINE_QUERY_LIMIT }, (_, index) => ({
      id: `session-${String(index + 1).padStart(2, '0')}`,
      serviceDateYmd: '2026-09-10',
    }));

    const plan = baselineBatchFromQueryRows(rows);

    expect(AVS_BASELINE_MAX_SESSIONS_PER_RUN).toBe(10);
    expect(AVS_BASELINE_QUERY_LIMIT).toBe(11);
    expect(plan.batch).toHaveLength(10);
    expect(plan.hasMore).toBe(true);
    expect(plan.nextCursor).toEqual({
      serviceDateYmd: '2026-09-10',
      sessionId: 'session-10',
    });
  });

  it('marks the range terminal when the query has no lookahead row', () => {
    const plan = baselineBatchFromQueryRows([
      { id: 'session-1', serviceDateYmd: '2026-09-10' },
      { id: 'session-2', serviceDateYmd: '2026-09-11' },
    ]);

    expect(plan.hasMore).toBe(false);
    expect(plan.nextCursor).toEqual({
      serviceDateYmd: '2026-09-11',
      sessionId: 'session-2',
    });
  });
});
