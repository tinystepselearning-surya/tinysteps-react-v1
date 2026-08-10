import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCountFromServerMock, getDocsMock, whereMock } = vi.hoisted(() => ({
  getCountFromServerMock: vi.fn(),
  getDocsMock: vi.fn(),
  whereMock: vi.fn((...args: unknown[]) => ({ kind: 'where', args })),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  query: (...args: unknown[]) => ({ kind: 'query', args }),
  where: whereMock,
  getCountFromServer: getCountFromServerMock,
  getDocs: getDocsMock,
}));

import { fetchAdminStats } from '../../hooks/useAdminStats';

const countSnapshot = (count: number) => ({ data: () => ({ count }) });

const sessionSnapshot = (
  rows: Array<{ status?: string; archived?: boolean }>,
) => ({
  size: rows.length,
  docs: rows.map((row) => ({ data: () => row })),
});

describe('fetchAdminStats', () => {
  beforeEach(() => {
    getCountFromServerMock.mockReset();
    getDocsMock.mockReset();
    whereMock.mockClear();
    vi.useRealTimers();
  });

  it('uses aggregate counts and reports non-cancelled sessions on today’s IST date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-09T20:15:00.000Z'));
    getCountFromServerMock
      .mockResolvedValueOnce(countSnapshot(12))
      .mockResolvedValueOnce(countSnapshot(8))
      .mockResolvedValueOnce(countSnapshot(3));
    getDocsMock.mockResolvedValueOnce(
      sessionSnapshot([
        { status: 'scheduled' },
        { status: 'completed' },
        { status: 'cancelled' },
        { status: 'rescheduled' },
        { status: 'archived' },
        { status: 'open', archived: true },
      ]),
    );

    await expect(fetchAdminStats()).resolves.toEqual({
      totalUsers: 12,
      totalStudents: 8,
      totalCourses: 3,
      sessionsToday: 2,
    });
    expect(whereMock).toHaveBeenCalledWith('date', '==', '2026-08-10');
    expect(getCountFromServerMock).toHaveBeenCalledTimes(3);
  });

  it('surfaces Firestore failures instead of returning believable all-zero stats', async () => {
    getCountFromServerMock.mockRejectedValueOnce(new Error('permission denied'));
    getCountFromServerMock.mockResolvedValue(countSnapshot(0));
    getDocsMock.mockResolvedValue(sessionSnapshot([]));

    await expect(fetchAdminStats()).rejects.toThrow('permission denied');
  });
});
