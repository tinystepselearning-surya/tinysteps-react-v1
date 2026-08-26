import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { docMock, getDocMock } = vi.hoisted(() => ({
  docMock: vi.fn((...args: any[]) => ({ kind: 'doc', args })),
  getDocMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  getDoc: getDocMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

import { useEarnings } from '../../pages/teacher/hooks/useEarnings';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useEarnings monthly read contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the selected teachers/{teacherId}/earnings/{monthKey} document exactly once', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      id: '2026-08',
      data: () => ({
        month: '2026-08',
        totalEarnings: 4550,
        pendingEarnings: 700,
        totalSessions: 22,
        sessionsCompleted: 22,
        demoEarnings: 700,
        demoCompletedCount: 3,
        demoEnrollmentBonusCount: 1,
        payments: [],
      }),
    });

    const { result } = renderHook(() => useEarnings('teacher-1', '2026-08'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(docMock).toHaveBeenCalledTimes(1);
    expect(docMock.mock.calls[0].slice(1)).toEqual([
      'teachers',
      'teacher-1',
      'earnings',
      '2026-08',
    ]);
    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(result.current.data?.totalEarnings).toBe(4550);
    expect(result.current.data?.demoCompletedCount).toBe(3);
  });

  it('returns an empty month when the rollup is absent without reading legacy teacherEarnings', async () => {
    getDocMock.mockResolvedValue({
      exists: () => false,
      id: '2026-08',
      data: () => null,
    });

    const { result } = renderHook(() => useEarnings('teacher-1', '2026-08'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getDocMock).toHaveBeenCalledTimes(1);
    expect(docMock).toHaveBeenCalledTimes(1);
    expect(docMock.mock.calls.some((call) => call.includes('teacherEarnings'))).toBe(false);
    expect(result.current.data).toMatchObject({
      month: '2026-08',
      totalEarnings: 0,
      pendingEarnings: 0,
      totalSessions: 0,
      demoEarnings: 0,
      demoCompletedCount: 0,
      demoEnrollmentBonusCount: 0,
    });
  });
});
