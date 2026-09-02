import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../../types/models';
import type { LeadFunnelLead } from '../../../pages/admin/leadFunnelAnalytics';
import { buildAnalyticsV3Certification } from '../../../pages/admin/analyticsV3Certification';

const lead = (overrides: Record<string, unknown> = {}): LeadFunnelLead => ({
  id: 'lead-1',
  source: 'website',
  receivedAt: '2026-08-10T10:00:00+05:30',
  demoSessionId: 'demo-1',
  status: 'admitted_confirmed',
  acquisitionChannel: 'google_organic',
  ...overrides,
} as LeadFunnelLead);

const demo = (overrides: Partial<DemoSession> = {}): DemoSession => ({
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
  ...overrides,
});

describe('Analytics V3 certification', () => {
  it('certifies aligned canonical and lead-side milestones without extra reads', () => {
    const result = buildAnalyticsV3Certification(
      [lead()],
      [demo()],
      '2026-08-01',
      '2026-08-31',
      new Date('2026-09-01T00:00:00+05:30'),
    );

    expect(result.overall).toBe('certified');
    expect(result.reconciliation.aligned).toBe(true);
    expect(result.reconciliation.canonical).toEqual({
      received: 1,
      demoCreated: 1,
      completed: 1,
      enrolled: 1,
    });
    expect(result.attribution.coveragePercent).toBe(100);
    expect(result.additionalFirestoreReads).toBe(0);
  });

  it('marks lead-side lifecycle drift as review rather than inventing canonical demo outcomes', () => {
    const result = buildAnalyticsV3Certification(
      [lead({ demoSessionId: null, status: 'demo_completed' })],
      [],
      '2026-08-01',
      '2026-08-31',
    );

    expect(result.reconciliation.aligned).toBe(false);
    expect(result.reconciliation.delta.demoCreated).toBe(1);
    expect(result.reconciliation.delta.completed).toBe(1);
    expect(result.checks.find((check) => check.id === 'cohort-reconciliation')?.status).toBe('watch');
    expect(result.overall).toBe('provisional');
  });

  it('fails certification when an explicit lead demoSessionId cannot be resolved', () => {
    const result = buildAnalyticsV3Certification(
      [lead({ demoSessionId: 'missing-demo', status: 'demo_pending_schedule' })],
      [],
      '2026-08-01',
      '2026-08-31',
    );

    expect(result.linkage.explicitDemoLinksMissing).toBe(1);
    expect(result.checks.find((check) => check.id === 'explicit-demo-links')?.status).toBe('fail');
    expect(result.overall).toBe('attention');
  });

  it('distinguishes explicitly rescheduled multi-demo history from unexplained duplicates', () => {
    const secondDemo = demo({
      id: 'demo-2',
      status: 'cancelled',
      conversionStatus: null,
      completedAt: null,
      enrolledAt: null,
      rescheduledFromDemoId: 'demo-1',
    });
    const result = buildAnalyticsV3Certification(
      [lead()],
      [demo({ rescheduledToDemoId: 'demo-2' }), secondDemo],
      '2026-08-01',
      '2026-08-31',
    );

    expect(result.linkage.multipleDemoLeads).toBe(1);
    expect(result.linkage.rescheduleLinkedMultipleDemoLeads).toBe(1);
    expect(result.linkage.unexplainedMultipleDemoLeads).toBe(0);
  });

  it('surfaces stale live demo backlog without deleting or reclassifying records', () => {
    const result = buildAnalyticsV3Certification(
      [lead({ status: 'demo_pending_schedule' })],
      [demo({
        status: 'open',
        outcome: null,
        conversionStatus: null,
        completedAt: null,
        enrolledAt: null,
        createdAt: new Date('2026-08-01T10:00:00+05:30') as any,
      })],
      '2026-08-01',
      '2026-08-31',
      new Date('2026-08-20T10:00:00+05:30'),
    );

    expect(result.operational.staleOpenOver7Days).toBe(1);
    expect(result.checks.find((check) => check.id === 'stale-demo-backlog')?.status).toBe('watch');
    expect(result.overall).toBe('provisional');
  });
});
