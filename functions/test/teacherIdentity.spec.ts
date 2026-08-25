import { describe, expect, it } from 'vitest';
import {
  aliasFieldMatchesCanonicalTeacher,
  buildCanonicalTeacherWriteFields,
  buildEnrollmentTeacherWriteFields,
  resolveCanonicalTeacherIdForWrite,
} from '../src/helpers/teacherIdentity';

describe('canonical teacher writer identity', () => {
  it('writes only canonical teacherId for operational sessions after B5', () => {
    expect(buildCanonicalTeacherWriteFields(' teacher-123 ')).toEqual({
      teacherId: 'teacher-123',
    });
  });

  it('writes only canonical teacherId for enrollment ownership after B5', () => {
    expect(buildEnrollmentTeacherWriteFields('teacher-123')).toEqual({
      teacherId: 'teacher-123',
    });
    expect(buildEnrollmentTeacherWriteFields(null)).toEqual({
      teacherId: null,
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

  it('does not invent a teacher when both canonical and legacy identities are absent', () => {
    expect(resolveCanonicalTeacherIdForWrite({
      status: 'active',
    })).toEqual({
      teacherId: null,
      source: 'missing',
      legacyRefs: [],
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

  it('keeps alias comparison available only for historical audit and repair', () => {
    expect(aliasFieldMatchesCanonicalTeacher('teacherIds', ['teacher-1'], 'teacher-1')).toBe(true);
    expect(aliasFieldMatchesCanonicalTeacher('teacherIds', ['teacher-1', 'teacher-2'], 'teacher-1')).toBe(false);
    expect(aliasFieldMatchesCanonicalTeacher('teacherUid', 'teacher-1', 'teacher-1')).toBe(true);
    expect(aliasFieldMatchesCanonicalTeacher('teacherUid', 'teacher-2', 'teacher-1')).toBe(false);
  });

  it('rejects empty canonical session ownership writes', () => {
    expect(() => buildCanonicalTeacherWriteFields('')).toThrow(/Canonical teacherId is required/);
  });
});
