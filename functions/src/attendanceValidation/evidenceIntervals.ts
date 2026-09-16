import type { GraphAttendanceInterval } from './microsoftGraphClient';

export type IntervalInvalidReason =
  | 'missing_join'
  | 'missing_leave'
  | 'invalid_join'
  | 'invalid_leave'
  | 'non_positive_interval';

export interface NormalizedEvidenceInterval {
  startDateTime: string;
  endDateTime: string;
  durationInSeconds: number;
}

export interface IntervalNormalizationDiagnostics {
  sourceIntervalCount: number;
  validSourceIntervalCount: number;
  invalidSourceIntervalCount: number;
  mergedIntervalCount: number;
  invalidReasons: Record<IntervalInvalidReason, number>;
}

export interface IntervalNormalizationResult {
  intervals: NormalizedEvidenceInterval[];
  diagnostics: IntervalNormalizationDiagnostics;
}

export interface ParticipantIntervalMetrics {
  sourceIntervalCount: number;
  validSourceIntervalCount: number;
  invalidSourceIntervalCount: number;
  normalizedIntervalCount: number;
  normalizedIntervals: NormalizedEvidenceInterval[];
  observedSeconds: number;
  scheduledSeconds: number;
  scheduledDwellPercentage: number;
  firstJoinDateTime: string | null;
  lastLeaveDateTime: string | null;
  invalidReasons: Record<IntervalInvalidReason, number>;
}

export interface PairOverlapMetrics {
  overlapSeconds: number;
  scheduledOverlapSeconds: number;
  scheduledOverlapPercentage: number;
  overlapIntervals: NormalizedEvidenceInterval[];
  scheduledOverlapIntervals: NormalizedEvidenceInterval[];
}

interface MillisecondInterval {
  startMs: number;
  endMs: number;
}

function emptyInvalidReasons(): Record<IntervalInvalidReason, number> {
  return {
    missing_join: 0,
    missing_leave: 0,
    invalid_join: 0,
    invalid_leave: 0,
    non_positive_interval: 0,
  };
}

function parseDateTime(value: string | undefined): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function secondsBetween(startMs: number, endMs: number): number {
  return Math.round(((endMs - startMs) / 1000) * 1000) / 1000;
}

function percentage(numeratorSeconds: number, denominatorSeconds: number): number {
  if (!(denominatorSeconds > 0)) return 0;
  const raw = (numeratorSeconds / denominatorSeconds) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)) * 100) / 100;
}

function toPublicInterval(interval: MillisecondInterval): NormalizedEvidenceInterval {
  return {
    startDateTime: new Date(interval.startMs).toISOString(),
    endDateTime: new Date(interval.endMs).toISOString(),
    durationInSeconds: secondsBetween(interval.startMs, interval.endMs),
  };
}

function toMilliseconds(interval: NormalizedEvidenceInterval): MillisecondInterval {
  return {
    startMs: Date.parse(interval.startDateTime),
    endMs: Date.parse(interval.endDateTime),
  };
}

function mergeIntervals(intervals: MillisecondInterval[]): MillisecondInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((left, right) => (
    left.startMs === right.startMs
      ? left.endMs - right.endMs
      : left.startMs - right.startMs
  ));

  const merged: MillisecondInterval[] = [];
  for (const current of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || current.startMs > previous.endMs) {
      merged.push({ ...current });
      continue;
    }
    previous.endMs = Math.max(previous.endMs, current.endMs);
  }
  return merged;
}

function requireWindow(startDateTime: string, endDateTime: string): MillisecondInterval {
  const startMs = Date.parse(startDateTime);
  const endMs = Date.parse(endDateTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new RangeError('Attendance validation requires a valid positive scheduled window.');
  }
  return { startMs, endMs };
}

export function normalizeAttendanceIntervals(
  source: readonly GraphAttendanceInterval[] | undefined,
): IntervalNormalizationResult {
  const sourceIntervals = source ?? [];
  const invalidReasons = emptyInvalidReasons();
  const validIntervals: MillisecondInterval[] = [];

  for (const interval of sourceIntervals) {
    const joinText = typeof interval.joinDateTime === 'string'
      ? interval.joinDateTime.trim()
      : '';
    const leaveText = typeof interval.leaveDateTime === 'string'
      ? interval.leaveDateTime.trim()
      : '';

    if (!joinText) {
      invalidReasons.missing_join += 1;
      continue;
    }
    if (!leaveText) {
      invalidReasons.missing_leave += 1;
      continue;
    }

    const startMs = parseDateTime(joinText);
    if (startMs === null) {
      invalidReasons.invalid_join += 1;
      continue;
    }

    const endMs = parseDateTime(leaveText);
    if (endMs === null) {
      invalidReasons.invalid_leave += 1;
      continue;
    }

    if (endMs <= startMs) {
      invalidReasons.non_positive_interval += 1;
      continue;
    }

    validIntervals.push({ startMs, endMs });
  }

  const merged = mergeIntervals(validIntervals);
  const invalidSourceIntervalCount = Object.values(invalidReasons)
    .reduce((total, count) => total + count, 0);

  return {
    intervals: merged.map(toPublicInterval),
    diagnostics: {
      sourceIntervalCount: sourceIntervals.length,
      validSourceIntervalCount: validIntervals.length,
      invalidSourceIntervalCount,
      mergedIntervalCount: merged.length,
      invalidReasons,
    },
  };
}

export function clipNormalizedIntervalsToWindow(
  intervals: readonly NormalizedEvidenceInterval[],
  windowStartDateTime: string,
  windowEndDateTime: string,
): NormalizedEvidenceInterval[] {
  const window = requireWindow(windowStartDateTime, windowEndDateTime);
  const clipped: MillisecondInterval[] = [];

  for (const interval of intervals) {
    const source = toMilliseconds(interval);
    const startMs = Math.max(source.startMs, window.startMs);
    const endMs = Math.min(source.endMs, window.endMs);
    if (endMs > startMs) clipped.push({ startMs, endMs });
  }

  return mergeIntervals(clipped).map(toPublicInterval);
}

export function intersectNormalizedIntervals(
  left: readonly NormalizedEvidenceInterval[],
  right: readonly NormalizedEvidenceInterval[],
): NormalizedEvidenceInterval[] {
  const leftMs = left.map(toMilliseconds);
  const rightMs = right.map(toMilliseconds);
  const intersections: MillisecondInterval[] = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftMs.length && rightIndex < rightMs.length) {
    const leftInterval = leftMs[leftIndex];
    const rightInterval = rightMs[rightIndex];
    const startMs = Math.max(leftInterval.startMs, rightInterval.startMs);
    const endMs = Math.min(leftInterval.endMs, rightInterval.endMs);

    if (endMs > startMs) intersections.push({ startMs, endMs });

    if (leftInterval.endMs <= rightInterval.endMs) {
      leftIndex += 1;
    } else {
      rightIndex += 1;
    }
  }

  return mergeIntervals(intersections).map(toPublicInterval);
}

export function sumNormalizedIntervalSeconds(
  intervals: readonly NormalizedEvidenceInterval[],
): number {
  return Math.round(
    intervals.reduce((total, interval) => total + interval.durationInSeconds, 0) * 1000,
  ) / 1000;
}

export function calculateParticipantIntervalMetrics(
  source: readonly GraphAttendanceInterval[] | undefined,
  scheduledStartDateTime: string,
  scheduledEndDateTime: string,
): ParticipantIntervalMetrics {
  const scheduledWindow = requireWindow(scheduledStartDateTime, scheduledEndDateTime);
  const normalized = normalizeAttendanceIntervals(source);
  const scheduledIntervals = clipNormalizedIntervalsToWindow(
    normalized.intervals,
    scheduledStartDateTime,
    scheduledEndDateTime,
  );
  const observedSeconds = sumNormalizedIntervalSeconds(normalized.intervals);
  const scheduledSeconds = sumNormalizedIntervalSeconds(scheduledIntervals);
  const scheduledDurationSeconds = secondsBetween(scheduledWindow.startMs, scheduledWindow.endMs);

  return {
    sourceIntervalCount: normalized.diagnostics.sourceIntervalCount,
    validSourceIntervalCount: normalized.diagnostics.validSourceIntervalCount,
    invalidSourceIntervalCount: normalized.diagnostics.invalidSourceIntervalCount,
    normalizedIntervalCount: normalized.diagnostics.mergedIntervalCount,
    normalizedIntervals: normalized.intervals,
    observedSeconds,
    scheduledSeconds,
    scheduledDwellPercentage: percentage(scheduledSeconds, scheduledDurationSeconds),
    firstJoinDateTime: normalized.intervals[0]?.startDateTime ?? null,
    lastLeaveDateTime: normalized.intervals[normalized.intervals.length - 1]?.endDateTime ?? null,
    invalidReasons: normalized.diagnostics.invalidReasons,
  };
}

export function calculatePairOverlapMetrics(
  leftSource: readonly GraphAttendanceInterval[] | undefined,
  rightSource: readonly GraphAttendanceInterval[] | undefined,
  scheduledStartDateTime: string,
  scheduledEndDateTime: string,
): PairOverlapMetrics {
  const scheduledWindow = requireWindow(scheduledStartDateTime, scheduledEndDateTime);
  const left = normalizeAttendanceIntervals(leftSource).intervals;
  const right = normalizeAttendanceIntervals(rightSource).intervals;
  const overlapIntervals = intersectNormalizedIntervals(left, right);
  const scheduledOverlapIntervals = clipNormalizedIntervalsToWindow(
    overlapIntervals,
    scheduledStartDateTime,
    scheduledEndDateTime,
  );
  const overlapSeconds = sumNormalizedIntervalSeconds(overlapIntervals);
  const scheduledOverlapSeconds = sumNormalizedIntervalSeconds(scheduledOverlapIntervals);
  const scheduledDurationSeconds = secondsBetween(scheduledWindow.startMs, scheduledWindow.endMs);

  return {
    overlapSeconds,
    scheduledOverlapSeconds,
    scheduledOverlapPercentage: percentage(scheduledOverlapSeconds, scheduledDurationSeconds),
    overlapIntervals,
    scheduledOverlapIntervals,
  };
}
