import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DemoSession } from '../../types/models';
import type { LeadFunnelLead } from '../../pages/admin/leadFunnelAnalytics';

vi.mock('@components/ui/card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

vi.mock('@components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock('@components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('recharts', () => ({
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import LeadFunnelTrendAnalysis from '../../pages/admin/LeadFunnelTrendAnalysis';

const ts = (iso: string) => ({ toMillis: () => new Date(iso).getTime() });

const demo = (overrides: Partial<DemoSession> & Pick<DemoSession, 'id'>): DemoSession => ({
  id: overrides.id,
  parentName: 'Parent',
  childName: 'Child',
  childGrade: '1',
  courseInterested: 'Phonics',
  preferredDateTimeText: 'Evening',
  status: 'open',
  createdBy: 'admin',
  ...overrides,
});

describe('LeadFunnelTrendAnalysis Growth & Admissions V3', () => {
  it('surfaces cohort gaps, previous-period comparison and live backlog aging', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'aug-1', source: 'website', receivedAt: ts('2026-08-01T04:00:00.000Z') },
      { id: 'aug-2', source: 'website', receivedAt: ts('2026-08-02T04:00:00.000Z') },
      { id: 'jul-1', source: 'website', receivedAt: ts('2026-07-10T04:00:00.000Z') },
    ];
    const demos: DemoSession[] = [
      demo({
        id: 'aug-demo',
        leadId: 'aug-1',
        status: 'completed',
        createdAt: ts('2026-08-01T05:00:00.000Z') as any,
        completedAt: ts('2026-08-01T06:00:00.000Z') as any,
      }),
      demo({
        id: 'jul-demo',
        leadId: 'jul-1',
        status: 'completed',
        createdAt: ts('2026-07-10T05:00:00.000Z') as any,
        completedAt: ts('2026-07-10T06:00:00.000Z') as any,
        conversionStatus: 'enrolled',
      }),
      demo({
        id: 'old-open',
        status: 'open',
        createdAt: ts('2026-06-01T04:00:00.000Z') as any,
      }),
    ];

    render(
      <LeadFunnelTrendAnalysis
        leads={leads}
        demos={demos}
        startKey="2026-08-01"
        endKey="2026-08-31"
      />,
    );

    expect(screen.getByText('Stage-gap diagnosis')).toBeTruthy();
    expect(screen.getByText('Previous-period comparison')).toBeTruthy();
    expect(screen.getByText(/Same-length preceding lead cohort: 2026-07-01 to 2026-07-31/)).toBeTruthy();
    expect(screen.getByText('Live demo workload health')).toBeTruthy();
    expect(screen.getByText('Very old open records')).toBeTruthy();
    expect(screen.getByText(/Largest gap by volume/)).toBeTruthy();
    expect(screen.getByText(/age alone does not prove a record is invalid/)).toBeTruthy();
  });
});
