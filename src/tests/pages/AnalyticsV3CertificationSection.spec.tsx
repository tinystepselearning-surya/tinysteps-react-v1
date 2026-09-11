import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../types/models';
import AnalyticsV3CertificationSection from '../../pages/admin/AnalyticsV3CertificationSection';

const lead = {
  id: 'lead-1',
  source: 'website',
  receivedAt: '2026-08-10T10:00:00+05:30',
  demoSessionId: 'demo-1',
  status: 'admitted_confirmed',
  acquisitionChannel: 'google_organic',
};

const demo: DemoSession = {
  id: 'demo-1',
  leadId: 'lead-1',
  parentName: 'Parent',
  childName: 'Child',
  childGrade: '2',
  courseInterested: 'Phonics',
  preferredDateTimeText: '10 Aug',
  status: 'completed',
  outcome: 'completed',
  conversionStatus: 'enrolled',
  createdAt: new Date('2026-08-10T11:00:00+05:30') as any,
  completedAt: new Date('2026-08-10T11:35:00+05:30') as any,
  enrolledAt: new Date('2026-08-10T12:00:00+05:30') as any,
  createdBy: 'admin',
};

describe('AnalyticsV3CertificationSection', () => {
  it('renders certification status, reconciliation and the operational deep link', () => {
    render(
      <AnalyticsV3CertificationSection
        leads={[lead as any]}
        demos={[demo]}
        startKey="2026-08-01"
        endKey="2026-08-31"
      />,
    );

    expect(screen.getByText('Analytics V3 certification & data health')).toBeTruthy();
    expect(screen.getByText('Certified')).toBeTruthy();
    expect(screen.getByText('+0 Firestore reads')).toBeTruthy();
    expect(screen.getByText('Milestone reconciliation')).toBeTruthy();
    expect(screen.getByText('Brick 8 read budget')).toBeTruthy();

    const leadsLink = screen.getByRole('link', { name: 'Open Leads & Enquiries' });
    expect(leadsLink.getAttribute('href')).toBe('/surya?tab=leads');
  });
});
