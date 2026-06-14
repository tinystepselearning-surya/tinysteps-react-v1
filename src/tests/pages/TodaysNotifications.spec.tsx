import { describe, expect, it } from 'vitest';
import { collectSessionTeacherRefs, resolvePreferredSessionTeacherRef } from '../../lib/sessionTeacherRefs';

describe('TodaysNotifications teacher alias resolution', () => {
  it('collects every supported teacher alias from a repaired class session', () => {
    expect(
      collectSessionTeacherRefs({
        teacherIds: ['teacher-aditi'],
        assignedTeacherId: 'teacher-aditi',
        primaryTeacherId: 'teacher-aditi',
        teacherUid: 'teacher-aditi',
      }),
    ).toEqual(['teacher-aditi']);
  });

  it('prefers the enrollment-matching teacher alias so Sessions Management can include repaired rows', () => {
    const session = {
      assignedTeacherId: 'teacher-aditi',
      teacherUid: 'teacher-aditi',
    };

    expect(resolvePreferredSessionTeacherRef(session, ['teacher-aditi'])).toBe('teacher-aditi');
    expect(resolvePreferredSessionTeacherRef(session, ['someone-else', 'teacher-aditi'])).toBe('teacher-aditi');
  });
});
