export const ANALYTICS_BUSINESS_TIME_ZONE = 'Asia/Kolkata';

export const ANALYTICS_METRIC_LABELS = {
  leadsReceived: 'Leads Received',
  demoCreated: 'Demo Created',
  demoCompleted: 'Demo Completed',
  enrolled: 'Enrolled',
} as const;

export const ANALYTICS_GRAIN_LABELS = {
  leadCohort: 'Lead cohort',
  eventActivity: 'Event-date activity',
  liveDemoRecords: 'Live demo records',
} as const;

const DEMO_CREATED_LEAD_STATUSES = new Set([
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
  'admitted_confirmed',
]);

export type LeadMilestoneRecord = {
  demoSessionId?: string | null;
  status?: string | null;
};

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

/**
 * Lead-level projection of the canonical Demo Created milestone.
 *
 * Acquisition analytics intentionally works from the lead cohort only. A linked
 * demo id is the strongest lead-side evidence; lifecycle statuses are the
 * compatibility fallback for older/synced records.
 */
export const hasLeadDemoCreatedMilestone = (lead: LeadMilestoneRecord): boolean =>
  Boolean(String(lead.demoSessionId || '').trim()) || DEMO_CREATED_LEAD_STATUSES.has(normalize(lead.status));

/** Lead-side projection of the canonical Enrolled milestone. */
export const hasLeadEnrolledMilestone = (lead: LeadMilestoneRecord): boolean =>
  normalize(lead.status) === 'admitted_confirmed';

export const analyticsCohortDescription = (startKey?: string, endKey?: string): string =>
  `${ANALYTICS_GRAIN_LABELS.leadCohort}: ${startKey || '—'} to ${endKey || '—'} · first received · ${ANALYTICS_BUSINESS_TIME_ZONE}`;
