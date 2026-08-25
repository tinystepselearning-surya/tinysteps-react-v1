import { describe, expect, it } from 'vitest';
import { operationalTeacherRecordBelongsTo } from '../../lib/teacherIdentity';

describe('B4 teacher read ownership behavior', () => {
  it('keeps the canonical teacher visible when a stale alias points elsewhere', () => {
    const row = {
      teacherId: 'teacher-current',
      teacherIds: ['teacher-old'],
      assignedTeacherId: 'teacher-old',
    };

    expect(operationalTeacherRecordBelongsTo(row, 'teacher-current')).toBe(true);
    expect(operationalTeacherRecordBelongsTo(row, 'teacher-old')).toBe(false);
  });

  it('keeps legacy direct ownership resolution only for rows without canonical teacherId', () => {
    const legacyRow = {
      assignedTeacherId: 'teacher-legacy',
      teacherIds: ['teacher-legacy'],
    };

    expect(operationalTeacherRecordBelongsTo(legacyRow, 'teacher-legacy')).toBe(true);
  });
});
