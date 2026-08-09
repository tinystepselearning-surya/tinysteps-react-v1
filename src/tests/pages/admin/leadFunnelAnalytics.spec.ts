import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../../types/models';
import {
  buildLeadFunnelAnalytics,
  leadReceivedDateKey,
  type LeadFunnelLead,
} from '../../../pages/admin/leadFunnelAnalytics';

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

describe('lead funnel analytics', () => {
  it('uses original lead received date while counting later demo lifecycle events separately', () => {
    const leads: LeadFunnelLead[] = [
      {
        id: 'lead-1',
        source: 'website',
        receivedAt: ts('2026-08-05T05:00:00.000Z'),
      },
    ];
    const demos: DemoSession[] = [
      demo({
        id: 'demo-1',
        leadId: 'lead-1',
        createdAt: ts('2026-08-09T05:00:00.000Z') as any,
        assignedAt: ts('2026-08-09T06:00:00.000Z') as any,
        completedAt: ts('2026-08-09T07:00:00.000Z') as any,
        lastUpdatedAt: ts('2026-08-09T08:00:00.000Z') as any,
        status: 'completed',
        conversionStatus: 'enrolled',
      }),
    ];

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-08-05', '2026-08-09');
    expect(result.cohortTotals.received).toBe(1);
    expect(result.cohortTotals.demoCreated).toBe(1);
    expect(result.cohortTotals.assigned).toBe(1);
    expect(result.cohortTotals.completed).toBe(1);
    expect(result.cohortTotals.enrolled).toBe(1);
    expect(result.activity.find((point) => point.dateKey === '2026-08-05')?.received).toBe(1);
    expect(result.activity.find((point) => point.dateKey === '2026-08-09')?.demoCreated).toBe(1);
  });

  it('falls back from receivedAt to requestedAt and createdAt', () => {
    expect(leadReceivedDateKey({ id: 'a', requestedAt: ts('2026-08-09T03:00:00.000Z') })).toBe('2026-08-09');
    expect(leadReceivedDateKey({ id: 'b', createdAt: ts('2026-08-08T20:00:00.000Z') })).toBe('2026-08-09');
  });

  it('counts one lead once in cohort conversion even when it has multiple rescheduled demos', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'lead-1', source: 'whatsapp', receivedAt: ts('2026-08-09T03:00:00.000Z') },
    ];
    const demos: DemoSession[] = [
      demo({
        id: 'demo-1',
        leadId: 'lead-1',
        status: 'completed',
        createdAt: ts('2026-08-09T04:00:00.000Z') as any,
        assignedAt: ts('2026-08-09T05:00:00.000Z') as any,
        completedAt: ts('2026-08-09T06:00:00.000Z') as any,
        outcome: 'reschedule_requested',
      }),
      demo({
        id: 'demo-2',
        leadId: 'lead-1',
        status: 'completed',
        createdAt: ts('2026-08-09T07:00:00.000Z') as any,
        assignedAt: ts('2026-08-09T08:00:00.000Z') as any,
        completedAt: ts('2026-08-09T09:00:00.000Z') as any,
        conversionStatus: 'enrolled',
      }),
    ];

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-08-09', '2026-08-09');
    expect(result.cohortTotals).toMatchObject({
      received: 1,
      demoCreated: 1,
      assigned: 1,
      completed: 1,
      enrolled: 1,
    });
    expect(result.sourcePerformance[0]).toMatchObject({
      source: 'WhatsApp',
      received: 1,
      enrolled: 1,
      leadToEnrollmentRate: 100,
    });
  });

  it('keeps manual demo leads and website leads in the same canonical funnel', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'web', source: 'website', receivedAt: ts('2026-08-09T02:00:00.000Z') },
      { id: 'manual', source: 'manual', receivedAt: ts('2026-08-09T03:00:00.000Z') },
    ];
    const demos: DemoSession[] = [
      demo({ id: 'manual-demo', leadId: 'manual', createdAt: ts('2026-08-09T04:00:00.000Z') as any }),
    ];

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-08-09', '2026-08-09');
    expect(result.cohortTotals.received).toBe(2);
    expect(result.cohortTotals.demoCreated).toBe(1);
    expect(result.sourcePerformance.map((row) => row.source).sort()).toEqual(['Manual', 'Website']);
  });
});
