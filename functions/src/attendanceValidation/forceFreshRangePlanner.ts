import { createHash } from 'crypto';
import {
  normalizeAvsLatestCheckRange,
} from './latestCheckPlanner';

export const AVS_FORCE_FRESH_RANGE_MAX_CASES = 100;
export const AVS_FORCE_FRESH_RANGE_QUERY_LIMIT =
  AVS_FORCE_FRESH_RANGE_MAX_CASES + 1;
export const AVS_FORCE_FRESH_RANGE_CONCURRENCY = 5;
export const ATTENDANCE_VALIDATION_FORCE_FRESH_RANGES_COLLECTION =
  'attendanceValidationForceFreshRanges';

export interface AvsForceFreshRangeCursor {
  serviceDateYmd: string;
  caseId: string;
}

export interface AvsForceFreshRange {
  fromDate: string;
  toDate: string;
}

export function normalizeAvsForceFreshRange(
  fromDate: unknown,
  toDate: unknown,
): AvsForceFreshRange {
  return normalizeAvsLatestCheckRange(fromDate, toDate);
}

export function avsForceFreshRangeId(range: AvsForceFreshRange): string {
  const digest = createHash('sha256')
    .update(`${range.fromDate}\n${range.toDate}`)
    .digest('hex')
    .slice(0, 20);
  return `range_${range.fromDate.replace(/-/g, '')}_${range.toDate.replace(/-/g, '')}_${digest}`;
}

export function forceFreshRangeBatchFromQueryRows<T extends {
  id: string;
  serviceDateYmd: string;
}>(
  rows: readonly T[],
  completedCaseIds: ReadonlySet<string> = new Set(),
): {
  batch: T[];
  hasMore: boolean;
  nextCursor: AvsForceFreshRangeCursor | null;
} {
  const batch: T[] = [];
  let lastExaminedIndex = -1;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    lastExaminedIndex = index;
    if (!completedCaseIds.has(row.id)) batch.push(row);
    if (batch.length === AVS_FORCE_FRESH_RANGE_MAX_CASES) break;
  }

  const lastExamined = lastExaminedIndex >= 0
    ? rows[lastExaminedIndex]
    : null;
  return {
    batch,
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
