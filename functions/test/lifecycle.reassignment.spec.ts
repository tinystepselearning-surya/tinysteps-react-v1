import { describe, expect, it } from 'vitest';
import { buildSessionRepairQueryCoverage } from '../src/lifecycle';

describe('buildSessionRepairQueryCoverage', () => {
  it('always includes the primary enrollmentId query', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: null,
      kidIds: [],
      studentId: null,
      childId: null,
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual([
      expect.objectContaining({
        field: 'enrollmentId',
        op: '==',
        value: 'enr_123',
        source: 'enrollmentId',
        legacy: false,
      }),
    ]);
  });

  it('covers actual studentId plus legacy studentId fallback when ids differ', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      studentId: 'student_1',
      childId: null,
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'studentId', op: '==', value: 'student_1', legacy: false }),
        expect.objectContaining({ field: 'studentIds', op: 'array-contains', value: 'student_1', legacy: false }),
        expect.objectContaining({ field: 'studentId', op: '==', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'studentIds', op: 'array-contains', value: 'kid_1', legacy: true }),
      ]),
    );
  });

  it('covers childId and both child array aliases', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'kid_1',
      kidIds: ['kid_1'],
      studentId: 'student_1',
      childId: 'child_1',
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    expect(coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'childId', op: '==', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childIds', op: 'array-contains', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childrenIds', op: 'array-contains', value: 'child_1', legacy: false }),
        expect.objectContaining({ field: 'childId', op: '==', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'childIds', op: 'array-contains', value: 'kid_1', legacy: true }),
        expect.objectContaining({ field: 'childrenIds', op: 'array-contains', value: 'kid_1', legacy: true }),
      ]),
    );
  });

  it('deduplicates queries when identity aliases collapse to the same id', () => {
    const coverage = buildSessionRepairQueryCoverage('enr_123', {
      kidId: 'same_id',
      kidIds: ['same_id'],
      studentId: 'same_id',
      childId: 'same_id',
      studentName: null,
      kidName: null,
      childName: null,
      studentFullName: null,
      kidFullName: null,
      childFullName: null,
    });

    const keys = coverage.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(coverage.filter((entry) => entry.legacy)).toHaveLength(0);
  });
});
