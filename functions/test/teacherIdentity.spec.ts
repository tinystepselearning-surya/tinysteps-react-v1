import { describe, expect, it } from 'vitest';
import {
  aliasFieldMatchesCanonicalTeacher,
  buildCanonicalTeacherWriteFields,
  buildEnrollmentTeacherWriteFields,
  resolveCanonicalTeacherIdForWrite,
} from '../src/helpers/teacherIdentity';

describe('canonical teacher writer identity', () => {
  it('always derives session compatibility aliases from the canonical teacherId', () => {
    expect(buildCanonicalTeacherWriteFields(' teacher-123 ')).toEqual({
      teacherId: 'teacher-123',
      teacherIds: ['teacher-123'],
      assignedTeacherId: 'teacher-123',
      primaryTeacherId: 'teacher-123',
      teacherUid: 'teacher-123',
      teacher_id: 'teacher-123',
    });
  });

  it('keeps enrollment identity minimal while canonical', () => {
    expect(buildEnrollmentTeacherWriteFields('teacher-123')).toEqual({
      teacherId: 'teacher-123',
      teacherIds: ['teacher-123'],
    });
    expect(buildEnrollmentTeacherWriteFields(null)).toEqual({
      teacherId: null,
      teacherIds: [],
    });
  });

  it('trusts canonical teacherId even when old aliases disagree', () => {
    expect(resolveCanonicalTeacherIdForWrite({
      teacherId: 'teacher-new',
      teacherIds: ['teacher-old'],
      assignedTeacherId: 'teacher-old',
    })).toEqual({
      teacherId: 'teacher-new',
      source: 'canonical',
      legacyRefs: ['teacher-old'],
    });
  });

  it('uses one unambiguous legacy identity only when canonical teacherId is absent', () => {
    expect(resolveCanonicalTeacherIdForWrite({
      assignedTeacherId: 'teacher-legacy',
      teacherUid: 'teacher-legacy',
    })).toEqual({
      teacherId: 'teacher-legacy',
      source: 'legacy',
      legacyRefs: ['teacher-legacy'],
    });
  });

  it('refuses to choose between conflicting legacy identities', () => {
    expect(resolveCanonicalTeacherIdForWrite({
      assignedTeacherId: 'teacher-a',
      teacherUid: 'teacher-b',
    })).toEqual({
      teacherId: null,
      source: 'ambiguous_legacy',
      legacyRefs: ['teacher-a', 'teacher-b'],
    });
  });

  it('recognizes canonical and mismatching aliases', () => {
    expect(aliasFieldMatchesCanonicalTeacher('teacherIds', ['teacher-1'], 'teacher-1')).toBe(true);
    expect(aliasFieldMatchesCanonicalTeacher('teacherIds', ['teacher-1', 'teacher-2'], 'teacher-1')).toBe(false);
    expect(aliasFieldMatchesCanonicalTeacher('teacherUid', 'teacher-1', 'teacher-1')).toBe(true);
    expect(aliasFieldMatchesCanonicalTeacher('teacherUid', 'teacher-2', 'teacher-1')).toBe(false);
  });

  it('rejects empty canonical session ownership writes', () => {
    expect(() => buildCanonicalTeacherWriteFields('')).toThrow(/Canonical teacherId is required/);
  });
});
