import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  usePagedLeads: vi.fn(),
  reloadPage: vi.fn(),
  fetchRange: vi.fn(),
  toast: vi.fn(),
  leadsLoading: false,
}));

vi.mock('../../../pages/admin/leadsPaged', () => ({
  LEAD_PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  usePagedLeads: mocks.usePagedLeads,
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('../../../services/demoSessionsService', () => ({
  listenDemoSessionsByIds: vi.fn(() => vi.fn()),
  listenDemoSessionPrivatePhonesByIds: vi.fn(() => vi.fn()),
  reassignDemoSession: vi.fn(),
  updateDemoConversion: vi.fn(),
}));

vi.mock('../../../services/leadsAdminService', () => ({
  adminDeleteLeadWorkflowRecord: vi.fn(),
  adminUpdateLeadWorkflowRecord: vi.fn(),
}));

vi.mock('../../../pages/admin/LeadsInquiriesWorkspaceLegacy', () => ({
  default: () => null,
}));

vi.mock('../../../pages/admin/LeadAdminToolsMenu', () => ({
  default: () => null,
}));

vi.mock('@components/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, variant: _variant, size: _size, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@components/ui/badge', () => ({
  Badge: ({ children, variant: _variant, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

import LeadsInquiriesWorkspaceV2 from '../../../pages/admin/LeadsInquiriesWorkspaceV2';

const dateBoundaryMs = (value: string, endOfDay = false): number =>
  Date.parse(`${value}${endOfDay ? 'T23:59:59.999+05:30' : 'T00:00:00.000+05:30'}`);

const todayDateInputIST = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
};

beforeEach(() => {
  mocks.usePagedLeads.mockReset();
  mocks.reloadPage.mockReset();
  mocks.fetchRange.mockReset();
  mocks.toast.mockReset();
  mocks.leadsLoading = false;

  mocks.usePagedLeads.mockImplementation((options: any) => {
    React.useEffect(() => {
      mocks.fetchRange({
        dateFromMs: options.dateFromMs,
        dateToMs: options.dateToMs,
        forced: false,
      });
    }, [options.dateFromMs, options.dateToMs]);

    return {
      leads: [],
      isLoading: mocks.leadsLoading,
      reloadPage: (resetToFirst = false) => {
        mocks.reloadPage(resetToFirst);
        mocks.fetchRange({
          dateFromMs: options.dateFromMs,
          dateToMs: options.dateToMs,
          forced: true,
        });
      },
    };
  });
});

afterEach(() => cleanup());

describe('Leads & Enquiries explicit date filter application', () => {
  it('does not fetch draft dates, applies both boundaries, forces same-range reload, rejects invalid ranges, and Clear returns to Today', async () => {
    render(<LeadsInquiriesWorkspaceV2 />);

    await waitFor(() => expect(mocks.fetchRange).toHaveBeenCalledTimes(1));
    const initialFetch = mocks.fetchRange.mock.calls[0][0];

    const fromInput = screen.getByLabelText('Enquiry from') as HTMLInputElement;
    const toInput = screen.getByLabelText('Enquiry to') as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: '2026-09-01' } });
    fireEvent.change(toInput, { target: { value: '2026-09-30' } });

    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);
    expect(mocks.fetchRange.mock.calls[0][0]).toEqual(initialFetch);

    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));

    await waitFor(() => expect(mocks.fetchRange).toHaveBeenCalledTimes(2));
    expect(mocks.fetchRange.mock.calls[1][0]).toEqual({
      dateFromMs: dateBoundaryMs('2026-09-01'),
      dateToMs: dateBoundaryMs('2026-09-30', true),
      forced: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));

    expect(mocks.reloadPage).toHaveBeenCalledWith(true);
    expect(mocks.fetchRange).toHaveBeenCalledTimes(3);
    expect(mocks.fetchRange.mock.calls[2][0]).toEqual({
      dateFromMs: dateBoundaryMs('2026-09-01'),
      dateToMs: dateBoundaryMs('2026-09-30', true),
      forced: true,
    });

    fireEvent.change(fromInput, { target: { value: '2026-10-10' } });
    fireEvent.change(toInput, { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));

    expect(mocks.fetchRange).toHaveBeenCalledTimes(3);
    expect(mocks.reloadPage).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Check enquiry dates',
      variant: 'destructive',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(mocks.fetchRange).toHaveBeenCalledTimes(4));
    const today = todayDateInputIST();
    expect(mocks.fetchRange.mock.calls[3][0]).toEqual({
      dateFromMs: dateBoundaryMs(today),
      dateToMs: dateBoundaryMs(today, true),
      forced: false,
    });
    expect(fromInput.value).toBe('');
    expect(toInput.value).toBe('');
  });

  it('disables Apply filter and shows Applying while the lead range query is loading', () => {
    mocks.leadsLoading = true;

    render(<LeadsInquiriesWorkspaceV2 />);

    const button = screen.getByRole('button', { name: 'Applying…' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
