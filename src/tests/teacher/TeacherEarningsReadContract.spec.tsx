import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  getDocsMock,
  queryMock,
  whereMock,
  useEarningsMock,
  useAuthStoreMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn((...args: any[]) => ({ kind: 'collection', args, name: args[1] })),
  getDocsMock: vi.fn(),
  queryMock: vi.fn((ref: any, ...parts: any[]) => ({ kind: 'query', ref, parts })),
  whereMock: vi.fn((field: string, op: string, value: unknown) => ({ kind: 'where', field, op, value })),
  useEarningsMock: vi.fn(),
  useAuthStoreMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  where: whereMock,
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: useAuthStoreMock,
}));

vi.mock('../../pages/teacher/hooks/useEarnings', () => ({
  useEarnings: useEarningsMock,
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, variant: _variant, size: _size, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select aria-label="Month" value={value} onChange={(event) => onValueChange?.(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('@components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children, colSpan }: any) => <td colSpan={colSpan}>{children}</td>,
}));

import { EarningsSummary } from '../../pages/teacher/components/earnings/EarningsSummary';

const monthlySummary = {
  month: '2026-08',
  totalSessions: 22,
  sessionsCompleted: 22,
  sessionsPending: 0,
  ratePerSession: 175,
  totalEarnings: 4550,
  pendingEarnings: 700,
  demoEarnings: 700,
  demoCompletedCount: 3,
  demoEnrollmentBonusCount: 1,
  breakdownByCourse: [],
  payments: [],
};

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
  exists: () => true,
});

const collectionName = (input: any) => input?.ref?.name || input?.name || '';
const hasWhere = (input: any, field: string, op?: string, value?: unknown) =>
  Array.isArray(input?.parts) &&
  input.parts.some(
    (part: any) =>
      part?.kind === 'where' &&
      part.field === field &&
      (op ? part.op === op : true) &&
      (value === undefined ? true : part.value === value),
  );

const sessionDoc = makeDoc('session-1', {
  teacherId: 'teacher-1',
  date: '2026-08-12',
  startTime: '18:00',
  endTime: '18:35',
  kidId: 'kid-1',
  studentName: 'Asha',
  courseName: 'Phonics',
  attendanceStatus: 'present',
  sessionType: 'regular',
});

const earningDoc = makeDoc('session-1', {
  teacherId: 'teacher-1',
  monthKey: '2026-08',
  sessionId: 'session-1',
  kidId: 'kid-1',
  studentName: 'Asha',
  source: 'session_present_completed',
  status: 'pending',
  amount: 175,
});

const demoDoc = makeDoc('demo-earning-1', {
  teacherId: 'teacher-1',
  monthKey: '2026-08',
  demoId: 'demo-1',
  kidId: 'kid-2',
  studentName: 'Mira',
  source: 'demo_completed',
  status: 'pending',
  amount: 175,
});

describe('Teacher Earnings read-contract cutover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStoreMock.mockReturnValue({ user: { uid: 'teacher-1' } });
    useEarningsMock.mockReturnValue({
      data: monthlySummary,
      isLoading: false,
      isError: false,
    });
    getDocsMock.mockImplementation(async (input: any) => {
      if (collectionName(input) === 'classSessions') return { docs: [sessionDoc] };
      if (collectionName(input) === 'teacherEarnings') return { docs: [earningDoc, demoDoc] };
      return { docs: [] };
    });
  });

  it('mounts from the monthly rollup without querying detail collections', () => {
    render(<EarningsSummary teacherId="teacher-1" />);

    expect(screen.getByText('Earnings Overview')).toBeTruthy();
    expect(screen.queryByText('Week')).toBeNull();
    expect(screen.queryByText('Custom')).toBeNull();
    expect(getDocsMock).not.toHaveBeenCalled();
    expect(collectionMock).not.toHaveBeenCalled();
  });

  it('loads only month-bounded sessions and ledger after View details, then reuses them for student expansion', async () => {
    render(<EarningsSummary teacherId="teacher-1" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[0]);

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(2));

    const queries = getDocsMock.mock.calls.map((call) => call[0]);
    const sessionQuery = queries.find((input) => collectionName(input) === 'classSessions');
    const ledgerQuery = queries.find((input) => collectionName(input) === 'teacherEarnings');

    expect(sessionQuery).toBeTruthy();
    expect(hasWhere(sessionQuery, 'teacherId', '==', 'teacher-1')).toBe(true);
    expect(hasWhere(sessionQuery, 'date', '>=', '2026-08-01')).toBe(true);
    expect(hasWhere(sessionQuery, 'date', '<=', '2026-08-31')).toBe(true);

    expect(ledgerQuery).toBeTruthy();
    expect(hasWhere(ledgerQuery, 'teacherId', '==', 'teacher-1')).toBe(true);
    expect(hasWhere(ledgerQuery, 'monthKey', '==', '2026-08')).toBe(true);

    const studentRow = screen.getByText('Asha').closest('tr');
    expect(studentRow).toBeTruthy();
    fireEvent.click(within(studentRow as HTMLElement).getByRole('button', { name: 'View details' }));

    expect(screen.getByText('Date-wise details: Asha')).toBeTruthy();
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });

  it('loads demo ledger only on demand and reuses the same month cache', async () => {
    render(<EarningsSummary teacherId="teacher-1" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[1]);

    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(1));
    const ledgerQuery = getDocsMock.mock.calls[0][0];
    expect(collectionName(ledgerQuery)).toBe('teacherEarnings');
    expect(hasWhere(ledgerQuery, 'teacherId', '==', 'teacher-1')).toBe(true);
    expect(hasWhere(ledgerQuery, 'monthKey', '==', '2026-08')).toBe(true);
    expect(screen.getByText('Mira')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[1]);
    expect(getDocsMock).toHaveBeenCalledTimes(1);
  });

  it('fails closed when the bounded session query fails and never falls back to teacher-wide history', async () => {
    getDocsMock.mockImplementation(async (input: any) => {
      if (collectionName(input) === 'classSessions') throw new Error('missing index');
      if (collectionName(input) === 'teacherEarnings') return { docs: [] };
      return { docs: [] };
    });

    render(<EarningsSummary teacherId="teacher-1" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[0]);

    await waitFor(() => expect(screen.getByText('Unable to load session details.')).toBeTruthy());

    const sessionQueries = getDocsMock.mock.calls
      .map((call) => call[0])
      .filter((input) => collectionName(input) === 'classSessions');
    expect(sessionQueries).toHaveLength(1);
    expect(hasWhere(sessionQueries[0], 'date', '>=', '2026-08-01')).toBe(true);
    expect(hasWhere(sessionQueries[0], 'date', '<=', '2026-08-31')).toBe(true);

    const unboundedTeacherHistoryQuery = getDocsMock.mock.calls
      .map((call) => call[0])
      .some(
        (input) =>
          collectionName(input) === 'classSessions' &&
          hasWhere(input, 'teacherId', '==', 'teacher-1') &&
          !hasWhere(input, 'date', '>=') &&
          !hasWhere(input, 'date', '<='),
      );
    expect(unboundedTeacherHistoryQuery).toBe(false);
  });
});
