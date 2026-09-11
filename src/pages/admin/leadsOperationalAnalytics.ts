export type LeadOperationalQueueKey =
  | 'new_enquiries'
  | 'not_contacted'
  | 'follow_up_today'
  | 'overdue_follow_up'
  | 'no_response'
  | 'demo_not_scheduled'
  | 'demo_scheduled'
  | 'decision_pending'
  | 'enrolled'
  | 'lost';

export type LeadAttentionLevel = 'needs_attention' | 'follow_up_today' | 'waiting_parent' | 'on_track' | 'closed';

export interface LeadOperationalRecord {
  id: string;
  parentName?: string | null;
  childName?: string | null;
  primaryPhone?: string | null;
  whatsappNumber?: string | null;
  phoneNormalized?: string | null;
  programInterest?: string | null;
  interestTrack?: string | null;
  source?: string | null;
  status?: string | null;
  priority?: string | null;
  ownerUserId?: string | null;
  ownerRole?: string | null;
  nextFollowUpAt?: unknown;
  lastContactAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  demoCreatedAt?: unknown;
  demoAssignedAt?: unknown;
  demoCompletedAt?: unknown;
  enrolledAt?: unknown;
}

export interface LeadOperationalQueueDefinition {
  key: LeadOperationalQueueKey;
  label: string;
  shortHelp: string;
  statuses?: readonly string[];
  tone: 'neutral' | 'warning' | 'urgent' | 'success';
}

export const ACTIVE_FOLLOW_UP_STATUSES = [
  'new',
  'attempted_contact',
  'contacted',
  'qualified',
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
] as const;

export const TERMINAL_LEAD_STATUSES = [
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
] as const;

export const LEAD_OPERATIONAL_QUEUES: readonly LeadOperationalQueueDefinition[] = [
  {
    key: 'new_enquiries',
    label: 'New enquiries',
    shortHelp: 'Fresh leads still in New status.',
    statuses: ['new'],
    tone: 'neutral',
  },
  {
    key: 'not_contacted',
    label: 'Not contacted',
    shortHelp: 'New or attempted-contact leads without a successful contact stage yet.',
    statuses: ['new', 'attempted_contact'],
    tone: 'warning',
  },
  {
    key: 'follow_up_today',
    label: 'Follow-up due today',
    shortHelp: 'Active leads whose saved next follow-up falls today in Asia/Kolkata.',
    tone: 'warning',
  },
  {
    key: 'overdue_follow_up',
    label: 'Overdue follow-ups',
    shortHelp: 'Active leads whose saved next follow-up date has already passed.',
    tone: 'urgent',
  },
  {
    key: 'no_response',
    label: 'No response',
    shortHelp: 'Leads explicitly closed or classified as no response.',
    statuses: ['no_response'],
    tone: 'warning',
  },
  {
    key: 'demo_not_scheduled',
    label: 'Demo not scheduled',
    shortHelp: 'Leads currently waiting for demo scheduling.',
    statuses: ['demo_pending_schedule'],
    tone: 'urgent',
  },
  {
    key: 'demo_scheduled',
    label: 'Demo scheduled',
    shortHelp: 'Leads with a booked demo currently owned by the teacher workflow.',
    statuses: ['demo_booked'],
    tone: 'neutral',
  },
  {
    key: 'decision_pending',
    label: 'Demo completed · decision pending',
    shortHelp: 'Completed demos still awaiting an admin decision or admission follow-up.',
    statuses: ['demo_completed', 'admission_follow_up'],
    tone: 'urgent',
  },
  {
    key: 'enrolled',
    label: 'Enrolled',
    shortHelp: 'Successful admissions confirmed in the lead lifecycle.',
    statuses: ['admitted_confirmed'],
    tone: 'success',
  },
  {
    key: 'lost',
    label: 'Lost / closed',
    shortHelp: 'Not interested, wrong fit, no response or manually lost.',
    statuses: ['not_interested', 'wrong_fit', 'no_response', 'lost'],
    tone: 'neutral',
  },
] as const;

export const LEAD_AGE_BANDS = [
  { key: '0_1', label: '0–1 days', minDays: 0, maxDaysExclusive: 2 },
  { key: '2_3', label: '2–3 days', minDays: 2, maxDaysExclusive: 4 },
  { key: '4_7', label: '4–7 days', minDays: 4, maxDaysExclusive: 8 },
  { key: '8_14', label: '8–14 days', minDays: 8, maxDaysExclusive: 15 },
  { key: '15_plus', label: '15+ days', minDays: 15, maxDaysExclusive: null },
] as const;

export type LeadAgeBandKey = (typeof LEAD_AGE_BANDS)[number]['key'];
export type LeadAgeBandCounts = Record<LeadAgeBandKey, number>;

export const EMPTY_LEAD_AGE_BANDS: LeadAgeBandCounts = {
  '0_1': 0,
  '2_3': 0,
  '4_7': 0,
  '8_14': 0,
  '15_plus': 0,
};

export const operationalQueueDefinition = (key: LeadOperationalQueueKey): LeadOperationalQueueDefinition =>
  LEAD_OPERATIONAL_QUEUES.find((item) => item.key === key) || LEAD_OPERATIONAL_QUEUES[0];

export const toOperationalMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof candidate.toMillis === 'function') {
      const ms = candidate.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000 + Math.floor((candidate.nanoseconds || 0) / 1_000_000);
    }
  }
  return 0;
};

export const istDateKey = (nowMs = Date.now()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(nowMs));
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return year && month && day ? `${year}-${month}-${day}` : '';
};

export const istDayBounds = (nowMs = Date.now()): { startMs: number; endMs: number } => {
  const key = istDateKey(nowMs);
  if (!key) return { startMs: 0, endMs: 0 };
  const startMs = Date.parse(`${key}T00:00:00.000+05:30`);
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
};

export const leadAgeDays = (record: LeadOperationalRecord, nowMs = Date.now()): number | null => {
  const createdMs = toOperationalMs(record.createdAt);
  if (!createdMs || createdMs > nowMs) return null;
  return Math.floor((nowMs - createdMs) / (24 * 60 * 60 * 1000));
};

export const leadAgeBand = (record: LeadOperationalRecord, nowMs = Date.now()): LeadAgeBandKey | null => {
  const days = leadAgeDays(record, nowMs);
  if (days === null) return null;
  if (days <= 1) return '0_1';
  if (days <= 3) return '2_3';
  if (days <= 7) return '4_7';
  if (days <= 14) return '8_14';
  return '15_plus';
};

export const stageAnchorMs = (record: LeadOperationalRecord): number => {
  const status = String(record.status || '').trim().toLowerCase();
  if (status === 'demo_completed' || status === 'admission_follow_up') {
    return toOperationalMs(record.demoCompletedAt) || toOperationalMs(record.updatedAt) || toOperationalMs(record.createdAt);
  }
  if (status === 'demo_pending_schedule' || status === 'demo_booked') {
    return toOperationalMs(record.demoCreatedAt) || toOperationalMs(record.updatedAt) || toOperationalMs(record.createdAt);
  }
  return toOperationalMs(record.createdAt) || toOperationalMs(record.updatedAt);
};

export const stageAgeDays = (record: LeadOperationalRecord, nowMs = Date.now()): number | null => {
  const anchor = stageAnchorMs(record);
  if (!anchor || anchor > nowMs) return null;
  return Math.floor((nowMs - anchor) / (24 * 60 * 60 * 1000));
};

export const deriveLeadAttention = (
  record: LeadOperationalRecord,
  nowMs = Date.now(),
): { level: LeadAttentionLevel; reason: string } => {
  const status = String(record.status || '').trim().toLowerCase();
  if ((TERMINAL_LEAD_STATUSES as readonly string[]).includes(status)) {
    return { level: 'closed', reason: 'Lifecycle is closed.' };
  }

  const { startMs, endMs } = istDayBounds(nowMs);
  const followUpMs = toOperationalMs(record.nextFollowUpAt);
  if (followUpMs && startMs && followUpMs < startMs) {
    return { level: 'needs_attention', reason: 'Saved follow-up date is overdue.' };
  }
  if (followUpMs && startMs && followUpMs >= startMs && followUpMs < endMs) {
    return { level: 'follow_up_today', reason: 'Follow-up is due today.' };
  }

  const createdMs = toOperationalMs(record.createdAt);
  const lastContactMs = toOperationalMs(record.lastContactAt);
  if ((status === 'new' || status === 'attempted_contact') && !lastContactMs && createdMs && nowMs - createdMs >= 24 * 60 * 60 * 1000) {
    return { level: 'needs_attention', reason: 'No successful contact timestamp after 24 hours.' };
  }

  const stageDays = stageAgeDays(record, nowMs);
  if (status === 'demo_pending_schedule' && stageDays !== null && stageDays >= 2) {
    return { level: 'needs_attention', reason: 'Demo scheduling has been pending for at least 2 days.' };
  }
  if ((status === 'demo_completed' || status === 'admission_follow_up') && stageDays !== null && stageDays >= 3) {
    return { level: 'needs_attention', reason: 'Post-demo decision has been pending for at least 3 days.' };
  }
  if (status === 'admission_follow_up') {
    return { level: 'waiting_parent', reason: 'Admission follow-up is active.' };
  }
  return { level: 'on_track', reason: 'No overdue rule is currently triggered.' };
};

export const matchesOperationalQueue = (
  record: LeadOperationalRecord,
  key: LeadOperationalQueueKey,
  nowMs = Date.now(),
): boolean => {
  const status = String(record.status || '').trim().toLowerCase();
  if (key === 'follow_up_today' || key === 'overdue_follow_up') {
    if (!(ACTIVE_FOLLOW_UP_STATUSES as readonly string[]).includes(status)) return false;
    const followUpMs = toOperationalMs(record.nextFollowUpAt);
    const { startMs, endMs } = istDayBounds(nowMs);
    if (!followUpMs || !startMs) return false;
    return key === 'follow_up_today'
      ? followUpMs >= startMs && followUpMs < endMs
      : followUpMs < startMs;
  }
  const definition = operationalQueueDefinition(key);
  return Boolean(definition.statuses?.includes(status));
};
