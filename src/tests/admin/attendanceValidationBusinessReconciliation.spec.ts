import { describe, expect, it } from 'vitest';
import {
  reconcileAvsBusinessGroups,
  supportedPresentCountFromOverlap,
  type AvsBusinessCaseInput,
} from '../../lib/attendanceValidationBusinessReconciliation';

function avsCase(
  id: string,
  overrides: Partial<AvsBusinessCaseInput> = {},
): AvsBusinessCaseInput {
  return {
    id,
    serviceDateYmd: '2026-09-18',
    enrollmentId: 'enrollment-1',
    kidId: 'kid-1',
    teacherId: 'teacher-1',
    studentName: 'Student One',
    teacherName: 'Teacher One',
    tinyStepsAttendance: null,
    validationDecision: 'review',
    sameDayCoverageSeconds: null,
    sameDayPresentSessionCount: null,
    sameDayOccurrenceCount: null,
    reasons: [],
    sourceClassificationReasons: [],
    proofIssues: [],
    identityIssues: [],
    staffRegistryIssues: [],
    ...overrides,
  };
}

describe('AVS three-outcome business reconciliation', () => {
  it('honours the strict greater-than 25-minute rule and multi-session scaling', () => {
    expect(supportedPresentCountFromOverlap(1500)).toBe(0);
    expect(supportedPresentCountFromOverlap(1501)).toBe(1);
    expect(supportedPresentCountFromOverlap(3000)).toBe(1);
    expect(supportedPresentCountFromOverlap(3001)).toBe(2);
    expect(supportedPresentCountFromOverlap(4501)).toBe(3);
  });

  it('marks a matching Teams-supported count and Tiny Steps Present count verified', () => {
    const [group] = reconcileAvsBusinessGroups([
      avsCase('session-1', {
        tinyStepsAttendance: 'present',
        validationDecision: 'present',
        sameDayCoverageSeconds: 2100,
        sameDayPresentSessionCount: 1,
        sameDayOccurrenceCount: 1,
      }),
    ]);

    expect(group.outcome).toBe('verified');
    expect(group.teamsSupportedPresentCount).toBe(1);
    expect(group.tinyStepsPresentCount).toBe(1);
  });

  it('finds exactly one false present when Tiny Steps has two Presents but Teams supports one', () => {
    const cases = [
      avsCase('session-1', {
        tinyStepsAttendance: 'present',
        validationDecision: 'review',
        sameDayCoverageSeconds: 2100,
        sameDayPresentSessionCount: 2,
        sameDayOccurrenceCount: 1,
      }),
      avsCase('session-2', {
        tinyStepsAttendance: 'present',
        validationDecision: 'review',
        sameDayCoverageSeconds: 2100,
        sameDayPresentSessionCount: 2,
        sameDayOccurrenceCount: 1,
      }),
    ];

    const [group] = reconcileAvsBusinessGroups(cases);
    expect(group.outcome).toBe('false_present');
    expect(group.falsePresentCount).toBe(1);
    expect(group.falseAbsentCount).toBe(0);
  });

  it('finds exactly one false absent when Teams supports two Presents but Tiny Steps has one', () => {
    const cases = [
      avsCase('session-1', {
        tinyStepsAttendance: 'present',
        validationDecision: 'present',
        sameDayCoverageSeconds: 4200,
        sameDayPresentSessionCount: 1,
        sameDayOccurrenceCount: 2,
      }),
      avsCase('session-2', {
        tinyStepsAttendance: null,
        validationDecision: 'review',
        sameDayCoverageSeconds: 4200,
        sameDayPresentSessionCount: 1,
        sameDayOccurrenceCount: 2,
      }),
    ];

    const [group] = reconcileAvsBusinessGroups(cases);
    expect(group.outcome).toBe('false_absent');
    expect(group.falseAbsentCount).toBe(1);
    expect(group.falsePresentCount).toBe(0);
  });

  it('treats Absent or blank Tiny Steps rows as no Present discrepancy when Teams supports zero Presents', () => {
    const [absent] = reconcileAvsBusinessGroups([
      avsCase('session-1', {
        tinyStepsAttendance: 'absent',
        validationDecision: 'not_occurred',
        sameDayCoverageSeconds: 0,
        sameDayPresentSessionCount: 0,
        sameDayOccurrenceCount: 0,
      }),
    ]);
    expect(absent.outcome).toBe('verified');

    const [blank] = reconcileAvsBusinessGroups([
      avsCase('session-2', {
        tinyStepsAttendance: null,
        validationDecision: 'absent',
        sameDayCoverageSeconds: 0,
        sameDayPresentSessionCount: 0,
        sameDayOccurrenceCount: 1,
      }),
    ]);
    expect(blank.outcome).toBe('verified');
  });

  it('keeps insufficient evidence unresolved instead of forcing it into one of the three business outcomes', () => {
    const [group] = reconcileAvsBusinessGroups([
      avsCase('session-1', {
        tinyStepsAttendance: 'present',
        validationDecision: 'review',
        sameDayCoverageSeconds: 0,
        sameDayPresentSessionCount: 1,
        reasons: ['same_day_identity_requires_review'],
      }),
    ]);

    expect(group.outcome).toBe('unresolved');
    expect(group.falsePresentCount).toBe(0);
    expect(group.falseAbsentCount).toBe(0);
  });

  it('uses legacy deterministic decisions only when same-day diagnostics are unavailable', () => {
    const [group] = reconcileAvsBusinessGroups([
      avsCase('session-1', {
        tinyStepsAttendance: null,
        validationDecision: 'present',
      }),
    ]);

    expect(group.outcome).toBe('false_absent');
    expect(group.teamsSupportedPresentCount).toBe(1);
  });
});
