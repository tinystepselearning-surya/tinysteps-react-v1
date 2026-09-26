import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDocs: vi.fn(), call: vi.fn() }));
vi.mock('../../lib/firebaseConfig', () => ({ db: {} }));
vi.mock('../../lib/callFunctions', () => ({ callFunction: mocks.call }));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  query: (base: object, ...constraints: object[]) => ({ ...base, constraints: [...((base as any).constraints ?? []), ...constraints] }),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  orderBy: (field: string, direction: string) => ({ orderBy: field, direction }),
  documentId: () => '__name__', startAfter: (cursor: unknown) => ({ cursor }),
  limit: (n: number) => ({ limit: n }), getDocs: mocks.getDocs,
}));
vi.mock('../../pages/admin/components/AttendanceValidationBusinessView', () => ({
  default: ({ cases }: { cases: Array<{ id: string }> }) => <div data-testid="cases">{cases.map((c) => c.id).join(',')}</div>,
}));
import { loadAvsParentCases } from '../../lib/attendanceValidationParentScope';
import { collection, query } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import AttendanceValidationDashboard from '../../pages/admin/AttendanceValidationDashboard';
const doc = (id: string, data: object) => ({ id, data: () => data });
const summary = { totalCount: 0, retryableInfrastructureCount: 0, configurationCount: 0, authorizationCount: 0, unknownInfrastructureCount: 0, businessReviewCount: 0, codeCounts: {} };
const response = { ok: true, fromDate: '2026-09-01', toDate: '2026-09-09', parentId: 'parent-a', continueValidation: true,
  nextCursor: { date: '2026-09-09', sessionId: 'case-a' }, failureSummary: summary, evidenceIssueSummary: summary, freshOutcomes: [] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDocs.mockImplementation(async (q: any) => {
    if (q.name === 'users' && q.constraints.some((c: any) => c.field === 'role')) return { docs: [
      doc('parent-a', { displayName: 'Parent A' }), doc('parent-b', { fullName: 'Parent B' }),
    ] };
    if (q.name === 'enrollments') {
      const parent = q.constraints.find((c: any) => c.field === 'parentId')?.value;
      return { docs: parent ? [doc(parent === 'parent-a' ? 'enrollment-a' : 'enrollment-b', {})] : [] };
    }
    if (q.name === 'attendanceValidationCases') {
      const ids = q.constraints.find((c: any) => c.field === 'enrollmentId')?.value;
      return { docs: ['a', 'b'].filter((id) => !ids || ids.includes(`enrollment-${id}`)).map((id) => doc(`case-${id}`, {
        enrollmentId: `enrollment-${id}`, serviceDateYmd: '2026-09-09', studentName: 'Student', teacherName: 'Teacher',
      })) };
    }
    return { docs: [] };
  });
  mocks.call.mockResolvedValue(response);
});
async function selectParent() {
  fireEvent.focus(screen.getByLabelText('Parent'));
  await screen.findByRole('option', { name: 'Parent A' });
  fireEvent.change(screen.getByLabelText('Parent'), { target: { value: 'parent-a' } });
  fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-09' } });
}

describe('Attendance Validation Parent selector', () => {
  it('lazily reads the canonical parent directory once and performs no automatic validation', async () => {
    render(<AttendanceValidationDashboard />);
    expect(mocks.getDocs).not.toHaveBeenCalled();
    await selectParent();
    fireEvent.focus(screen.getByLabelText('Search parents'));
    fireEvent.change(screen.getByLabelText('Search parents'), { target: { value: 'Parent B' } });
    fireEvent.focus(screen.getByLabelText('Parent'));
    expect(mocks.getDocs).toHaveBeenCalledTimes(1);
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it('loads only Parent A enrollment cases and clears results on parent change', async () => {
    render(<AttendanceValidationDashboard />);
    await selectParent();
    fireEvent.click(screen.getByRole('button', { name: /Load Results/ }));
    await waitFor(() => expect(screen.getByTestId('cases')).toHaveTextContent('case-a'));
    expect(screen.getByTestId('cases')).not.toHaveTextContent('case-b');
    fireEvent.change(screen.getByLabelText('Parent'), { target: { value: 'parent-b' } });
    expect(screen.queryByTestId('cases')).not.toBeInTheDocument();
    expect(mocks.call).not.toHaveBeenCalled();
  });
  it('retains parent and cursor on Continue, resets summary on parent change, and disables broad re-fetch', async () => {
    render(<AttendanceValidationDashboard />);
    await selectParent();
    expect(screen.getByRole('button', { name: /Re-fetch Teams Data/, hidden: true })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Run Validation/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Continue Validation/ })).toBeEnabled());
    expect(mocks.call).toHaveBeenLastCalledWith('runAttendanceValidationRange', expect.objectContaining({ parentId: 'parent-a', cursor: null }));
    fireEvent.click(screen.getByRole('button', { name: /Continue Validation/ }));
    await waitFor(() => expect(mocks.call).toHaveBeenCalledTimes(2));
    expect(mocks.call).toHaveBeenLastCalledWith('runAttendanceValidationRange', expect.objectContaining({ parentId: 'parent-a', cursor: response.nextCursor }));
    await waitFor(() => expect(screen.getByLabelText('Parent')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Parent'), { target: { value: 'all' } });
    expect(screen.getByRole('button', { name: /Run Validation/ })).toBeInTheDocument();
    expect(mocks.call).toHaveBeenCalledTimes(2);
  });
  it('All parents loads the existing full range', async () => {
    render(<AttendanceValidationDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Load Results/ }));
    await waitFor(() => expect(screen.getByTestId('cases')).toHaveTextContent('case-a,case-b'));
  });
});

it('chunks parent saved-case reads without including another parent', async () => {
  const ids = ['enrollment-a', ...Array.from({ length: 30 }, (_, i) => `unused-${i}`)];
  const docs = await loadAvsParentCases(query(collection(db, 'attendanceValidationCases')), ids, 100);
  expect(docs.map((item) => item.id)).toEqual(['case-a']);
  expect(mocks.getDocs).toHaveBeenCalledTimes(2);
  for (const [q] of mocks.getDocs.mock.calls) {
    expect(q.constraints.find((item: any) => item.field === 'enrollmentId').value.length).toBeLessThanOrEqual(30);
  }
});
