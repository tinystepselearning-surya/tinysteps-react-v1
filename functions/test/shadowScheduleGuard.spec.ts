import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  SHADOW_SCHEDULE_GUARD_SCHEDULE,
  SHADOW_SCHEDULE_GUARD_TIME_ZONE,
  buildShadowScheduleGuardAssessment,
} from '../src/scheduled/shadowScheduleGuard';
import type {ScheduleIntegritySummary} from '../src/scheduling/scheduleIntegrityEngine';

const baseSummary = (
  overrides: Partial<ScheduleIntegritySummary> = {},
): ScheduleIntegritySummary => ({
  mode: 'READ_ONLY',
  pointerIndependentScan: true,
  anchorYmd: '2026-09-18',
  horizonEndYmd: '2026-10-02',
  horizonDays: 14,
  operationalEnrollments: 3,
  eligibleEnrollments: 3,
  invalidEnrollments: 0,
  expectedOccurrences: 9,
  healthyOccurrences: 9,
  scheduleExceptions: 0,
  missingOccurrences: 0,
  identityMismatches: 0,
  scheduleMismatches: 0,
  staleRevisionOccurrences: 0,
  missingToday: 0,
  affectedEnrollments: 0,
  zeroCoveredEnrollments: 0,
  enrollmentsMissingMaterializationMetadata: 0,
  invalidByReason: {
    invalid_schedule: 0,
    missing_teacher: 0,
    ambiguous_teacher: 0,
    missing_child_identity: 0,
  },
  defectsByDate: {},
  details: [],
  invalidDetails: [],
  ...overrides,
});

describe('Brick 3 shadow schedule guard', () => {
  it('runs every six hours in Asia/Kolkata', () => {
    expect(SHADOW_SCHEDULE_GUARD_SCHEDULE).toBe('0 */6 * * *');
    expect(SHADOW_SCHEDULE_GUARD_TIME_ZONE).toBe('Asia/Kolkata');
  });

  it('reports healthy when the integrity engine finds no defects', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary());

    expect(assessment.shadowMode).toBe(true);
    expect(assessment.autoRepairEnabled).toBe(false);
    expect(assessment.severity).toBe('healthy');
    expect(assessment.reasons).toEqual([]);
    expect(assessment.coveredOccurrences).toBe(9);
  });

  it('raises warning for non-immediate integrity defects', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary({
      missingOccurrences: 2,
      affectedEnrollments: 1,
      healthyOccurrences: 7,
      details: [{
        enrollmentId: 'enr-1',
        expected: 3,
        healthy: 1,
        exceptions: 0,
        missing: 2,
        identityMismatches: 0,
        scheduleMismatches: 0,
        staleRevision: 0,
        missingToday: 0,
        materializationMetadataPresent: true,
      }],
    }));

    expect(assessment.severity).toBe('warning');
    expect(assessment.reasons).toContain('missing_occurrence');
    expect(assessment.affectedEnrollmentIds).toEqual(['enr-1']);
  });

  it('treats stale-revision-only coverage as warning, not zero-coverage critical', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary({
      expectedOccurrences: 3,
      healthyOccurrences: 0,
      staleRevisionOccurrences: 3,
      affectedEnrollments: 1,
      zeroCoveredEnrollments: 0,
      details: [{
        enrollmentId: 'enr-stale',
        expected: 3,
        healthy: 0,
        exceptions: 0,
        missing: 0,
        identityMismatches: 0,
        scheduleMismatches: 0,
        staleRevision: 3,
        missingToday: 0,
        materializationMetadataPresent: true,
      }],
    }));

    expect(assessment.severity).toBe('warning');
    expect(assessment.reasons).toContain('stale_revision');
    expect(assessment.reasons).not.toContain('zero_covered_enrollment');
    expect(assessment.coveredOccurrences).toBe(3);
  });

  it('raises critical when a class is missing today', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary({
      missingOccurrences: 1,
      missingToday: 1,
      healthyOccurrences: 8,
      affectedEnrollments: 1,
      details: [{
        enrollmentId: 'enr-today',
        expected: 3,
        healthy: 2,
        exceptions: 0,
        missing: 1,
        identityMismatches: 0,
        scheduleMismatches: 0,
        staleRevision: 0,
        missingToday: 1,
        materializationMetadataPresent: true,
      }],
    }));

    expect(assessment.severity).toBe('critical');
    expect(assessment.reasons).toContain('missing_today');
  });

  it('raises critical for an operational enrollment with zero covered occurrences', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary({
      expectedOccurrences: 3,
      healthyOccurrences: 0,
      zeroCoveredEnrollments: 1,
      missingOccurrences: 3,
      affectedEnrollments: 1,
    }));

    expect(assessment.severity).toBe('critical');
    expect(assessment.reasons).toContain('zero_covered_enrollment');
  });

  it('keeps invalid source data separate and visible', () => {
    const assessment = buildShadowScheduleGuardAssessment(baseSummary({
      operationalEnrollments: 4,
      eligibleEnrollments: 3,
      invalidEnrollments: 1,
      invalidByReason: {
        invalid_schedule: 0,
        missing_teacher: 1,
        ambiguous_teacher: 0,
        missing_child_identity: 0,
      },
      invalidDetails: [{
        enrollmentId: 'enr-invalid',
        reason: 'missing_teacher',
      }],
    }));

    expect(assessment.severity).toBe('warning');
    expect(assessment.reasons).toContain('invalid_enrollment_source');
    expect(assessment.invalidEnrollmentIds).toEqual(['enr-invalid']);
  });

  it('contains no repair, write, or self-heal path', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduled/shadowScheduleGuard.ts'),
      'utf8',
    );

    expect(source).toContain('runScheduleIntegrityEngineWithStore');
    expect(source).not.toContain('runTransaction(');
    expect(source).not.toContain('.create(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.delete(');
    expect(source).not.toContain('FieldValue');
    expect(source).not.toContain('adminRepairRollingScheduleMaterialization');
    expect(source).not.toContain('materializeRollingEnrollment');
  });
});
