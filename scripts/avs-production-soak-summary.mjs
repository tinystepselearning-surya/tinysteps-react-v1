export const AVS_SOAK_VALIDATION_START_YMD = '2026-09-01';
export const AVS_SOAK_MAX_RANGE_DAYS = 31;
export const AVS_SOAK_CASE_READ_CAP = 5000;
export const AVS_SOAK_DIRTY_READ_CAP = 5000;
export const AVS_SOAK_RUN_READ_CAP = 200;

const DAY_MS = 24 * 60 * 60 * 1000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function count(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : 0;
}

function validYmd(value) {
  const normalized = text(value);
  if (!YMD_RE.test(normalized)) return null;
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function timestampDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  if (typeof value.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime())
      ? parsed
      : null;
  }

  const seconds =
    typeof value.seconds === 'number'
      ? value.seconds
      : value._seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;

  const parsed = new Date(seconds * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sortedCounter(values) {
  const counts = {};
  for (const value of values) {
    const key = text(value) || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function arrayValueCounts(rows, field) {
  const values = [];
  for (const row of rows) {
    const entries = Array.isArray(row?.[field]) ? row[field] : [];
    for (const entry of entries) {
      const normalized = text(entry);
      if (normalized) values.push(normalized);
    }
  }
  return sortedCounter(values);
}

function inRange(value, range) {
  const ymd = validYmd(value);
  return Boolean(
    ymd
    && ymd >= range.fromDate
    && ymd <= range.toDate,
  );
}

function operationalMutationTrueCount(rows) {
  return rows.filter((row) => row?.operationalMutationAllowed === true).length;
}

function operationalMutationMissingCount(rows) {
  return rows.filter(
    (row) => row?.operationalMutationAllowed !== false
      && row?.operationalMutationAllowed !== true,
  ).length;
}

export function normalizeAvsSoakRange(fromDate, toDate) {
  const from = validYmd(fromDate);
  const to = validYmd(toDate);
  if (!from || !to) {
    throw new TypeError('AVS soak range requires valid YYYY-MM-DD dates.');
  }
  if (from < AVS_SOAK_VALIDATION_START_YMD) {
    throw new RangeError(
      `AVS soak range cannot start before ${AVS_SOAK_VALIDATION_START_YMD}.`,
    );
  }
  if (from > to) {
    throw new RangeError('AVS soak fromDate must be on or before toDate.');
  }

  const inclusiveDays =
    Math.floor(
      (
        Date.parse(`${to}T00:00:00.000Z`)
        - Date.parse(`${from}T00:00:00.000Z`)
      ) / DAY_MS,
    ) + 1;

  if (inclusiveDays > AVS_SOAK_MAX_RANGE_DAYS) {
    throw new RangeError(
      `AVS soak range supports at most ${AVS_SOAK_MAX_RANGE_DAYS} days.`,
    );
  }

  return { fromDate: from, toDate: to, inclusiveDays };
}

export function summarizeAttendanceValidationSoak(input) {
  const range = normalizeAvsSoakRange(
    input?.range?.fromDate,
    input?.range?.toDate,
  );
  const asOf = input?.asOf instanceof Date
    ? input.asOf
    : new Date(input?.asOf ?? Date.now());
  if (Number.isNaN(asOf.getTime())) {
    throw new TypeError('asOf must be a valid date.');
  }

  const cases = Array.isArray(input?.cases) ? input.cases : [];
  const dirtySessions = Array.isArray(input?.dirtySessions)
    ? input.dirtySessions
    : [];
  const forceFreshRuns = Array.isArray(input?.forceFreshRuns)
    ? input.forceFreshRuns
    : [];

  const caseRows = cases.filter((row) =>
    inRange(row?.serviceDateYmd, range),
  );
  const dirtyRows = dirtySessions.filter((row) =>
    inRange(row?.serviceDateYmd, range),
  );
  const runRows = forceFreshRuns.filter((row) => {
    const fromDate = validYmd(row?.fromDate);
    const toDate = validYmd(row?.toDate);
    return Boolean(
      fromDate
      && toDate
      && fromDate <= range.toDate
      && toDate >= range.fromDate,
    );
  });

  let dirtyOlderThan24Hours = 0;
  let dirtyOlderThan72Hours = 0;
  let dirtyTimestampMissingCount = 0;
  let oldestDirtyAgeHours = 0;

  for (const row of dirtyRows) {
    const dirtyAt = timestampDate(row?.dirtyAt);
    if (!dirtyAt) {
      dirtyTimestampMissingCount += 1;
      continue;
    }
    const ageHours = Math.max(
      0,
      (asOf.getTime() - dirtyAt.getTime()) / (60 * 60 * 1000),
    );
    oldestDirtyAgeHours = Math.max(oldestDirtyAgeHours, ageHours);
    if (ageHours > 24) dirtyOlderThan24Hours += 1;
    if (ageHours > 72) dirtyOlderThan72Hours += 1;
  }

  const explicitOperationalMutationPermissionCount =
    operationalMutationTrueCount(caseRows)
    + operationalMutationTrueCount(dirtyRows)
    + operationalMutationTrueCount(runRows);

  const missingOperationalMutationFlagCount =
    operationalMutationMissingCount(caseRows)
    + operationalMutationMissingCount(dirtyRows)
    + operationalMutationMissingCount(runRows);

  const invalidCaseDateCount = cases.filter(
    (row) => !validYmd(row?.serviceDateYmd),
  ).length;
  const invalidDirtyDateCount = dirtySessions.filter(
    (row) => !validYmd(row?.serviceDateYmd),
  ).length;

  const statusCounts = sortedCounter(
    runRows.map((row) => row?.status),
  );
  const classificationCounts = sortedCounter(
    caseRows.map((row) => row?.classification),
  );
  const resolutionStatusCounts = sortedCounter(
    caseRows.map((row) => row?.resolutionStatus),
  );
  const attendanceCounts = sortedCounter(
    caseRows.map((row) => row?.tinyStepsAttendance),
  );
  const dirtyReasonCounts = sortedCounter(
    dirtyRows.map((row) => row?.reason),
  );

  const retryableFailureBacklog = runRows.reduce(
    (sum, row) => sum + count(row?.retryableFailureCount),
    0,
  );
  const actionRequiredFailureBacklog = runRows.reduce(
    (sum, row) => sum + count(row?.actionRequiredFailureCount),
    0,
  );
  const failedCaseBacklog = runRows.reduce(
    (sum, row) => sum + count(row?.failedCount),
    0,
  );
  const remainingCaseBacklog = runRows.reduce(
    (sum, row) => sum + count(row?.remainingCases),
    0,
  );
  const graphLogicalCalls = runRows.reduce(
    (sum, row) => sum + count(row?.graphLogicalCalls),
    0,
  );

  const openReviewCaseCount = caseRows.filter((row) => {
    const status = text(row?.resolutionStatus);
    return status === 'open' || status === 'needs_review';
  }).length;

  const infrastructureRetryDirtyCount = dirtyRows.filter(
    (row) => text(row?.reason) === 'validation_infrastructure_retry',
  ).length;

  return {
    schemaVersion: 1,
    brick: 'AVS_BRICK_7_PRODUCTION_SOAK',
    generatedAt: asOf.toISOString(),
    range,
    cases: {
      totalCount: caseRows.length,
      classificationCounts,
      resolutionStatusCounts,
      tinyStepsAttendanceCounts: attendanceCounts,
      reasonCounts: arrayValueCounts(caseRows, 'reasons'),
      proofIssueCounts: arrayValueCounts(caseRows, 'proofIssues'),
      identityIssueCounts: arrayValueCounts(caseRows, 'identityIssues'),
      openReviewCaseCount,
    },
    dirtySessions: {
      totalCount: dirtyRows.length,
      reasonCounts: dirtyReasonCounts,
      infrastructureRetryCount: infrastructureRetryDirtyCount,
      olderThan24HoursCount: dirtyOlderThan24Hours,
      olderThan72HoursCount: dirtyOlderThan72Hours,
      missingDirtyTimestampCount: dirtyTimestampMissingCount,
      oldestDirtyAgeHours: Number(oldestDirtyAgeHours.toFixed(2)),
    },
    forceFreshRuns: {
      totalCount: runRows.length,
      statusCounts,
      failedCaseBacklog,
      retryableFailureBacklog,
      actionRequiredFailureBacklog,
      remainingCaseBacklog,
      graphLogicalCalls,
    },
    safety: {
      explicitOperationalMutationPermissionCount,
      missingOperationalMutationFlagCount,
      invalidCaseDateCount,
      invalidDirtyDateCount,
      invariantViolation:
        explicitOperationalMutationPermissionCount > 0
        || invalidCaseDateCount > 0
        || invalidDirtyDateCount > 0,
    },
    signals: {
      pendingDirtySessions: dirtyRows.length,
      infrastructureRetryDirtySessions: infrastructureRetryDirtyCount,
      retryableFailureBacklog,
      actionRequiredFailureBacklog,
      openReviewCases: openReviewCaseCount,
      safetyInvariantViolation:
        explicitOperationalMutationPermissionCount > 0
        || invalidCaseDateCount > 0
        || invalidDirtyDateCount > 0,
    },
    operationalMutationAllowed: false,
  };
}
