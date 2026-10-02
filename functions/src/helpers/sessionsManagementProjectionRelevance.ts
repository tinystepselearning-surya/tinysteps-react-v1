/**
 * Sessions Management is an operational read model. Finance bookkeeping fields are
 * deliberately excluded from its live projection revision signal so backend ledger
 * writes do not force redundant delta writes and admin snapshot reloads.
 */

type UnknownRecord = Record<string, unknown>;

const ENROLLMENT_NON_PROJECTION_FIELDS = new Set([
  'metrics',
  'updatedAt',
  'updatedBy',
]);

const SESSION_NON_PROJECTION_FIELDS = new Set([
  'updatedAt',
  'updatedBy',
  'financialTermsSnapshotVersion',
  'billingRateSnapshot',
  'teacherPayRateSnapshot',
  'financialTermsCurrency',
  'financialTermsCapturedAt',
  'financialTermsSnapshotSource',
  'revenueAccrued',
  'accruedAmount',
  'accruedMonthKey',
  'accruedAt',
  'revenueRepairRequired',
  'revenueRepairDetectedAt',
  'revenueRepairReason',
]);

const comparableValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return { __dateMs: value.getTime() };
  if (Array.isArray(value)) return value.map(comparableValue);
  if (typeof value === 'object') {
    const timestampLike = value as { toMillis?: () => number; path?: unknown };
    if (typeof timestampLike.toMillis === 'function') {
      try {
        return { __timestampMs: timestampLike.toMillis() };
      } catch {
        // Fall through to stable object normalization.
      }
    }
    if (typeof timestampLike.path === 'string') {
      return { __documentPath: timestampLike.path };
    }
    const record = value as UnknownRecord;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, comparableValue(record[key])]),
    );
  }
  return String(value);
};

const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(comparableValue(left)) === JSON.stringify(comparableValue(right));

const hasRelevantTopLevelChange = (
  before: UnknownRecord,
  after: UnknownRecord,
  ignoredFields: Set<string>,
): boolean => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (ignoredFields.has(key)) continue;
    if (!valuesEqual(before[key], after[key])) return true;
  }
  return false;
};

export const hasSessionsManagementEnrollmentProjectionChange = (
  before: UnknownRecord,
  after: UnknownRecord,
): boolean => hasRelevantTopLevelChange(before, after, ENROLLMENT_NON_PROJECTION_FIELDS);

export const hasSessionsManagementSessionProjectionChange = (
  before: UnknownRecord,
  after: UnknownRecord,
): boolean => hasRelevantTopLevelChange(before, after, SESSION_NON_PROJECTION_FIELDS);
