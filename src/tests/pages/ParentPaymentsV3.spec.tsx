import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findParents, readLedger, recordReceipt, downloadPdf } = vi.hoisted(() => ({
  findParents: vi.fn(),
  readLedger: vi.fn(),
  recordReceipt: vi.fn(),
  downloadPdf: vi.fn(),
}));

vi.mock('../../lib/firebaseConfig', () => ({ db: {}, functions: {} }));
vi.mock('firebase/functions', () => ({
  httpsCallable: (_functions: unknown, name: string) => (
    name === 'adminGetParentLedgerV3' ? readLedger : recordReceipt
  ),
}));
vi.mock('../../pages/admin/paymentUserSearch', () => ({
  PAYMENT_USER_SEARCH_DEBOUNCE_MS: 0,
  PAYMENT_USER_SEARCH_MIN_CHARS: 2,
  useDebouncedValue: (value: string) => value,
  searchPaymentUsers: findParents,
}));
vi.mock('../../pages/admin/parentPaymentsV3Invoice', () => ({
  downloadParentLedgerV3Invoice: downloadPdf,
}));
vi.mock('@components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock('@components/ui/button', () => ({
  Button: ({ children, variant: _variant, size: _size, ...rest }: any) =>
    <button {...rest}>{children}</button>,
}));
vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
}));

import ParentPaymentsV3 from '../../pages/admin/ParentPaymentsV3';

const parent = { id: 'parent_123456', name: 'Test Parent', role: 'parent' };
const account = {
  schemaVersion: 3,
  parentId: parent.id,
  parentName: parent.name,
  complete: true,
  cutoverRunId: 'migration_20261019_run01',
  source: 'firestore_billing_charges_and_v3_receipts',
  generatedAt: '2026-10-19T12:00:00Z',
  asOfDate: null,
  chargeCount: 1,
  receiptCount: 1,
  totalBilled: 750,
  totalReceived: 1000,
  totalApplied: 750,
  availableAdvance: 250,
  outstandingDue: 0,
  netDue: -250,
  months: [{ monthKey: '2026-10', classes: 1, billed: 750, applied: 750, due: 0 }],
  classDetails: [{ id: 'class1', serviceDate: '2026-10-03', monthKey: '2026-10',
    studentName: 'Sample Student', courseName: 'Phonics',
    attendance: 'Present', amount: 750, applied: 750, due: 0 }],
  billingWarnings: [],
  receiptDetails: [{ id: 'receipt1', receivedDate: '2026-10-12',
    kind: 'regular', amount: 1000, method: 'UPI', reference: null }],
};

async function chooseParent() {
  fireEvent.change(screen.getByLabelText('Find parent'), { target: { value: 'Test' } });
  const button = await screen.findByText('Open account');
  fireEvent.click(button);
}

describe('Admin Parent Payments V3 preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findParents.mockResolvedValue([parent]);
    readLedger.mockResolvedValue({ data: account });
    recordReceipt.mockResolvedValue({ data: { ok: true } });
  });

  it('shows a complete account only after the verified V3 callable succeeds', async () => {
    render(<ParentPaymentsV3 onBack={vi.fn()} />);
    await chooseParent();
    expect(await screen.findByText('Sample Student')).toBeTruthy();
    expect(screen.getByText('Phonics')).toBeTruthy();
    expect(screen.getByText('UPI')).toBeTruthy();
    expect(screen.getByText('Available advance')).toBeTruthy();
    const download = screen.getByRole('button', { name: 'Download cumulative PDF' });
    fireEvent.click(download);
    expect(downloadPdf).toHaveBeenCalledWith(account);
  });

  it('never displays financial totals when migration is not active', async () => {
    readLedger.mockRejectedValue(Object.assign(
      new Error('V3 account statements are unavailable before verified cutover.'),
      { code: 'functions/failed-precondition' },
    ));
    render(<ParentPaymentsV3 onBack={vi.fn()} />);
    await chooseParent();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Total billed')).toBeNull();
    expect(screen.getByRole('button', { name: 'Record payment' }).hasAttribute('disabled')).toBe(true);
  });

  it('records a confirmed receipt and reloads the verified ledger', async () => {
    render(<ParentPaymentsV3 onBack={vi.fn()} />);
    await chooseParent();
    await screen.findByText('Sample Student');
    fireEvent.click(screen.getByRole('button', { name: 'Record payment' }));
    fireEvent.change(screen.getByLabelText('Amount received'), { target: { value: '4000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record verified receipt' }));
    await waitFor(() => expect(recordReceipt).toHaveBeenCalledOnce());
    expect(recordReceipt.mock.calls[0][0]).toMatchObject({
      parentId: parent.id, amount: 4000, kind: 'regular',
    });
    await waitFor(() => expect(readLedger).toHaveBeenCalledTimes(2));
  });
});
