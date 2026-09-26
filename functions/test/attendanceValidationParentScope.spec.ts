import { describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { normalizeAvsParentId, resolveAvsParentEnrollments } from '../src/attendanceValidation/parentScope';
import { discoverAvsRangeGroups } from '../src/attendanceValidation/groupValidation';

function database(enrollmentCount = 2, sessionsPerEnrollment = 1) {
  const data: Record<string, Array<{ id: string; data: Record<string, unknown> }>> = {
    enrollments: Array.from({ length: enrollmentCount }, (_, i) => ({ id: `enrollment-${i}`, data: { parentId: i === 1 ? 'parent-b' : 'parent-a' } })),
    classSessions: Array.from({ length: enrollmentCount * sessionsPerEnrollment }, (_, i) => ({ id: `session-${String(i).padStart(4, '0')}`, data: {
      enrollmentId: `enrollment-${Math.floor(i / sessionsPerEnrollment)}`, date: '2026-09-09',
      kidId: `kid-${i}`, kidIds: [`kid-${i}`], teacherId: 'teacher',
    } })),
  };
  const reads: Array<{ collection: string; filters: unknown[][] }> = [];
  function query(collection: string, filters: unknown[][] = [], cap = Infinity, after: string | null = null): any {
    return {
      where: (...filter: unknown[]) => query(collection, [...filters, filter], cap, after),
      orderBy: () => query(collection, filters, cap, after),
      limit: (n: number) => query(collection, filters, n, after),
      startAfter: (_date: string, id: string) => query(collection, filters, cap, id),
      get: async () => {
        reads.push({ collection, filters });
        const docs = data[collection].filter((row) => (!after || row.id > after) && filters.every(([field, op, value]) => {
          const actual = row.data[String(field)];
          if (op === '==') return actual === value;
          if (op === 'in') return (value as unknown[]).includes(actual);
          if (op === 'array-contains') return Array.isArray(actual) && actual.includes(value);
          return op === '>=' ? String(actual) >= String(value) : String(actual) <= String(value);
        })).slice(0, cap).map((row) => ({ id: row.id, data: () => row.data }));
        return { docs, size: docs.length };
      },
    };
  }
  return { db: { collection: (name: string) => query(name) } as unknown as Firestore, reads };
}
const range = { fromDate: '2026-09-09', toDate: '2026-09-09' };
describe('parent scope in group discovery', () => {
  it('only discovers Parent A sessions, including same-day context queries', async () => {
    const { db, reads } = database();
    const ids = await resolveAvsParentEnrollments(db, 'parent-a');
    const result = await discoverAvsRangeGroups(db, range, ids, null);
    expect(result.groups.flat().map((row) => row.data.enrollmentId)).toEqual(['enrollment-0']);
    for (const read of reads.filter((item) => item.collection === 'classSessions')) {
      expect(read.filters).toContainEqual(['enrollmentId', 'in', ['enrollment-0']]);
    }
  });
  it('All parents preserves discovery of both parents', async () => {
    const { db } = database();
    expect(await resolveAvsParentEnrollments(db, normalizeAvsParentId('all'))).toBeNull();
    expect((await discoverAvsRangeGroups(db, range, null, null)).groups).toHaveLength(2);
  });
  it('an empty parent never falls back to global reads', async () => {
    const { db, reads } = database();
    const result = await discoverAvsRangeGroups(db, range, [], null);
    expect(result.groups).toEqual([]);
    expect(reads).toEqual([]);
  });
  it('chunks enrollment filters at 30 and resumes without skipping sessions', async () => {
    const { db, reads } = database(33, 4);
    const ids = await resolveAvsParentEnrollments(db, 'parent-a');
    const first = await discoverAvsRangeGroups(db, range, ids, null);
    const second = await discoverAvsRangeGroups(db, range, ids, first.nextCursor);
    expect(first.processedSessionCount).toBe(100);
    expect(first.hasMore).toBe(true);
    expect(second.processedSessionCount).toBe(28);
    expect(second.hasMore).toBe(false);
    expect(new Set([...first.groups, ...second.groups].flat().map((row) => row.id)).size).toBe(128);
    for (const read of reads.filter((item) => item.collection === 'classSessions')) {
      const filter = read.filters.find((item) => item[0] === 'enrollmentId');
      expect((filter![2] as string[]).length).toBeLessThanOrEqual(30);
    }
  });
  it.each(['a/b', '.', '..', '__reserved__', ' leading', '\u0000', 12, {}])('rejects unsafe parent IDs: %s', (value) => {
    expect(() => normalizeAvsParentId(value)).toThrow();
  });
  it('fails closed at the enrollment read bound', async () => {
    await expect(resolveAvsParentEnrollments(database(303).db, 'parent-a')).rejects.toThrow('bound');
  });
});
