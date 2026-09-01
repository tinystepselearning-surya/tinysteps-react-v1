import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_GRAIN_LABELS,
  ANALYTICS_METRIC_LABELS,
  analyticsCohortDescription,
  hasLeadDemoCreatedMilestone,
  hasLeadEnrolledMilestone,
} from '../../../pages/admin/analyticsMeasurementContract';

describe('analytics measurement contract', () => {
  it('keeps canonical funnel terminology in one shared contract', () => {
    expect(ANALYTICS_METRIC_LABELS).toEqual({
      leadsReceived: 'Leads Received',
      demoCreated: 'Demo Created',
      demoCompleted: 'Demo Completed',
      enrolled: 'Enrolled',
    });
    expect(ANALYTICS_GRAIN_LABELS).toEqual({
      leadCohort: 'Lead cohort',
      eventActivity: 'Event-date activity',
      liveDemoRecords: 'Live demo records',
    });
  });

  it('projects Demo Created from a linked demo or canonical post-demo lead lifecycle', () => {
    expect(hasLeadDemoCreatedMilestone({ demoSessionId: 'demo-1', status: 'new' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'demo_pending_schedule' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'demo_booked' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'demo_completed' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'admission_follow_up' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'admitted_confirmed' })).toBe(true);
    expect(hasLeadDemoCreatedMilestone({ status: 'contacted' })).toBe(false);
  });

  it('uses admitted_confirmed only as the lead-side Enrolled milestone', () => {
    expect(hasLeadEnrolledMilestone({ status: 'admitted_confirmed' })).toBe(true);
    expect(hasLeadEnrolledMilestone({ status: 'admission_follow_up' })).toBe(false);
    expect(hasLeadEnrolledMilestone({ status: 'demo_completed' })).toBe(false);
  });

  it('formats the lead cohort with its anchor and business timezone', () => {
    expect(analyticsCohortDescription('2026-09-01', '2026-09-30')).toBe(
      'Lead cohort: 2026-09-01 to 2026-09-30 · first received · Asia/Kolkata',
    );
  });
});
