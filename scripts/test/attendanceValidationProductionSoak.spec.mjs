import { describe, expect, it } from 'vitest';
import {
  normalizeAvsSoakRange,
  summarizeAttendanceValidationSoak,
} from '../avs-production-soak-summary.mjs';

function baseRun(overrides = {}) {
  return {
    fromDate: '2026-09-20',
    toDate: '2026-09-24',
    status: 'complete',
    failedCount: 0,
    remainingCases: 0,
    graphLogicalCalls: 5,
    updatedAt: new Date('2026-09-24T10:00:00.000Z'),
    operationalMutationAllowed: false,
    _soakRunKey: 'run-0',
    _soakRunOrder: 0,
    ...overrides,
  };
}

function checkpoint(overrides = {}) {
  return {
    caseId: 'case-a',
    serviceDateYmd: '2026-09-22',
    status: 'refreshed',
    retryable: false,
    failureCategory: null,
    retryDisposition: null,
    operatorAction: null,
    updatedAt: new Date('2026-09-24T10:00:00.000Z'),
    operationalMutationAllowed: false,
    _soakRunKey: 'run-0',
    _soakRunOrder: 0,
    _soakCheckpointOrder: 0,
    ...overrides,
  };
}

describe('AVS Brick 7 production soak summary', () => {
  it('accepts only the bounded AVS validation window', () => {
    expect(normalizeAvsSoakRange('2026-09-01', '2026-09-24')).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-24',
      inclusiveDays: 24,
    });
    expect(() =>
      normalizeAvsSoakRange('2026-08-31', '2026-09-02'),
    ).toThrow(/cannot start before/);
    expect(() =>
      normalizeAvsSoakRange('2026-09-01', '2026-10-15'),
    ).toThrow(/at most 31 days/);
  });

  it('uses latest per-case checkpoint state instead of historical run totals', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [],
      dirtySessions: [],
      forceFreshRuns: [
        baseRun({
          status: 'complete_with_failures',
          failedCount: 1,
          updatedAt: new Date('2026-09-23T10:00:00.000Z'),
          _soakRunKey: 'run-old',
          _soakRunOrder: 0,
        }),
        baseRun({
          updatedAt: new Date('2026-09-24T10:00:00.000Z'),
          _soakRunKey: 'run-new',
          _soakRunOrder: 1,
        }),
      ],
      forceFreshCheckpoints: [
        checkpoint({
          status: 'failed',
          retryable: true,
          failureCategory: 'retryable_infrastructure',
          retryDisposition: 'retry',
          operatorAction: 'retry',
          updatedAt: new Date('2026-09-23T10:00:00.000Z'),
          _soakRunKey: 'run-old',
          _soakRunOrder: 0,
        }),
        checkpoint({
          status: 'refreshed',
          updatedAt: new Date('2026-09-24T10:00:00.000Z'),
          _soakRunKey: 'run-new',
          _soakRunOrder: 1,
        }),
      ],
    });

    expect(report.forceFreshRuns.failedCaseBacklog).toBe(0);
    expect(report.forceFreshRuns.retryableFailureBacklog).toBe(0);
    expect(report.forceFreshRuns.actionRequiredFailureBacklog).toBe(0);
    expect(report.forceFreshRuns.supersededFailureCheckpointCount).toBe(1);
    expect(report.forceFreshRuns.currentGenerationCount).toBe(1);
  });

  it('keeps the newest failed checkpoint as current even when an older run succeeded', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [],
      dirtySessions: [],
      forceFreshRuns: [
        baseRun({
          updatedAt: new Date('2026-09-23T10:00:00.000Z'),
          _soakRunKey: 'run-old',
          _soakRunOrder: 0,
        }),
        baseRun({
          status: 'complete_with_failures',
          failedCount: 1,
          updatedAt: new Date('2026-09-24T10:00:00.000Z'),
          _soakRunKey: 'run-new',
          _soakRunOrder: 1,
        }),
      ],
      forceFreshCheckpoints: [
        checkpoint({
          status: 'refreshed',
          updatedAt: new Date('2026-09-23T10:00:00.000Z'),
          _soakRunKey: 'run-old',
          _soakRunOrder: 0,
        }),
        checkpoint({
          status: 'failed',
          retryable: true,
          failureCategory: 'retryable_infrastructure',
          retryDisposition: 'retry',
          operatorAction: 'retry',
          updatedAt: new Date('2026-09-24T10:00:00.000Z'),
          _soakRunKey: 'run-new',
          _soakRunOrder: 1,
        }),
      ],
    });

    expect(report.forceFreshRuns.failedCaseBacklog).toBe(1);
    expect(report.forceFreshRuns.retryableFailureBacklog).toBe(1);
    expect(report.forceFreshRuns.actionRequiredFailureBacklog).toBe(0);
  });

  it('fails legacy failed checkpoints closed instead of losing their categorization', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [],
      dirtySessions: [],
      forceFreshRuns: [
        baseRun({
          status: 'complete_with_failures',
          failedCount: 1,
        }),
      ],
      forceFreshCheckpoints: [
        checkpoint({
          status: 'failed',
          retryable: undefined,
          failureCategory: undefined,
          retryDisposition: undefined,
          operatorAction: undefined,
        }),
      ],
    });

    expect(report.forceFreshRuns.failedCaseBacklog).toBe(1);
    expect(report.forceFreshRuns.retryableFailureBacklog).toBe(0);
    expect(report.forceFreshRuns.actionRequiredFailureBacklog).toBe(1);
    expect(report.forceFreshRuns.legacyUncategorizedFailureBacklog).toBe(1);
  });

  it('keeps unrepresented legacy run failures action-required', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [],
      dirtySessions: [],
      forceFreshRuns: [
        baseRun({
          status: 'complete_with_failures',
          failedCount: 2,
        }),
      ],
      forceFreshCheckpoints: [],
    });

    expect(report.forceFreshRuns.failedCaseBacklog).toBe(2);
    expect(report.forceFreshRuns.actionRequiredFailureBacklog).toBe(2);
    expect(report.forceFreshRuns.legacyUncategorizedFailureBacklog).toBe(2);
  });

  it('summarizes dirty backlog and remains aggregate-only', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [
        {
          serviceDateYmd: '2026-09-21',
          classification: 'VERIFIED',
          resolutionStatus: 'verified',
          tinyStepsAttendance: 'present',
          reasons: ['same_day_coverage_verified'],
          proofIssues: [],
          identityIssues: [],
          operationalMutationAllowed: false,
          studentName: 'Private Student',
          teacherName: 'Private Teacher',
          email: 'private@example.com',
        },
      ],
      dirtySessions: [
        {
          serviceDateYmd: '2026-09-22',
          reason: 'validation_infrastructure_retry',
          dirtyAt: new Date('2026-09-21T10:00:00.000Z'),
          operationalMutationAllowed: false,
        },
      ],
      forceFreshRuns: [baseRun()],
      forceFreshCheckpoints: [checkpoint()],
    });

    expect(report.schemaVersion).toBe(2);
    expect(report.dirtySessions.infrastructureRetryCount).toBe(1);
    expect(report.dirtySessions.olderThan24HoursCount).toBe(1);
    expect(report.forceFreshRuns.currentStateSchemaVersion).toBe(1);
    expect(report.safety.invariantViolation).toBe(false);

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('Private Student');
    expect(serialized).not.toContain('Private Teacher');
    expect(serialized).not.toContain('private@example.com');
    expect(serialized).not.toContain('case-a');
  });

  it('includes checkpoint mutation/date violations in the safety signal', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [],
      dirtySessions: [],
      forceFreshRuns: [baseRun()],
      forceFreshCheckpoints: [
        checkpoint({
          serviceDateYmd: 'bad-date',
          operationalMutationAllowed: true,
        }),
      ],
    });

    expect(report.safety.explicitOperationalMutationPermissionCount).toBe(1);
    expect(report.safety.invalidCheckpointDateCount).toBe(1);
    expect(report.safety.invariantViolation).toBe(true);
  });
});
