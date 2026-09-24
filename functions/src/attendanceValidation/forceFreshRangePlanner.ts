import {
  normalizeAvsLatestCheckRange,
} from './latestCheckPlanner';

export const AVS_FORCE_FRESH_RANGE_MAX_CASES = 100;
export const AVS_FORCE_FRESH_RANGE_QUERY_LIMIT =
  AVS_FORCE_FRESH_RANGE_MAX_CASES + 1;
export const AVS_FORCE_FRESH_RANGE_CONCURRENCY = 5;

export const ATTENDANCE_VALIDATION_FORCE_FRESH_RUNS_COLLECTION =
  'attendanceValidationForceFreshRuns';
export const ATTENDANCE_VALIDATION_FORCE_FRESH_RUN_CASES_SUBCOLLECTION =
  'cases';

export interface AvsForceFreshRangeCursor {
  serviceDateYmd: string;
  caseId: string;
}

export interface AvsForceFreshRange {
  fromDate: string;
  toDate: string;
}

export type AvsForceFreshTerminalStatus =
  | 'refreshed'
  | 'skipped'
  | 'failed';

export function normalizeAvsForceFreshRange(
  fromDate: unknown,
  toDate: unknown,
): AvsForceFreshRange {
  return normalizeAvsLatestCheckRange(fromDate, toDate);
}

export function cleanAvsForceFreshRunId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const runId = String(value).trim();
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(runId)) {
    throw new TypeError(
      'runId must be 8-120 characters using letters, numbers, underscore, or hyphen.',
    );
  }
  return runId;
}

export function forceFreshRangeBatchFromQueryRows<T extends {
  id: string;
  serviceDateYmd: string;
}>(
  rows: readonly T[],
  terminalCheckpointCaseIds: ReadonlySet<string> = new Set(),
): {
  batch: T[];
  hasMore: boolean;
  nextCursor: AvsForceFreshRangeCursor | null;
  checkpointedCaseCount: number;
} {
  const batch: T[] = [];
  let checkpointedCaseCount = 0;
  let lastExaminedIndex = -1;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    lastExaminedIndex = index;
    if (terminalCheckpointCaseIds.has(row.id)) {
      checkpointedCaseCount += 1;
    } else {
      batch.push(row);
    }
    if (batch.length === AVS_FORCE_FRESH_RANGE_MAX_CASES) break;
  }

  const lastExamined = lastExaminedIndex >= 0
    ? rows[lastExaminedIndex]
    : null;

  return {
    batch,
    checkpointedCaseCount,
    hasMore:
      lastExaminedIndex < rows.length - 1
      || rows.length === AVS_FORCE_FRESH_RANGE_QUERY_LIMIT,
    nextCursor: lastExamined
      ? {
          serviceDateYmd: lastExamined.serviceDateYmd,
          caseId: lastExamined.id,
        }
      : null,
  };
}

export function forceFreshCounterDelta(
  previousStatus: AvsForceFreshTerminalStatus | null,
  nextStatus: AvsForceFreshTerminalStatus,
): {
  processedCount: number;
  refreshedCount: number;
  skippedCount: number;
  failedCount: number;
} {
  const delta = {
    processedCount: previousStatus === null ? 1 : 0,
    refreshedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  if (previousStatus === nextStatus) return delta;

  if (previousStatus === 'refreshed') delta.refreshedCount -= 1;
  if (previousStatus === 'skipped') delta.skippedCount -= 1;
  if (previousStatus === 'failed') delta.failedCount -= 1;

  if (nextStatus === 'refreshed') delta.refreshedCount += 1;
  if (nextStatus === 'skipped') delta.skippedCount += 1;
  if (nextStatus === 'failed') delta.failedCount += 1;

  return delta;
}

export function forceFreshRunStatus(params: {
  remainingCases: number;
  failedCases: number;
}): 'in_progress' | 'complete' | 'complete_with_failures' {
  if (params.remainingCases > 0) return 'in_progress';
  return params.failedCases > 0
    ? 'complete_with_failures'
    : 'complete';
}

export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer.');
  }

  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(values[index], index);
      }
    },
  );
  await Promise.all(runners);
  return results;
}
