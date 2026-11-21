import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  usePagedLeads: vi.fn(),
  reloadPage: vi.fn(),
  fetchRange: vi.fn(),
  toast: vi.fn(),
  retryDemo: vi.fn(),
  getDemoDoc: vi.fn(),
  getTeachers: vi.fn(),
  leadsLoading: false,
  loadedLeads: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../../pages/admin/leadsPaged', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../pages/admin/leadsPaged')>()),
  LEAD_PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  usePagedLeads: mocks.usePagedLeads,
}));

vi.mock('../../../lib/firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn((_db: unknown, path: string) => ({ path })),
    doc: vi.fn((_db: unknown, _path: string, id: string) => ({ id })),
    query: vi.fn((ref: unknown) => ref),
    where: vi.fn(),
    getDoc: mocks.getDemoDoc,
    getDocs: mocks.getTeachers,
  };
});

vi.mock('../../../services/demoSessionsService', () => ({
  listenDemoSessionsByIds: vi.fn((_ids: unknown, onData: (rows: unknown[]) => void) => {
    onData([]);
    return vi.fn();
  }),
  listenDemoSessionPrivatePhonesByIds: vi.fn(() => vi.fn()),
  reassignDemoSession: vi.fn(),
  updateDemoConversion: vi.fn(),
}));

vi.mock('../../../services/leadsAdminService', () => ({
  adminDeleteLeadWorkflowRecord: vi.fn(),
  adminRetryLeadDemoRequest: mocks.retryDemo,
  adminUpdateLeadWorkflowRecord: vi.fn(),
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
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
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
  mocks.retryDemo.mockReset();
  mocks.getDemoDoc.mockReset();
  mocks.getTeachers.mockReset();
  mocks.getDemoDoc.mockImplementation(async (ref: { id: string }) => ({
    exists: () => true,
    id: ref.id,
    data: () => ({ status: 'open', leadType: null, parentName: 'Parent', childName: 'Child', courseInterested: 'Phonics', createdBy: 'test' }),
  }));
  mocks.getTeachers.mockResolvedValue({ docs: [] });
  mocks.leadsLoading = false;
  mocks.loadedLeads = [];

  mocks.usePagedLeads.mockImplementation((options: any) => {
    React.useEffect(() => {
      mocks.fetchRange({
        dateFromMs: options.dateFromMs,
        dateToMs: options.dateToMs,
        forced: false,
      });
    }, [options.dateFromMs, options.dateToMs]);

    return {
      leads: mocks.loadedLeads,
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

  it('filters only scheduled Admin Review follow-ups due by today without another lead query', async () => {
    const today = todayDateInputIST();
    const todayStart = dateBoundaryMs(today);
    const afterToday = dateBoundaryMs(today, true) + 60_000;
    const makeLead = (
      id: string,
      parentName: string,
      nextFollowUpAt: number,
      status: string,
      phone: string,
    ) => ({
      id,
      parentName,
      childName: 'Child ' + id,
      primaryPhone: phone,
      status,
      source: 'website',
      programInterest: 'Phonics',
      createdAt: { toMillis: () => todayStart + 1_000 },
      nextFollowUpAt: { toMillis: () => nextFollowUpAt },
    });

    mocks.loadedLeads = [
      makeLead('due', 'Due Parent', todayStart + 60_000, 'admission_follow_up', '919111111101'),
      makeLead('later', 'Later Parent', afterToday, 'admission_follow_up', '919111111102'),
      makeLead('closed', 'Closed Parent', todayStart + 60_000, 'admitted_confirmed', '919111111103'),
    ];

    render(<LeadsInquiriesWorkspaceV2 />);

    const dueToggle = await screen.findByRole('button', { name: 'Follow-ups due today (1)' });
    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);
    fireEvent.click(dueToggle);

    expect(screen.getByText('Due Parent')).toBeTruthy();
    expect(screen.queryByText('Later Parent')).toBeNull();
    expect(screen.queryByText('Closed Parent')).toBeNull();
    expect(dueToggle.getAttribute('aria-pressed')).toBe('true');
    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);

    fireEvent.click(dueToggle);
    expect(screen.getByText('Due Parent')).toBeTruthy();
    expect(screen.getByText('Later Parent')).toBeTruthy();
    expect(dueToggle.getAttribute('aria-pressed')).toBe('false');
    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);
  });

  it('offers optional stated-timing sort and details filtering without modifying or fetching leads again', async () => {
    const todayStart = dateBoundaryMs(todayDateInputIST());
    const makeLead = (id: string, name: string, created: number, urgency: string, concern: string) => ({
      id, parentName: name, childName: 'Child ' + id, primaryPhone: '9191000077' + id,
      childAge: 6, programInterest: 'Reading', mainConcern: concern, source: 'website',
      status: 'new', urgency, classFormatPreference: 'unsure',
      createdAt: { toMillis: () => todayStart + created },
    });
    mocks.loadedLeads = [
      makeLead('001', 'Recent Parent', 3_000, 'Just exploring', 'Understanding what they read'),
      makeLead('002', 'Urgent Parent', 1_000, 'Today', 'Not sure where to start'),
      makeLead('003', 'Unknown Timing Parent', 2_000, '', 'Reading speed and word accuracy'),
    ];
    render(<LeadsInquiriesWorkspaceV2 />);

    const visibleOrder = () => screen.getAllByText(/^(Recent Parent|Urgent Parent|Unknown Timing Parent)$/)
      .map((item) => item.textContent);
    expect(visibleOrder()).toEqual(['Recent Parent', 'Unknown Timing Parent', 'Urgent Parent']);
    expect(screen.getByText('Parent-stated timing: Today')).toBeTruthy();
    expect(screen.getByText('Learning goal: parent needs guidance')).toBeTruthy();
    expect(screen.getByText('Check details: course guidance')).toBeTruthy();

    const timingSort = screen.getByRole('button', { name: 'Prioritise stated timing' });
    fireEvent.click(timingSort);
    expect(visibleOrder()).toEqual(['Urgent Parent', 'Recent Parent', 'Unknown Timing Parent']);
    expect(timingSort.getAttribute('aria-pressed')).toBe('true');

    const details = screen.getByRole('button', { name: 'Needs details (1)' });
    fireEvent.click(details);
    expect(visibleOrder()).toEqual(['Urgent Parent']);
    expect(details.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(details);
    expect(visibleOrder()).toHaveLength(3);
    expect(mocks.retryDemo).not.toHaveBeenCalled();
    expect(mocks.getTeachers).not.toHaveBeenCalled();
    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);
  });

  it('shows a different-day returning parent as a fresh Open review without resetting a prior closed decision', async () => {
    const todayStart = dateBoundaryMs(todayDateInputIST());
    const first = todayStart - 3 * 24 * 60 * 60 * 1000;
    mocks.loadedLeads = [{
      id: 'returning-parent', parentName: 'Returning Parent',
      childName: 'Same Child', primaryPhone: '919100006677',
      source: 'website', programInterest: 'Phonics',
      status: 'not_interested',
      createdAt: { toMillis: () => first },
      receivedAt: { toMillis: () => first },
      lastInquiryAt: { toMillis: () => todayStart + 60_000 },
      contactPreference: 'phone', contactPermission: true,
    }];
    render(<LeadsInquiriesWorkspaceV2 />);

    expect(await screen.findByText('Returning Parent')).toBeInTheDocument();
    expect(screen.getByText('New enquiry · Returning parent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review new enquiry' })).toBeInTheDocument();
    expect(screen.getByText(/Existing history retained/)).toBeInTheDocument();
    expect(screen.getByText('Returning enquiry · Needs review')).toBeInTheDocument();
    expect(mocks.retryDemo).not.toHaveBeenCalled();
    expect(mocks.getDemoDoc).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Assign teacher' })).not.toBeInTheDocument();
  });

  it('shows phone callback requests and keeps phone-only parents out of WhatsApp shortcuts', async () => {
    const todayStart = dateBoundaryMs(todayDateInputIST());
    mocks.loadedLeads = ['phone', 'whatsapp', 'legacy'].map((method, index) => ({
      id: `contact-${index}`, parentName: `Contact Parent ${index}`,
      childName: `Child ${index}`, primaryPhone: `91910000091${index}`,
      source: 'website', programInterest: 'Phonics', status: 'new',
      contactPreference: method === 'legacy' ? undefined : method,
      contactPermission: method !== 'legacy',
      createdAt: { toMillis: () => todayStart + index * 1000 },
    }));
    render(<LeadsInquiriesWorkspaceV2 />);
    expect(screen.getByText('Parent requested: Phone callback')).toBeTruthy();
    expect(screen.getByText('Parent requested: WhatsApp reply')).toBeTruthy();
    const callLink = screen.getByRole('link', { name: 'Call parent' });
    expect(callLink.getAttribute('href')).toBe('tel:919100000910');
    expect(screen.getAllByRole('button', { name: 'Open WhatsApp' })).toHaveLength(2);
    expect(mocks.retryDemo).not.toHaveBeenCalled();
    expect(mocks.fetchRange).toHaveBeenCalledTimes(1);
  });

  it('prepares a missing demo only when admin clicks Assign teacher', async () => {
    const todayStart = dateBoundaryMs(todayDateInputIST());
    mocks.loadedLeads = [{
      id: 'canonical-retry',
      parentName: 'Retry Parent',
      childName: 'Retry Child',
      primaryPhone: '919100000112',
      status: 'new',
      source: 'website',
      classFormatPreference: 'one_to_one',
      programInterest: 'Phonics',
      createdAt: { toMillis: () => todayStart + 1_000 },
    }];
    mocks.retryDemo.mockResolvedValue({ ok: true, action: 'created', demoId: 'lead_canonical-retry' });
    render(<LeadsInquiriesWorkspaceV2 />);
    const assign = await screen.findByRole('button', { name: 'Assign teacher' });
    expect(mocks.retryDemo).not.toHaveBeenCalled();
    fireEvent.click(assign);
    await waitFor(() => expect(mocks.retryDemo).toHaveBeenCalledWith('canonical-retry'));
    await waitFor(() => expect(mocks.getDemoDoc).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Parent preference: One-to-one classes')).toBeTruthy();
    expect(mocks.reloadPage).toHaveBeenCalled();
  });

  it('offers the same explicit teacher assignment for group and undecided enquiries', async () => {
    const todayStart = dateBoundaryMs(todayDateInputIST());
    mocks.loadedLeads = ['small_group', 'unsure'].map((format, index) => ({
      id: `format-${index}`,
      parentName: `Format Parent ${index}`,
      childName: `Child ${index}`,
      primaryPhone: `91910000011${index}`,
      status: 'new',
      source: 'website',
      classFormatPreference: format,
      programInterest: 'Phonics',
      createdAt: { toMillis: () => todayStart + 1_000 },
    }));
    mocks.retryDemo.mockResolvedValue({ ok: true, action: 'created', demoId: 'lead_format-0' });
    render(<LeadsInquiriesWorkspaceV2 />);
    expect(await screen.findAllByText('Demo request not linked')).toHaveLength(2);
    const assign = screen.getAllByRole('button', { name: 'Assign teacher' });
    expect(assign).toHaveLength(2);
    expect(mocks.retryDemo).not.toHaveBeenCalled();
    fireEvent.click(assign[0]);
    await waitFor(() => expect(mocks.retryDemo).toHaveBeenCalledWith('format-0'));
    expect(await screen.findByText('Parent preference: Group classes')).toBeTruthy();
    expect(mocks.getDemoDoc).toHaveBeenCalledTimes(1);
  });

});
