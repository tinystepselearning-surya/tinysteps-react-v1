export type SimpleLeadBucket = 'open' | 'in_progress' | 'admin_review' | 'closed';
export type SimpleLeadAction =
  | 'follow_up_lead'
  | 'assign_teacher'
  | 'wait_teacher'
  | 'review_outcome'
  | 'view_outcome';

export interface SimpleLeadWorkflowInput {
  leadStatus?: unknown;
  demoStatus?: unknown;
  conversionStatus?: unknown;
  hasDemo?: boolean;
  hasFollowUp?: boolean;
  classFormatPreference?: unknown;
}

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

/**
 * Read-only lead triage for the existing bounded admin queue.
 * This is NOT a verification score, a contact status, or an acquisition KPI.
 * Never persist or infer a parent's intent from these presentation hints.
 */
export type StatedParentUrgency = 'Today' | 'This week' | 'This month' | 'Just exploring';

/** An explicit parent request for this particular enquiry, not proof of
 * WhatsApp ownership, message receipt or permission for marketing campaigns.
 * Old leads and malformed data are treated as unknown, never opted in.
 */
export type EnquiryContactPreference = 'phone' | 'whatsapp' | 'either';

export const resolveEnquiryContactPreference = (input: unknown): EnquiryContactPreference | null => {
  // Accept both schema-typed LeadRecord and legacy Firestore map shapes.
  const lead = input && typeof input === 'object' ? input as Record<string, unknown> : null;
  if (lead?.contactPermission !== true) return null;
  const value = String(lead.contactPreference || '').trim().toLowerCase();
  return value === 'phone' || value === 'whatsapp' || value === 'either' ? value : null;
};

export const labelEnquiryContactPreference = (preference: EnquiryContactPreference): string =>
  preference === 'phone' ? 'Phone callback' : preference === 'whatsapp' ? 'WhatsApp reply' : 'Phone or WhatsApp';


export type LeadTriageInput = {
  parentName?: unknown;
  parentPhone?: unknown;
  childName?: unknown;
  childAge?: unknown;
  course?: unknown;
  mainConcern?: unknown;
  source?: unknown;
  urgency?: unknown;
};

const isRecordedTriageValue = (value: unknown): boolean => {
  const text = normalize(value);
  return Boolean(text) && !['—', '-', 'unknown', 'not specified', 'not recorded'].includes(text);
};

const STATED_URGENCY_RANK: Record<StatedParentUrgency, number> = {
  Today: 0,
  'This week': 1,
  'This month': 2,
  'Just exploring': 3,
};

export function resolveLeadTriage(input: LeadTriageInput): {
  statedUrgency: StatedParentUrgency | null;
  urgencyRank: number;
  needsCourseGuidance: boolean;
  detailGaps: string[];
} {
  const knownUrgencies: readonly StatedParentUrgency[] = [
    'Today', 'This week', 'This month', 'Just exploring',
  ];
  const statedUrgency = knownUrgencies.find((value) => normalize(value) === normalize(input.urgency)) || null;
  const mainConcern = normalize(input.mainConcern);
  const needsCourseGuidance = mainConcern === 'not sure where to start';

  const detailGaps: string[] = [];
  if (!isRecordedTriageValue(input.parentName)) detailGaps.push('parent name');
  const contactDigits = String(input.parentPhone || '').replace(/\D/g, '');
  if (contactDigits.length < 7 || contactDigits.length > 15) detailGaps.push('contact number');
  if (!isRecordedTriageValue(input.childName)) detailGaps.push('child name');
  const age = Number(input.childAge);
  if (!Number.isInteger(age) || age < 3 || age > 12) detailGaps.push('child age');
  if (!isRecordedTriageValue(input.course) && !isRecordedTriageValue(input.mainConcern)) {
    detailGaps.push('learning goal');
  }
  if (!isRecordedTriageValue(input.source)) detailGaps.push('enquiry source');
  if (needsCourseGuidance) detailGaps.push('course guidance');

  return {
    statedUrgency,
    urgencyRank: statedUrgency ? STATED_URGENCY_RANK[statedUrgency] : 4,
    needsCourseGuidance,
    detailGaps,
  };
}


const CLOSED_LEAD_STATUSES = new Set([
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
]);

const CLOSED_CONVERSION_STATUSES = new Set([
  'enrolled',
  'not_interested',
  'wrong_fit',
  'no_response',
]);

const FOLLOW_UP_CONVERSION_STATUSES = new Set(['interested', 'follow_up_later']);

export function isSimpleFollowUpDecision(value: unknown): boolean {
  return FOLLOW_UP_CONVERSION_STATUSES.has(normalize(value));
}

export function simpleOutcomeNeedsReason(value: unknown): boolean {
  return ['not_interested', 'wrong_fit', 'no_response'].includes(normalize(value));
}

export function resolveSimpleLeadBucket(input: SimpleLeadWorkflowInput): SimpleLeadBucket {
  const leadStatus = normalize(input.leadStatus);
  const demoStatus = normalize(input.demoStatus);
  const conversionStatus = normalize(input.conversionStatus);

  // Final admin decisions always win. Stale demo/follow-up data must never reopen a closed lead.
  if (CLOSED_LEAD_STATUSES.has(leadStatus) || CLOSED_CONVERSION_STATUSES.has(conversionStatus)) {
    return 'closed';
  }

  // Four clear ownership stages:
  // Open -> With Teacher -> Admin Review -> Closed.
  // Once a demo exists, the demo lifecycle is the operational source of truth.
  if (input.hasDemo) {
    if (FOLLOW_UP_CONVERSION_STATUSES.has(conversionStatus)) return 'admin_review';
    if (demoStatus === 'completed' || demoStatus === 'cancelled') return 'admin_review';
    if (demoStatus === 'assigned') return 'in_progress';
    return 'open';
  }

  // This is only a short-lived synchronization/legacy state. New enquiries receive a demo automatically.
  // Any surviving follow-up without a demo is admin-owned work, never teacher-owned work.
  if (input.hasFollowUp) return 'admin_review';
  return 'open';
}

export function resolveSimpleLeadAction(input: SimpleLeadWorkflowInput): SimpleLeadAction {
  const bucket = resolveSimpleLeadBucket(input);
  const demoStatus = normalize(input.demoStatus);

  if (bucket === 'closed') return 'view_outcome';
  if (bucket === 'admin_review') return input.hasDemo ? 'review_outcome' : 'follow_up_lead';
  // Opening the assignment action repairs a missing demo through the guarded admin callable.
  if (!input.hasDemo) return 'assign_teacher';
  if (demoStatus === 'open') return 'assign_teacher';
  if (demoStatus === 'assigned') return 'wait_teacher';
  return 'review_outcome';
}

export function resolveSimpleStatusLabel(input: SimpleLeadWorkflowInput): string {
  const bucket = resolveSimpleLeadBucket(input);
  const leadStatus = normalize(input.leadStatus);
  const demoStatus = normalize(input.demoStatus);
  const conversionStatus = normalize(input.conversionStatus);

  if (bucket === 'closed') {
    if (conversionStatus === 'enrolled' || leadStatus === 'admitted_confirmed') return 'Enrolled';
    if (conversionStatus === 'not_interested' || leadStatus === 'not_interested') return 'Not interested';
    if (conversionStatus === 'wrong_fit' || leadStatus === 'wrong_fit') return 'Wrong fit';
    if (conversionStatus === 'no_response' || leadStatus === 'no_response') return 'No response';
    return 'Closed';
  }

  if (conversionStatus === 'interested') return 'Interested — follow up';
  if (conversionStatus === 'follow_up_later') return 'Follow up later';

  if (input.hasDemo) {
    if (demoStatus === 'open') return 'Ready to assign';
    if (demoStatus === 'assigned') return 'With teacher';
    if (demoStatus === 'completed') return 'Ready for admin review';
    if (demoStatus === 'cancelled') return 'Needs admin action';
    return bucket === 'admin_review' ? 'Admin action needed' : 'In progress';
  }

  return input.hasFollowUp ? 'Admin follow-up' : 'Demo request not linked';
}
