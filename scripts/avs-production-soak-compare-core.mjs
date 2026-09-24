export const AVS_SOAK_REPORT_BRICK = 'AVS_BRICK_7_PRODUCTION_SOAK';
export const AVS_SOAK_COMPARISON_BRICK = 'AVS_BRICK_8_SOAK_TREND';
export const AVS_SOAK_COMPARISON_SCHEMA_VERSION = 1;
export const AVS_SOAK_EXPECTED_PROJECT_ID = 'tinysteps-react-v1';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function asObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
  return value;
}

function text(value, name) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new TypeError(`${name} must be a non-empty string.`);
  return normalized;
}

function ymd(value, name) {
  const normalized = text(value, name);
  if (!YMD_RE.test(normalized)) {
    throw new TypeError(`${name} must be YYYY-MM-DD.`);
  }
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed)
    || new Date(parsed).toISOString().slice(0, 10) !== normalized
  ) {
    throw new TypeError(`${name} must be a valid calendar date.`);
  }
  return normalized;
}

function timestamp(value, name) {
  const normalized = text(value, name);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`${name} must be an ISO timestamp.`);
  }
  return parsed;
}

function nonNegativeInteger(value, name) {
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed)
    || parsed < 0
    || !Number.isInteger(parsed)
  ) {
    throw new TypeError(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

function bool(value, name) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${name} must be boolean.`);
  }
  return value;
}

function metric(before, after, lowerIsBetter = true) {
  const delta = after - before;
  let direction = 'unchanged';
  if (delta !== 0) {
    if (!lowerIsBetter) direction = 'changed';
    else direction = delta < 0 ? 'improved' : 'worsened';
  }
  return { before, after, delta, direction };
}

function requireZero(value, name) {
  const normalized = nonNegativeInteger(value, name);
  if (normalized !== 0) {
    throw new TypeError(`${name} must be 0 for a Brick 7 read-only soak report.`);
  }
  return normalized;
}

export function normalizeAvsBrick7SoakReport(input, label = 'report') {
  const report = asObject(input, label);

  if (nonNegativeInteger(report.schemaVersion, `${label}.schemaVersion`) !== 1) {
    throw new TypeError(`${label}.schemaVersion must be 1.`);
  }
  if (text(report.brick, `${label}.brick`) !== AVS_SOAK_REPORT_BRICK) {
    throw new TypeError(`${label}.brick is not a Brick 7 soak report.`);
  }

  const projectId = text(report.projectId, `${label}.projectId`);
  if (projectId !== AVS_SOAK_EXPECTED_PROJECT_ID) {
    throw new TypeError(
      `${label}.projectId must be ${AVS_SOAK_EXPECTED_PROJECT_ID}.`,
    );
  }

  const generatedAt = timestamp(report.generatedAt, `${label}.generatedAt`);
  const range = asObject(report.range, `${label}.range`);
  const fromDate = ymd(range.fromDate, `${label}.range.fromDate`);
  const toDate = ymd(range.toDate, `${label}.range.toDate`);
  if (fromDate > toDate) {
    throw new TypeError(`${label}.range is reversed.`);
  }

  const reads = asObject(report.reads, `${label}.reads`);
  if (bool(reads.bounded, `${label}.reads.bounded`) !== true) {
    throw new TypeError(`${label}.reads.bounded must be true.`);
  }

  requireZero(report.graphCalls, `${label}.graphCalls`);
  requireZero(report.operationalWrites, `${label}.operationalWrites`);
  if (
    bool(
      report.operationalMutationAllowed,
      `${label}.operationalMutationAllowed`,
    ) !== false
  ) {
    throw new TypeError(
      `${label}.operationalMutationAllowed must be false.`,
    );
  }

  const cases = asObject(report.cases, `${label}.cases`);
  const dirty = asObject(report.dirtySessions, `${label}.dirtySessions`);
  const runs = asObject(report.forceFreshRuns, `${label}.forceFreshRuns`);
  const safety = asObject(report.safety, `${label}.safety`);

  return {
    schemaVersion: 1,
    brick: AVS_SOAK_REPORT_BRICK,
    projectId,
    generatedAt: generatedAt.toISOString(),
    generatedAtMs: generatedAt.getTime(),
    range: { fromDate, toDate },
    cases: {
      totalCount: nonNegativeInteger(
        cases.totalCount,
        `${label}.cases.totalCount`,
      ),
      openReviewCaseCount: nonNegativeInteger(
        cases.openReviewCaseCount,
        `${label}.cases.openReviewCaseCount`,
      ),
    },
    dirtySessions: {
      totalCount: nonNegativeInteger(
        dirty.totalCount,
        `${label}.dirtySessions.totalCount`,
      ),
      infrastructureRetryCount: nonNegativeInteger(
        dirty.infrastructureRetryCount,
        `${label}.dirtySessions.infrastructureRetryCount`,
      ),
      olderThan24HoursCount: nonNegativeInteger(
        dirty.olderThan24HoursCount,
        `${label}.dirtySessions.olderThan24HoursCount`,
      ),
      olderThan72HoursCount: nonNegativeInteger(
        dirty.olderThan72HoursCount,
        `${label}.dirtySessions.olderThan72HoursCount`,
      ),
    },
    forceFreshRuns: {
      failedCaseBacklog: nonNegativeInteger(
        runs.failedCaseBacklog,
        `${label}.forceFreshRuns.failedCaseBacklog`,
      ),
      retryableFailureBacklog: nonNegativeInteger(
        runs.retryableFailureBacklog,
        `${label}.forceFreshRuns.retryableFailureBacklog`,
      ),
      actionRequiredFailureBacklog: nonNegativeInteger(
        runs.actionRequiredFailureBacklog,
        `${label}.forceFreshRuns.actionRequiredFailureBacklog`,
      ),
      remainingCaseBacklog: nonNegativeInteger(
        runs.remainingCaseBacklog,
        `${label}.forceFreshRuns.remainingCaseBacklog`,
      ),
    },
    safety: {
      explicitOperationalMutationPermissionCount: nonNegativeInteger(
        safety.explicitOperationalMutationPermissionCount,
        `${label}.safety.explicitOperationalMutationPermissionCount`,
      ),
      invalidCaseDateCount: nonNegativeInteger(
        safety.invalidCaseDateCount,
        `${label}.safety.invalidCaseDateCount`,
      ),
      invalidDirtyDateCount: nonNegativeInteger(
        safety.invalidDirtyDateCount,
        `${label}.safety.invalidDirtyDateCount`,
      ),
      invariantViolation: bool(
        safety.invariantViolation,
        `${label}.safety.invariantViolation`,
      ),
    },
    reads: { bounded: true },
    graphCalls: 0,
    operationalWrites: 0,
    operationalMutationAllowed: false,
  };
}

export function compareAvsSoakReports(beforeInput, afterInput) {
  const before = normalizeAvsBrick7SoakReport(beforeInput, 'before');
  const after = normalizeAvsBrick7SoakReport(afterInput, 'after');

  if (after.generatedAtMs <= before.generatedAtMs) {
    throw new TypeError('after.generatedAt must be later than before.generatedAt.');
  }
  if (after.range.toDate < before.range.toDate) {
    throw new TypeError(
      'after.range.toDate must be the same as or later than before.range.toDate.',
    );
  }

  const trends = {
    openReviewCases: metric(
      before.cases.openReviewCaseCount,
      after.cases.openReviewCaseCount,
    ),
    dirtySessions: metric(
      before.dirtySessions.totalCount,
      after.dirtySessions.totalCount,
    ),
    infrastructureRetryDirtySessions: metric(
      before.dirtySessions.infrastructureRetryCount,
      after.dirtySessions.infrastructureRetryCount,
    ),
    staleDirtySessions72Hours: metric(
      before.dirtySessions.olderThan72HoursCount,
      after.dirtySessions.olderThan72HoursCount,
    ),
    failedReFetchCases: metric(
      before.forceFreshRuns.failedCaseBacklog,
      after.forceFreshRuns.failedCaseBacklog,
    ),
    retryableInfrastructureFailures: metric(
      before.forceFreshRuns.retryableFailureBacklog,
      after.forceFreshRuns.retryableFailureBacklog,
    ),
    actionRequiredFailures: metric(
      before.forceFreshRuns.actionRequiredFailureBacklog,
      after.forceFreshRuns.actionRequiredFailureBacklog,
    ),
    remainingReFetchCases: metric(
      before.forceFreshRuns.remainingCaseBacklog,
      after.forceFreshRuns.remainingCaseBacklog,
    ),
    totalCasesObserved: metric(
      before.cases.totalCount,
      after.cases.totalCount,
      false,
    ),
  };

  const criteria = {
    safetyInvariantClear: !after.safety.invariantViolation,
    noExplicitOperationalMutationPermission:
      after.safety.explicitOperationalMutationPermissionCount === 0,
    noInvalidSidecarDates:
      after.safety.invalidCaseDateCount === 0
      && after.safety.invalidDirtyDateCount === 0,
    noActionRequiredInfrastructureBacklog:
      after.forceFreshRuns.actionRequiredFailureBacklog === 0,
    noRetryableInfrastructureBacklog:
      after.forceFreshRuns.retryableFailureBacklog === 0,
    noInfrastructureRetryDirtyBacklog:
      after.dirtySessions.infrastructureRetryCount === 0,
    noStaleDirtyBacklog72Hours:
      after.dirtySessions.olderThan72HoursCount === 0,
    noRemainingReFetchBacklog:
      after.forceFreshRuns.remainingCaseBacklog === 0,
  };

  const blockingCriteria = Object.entries(criteria)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  const hardSafetyBlocked =
    !criteria.safetyInvariantClear
    || !criteria.noExplicitOperationalMutationPermission
    || !criteria.noInvalidSidecarDates;

  const readyForManualExitReview = blockingCriteria.length === 0;
  const gateStatus = hardSafetyBlocked
    ? 'blocked_safety'
    : readyForManualExitReview
      ? 'ready_for_manual_exit_review'
      : 'continue_soak';

  const regressionMetricNames = Object.entries(trends)
    .filter(([name, value]) =>
      name !== 'totalCasesObserved'
      && value.direction === 'worsened',
    )
    .map(([name]) => name);

  return {
    schemaVersion: AVS_SOAK_COMPARISON_SCHEMA_VERSION,
    brick: AVS_SOAK_COMPARISON_BRICK,
    projectId: AVS_SOAK_EXPECTED_PROJECT_ID,
    generatedAt: new Date().toISOString(),
    snapshots: {
      before: {
        generatedAt: before.generatedAt,
        range: before.range,
      },
      after: {
        generatedAt: after.generatedAt,
        range: after.range,
      },
    },
    trends,
    stability: {
      regressionDetected: regressionMetricNames.length > 0,
      regressionMetricNames,
    },
    exitGate: {
      status: gateStatus,
      readyForManualExitReview,
      criteria,
      blockingCriteria,
      businessReviewCaseCount:
        after.cases.openReviewCaseCount,
      businessReviewCasesBlockExitGate: false,
      automationAuthorized: false,
    },
    safety: {
      graphCalls: 0,
      firebaseReads: 0,
      firebaseWrites: 0,
      operationalWrites: 0,
      operationalMutationAllowed: false,
    },
  };
}
