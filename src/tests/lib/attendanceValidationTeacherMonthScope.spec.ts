import { describe, expect, it, vi } from 'vitest';

// Pure attribution checks must not initialize Firebase or read production data.
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

import { parentIdsForAvsTeacherMonth } from '../../lib/attendanceValidationTeacherMonthScope';

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
