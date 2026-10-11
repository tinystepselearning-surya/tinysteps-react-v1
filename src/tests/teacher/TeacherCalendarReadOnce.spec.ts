import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetDoc } = vi.hoisted(() => ({ mockGetDoc: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  getDoc: mockGetDoc,
  doc: (_db: unknown, name: string, id: string) => ({ name, id }),
}));
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: { subscribe: () => () => {} },
}));

import { TeacherCalendarSessionReadCache } from '../../pages/teacher/hooks/teacherCalendarSessionReadCache';
import type { TeacherSession } from '../../types/Teacher';

const scheduled = (id: string, date = '2026-10-12') =>
  ({ id, date, startTime: '17:00', teacherId: 'teacher-1', status: 'scheduled' } as TeacherSession);

describe('Teacher calendar browser-session read-once model', () => {
  beforeEach(() => { mockGetDoc.mockReset(); });

  it('deduplicates in-flight loads, tab remounts and repeated date selection', async () => {
    const cache = new TeacherCalendarSessionReadCache();
    const range = { teacherId: 'teacher-1', start: '2026-10-12', end: '2026-10-12' };
    const load = vi.fn(async () => [scheduled('real-1')]);
    const first = vi.fn();
    const second = vi.fn();
    const stop = cache.subscribe(range, load, first, vi.fn());
    cache.subscribe(range, load, second, vi.fn());
    await vi.waitFor(() => expect(first).toHaveBeenCalledOnce());
    expect(second).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
    stop();
    cache.subscribe(range, load, vi.fn(), vi.fn());
    expect(load).toHaveBeenCalledOnce();
  });

  it('honors explicit refresh, separate teachers, and queried date ranges', async () => {
    const cache = new TeacherCalendarSessionReadCache();
    const load = vi.fn(async () => [scheduled('real-1')]);
    const day = { teacherId: 'teacher-1', start: '2026-10-12', end: '2026-10-12' };
    cache.subscribe(day, load, vi.fn(), vi.fn());
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    cache.subscribe({ ...day, start: '2026-10-13', end: '2026-10-13' }, load, vi.fn(), vi.fn());
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    cache.subscribe({ ...day, teacherId: 'teacher-2' }, load, vi.fn(), vi.fn());
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(3));
    cache.invalidateTeacher('teacher-1');
    cache.subscribe(day, load, vi.fn(), vi.fn());
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(4));
  });

  it('broadcasts a saved attendance document locally, without refetching the collection', async () => {
    const cache = new TeacherCalendarSessionReadCache();
    const load = vi.fn(async () => [scheduled('real-1')]);
    const next = vi.fn();
    cache.subscribe({teacherId:'teacher-1',start:'2026-10-12',end:'2026-10-12'}, load, next, vi.fn());
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'real-1',
      data: () => ({date:'2026-10-12', teacherId:'teacher-1', status:'completed'}),
    });
    const confirmed = await cache.confirmSavedSession('teacher-1', 'real-1');
    expect(confirmed.status).toBe('completed');
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(next.mock.lastCall?.[0]?.[0]?.status).toBe('completed');
  });

  it('fails closed if a read-back belongs to another teacher', async () => {
    const cache = new TeacherCalendarSessionReadCache();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'cross-owned',
      data: () => ({date:'2026-10-12',teacherId:'teacher-2',status:'completed'}),
    });
    await expect(cache.confirmSavedSession('teacher-1','cross-owned'))
      .rejects.toThrow('does not belong');
  });

  it('forgets cached rows upon login change or manual invalidation', async () => {
    const cache = new TeacherCalendarSessionReadCache();
    cache.publishConfirmed('teacher-1',scheduled('real-1'));
    const initial = vi.fn();
    cache.subscribe({teacherId:'teacher-1',start:'2026-10-12',end:'2026-10-12'},
      async () => [], initial, vi.fn());
    await vi.waitFor(() => expect(initial).toHaveBeenCalledOnce());
    expect(initial.mock.lastCall?.[0]).toHaveLength(1);
    cache.clear();
    const after = vi.fn();
    cache.subscribe({teacherId:'teacher-1',start:'2026-10-12',end:'2026-10-12'},
      async () => [], after, vi.fn());
    await vi.waitFor(() => expect(after).toHaveBeenCalledOnce());
    expect(after.mock.lastCall?.[0]).toEqual([]);
  });
});
