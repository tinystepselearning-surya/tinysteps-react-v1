import { describe, expect, it } from 'vitest';
import {
  groupPersistedAvsBusinessOutcomes,
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
    businessOutcome: 'verified',
    teamsSupportedPresentCount: 1,
    tinyStepsPresentCount: 1,
    businessDifferenceCount: 0,
    sameDayEvidenceEvaluable: true,
    ...overrides,
  };
}

describe('AVS persisted three-outcome business grouping', () => {
  it('groups same student/teacher/service-date rows without recalculating attendance', () => {
    const [group] = groupPersistedAvsBusinessOutcomes([
      avsCase('session-1'),
      avsCase('session-2'),
    ]);

    expect(group.outcome).toBe('verified');
    expect(group.teamsSupportedPresentCount).toBe(1);
    expect(group.tinyStepsPresentCount).toBe(1);
    expect(group.cases).toHaveLength(2);
  });

  it('preserves a backend False Present result', () => {
    const [group] = groupPersistedAvsBusinessOutcomes([
      avsCase('session-1', {
        businessOutcome: 'false_present',
        teamsSupportedPresentCount: 1,
        tinyStepsPresentCount: 2,
        businessDifferenceCount: 1,
      }),
      avsCase('session-2', {
        businessOutcome: 'false_present',
        teamsSupportedPresentCount: 1,
        tinyStepsPresentCount: 2,
        businessDifferenceCount: 1,
      }),
    ]);

    expect(group.outcome).toBe('false_present');
    expect(group.differenceCount).toBe(1);
  });

  it('preserves a backend False Absent result', () => {
    const [group] = groupPersistedAvsBusinessOutcomes([
      avsCase('session-1', {
        businessOutcome: 'false_absent',
        teamsSupportedPresentCount: 2,
        tinyStepsPresentCount: 1,
        businessDifferenceCount: 1,
      }),
      avsCase('session-2', {
        businessOutcome: 'false_absent',
        teamsSupportedPresentCount: 2,
        tinyStepsPresentCount: 1,
        businessDifferenceCount: 1,
      }),
    ]);

    expect(group.outcome).toBe('false_absent');
    expect(group.differenceCount).toBe(1);
  });

  it('does not infer from legacy or incomplete rows', () => {
    const [group] = groupPersistedAvsBusinessOutcomes([
      avsCase('session-old', {
        businessOutcome: null,
        teamsSupportedPresentCount: null,
        tinyStepsPresentCount: null,
        businessDifferenceCount: null,
        sameDayEvidenceEvaluable: null,
      }),
    ]);

    expect(group.outcome).toBe('not_evaluable');
    expect(group.teamsSupportedPresentCount).toBeNull();
    expect(group.tinyStepsPresentCount).toBeNull();
  });

  it('fails closed when rows inside one business group disagree', () => {
    const [group] = groupPersistedAvsBusinessOutcomes([
      avsCase('session-1'),
      avsCase('session-2', {
        businessOutcome: 'false_present',
        teamsSupportedPresentCount: 0,
        tinyStepsPresentCount: 1,
        businessDifferenceCount: 1,
      }),
    ]);

    expect(group.outcome).toBe('not_evaluable');
  });
});
