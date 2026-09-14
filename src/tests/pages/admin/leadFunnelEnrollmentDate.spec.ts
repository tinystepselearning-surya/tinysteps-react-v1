import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../../types/models';
import { buildLeadFunnelAnalytics, type LeadFunnelLead } from '../../../pages/admin/leadFunnelAnalytics';

const ts = (iso: string) => ({ toMillis: () => new Date(iso).getTime() });

const demo = (overrides: Partial<DemoSession> & Pick<DemoSession, 'id'>): DemoSession => {
  const { id, ...rest } = overrides;
  return {
    id,
    parentName: 'Parent',
    childName: 'Child',
    childGrade: '1',
    courseInterested: 'Phonics',
    preferredDateTimeText: 'Evening',
    status: 'completed',
    createdBy: 'admin',
    ...rest,
  };
};

describe('lead funnel enrollment event dates', () => {
  it('plots enrollment only on enrolledAt, never on a later generic update', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'lead-1', source: 'website', receivedAt: ts('2026-09-10T04:00:00.000Z') },
    ];
    const demos: DemoSession[] = [
      demo({
        id: 'demo-1',
        leadId: 'lead-1',
        createdAt: ts('2026-09-10T05:00:00.000Z') as any,
        completedAt: ts('2026-09-11T05:00:00.000Z') as any,
        conversionStatus: 'enrolled',
        enrolledAt: ts('2026-09-11T06:00:00.000Z') as any,
        lastUpdatedAt: ts('2026-09-13T06:00:00.000Z') as any,
      }),
    ];

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-09-10', '2026-09-13');

    expect(result.cohortTotals.enrolled).toBe(1);
    expect(result.activity.find((point) => point.dateKey === '2026-09-11')?.enrolled).toBe(1);
    expect(result.activity.find((point) => point.dateKey === '2026-09-13')?.enrolled).toBe(0);
  });

  it('keeps legacy enrolled records in cohort totals but does not invent a daily enrollment date', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'lead-legacy', source: 'manual', receivedAt: ts('2026-09-10T04:00:00.000Z') },
    ];
    const demos: DemoSession[] = [
      demo({
        id: 'demo-legacy',
        leadId: 'lead-legacy',
        createdAt: ts('2026-09-10T05:00:00.000Z') as any,
        completedAt: ts('2026-09-11T05:00:00.000Z') as any,
        conversionStatus: 'enrolled',
        lastUpdatedAt: ts('2026-09-13T06:00:00.000Z') as any,
      }),
    ];

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-09-10', '2026-09-13');

    expect(result.cohortTotals.enrolled).toBe(1);
    expect(result.activity.reduce((sum, point) => sum + point.enrolled, 0)).toBe(0);
  });
});