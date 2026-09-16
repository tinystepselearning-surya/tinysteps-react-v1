import { describe, expect, it } from 'vitest';
import {
  calculatePairOverlapMetrics,
  calculateParticipantIntervalMetrics,
  normalizeAttendanceIntervals,
} from '../src/attendanceValidation/evidenceIntervals';

describe('attendance validation evidence intervals', () => {
  it('preserves valid source intervals while merging overlaps and duplicates for derived metrics', () => {
    const source = [
      {
        joinDateTime: '2026-09-16T10:00:00Z',
        leaveDateTime: '2026-09-16T10:10:00Z',
        durationInSeconds: 600,
      },
      {
        joinDateTime: '2026-09-16T10:05:00Z',
        leaveDateTime: '2026-09-16T10:15:00Z',
        durationInSeconds: 600,
      },
      {
        joinDateTime: '2026-09-16T10:15:00Z',
        leaveDateTime: '2026-09-16T10:20:00Z',
        durationInSeconds: 300,
      },
    ];

    const normalized = normalizeAttendanceIntervals(source);

    expect(normalized.diagnostics).toMatchObject({
      sourceIntervalCount: 3,
      validSourceIntervalCount: 3,
      invalidSourceIntervalCount: 0,
      mergedIntervalCount: 1,
    });
    expect(normalized.intervals).toEqual([
      {
        startDateTime: '2026-09-16T10:00:00.000Z',
        endDateTime: '2026-09-16T10:20:00.000Z',
        durationInSeconds: 1200,
      },
    ]);
  });

  it('rejects malformed and non-positive source intervals without inventing attendance time', () => {
    const normalized = normalizeAttendanceIntervals([
      { leaveDateTime: '2026-09-16T10:05:00Z' },
      { joinDateTime: '2026-09-16T10:00:00Z' },
      { joinDateTime: 'not-a-date', leaveDateTime: '2026-09-16T10:05:00Z' },
      { joinDateTime: '2026-09-16T10:00:00Z', leaveDateTime: 'bad' },
      { joinDateTime: '2026-09-16T10:10:00Z', leaveDateTime: '2026-09-16T10:10:00Z' },
    ]);

    expect(normalized.intervals).toEqual([]);
    expect(normalized.diagnostics.invalidSourceIntervalCount).toBe(5);
    expect(normalized.diagnostics.invalidReasons).toEqual({
      missing_join: 1,
      missing_leave: 1,
      invalid_join: 1,
      invalid_leave: 1,
      non_positive_interval: 1,
    });
  });

  it('clips participant dwell to the scheduled Tiny Steps class window', () => {
    const metrics = calculateParticipantIntervalMetrics(
      [
        {
          joinDateTime: '2026-09-16T15:58:00Z',
          leaveDateTime: '2026-09-16T16:36:00Z',
        },
      ],
      '2026-09-16T16:00:00Z',
      '2026-09-16T16:35:00Z',
    );

    expect(metrics.observedSeconds).toBe(2280);
    expect(metrics.scheduledSeconds).toBe(2100);
    expect(metrics.scheduledDwellPercentage).toBe(100);
    expect(metrics.firstJoinDateTime).toBe('2026-09-16T15:58:00.000Z');
    expect(metrics.lastLeaveDateTime).toBe('2026-09-16T16:36:00.000Z');
  });

  it('calculates pair overlap independently from identity assignment', () => {
    const overlap = calculatePairOverlapMetrics(
      [
        {
          joinDateTime: '2026-09-16T16:00:00Z',
          leaveDateTime: '2026-09-16T16:36:00Z',
        },
      ],
      [
        {
          joinDateTime: '2026-09-16T16:02:00Z',
          leaveDateTime: '2026-09-16T16:34:00Z',
        },
      ],
      '2026-09-16T16:00:00Z',
      '2026-09-16T16:35:00Z',
    );

    expect(overlap.overlapSeconds).toBe(1920);
    expect(overlap.scheduledOverlapSeconds).toBe(1920);
    expect(overlap.scheduledOverlapPercentage).toBe(91.43);
  });

  it('fails closed on an invalid scheduled window', () => {
    expect(() => calculateParticipantIntervalMetrics(
      [],
      '2026-09-16T16:35:00Z',
      '2026-09-16T16:00:00Z',
    )).toThrow(RangeError);
  });
});
