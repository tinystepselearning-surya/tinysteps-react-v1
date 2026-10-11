import { describe, expect, it, vi } from 'vitest';
import { ManualReminderReadCache } from '../../pages/admin/manualReminderReadCache';

type Session = { id: string; status: string; parentNotified?: boolean };

describe('Admin Sessions Management read-once, manual-refresh cache', () => {
  it('loads enrollments once and each real session date once, even across repeated tab selections', async () => {
    const cache = new ManualReminderReadCache<{id: string}, Session>();
    cache.useActor('admin-1');
    const enrollmentRead = vi.fn(async () => [{id: 'enrollment-1'}]);
    const sessionRead = vi.fn(async (date: string) => [
      {id: `real-${date}`, status: 'completed'},
    ]);

    await Promise.all([cache.loadEnrollments(enrollmentRead), cache.loadEnrollments(enrollmentRead)]);
    await Promise.all([
      cache.loadRealSessions('2026-10-12', sessionRead),
      cache.loadRealSessions('2026-10-13', sessionRead),
    ]);
    await cache.loadEnrollments(enrollmentRead);
    await cache.loadRealSessions('2026-10-12', sessionRead);
    await cache.loadRealSessions('2026-10-13', sessionRead);

    expect(enrollmentRead).toHaveBeenCalledOnce();
    expect(sessionRead).toHaveBeenCalledTimes(2);
    cache.setVisibleSessions('2026-10-12', [
      {id: 'virtual-12', status: 'scheduled'},
    ]);
    expect(cache.visibleSessionsByDate.get('2026-10-12')).toHaveLength(1);

    await cache.loadRealSessions('2026-10-15', sessionRead);
    expect(enrollmentRead).toHaveBeenCalledOnce();
    expect(sessionRead).toHaveBeenCalledTimes(3);
  });

  it('explicit manual refresh invalidates timetable, attendance and checkbox snapshots', async () => {
    const cache = new ManualReminderReadCache<{id: string}, Session>();
    cache.useActor('admin-1');
    const enrollmentRead = vi.fn(async () => [{id: 'enrollment-1'}]);
    const sessionRead = vi.fn(async (key: string) => [
      {id: `real-${key}`, status: 'completed'},
    ]);
    await cache.loadEnrollments(enrollmentRead);
    await cache.loadRealSessions('2026-10-12', sessionRead);
    cache.setVisibleSessions('2026-10-12', [{id: 'virtual', status: 'scheduled'}]);
    cache.updateVisibleSession('virtual', old => ({...old, parentNotified: true}));
    expect(cache.visibleSessionsByDate.get('2026-10-12')?.[0].parentNotified).toBe(true);

    cache.invalidate();
    expect(cache.enrollments).toBeNull();
    expect(cache.realSessionsByDate.size).toBe(0);
    expect(cache.visibleSessionsByDate.size).toBe(0);
    await cache.loadEnrollments(enrollmentRead);
    await cache.loadRealSessions('2026-10-12', sessionRead);
    expect(enrollmentRead).toHaveBeenCalledTimes(2);
    expect(sessionRead).toHaveBeenCalledTimes(2);
  });

  it('rejects responses from loads superseded by manual refresh or Admin account change', async () => {
    const cache = new ManualReminderReadCache<{id: string}, Session>();
    cache.useActor('admin-1');
    let resolveRead: ((rows: {id: string}[]) => void) | undefined;
    const waiting = cache.loadEnrollments(() => new Promise(resolve => { resolveRead = resolve; }));
    cache.invalidate();
    resolveRead?.([{id: 'stale'}]);
    await expect(waiting).rejects.toThrow('cache changed during load');
    expect(cache.enrollments).toBeNull();

    const waitingDate = cache.loadRealSessions('2026-10-12', () =>
      Promise.resolve([{id: 'stale-real', status: 'scheduled'}]));
    cache.useActor('admin-2');
    await expect(waitingDate).rejects.toThrow('cache changed during load');
    expect(cache.realSessionsByDate.size).toBe(0);
  });

  it('never reuses a prior Admin account’s rows, and local actions do not trigger new reads', async () => {
    const cache = new ManualReminderReadCache<{id: string}, Session>();
    cache.useActor('admin-1');
    const read = vi.fn(async () => [{id: 'first'}]);
    await cache.loadEnrollments(read);
    cache.setVisibleSessions('2026-10-12', [{id: 'virtual', status: 'scheduled'}]);
    cache.updateVisibleSession('virtual', row => ({...row, parentNotified: true}));
    cache.removeVisibleSession('virtual');
    expect(read).toHaveBeenCalledOnce();
    expect(cache.visibleSessionsByDate.get('2026-10-12')).toEqual([]);

    cache.useActor('admin-2');
    expect(cache.visibleSessionsByDate.size).toBe(0);
    expect(cache.enrollments).toBeNull();
    await cache.loadEnrollments(read);
    expect(read).toHaveBeenCalledTimes(2);
  });
});
