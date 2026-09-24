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
  maxSessions = AVS_BASELINE_MAX_SESSIONS_PER_RUN,
): {
  batch: T[];
  hasMore: boolean;
  nextCursor: AvsBaselineCursor | null;
} {
  if (
    !Number.isInteger(maxSessions)
    || maxSessions < 1
    || maxSessions > AVS_BASELINE_MAX_SESSIONS_PER_RUN
  ) {
    throw new RangeError(
      `maxSessions must be an integer from 1 to ${AVS_BASELINE_MAX_SESSIONS_PER_RUN}.`,
    );
  }

  const batch = rows.slice(0, maxSessions);
  const last = batch.at(-1) ?? null;
  return {
    batch,
    hasMore: rows.length > maxSessions,
    nextCursor: last
      ? {
          serviceDateYmd: last.serviceDateYmd,
          sessionId: last.id,
        }
      : null,
  };
}
