import { describe, expect, it, vi } from 'vitest';

// Pure attribution checks must not initialize Firebase or read production data.
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

import { parentIdsForAvsTeacherMonth, resolveAvsTeacherMonthParentScope, resolveAvsUnknownTeacherMonthParentScope } from '../../lib/attendanceValidationTeacherMonthScope';

describe('Parent Month Close teacher attribution', () => {
  it('matches the actual canonical session teacher during the selected month and deduplicates parents', () => {
    const sessions = [
      { teacherId: 'teacher-a', parentId: 'parent-2', date: '2026-10-01', status: 'completed' },
      { teacherId: 'teacher-a', parentId: 'parent-2', date: '2026-10-15', status: 'completed' },
      { teacherId: 'teacher-a', parentId: 'parent-1', date: '2026-10-31', status: 'cancelled' },
      { teacherId: 'teacher-a', parentId: 'parent-3', date: '2026-09-30', status: 'completed' },
      { teacherId: 'teacher-b', parentId: 'parent-4', date: '2026-10-10', status: 'completed' },
    ];
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-a', '2026-10'))
      .toEqual(['parent-1', 'parent-2']);
  });

  it('preserves two-teacher households and month-specific teacher transfers', () => {
    const sessions = [
      { teacherId: 'teacher-a', parentId: 'same-family', date: '2026-10-05' },
      { teacherId: 'teacher-b', parentId: 'same-family', date: '2026-10-20' },
      { teacherId: 'teacher-b', parentId: 'same-family', date: '2026-11-01' },
    ];
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-a', '2026-10')).toEqual(['same-family']);
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-b', '2026-10')).toEqual(['same-family']);
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-a', '2026-11')).toEqual([]);
  });

  it('reports missing parent identifiers and safely resolves stored parentIds for historical sessions', () => {
    const sessions = [
      { teacherId: 'teacher-a', parentId: '', parentIds: ['parent-1', 'parent-2'], date: '2026-10-08' },
      { teacherId: 'teacher-a', parentId: null, date: '2026-10-09' },
      { teacherId: 'teacher-a', parentIds: ['not/a-parent'], date: '2026-10-10' },
      { teacherId: 'teacher-b', parentId: '', date: '2026-10-11' },
    ];
    expect(resolveAvsTeacherMonthParentScope(sessions, 'teacher-a', '2026-10')).toEqual({
      parentIds: ['parent-1', 'parent-2'],
      unmatchedSessionCount: 2,
    });
  });


  it('includes missing teacher IDs and teacher IDs absent from the selectable directory', () => {
    const sessions = [
      { date: '2026-10-04', parentId: 'parent-1', teacherId: '' },
      { date: '2026-10-05', parentId: 'parent-2', teacherId: 'deleted-teacher' },
      { date: '2026-10-06', parentId: 'parent-3', teacherId: 'teacher-a' },
      { date: '2026-10-07', parentId: 'parent-1', teacherId: null },
      { date: '2026-11-01', parentId: 'outside-month', teacherId: '' },
      { date: '2026-10-08', parentId: 'alias-does-not-count', assignedTeacherId: 'teacher-a' },
    ];
    expect(resolveAvsUnknownTeacherMonthParentScope(sessions, new Set(['teacher-a']), '2026-10'))
      .toEqual({
        parentIds: ['alias-does-not-count', 'parent-1', 'parent-2'],
        unmatchedSessionCount: 0,
        unknownTeacherSessionCount: 4,
      });
  });

  it('retains overlap with mapped teachers so a partially unmapped household is not hidden', () => {
    const sessions = [
      { date: '2026-09-10', teacherId: 'teacher-a', parentId: 'family' },
      { date: '2026-09-13', teacherId: '', parentId: 'family' },
      { date: '2026-09-17', teacherId: 'teacher-b', parentId: 'only-mapped' },
      { date: '2026-09-21', teacherId: '', parentIds: ['multiple-a', 'multiple-b'] },
    ];
    const known = new Set(['teacher-a', 'teacher-b']);
    expect(resolveAvsUnknownTeacherMonthParentScope(sessions, known, '2026-09'))
      .toEqual({
        parentIds: ['family', 'multiple-a', 'multiple-b'],
        unmatchedSessionCount: 0,
        unknownTeacherSessionCount: 2,
      });
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-a', '2026-09')).toEqual(['family']);
  });

  it('fails to assign a parent when unresolved sessions lack a usable parent reference', () => {
    const sessions = [
      { date: '2026-10-01', teacherId: '', parentId: '' },
      { date: '2026-10-02', teacherId: 'unknown-uid', parentIds: ['invalid/path'] },
      { date: '2026-10-03', teacherId: '', parentIds: ['valid-parent', 'valid-parent'] },
    ];
    expect(resolveAvsUnknownTeacherMonthParentScope(sessions, new Set(['teacher-a']), '2026-10'))
      .toEqual({
        parentIds: ['valid-parent'],
        unmatchedSessionCount: 2,
        unknownTeacherSessionCount: 3,
      });
  });

  it('considers every teacher unknown when the confirmed teacher directory is empty', () => {
    expect(resolveAvsUnknownTeacherMonthParentScope(
      [{ date: '2026-10-01', teacherId: 'historic-uid', parentId: 'parent-1' }],
      new Set(),
      '2026-10',
    ).parentIds).toEqual(['parent-1']);
  });

  it('does not infer teacher ownership from stale aliases or current enrollment assignments', () => {
    const sessions = [
      { teacherId: 'teacher-b', assignedTeacherId: 'teacher-a', parentId: 'reassigned', date: '2026-10-05' },
      { teacherIds: ['teacher-a'], parentId: 'legacy-alias-only', date: '2026-10-06' },
      { teacherId: 'teacher-a', parentId: '', date: '2026-10-09' },
      { teacherId: 'teacher-a', parentId: 'missing-date' },
      { teacherId: 'teacher-a', parentId: 'wrong-month', date: '2026-09-05' },
      { teacherId: 'teacher-a', parentId: 'invalid-path/parent', date: '2026-10-10' },
    ];
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-a', '2026-10')).toEqual([]);
    expect(parentIdsForAvsTeacherMonth(sessions, 'teacher-b', '2026-10')).toEqual(['reassigned']);
  });
});
