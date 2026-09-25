import { describe, expect, it } from 'vitest';
import {
  compareAvsSoakReports,
  normalizeAvsBrick7SoakReport,
} from '../avs-production-soak-compare-core.mjs';

function report({
  generatedAt,
  fromDate = '2026-09-18',
  toDate = '2026-09-23',
  openReview = 0,
  dirty = 0,
  infraDirty = 0,
  stale72 = 0,
  failed = 0,
  retryable = 0,
  actionRequired = 0,
  legacy = 0,
  remaining = 0,
  mutationPermission = 0,
  invalidCases = 0,
  invalidDirty = 0,
  invalidCheckpoints = 0,
  invariantViolation = false,
  extras = {},
}) {
  return {
    schemaVersion: 2,
    brick: 'AVS_BRICK_7_PRODUCTION_SOAK',
    generatedAt,
    projectId: 'tinysteps-react-v1',
    range: {
      fromDate,
      toDate,
      inclusiveDays: 6,
    },
    cases: {
      totalCount: 25,
      classificationCounts: {},
      resolutionStatusCounts: {},
      tinyStepsAttendanceCounts: {},
      reasonCounts: {},
      proofIssueCounts: {},
      identityIssueCounts: {},
      openReviewCaseCount: openReview,
    },
    dirtySessions: {
      totalCount: dirty,
      reasonCounts: {},
      infrastructureRetryCount: infraDirty,
      olderThan24HoursCount: stale72,
      olderThan72HoursCount: stale72,
      missingDirtyTimestampCount: 0,
      oldestDirtyAgeHours: 0,
    },
    forceFreshRuns: {
      currentStateSchemaVersion: 1,
      currentGenerationCount: 1,
      currentStateCheckpointCount: 10,
      currentGenerationCheckpointCount: 10,
      failedCaseBacklog: failed,
      retryableFailureBacklog: retryable,
      actionRequiredFailureBacklog: actionRequired,
      legacyUncategorizedFailureBacklog: legacy,
      remainingCaseBacklog: remaining,
      supersededFailureCheckpointCount: 0,
      historicalGenerationCount: 2,
      historicalCheckpointCount: 20,
      historicalGraphLogicalCalls: 10,
      historicalRunStatusCounts: {},
    },
    safety: {
      explicitOperationalMutationPermissionCount: mutationPermission,
      missingOperationalMutationFlagCount: 0,
      invalidCaseDateCount: invalidCases,
      invalidDirtyDateCount: invalidDirty,
      invalidCheckpointDateCount: invalidCheckpoints,
      invariantViolation,
    },
    signals: {},
    operationalMutationAllowed: false,
    reads: { bounded: true },
    graphCalls: 0,
    operationalWrites: 0,
    ...extras,
  };
}

describe('AVS Brick 8 soak trend comparison', () => {
  it('marks a clean current-state snapshot ready for manual exit review', () => {
    const before = report({
      generatedAt: '2026-09-23T16:30:00.000Z',
      dirty: 4,
      infraDirty: 2,
      stale72: 1,
      failed: 3,
      retryable: 2,
      actionRequired: 1,
      remaining: 5,
      openReview: 8,
    });
    const after = report({
      generatedAt: '2026-09-24T16:30:00.000Z',
      openReview: 7,
    });

    const comparison = compareAvsSoakReports(before, after);

    expect(comparison.exitGate.status).toBe('ready_for_manual_exit_review');
    expect(comparison.exitGate.readyForManualExitReview).toBe(true);
    expect(comparison.exitGate.blockingCriteria).toEqual([]);
    expect(comparison.exitGate.businessReviewCaseCount).toBe(7);
    expect(comparison.exitGate.businessReviewCasesBlockExitGate).toBe(false);
    expect(comparison.exitGate.automationAuthorized).toBe(false);
    expect(comparison.trends.retryableInfrastructureFailures).toMatchObject({
      before: 2,
      after: 0,
      delta: -2,
      direction: 'improved',
    });
  });

  it('blocks on current unresolved or legacy-uncategorized infrastructure state', () => {
    const before = report({
      generatedAt: '2026-09-23T16:30:00.000Z',
    });
    const after = report({
      generatedAt: '2026-09-24T16:30:00.000Z',
      failed: 3,
      retryable: 1,
      actionRequired: 2,
      legacy: 1,
      infraDirty: 2,
      remaining: 4,
    });

    const comparison = compareAvsSoakReports(before, after);

    expect(comparison.exitGate.status).toBe('continue_soak');
    expect(comparison.exitGate.blockingCriteria).toEqual(
      expect.arrayContaining([
        'noActionRequiredInfrastructureBacklog',
        'noRetryableInfrastructureBacklog',
        'noLegacyUncategorizedFailureBacklog',
        'noInfrastructureRetryDirtyBacklog',
        'noRemainingReFetchBacklog',
      ]),
    );
  });

  it('hard-blocks on AVS safety invariant violations', () => {
    const before = report({
      generatedAt: '2026-09-23T16:30:00.000Z',
    });
    const after = report({
      generatedAt: '2026-09-24T16:30:00.000Z',
      mutationPermission: 1,
      invariantViolation: true,
    });

    const comparison = compareAvsSoakReports(before, after);
    expect(comparison.exitGate.status).toBe('blocked_safety');
    expect(comparison.exitGate.readyForManualExitReview).toBe(false);
    expect(comparison.exitGate.automationAuthorized).toBe(false);
  });

  it('requires exactly the same service-date window', () => {
    const before = report({
      generatedAt: '2026-09-23T16:30:00.000Z',
      fromDate: '2026-09-18',
      toDate: '2026-09-23',
    });

    expect(() => compareAvsSoakReports(
      before,
      report({
        generatedAt: '2026-09-24T16:30:00.000Z',
        fromDate: '2026-09-19',
        toDate: '2026-09-23',
      }),
    )).toThrow(/exact same service-date window/);

    expect(() => compareAvsSoakReports(
      before,
      report({
        generatedAt: '2026-09-24T16:30:00.000Z',
        fromDate: '2026-09-18',
        toDate: '2026-09-24',
      }),
    )).toThrow(/exact same service-date window/);
  });

  it('rejects old Brick 7 schema and inconsistent current-state counters', () => {
    expect(() => normalizeAvsBrick7SoakReport({
      ...report({ generatedAt: '2026-09-24T16:30:00.000Z' }),
      schemaVersion: 1,
    })).toThrow(/schemaVersion must be 2/);

    expect(() => normalizeAvsBrick7SoakReport(
      report({
        generatedAt: '2026-09-24T16:30:00.000Z',
        failed: 2,
        retryable: 1,
        actionRequired: 0,
      }),
    )).toThrow(/current failure backlog counters are inconsistent/);
  });

  it('whitelists aggregate fields and never echoes extra PII', () => {
    const raw = report({
      generatedAt: '2026-09-24T16:30:00.000Z',
      extras: {
        studentName: 'Private Student',
        teacherName: 'Private Teacher',
        email: 'private@example.com',
        joinUrl: 'https://private.invalid/meeting',
      },
    });

    const normalized = normalizeAvsBrick7SoakReport(raw, 'report');
    const serialized = JSON.stringify(normalized);

    expect(serialized).not.toContain('Private Student');
    expect(serialized).not.toContain('Private Teacher');
    expect(serialized).not.toContain('private@example.com');
    expect(serialized).not.toContain('private.invalid');
  });

  it('rejects reports that are not bounded read-only Brick 7 snapshots', () => {
    expect(() => normalizeAvsBrick7SoakReport({
      ...report({ generatedAt: '2026-09-24T16:30:00.000Z' }),
      graphCalls: 1,
    })).toThrow(/graphCalls must be 0/);

    expect(() => normalizeAvsBrick7SoakReport({
      ...report({ generatedAt: '2026-09-24T16:30:00.000Z' }),
      operationalWrites: 1,
    })).toThrow(/operationalWrites must be 0/);

    expect(() => normalizeAvsBrick7SoakReport({
      ...report({ generatedAt: '2026-09-24T16:30:00.000Z' }),
      reads: { bounded: false },
    })).toThrow(/reads.bounded must be true/);
  });

  it('rejects reversed snapshot chronology', () => {
    const before = report({
      generatedAt: '2026-09-24T16:30:00.000Z',
    });
    const olderAfter = report({
      generatedAt: '2026-09-23T16:30:00.000Z',
    });
    expect(() => compareAvsSoakReports(before, olderAfter)).toThrow(
      /generatedAt must be later/,
    );
  });
});
