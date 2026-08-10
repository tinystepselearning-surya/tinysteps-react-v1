import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDocsMock } = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => ({ kind: 'collection', args }),
  query: (...args: unknown[]) => ({ kind: 'query', args }),
  where: (...args: unknown[]) => ({ kind: 'where', args }),
  getDocs: getDocsMock,
}));

import { fetchAdminStats } from '../../hooks/useAdminStats';

const sizedSnapshot = (size: number) => ({ size, docs: [] });

const sessionSnapshot = (
  rows: Array<{ status?: string; archived?: boolean }>,
) => ({
  size: rows.length,
  docs: rows.map((row) => ({ data: () => row })),
});

describe('fetchAdminStats', () => {
  beforeEach(() => {
    getDocsMock.mockReset();
  });

  it('reports today sessions instead of hardcoding zero', async () => {
    getDocsMock
      .mockResolvedValueOnce(sizedSnapshot(12))
      .mockResolvedValueOnce(sizedSnapshot(8))
      .mockResolvedValueOnce(sizedSnapshot(3))
      .mockResolvedValueOnce(
        sessionSnapshot([
          { status: 'scheduled' },
          { status: 'completed' },
          { status: 'cancelled' },
          { status: 'rescheduled' },
          { status: 'open', archived: true },
        ]),
      );

    await expect(fetchAdminStats()).resolves.toEqual({
      totalUsers: 12,
      totalStudents: 8,
      totalCourses: 3,
      activeSessionsToday: 2,
    });
  });

  it('surfaces Firestore failures instead of returning believable all-zero stats', async () => {
    getDocsMock.mockRejectedValueOnce(new Error('permission denied'));

    await expect(fetchAdminStats()).rejects.toThrow('permission denied');
  });
});
