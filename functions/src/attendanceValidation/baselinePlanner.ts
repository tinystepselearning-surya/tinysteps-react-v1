import { createHash } from 'crypto';
import {
  normalizeAvsLatestCheckRange,
} from './latestCheckPlanner';

export const AVS_BASELINE_MAX_SESSIONS_PER_RUN = 100;
export const AVS_BASELINE_QUERY_LIMIT =
  AVS_BASELINE_MAX_SESSIONS_PER_RUN + 1;
export const ATTENDANCE_VALIDATION_BASELINE_RANGES_COLLECTION =
  'attendanceValidationBaselineRanges';

export interface AvsBaselineCursor {
  serviceDateYmd: string;
  sessionId: string;
}

export interface AvsBaselineRange {
  fromDate: string;
  toDate: string;
}

export function normalizeAvsBaselineRange(
  fromDate: unknown,
  toDate: unknown,
): AvsBaselineRange {
  return normalizeAvsLatestCheckRange(fromDate, toDate);
}

export function avsBaselineRangeId(
  range: AvsBaselineRange,
): string {
  const digest = createHash('sha256')
    .update(`${range.fromDate}\n${range.toDate}`)
    .digest('hex')
    .slice(0, 20);
  return `range_${range.fromDate.replace(/-/g, '')}_${range.toDate.replace(/-/g, '')}_${digest}`;
}

export function baselineBatchFromQueryRows<T extends {
  id: string;
  serviceDateYmd: string;
}>(
  rows: readonly T[],
): {
  batch: T[];
  hasMore: boolean;
  nextCursor: AvsBaselineCursor | null;
} {
  const batch = rows.slice(0, AVS_BASELINE_MAX_SESSIONS_PER_RUN);
  const last = batch.at(-1) ?? null;
  return {
    batch,
    hasMore: rows.length > AVS_BASELINE_MAX_SESSIONS_PER_RUN,
    nextCursor: last
      ? {
          serviceDateYmd: last.serviceDateYmd,
          sessionId: last.id,
        }
      : null,
  };
}
