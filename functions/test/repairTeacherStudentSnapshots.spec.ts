import { describe, expect, it } from 'vitest';
import {
  buildStudentSnapshotRepairPatch,
  isFutureSessionLike,
  normalizeSnapshotStudentName,
} from '../src/repairTeacherStudentSnapshots';

describe('repairTeacherStudentSnapshots helpers', () => {
  it('normalizes placeholder display names to empty strings', () => {
    expect(normalizeSnapshotStudentName('Unnamed student')).toBe('');
    expect(normalizeSnapshotStudentName('Student name pending')).toBe('');
    expect(normalizeSnapshotStudentName('2 assigned')).toBe('');
    expect(normalizeSnapshotStudentName('Asha')).toBe('Asha');
  });

  it('builds a backfill patch for missing root and snapshot name fields', () => {
    const patch = buildStudentSnapshotRepairPatch(
      {
        childName: '',
        studentSnapshot: { level: 'L2' },
      },
      'Asha',
      'kid-1',
    );

    expect(patch).toEqual({
      studentName: 'Asha',
      childName: 'Asha',
      kidName: 'Asha',
      studentSnapshot: {
        level: 'L2',
        id: 'kid-1',
        kidId: 'kid-1',
        name: 'Asha',
      },
      childSnapshot: {
        id: 'kid-1',
        kidId: 'kid-1',
        name: 'Asha',
      },
      kidSnapshot: {
        id: 'kid-1',
        kidId: 'kid-1',
        name: 'Asha',
      },
    });
  });

  it('only treats future sessions as repair targets', () => {
    const nowMs = Date.parse('2026-06-11T10:00:00.000Z');

    expect(isFutureSessionLike({ startAt: { toDate: () => new Date('2026-06-12T10:00:00.000Z') } }, nowMs)).toBe(true);
    expect(isFutureSessionLike({ date: '2026-06-11' }, nowMs)).toBe(true);
    expect(isFutureSessionLike({ date: '2026-06-10' }, nowMs)).toBe(false);
  });
});
