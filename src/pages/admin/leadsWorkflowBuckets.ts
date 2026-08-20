export type SimpleLeadBucket = 'open' | 'in_progress' | 'closed';
export type SimpleLeadAction =
  | 'create_demo'
  | 'assign_teacher'
  | 'wait_teacher'
  | 'review_outcome'
  | 'view_outcome';

export interface SimpleLeadWorkflowInput {
  leadStatus?: unknown;
  demoStatus?: unknown;
  conversionStatus?: unknown;
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

export function resolveSimpleLeadBucket(input: SimpleLeadWorkflowInput): SimpleLeadBucket {
  const leadStatus = normalize(input.leadStatus);
  const demoStatus = normalize(input.demoStatus);
  const conversionStatus = normalize(input.conversionStatus);

  if (CLOSED_LEAD_STATUSES.has(leadStatus) || CLOSED_CONVERSION_STATUSES.has(conversionStatus)) {
    return 'closed';
  }

  if (demoStatus === 'assigned' || demoStatus === 'completed' || demoStatus === 'cancelled') {
    return 'in_progress';
  }

  if (conversionStatus === 'interested' || conversionStatus === 'follow_up_later') {
    return 'in_progress';
  }

  return 'open';
}

export function resolveSimpleLeadAction(input: SimpleLeadWorkflowInput & { hasDemo?: boolean }): SimpleLeadAction {
  const bucket = resolveSimpleLeadBucket(input);
  const demoStatus = normalize(input.demoStatus);

  if (bucket === 'closed') return 'view_outcome';
  if (!input.hasDemo) return 'create_demo';
  if (demoStatus === 'open') return 'assign_teacher';
  if (demoStatus === 'assigned') return 'wait_teacher';
  return 'review_outcome';
}

export function resolveSimpleStatusLabel(input: SimpleLeadWorkflowInput & { hasDemo?: boolean }): string {
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

  if (!input.hasDemo) return 'New enquiry';
  if (demoStatus === 'open') return 'Ready to assign';
  if (demoStatus === 'assigned') return 'With teacher';
  if (demoStatus === 'completed') return 'Teacher response ready';
  if (demoStatus === 'cancelled') return 'Needs admin decision';
  if (conversionStatus === 'interested') return 'Interested — follow up';
  if (conversionStatus === 'follow_up_later') return 'Follow up later';
  return 'In progress';
}
