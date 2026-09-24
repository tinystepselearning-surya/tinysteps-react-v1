import { describe, expect, it } from 'vitest';
import {
  normalizeAvsSoakRange,
  summarizeAttendanceValidationSoak,
} from '../avs-production-soak-summary.mjs';

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

  it('summarizes cases, dirty backlog, and re-fetch generations without PII', () => {
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
        {
          serviceDateYmd: '2026-09-22',
          classification: 'MISSING_TEAMS_EVIDENCE',
          resolutionStatus: 'needs_review',
          tinyStepsAttendance: 'present',
          reasons: ['meeting_not_found'],
          proofIssues: ['attendance_report_missing'],
          identityIssues: [],
          operationalMutationAllowed: false,
        },
      ],
      dirtySessions: [
        {
          serviceDateYmd: '2026-09-22',
          reason: 'validation_infrastructure_retry',
          dirtyAt: new Date('2026-09-21T10:00:00.000Z'),
          operationalMutationAllowed: false,
        },
        {
          serviceDateYmd: '2026-09-23',
          reason: 'teacher_attendance_changed',
          dirtyAt: new Date('2026-09-24T10:00:00.000Z'),
          operationalMutationAllowed: false,
        },
      ],
      forceFreshRuns: [
        {
          fromDate: '2026-09-20',
          toDate: '2026-09-23',
          status: 'complete_with_failures',
          failedCount: 3,
          retryableFailureCount: 2,
          actionRequiredFailureCount: 1,
          remainingCases: 0,
          graphLogicalCalls: 12,
          operationalMutationAllowed: false,
        },
      ],
    });

    expect(report.cases.totalCount).toBe(2);
    expect(report.cases.classificationCounts).toEqual({
      MISSING_TEAMS_EVIDENCE: 1,
      VERIFIED: 1,
    });
    expect(report.cases.openReviewCaseCount).toBe(1);
    expect(report.dirtySessions.totalCount).toBe(2);
    expect(report.dirtySessions.infrastructureRetryCount).toBe(1);
    expect(report.dirtySessions.olderThan24HoursCount).toBe(1);
    expect(report.forceFreshRuns.retryableFailureBacklog).toBe(2);
    expect(report.forceFreshRuns.actionRequiredFailureBacklog).toBe(1);
    expect(report.forceFreshRuns.graphLogicalCalls).toBe(12);
    expect(report.safety.invariantViolation).toBe(false);

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('Private Student');
    expect(serialized).not.toContain('Private Teacher');
    expect(serialized).not.toContain('private@example.com');
  });

  it('fails the safety signal only for explicit mutation permission or invalid dates', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [
        {
          serviceDateYmd: '2026-09-21',
          classification: 'VERIFIED',
          operationalMutationAllowed: true,
        },
        {
          serviceDateYmd: 'bad-date',
          classification: 'AMBIGUOUS',
          operationalMutationAllowed: false,
        },
      ],
      dirtySessions: [],
      forceFreshRuns: [],
    });

    expect(report.safety.explicitOperationalMutationPermissionCount).toBe(1);
    expect(report.safety.invalidCaseDateCount).toBe(1);
    expect(report.safety.invariantViolation).toBe(true);
    expect(report.operationalMutationAllowed).toBe(false);
  });

  it('reports missing mutation flags separately without treating them as explicit permission', () => {
    const report = summarizeAttendanceValidationSoak({
      range: { fromDate: '2026-09-20', toDate: '2026-09-24' },
      asOf: new Date('2026-09-24T16:30:00.000Z'),
      cases: [
        {
          serviceDateYmd: '2026-09-21',
          classification: 'VERIFIED',
        },
      ],
      dirtySessions: [],
      forceFreshRuns: [],
    });

    expect(report.safety.explicitOperationalMutationPermissionCount).toBe(0);
    expect(report.safety.missingOperationalMutationFlagCount).toBe(1);
    expect(report.safety.invariantViolation).toBe(false);
  });
});
