import { describe, expect, it } from 'vitest';
import {
  collectSessionTeacherRefs,
  resolvePreferredSessionTeacherRef,
} from '../../lib/sessionTeacherRefs';

describe('sessionTeacherRefs canonical reassignment precedence', () => {
  it('places canonical teacherId before stale legacy teacherIds', () => {
    expect(
      collectSessionTeacherRefs({
        teacherId: 'teacher-nandini',
        teacherIds: ['teacher-vaishnavi'],
        assignedTeacherId: 'teacher-vaishnavi',
      }),
    ).toEqual(['teacher-nandini', 'teacher-vaishnavi']);
  });

  it('resolves the canonical teacher when no preferred refs are supplied', () => {
    expect(
      resolvePreferredSessionTeacherRef(
        {
          teacherId: 'teacher-nandini',
          teacherIds: ['teacher-vaishnavi'],
          teacherName: 'Vaishnavi G',
        },
        [],
      ),
    ).toBe('teacher-nandini');
  });
});
