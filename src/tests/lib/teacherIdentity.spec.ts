import { describe, expect, it } from 'vitest';
import {
  auditOperationalTeacherIdentity,
  buildCanonicalEnrollmentTeacherWriteFields,
  buildCanonicalOperationalTeacherWriteFields,
  collectLegacyTeacherIdentityRefs,
  operationalTeacherRecordBelongsTo,
  resolveOperationalTeacherId,
} from '../../lib/teacherIdentity';

describe('teacher identity normalization contract', () => {
  it('always prefers canonical teacherId when it exists', () => {
    expect(resolveOperationalTeacherId({
      teacherId: 'canonical-teacher',
      assignedTeacherId: 'legacy-teacher',
      teacherIds: ['legacy-teacher'],
    })).toBe('canonical-teacher');
  });

  it('uses canonical teacherId as the only owner when stale aliases disagree', () => {
    const record = {
      teacherId: 'teacher-b',
      assignedTeacherId: 'teacher-a',
      teacherIds: ['teacher-a'],
    };

    expect(operationalTeacherRecordBelongsTo(record, 'teacher-b')).toBe(true);
    expect(operationalTeacherRecordBelongsTo(record, 'teacher-a')).toBe(false);
  });

  it('retains direct legacy ownership compatibility only when canonical teacherId is absent', () => {
    const record = { assignedTeacherId: 'legacy-teacher' };
    expect(operationalTeacherRecordBelongsTo(record, 'legacy-teacher')).toBe(true);
    expect(operationalTeacherRecordBelongsTo(record, 'other-teacher')).toBe(false);
  });

  it('preserves legacy resolution for records that do not yet have teacherId', () => {
    expect(resolveOperationalTeacherId({
      assignedTeacherId: 'assigned-teacher',
      teacherIds: ['array-teacher'],
    })).toBe('assigned-teacher');
  });

  it('collects unique legacy references without treating teacherId as an alias', () => {
    expect(collectLegacyTeacherIdentityRefs({
      teacherId: 'canonical-teacher',
      teacherIds: ['canonical-teacher', 'legacy-teacher'],
      assignedTeacherId: 'legacy-teacher',
      primaryTeacherId: 'canonical-teacher',
      teacherUid: 'legacy-teacher',
    })).toEqual(['canonical-teacher', 'legacy-teacher']);
  });

  it('flags a legacy-only record as needing canonical backfill', () => {
    expect(auditOperationalTeacherIdentity({
      teacherUid: 'teacher-123',
    })).toMatchObject({
      canonicalTeacherId: '',
      resolvedTeacherId: 'teacher-123',
      missingCanonicalTeacherId: true,
      legacyOnly: true,
      mismatchedAliasFields: [],
    });
  });

  it('flags alias disagreement without changing the canonical teacher', () => {
    expect(auditOperationalTeacherIdentity({
      teacherId: 'teacher-a',
      teacherIds: ['teacher-a', 'teacher-b'],
      assignedTeacherId: 'teacher-b',
      primaryTeacherId: 'teacher-a',
      teacherUid: 'teacher-a',
      teacher_id: 'teacher-a',
    })).toMatchObject({
      canonicalTeacherId: 'teacher-a',
      resolvedTeacherId: 'teacher-a',
      missingCanonicalTeacherId: false,
      legacyOnly: false,
      mismatchedAliasFields: ['teacherIds', 'assignedTeacherId'],
    });
  });

  it('accepts fully aligned compatibility aliases during the migration phase', () => {
    expect(auditOperationalTeacherIdentity({
      teacherId: 'teacher-a',
      teacherIds: ['teacher-a'],
      assignedTeacherId: 'teacher-a',
      primaryTeacherId: 'teacher-a',
      teacherUid: 'teacher-a',
      teacher_id: 'teacher-a',
    })).toMatchObject({
      canonicalTeacherId: 'teacher-a',
      resolvedTeacherId: 'teacher-a',
      missingCanonicalTeacherId: false,
      legacyOnly: false,
      mismatchedAliasFields: [],
      hasLegacyAliases: true,
    });
  });

  it('derives every temporary session alias from one canonical teacherId', () => {
    expect(buildCanonicalOperationalTeacherWriteFields(' teacher-a ')).toEqual({
      teacherId: 'teacher-a',
      teacherIds: ['teacher-a'],
      assignedTeacherId: 'teacher-a',
      primaryTeacherId: 'teacher-a',
      teacherUid: 'teacher-a',
      teacher_id: 'teacher-a',
    });
  });

  it('keeps enrollment ownership minimal and canonical', () => {
    expect(buildCanonicalEnrollmentTeacherWriteFields(' teacher-a ')).toEqual({
      teacherId: 'teacher-a',
      teacherIds: ['teacher-a'],
    });
  });

  it('rejects an empty teacherId before client-side ownership writes', () => {
    expect(() => buildCanonicalOperationalTeacherWriteFields('')).toThrow(/Canonical teacherId is required/);
    expect(() => buildCanonicalEnrollmentTeacherWriteFields('')).toThrow(/Canonical teacherId is required/);
  });
});
