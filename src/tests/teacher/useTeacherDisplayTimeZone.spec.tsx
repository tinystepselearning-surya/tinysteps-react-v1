import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDoc } = vi.hoisted(() => ({ getDoc: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  getDoc,
}));
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

import { useTeacherDisplayTimeZone } from '../../pages/teacher/hooks/useTeacherDisplayTimeZone';

function Fixture({ teacherId = 'teacher-us' }: { teacherId?: string }) {
  const zone = useTeacherDisplayTimeZone(teacherId);
  return <span data-testid="time-zone">{zone}</span>;
}

describe('teacher profile time-zone preference', () => {
  beforeEach(() => getDoc.mockReset());

  it('uses the saved Pacific zone (even when entered as PST) and caches the user lookup', async () => {
    getDoc.mockResolvedValue({ data: () => ({ timezone: 'PST' }) });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = render(
      <QueryClientProvider client={client}><Fixture /></QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('time-zone').textContent).toBe('America/Los_Angeles'));
    expect(getDoc).toHaveBeenCalledWith({ collection: 'users', id: 'teacher-us' });
    first.unmount();

    render(<QueryClientProvider client={client}><Fixture /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByTestId('time-zone').textContent).toBe('America/Los_Angeles'));
    expect(getDoc).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('falls back to the browser zone for an invalid or missing profile value', async () => {
    getDoc.mockResolvedValue({ data: () => ({ timezone: 'Invalid/FictionalZone' }) });
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><Fixture teacherId="teacher-invalid" /></QueryClientProvider>);
    await waitFor(() =>
      expect(screen.getByTestId('time-zone').textContent).toBe(
        deviceZone === 'Asia/Calcutta' ? 'Asia/Kolkata' : deviceZone,
      ));
    client.clear();
  });
});
