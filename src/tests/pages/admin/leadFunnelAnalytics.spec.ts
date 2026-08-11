import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../../types/models';
import {
  buildLeadFunnelAnalytics,
  funnelRate,
  leadReceivedDateKey,
  type LeadFunnelLead,
} from '../../../pages/admin/leadFunnelAnalytics';

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
    status: 'open',
    createdBy: 'admin',
    ...rest,
  };
};

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
    expect(result.operational).toMatchObject({
      completedAwaitingAdmin: 1,
    });
    expect(result.activity[0].demoCreated).toBe(2);
  });

  it('returns a safe zero conversion rate for an empty denominator', () => {
    expect(funnelRate(0, 0)).toBe(0);
    expect(funnelRate(1, 0)).toBe(0);
    expect(Number.isFinite(funnelRate(1, 0))).toBe(true);
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

  it('uses Asia/Kolkata day boundaries for the cohort anchor', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'before-midnight-ist', receivedAt: ts('2026-08-08T18:29:59.999Z') },
      { id: 'at-midnight-ist', receivedAt: ts('2026-08-08T18:30:00.000Z') },
    ];

    expect(buildLeadFunnelAnalytics(leads, [], '2026-08-08', '2026-08-08').cohortTotals.received).toBe(1);
    expect(buildLeadFunnelAnalytics(leads, [], '2026-08-09', '2026-08-09').cohortTotals.received).toBe(1);
  });

  it('normalizes all supported canonical lead sources', () => {
    const sources = ['website', 'whatsapp', 'referral', 'instagram', 'manual'];
    const leads: LeadFunnelLead[] = sources.map((source, index) => ({
      id: `lead-${index}`,
      source,
      receivedAt: ts('2026-08-09T03:00:00.000Z'),
    }));

    const result = buildLeadFunnelAnalytics(leads, [], '2026-08-09', '2026-08-09');
    expect(result.sourcePerformance.map((row) => row.source).sort()).toEqual([
      'Instagram',
      'Manual',
      'Referral',
      'Website',
      'WhatsApp',
    ]);
  });

  it('does not count no-show or reschedule-only attempts as completed or enrolled', () => {
    const leads: LeadFunnelLead[] = [
      { id: 'lead-1', source: 'website', receivedAt: ts('2026-08-09T03:00:00.000Z') },
    ];
    const demos: DemoSession[] = ['parent_no_show', 'teacher_no_show', 'reschedule_requested'].map((outcome, index) =>
      demo({
        id: `attempt-${index}`,
        leadId: 'lead-1',
        status: 'completed',
        outcome: outcome as DemoSession['outcome'],
        conversionStatus: 'enrolled',
        createdAt: ts('2026-08-09T04:00:00.000Z') as any,
        completedAt: ts('2026-08-09T05:00:00.000Z') as any,
      }),
    );

    const result = buildLeadFunnelAnalytics(leads, demos, '2026-08-09', '2026-08-09');
    expect(result.cohortTotals.completed).toBe(0);
    expect(result.cohortTotals.enrolled).toBe(0);
    expect(result.activity[0]).toMatchObject({ completed: 0, enrolled: 0 });
  });
});
