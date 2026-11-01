import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  docs: [] as Array<{ id: string; date: string; teacherId?: string; parentId: string }>,
  readCounts: [] as number[],
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: () => ({ type: 'collection' }),
    where: (field: string, op: string, value: string) => ({ type: 'where', field, op, value }),
    orderBy: (field: string, direction: string) => ({ type: 'orderBy', field, direction }),
    startAfter: (cursor: { id: string }) => ({ type: 'startAfter', cursorId: cursor.id }),
    limit: (value: number) => ({ type: 'limit', value }),
    query: (_ref: unknown, ...constraints: Array<Record<string, unknown>>) => constraints,
    getDocs: async (constraints: Array<Record<string, unknown>>) => {
      const size = constraints.find((constraint) => constraint.type === 'limit')?.value as number;
      const start = constraints.find((constraint) => constraint.type === 'startAfter')?.cursorId as string | undefined;
      const from = constraints.find((constraint) => constraint.type === 'where' && constraint.op === '>=')?.value as string;
      const to = constraints.find((constraint) => constraint.type === 'where' && constraint.op === '<=')?.value as string;
      fake.readCounts.push(size);
      const matching = fake.docs.filter((doc) => doc.date >= from && doc.date <= to && (!start || doc.id > start));
      return {
        docs: matching.slice(0, size).map((doc) => ({ id: doc.id, data: () => doc })),
      };
    },
  };
});

import {
  loadAvsUnknownTeacherMonthParentScope,
  AVS_MONTH_CLOSE_UNKNOWN_SCAN_CAP,
} from '../../lib/attendanceValidationTeacherMonthScope';

describe('Unknown / Unmapped teacher bounded Firestore scan', () => {
  beforeEach(() => {
    fake.docs = [];
    fake.readCounts = [];
  });

  it('paginates more than 2,000 sessions without skipping same-day records', async () => {
    fake.docs = Array.from({ length: 2_177 }, (_, i) => ({
      id: String(i).padStart(6, '0'),
      date: '2026-09-18',
      teacherId: i < 2_167 ? 'teacher-known' : '',
      parentId: 'parent-' + i,
    }));
    const result = await loadAvsUnknownTeacherMonthParentScope(new Set(['teacher-known']), '2026-09');
    expect(result).toEqual({
      parentIds: Array.from({ length: 10 }, (_, i) => 'parent-' + (2167 + i)),
      unmatchedSessionCount: 0,
      unknownTeacherSessionCount: 10,
    });
    expect(fake.readCounts).toEqual([500, 500, 500, 500, 500]);
  });

  it('fails closed rather than showing partial parents above the query ceiling', async () => {
    fake.docs = Array.from({ length: AVS_MONTH_CLOSE_UNKNOWN_SCAN_CAP + 1 }, (_, i) => ({
      id: String(i).padStart(6, '0'),
      date: '2026-10-10',
      teacherId: '',
      parentId: 'parent-' + i,
    }));
    await expect(loadAvsUnknownTeacherMonthParentScope(new Set(), '2026-10'))
      .rejects.toThrow('No partial results are shown.');
    expect(fake.readCounts[fake.readCounts.length - 1]).toBe(1);
  });
});
