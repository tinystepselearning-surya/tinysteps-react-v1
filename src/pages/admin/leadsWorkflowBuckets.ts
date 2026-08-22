export type SimpleLeadBucket = 'open' | 'in_progress' | 'closed';
export type SimpleLeadAction =
  | 'awaiting_demo'
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
}

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

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

  // The demo is the operational source of truth once it exists.
  // Open means unassigned; assignment/completion moves the lead to In Progress automatically.
  if (input.hasDemo) {
    if (FOLLOW_UP_CONVERSION_STATUSES.has(conversionStatus)) return 'in_progress';
    if (demoStatus === 'assigned' || demoStatus === 'completed' || demoStatus === 'cancelled') {
      return 'in_progress';
    }
    return 'open';
  }

  // This is now only a short-lived synchronization state. New leads receive a demo automatically.
  if (input.hasFollowUp) return 'in_progress';
  return 'open';
}

export function resolveSimpleLeadAction(input: SimpleLeadWorkflowInput): SimpleLeadAction {
  const bucket = resolveSimpleLeadBucket(input);
  const demoStatus = normalize(input.demoStatus);

  if (bucket === 'closed') return 'view_outcome';
  if (!input.hasDemo) return input.hasFollowUp ? 'follow_up_lead' : 'awaiting_demo';
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
    if (demoStatus === 'completed') return 'Teacher response ready';
    if (demoStatus === 'cancelled') return 'Needs admin decision';
    return 'In progress';
  }

  return input.hasFollowUp ? 'Parent follow-up' : 'Preparing demo request';
}
