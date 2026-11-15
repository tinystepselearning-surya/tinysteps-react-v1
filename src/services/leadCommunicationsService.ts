import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebaseConfig';

export type LeadCommunicationType = 'message' | 'call' | 'follow_up' | 'note';
export type LeadCommunicationChannel = 'whatsapp' | 'phone' | 'internal' | 'other';
export type LeadCommunicationDirection = 'inbound' | 'outbound' | 'internal';
/** Parent's stated concern, not an admission outcome or proof of disinterest. */
export type LeadParentConcern = 'price_too_high' | 'other';

export const parentConcernLabel = (concern: LeadParentConcern): string =>
  concern === 'price_too_high' ? 'Price is too high' : 'Other concern';

const normalizeConcern = (value: unknown): LeadParentConcern | null =>
  value === 'price_too_high' || value === 'other' ? value : null;

/** Staff can edit a draft. Preparing/opening it must never create a sent contact event. */
export const customStaffWhatsAppUrl = (phone: string, draft: string): string | null => {
  const digits = phone.replace(/\D/g, '');
  const message = draft.trim();
  if (digits.length < 7 || digits.length > 15 || !message || message.length > 1500) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
/**
 * Explicitly staff-reported results, never inferred from WhatsApp links or an
 * outbound log. These are not externally verified delivery receipts.
 */
export type LeadContactOutcome =
  | 'message_sent_unconfirmed'
  | 'parent_replied'
  | 'attempted_no_answer'
  | 'spoke_to_parent'
  | 'invalid_contact';

export const leadContactOutcomeOptions = (
  type: LeadCommunicationType,
  direction: LeadCommunicationDirection,
): Array<{ value: LeadContactOutcome; label: string }> => {
  if (type === 'message' && direction === 'outbound') {
    return [{ value: 'message_sent_unconfirmed', label: 'Message sent — delivery unverified' }];
  }
  if (type === 'message' && direction === 'inbound') {
    return [{ value: 'parent_replied', label: 'Parent replied' }];
  }
  if (type === 'call' && direction === 'inbound') {
    return [{ value: 'spoke_to_parent', label: 'Spoke with parent' }];
  }
  if (type === 'call' && direction === 'outbound') {
    return [
      { value: 'spoke_to_parent', label: 'Spoke with parent' },
      { value: 'attempted_no_answer', label: 'No answer' },
      { value: 'invalid_contact', label: 'Wrong or unreachable number' },
    ];
  }
  return [];
};

export const leadContactOutcomeLabel = (outcome: LeadContactOutcome): string => ({
  message_sent_unconfirmed: 'Message sent — delivery unverified',
  parent_replied: 'Parent replied',
  attempted_no_answer: 'No answer',
  spoke_to_parent: 'Spoke with parent',
  invalid_contact: 'Wrong or unreachable number',
}[outcome]);

const normalizeOutcome = (value: unknown): LeadContactOutcome | null =>
  value === 'message_sent_unconfirmed' ||
  value === 'parent_replied' ||
  value === 'attempted_no_answer' ||
  value === 'spoke_to_parent' ||
  value === 'invalid_contact'
    ? value : null;

export const recentLeadContactEvidence = (rows: LeadCommunicationRecord[]): string => {
  // Newest meaningful explicit report wins; old records are never backfilled.
  const latest = rows.find((row) => row.outcome);
  if (latest?.outcome) {
    return `Latest staff-reported contact result: ${leadContactOutcomeLabel(latest.outcome)}. Not independently verified.`;
  }
  const inbound = rows.some((row) =>
    ['message', 'call'].includes(row.type) && row.direction === 'inbound');
  if (inbound) return 'Inbound contact logged by staff; no structured contact result recorded.';
  const outbound = rows.some((row) =>
    ['message', 'call'].includes(row.type) && row.direction === 'outbound');
  if (outbound) return 'Outbound contact logged by staff; no parent response confirmed here.';
  return 'No contact result recorded in the recent logs. This does not prove no contact occurred.';
};

export interface LeadCommunicationRecord {
  id: string;
  type: LeadCommunicationType;
  channel: LeadCommunicationChannel;
  direction: LeadCommunicationDirection | 'unknown';
  outcome?: LeadContactOutcome | null;
  parentConcern?: LeadParentConcern | null;
  summary: string;
  createdAtMs: number;
  createdBy?: string | null;
}

const toMs = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const candidate = value as { toMillis?: () => number; seconds?: number };
  if (typeof candidate.toMillis === 'function') return candidate.toMillis();
  if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  return 0;
};

const normalizeType = (value: unknown): LeadCommunicationType => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'message' || normalized === 'call' || normalized === 'follow_up') return normalized;
  return 'note';
};

const normalizeChannel = (value: unknown): LeadCommunicationChannel => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'whatsapp' || normalized === 'phone' || normalized === 'internal') return normalized;
  return 'other';
};

export async function fetchLeadCommunications(leadId: string, maxRows = 50): Promise<LeadCommunicationRecord[]> {
  const cleanLeadId = leadId.trim();
  if (!cleanLeadId) return [];
  const safeLimit = Math.min(Math.max(Math.round(maxRows), 1), 100);
  const snapshot = await getDocs(
    query(
      collection(db, 'leads', cleanLeadId, 'communications'),
      orderBy('createdAt', 'desc'),
      limit(safeLimit),
    ),
  );
  return snapshot.docs.map((item) => {
    const data = item.data() as Record<string, unknown>;
    const directionRaw = String(data.direction || '').trim().toLowerCase();
    // Historical records without a direction are unknown, not evidence of an internal note.
    const direction = directionRaw === 'inbound' || directionRaw === 'outbound' || directionRaw === 'internal'
      ? directionRaw
      : 'unknown';
    return {
      id: item.id,
      type: normalizeType(data.type),
      channel: normalizeChannel(data.channel),
      direction,
      outcome: normalizeOutcome(data.outcome),
      parentConcern: normalizeConcern(data.parentConcern),
      summary: String(data.summary || '').trim() || 'Communication logged',
      createdAtMs: toMs(data.createdAt),
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
    };
  });
}

export async function addLeadCommunication(input: {
  leadId: string;
  type: LeadCommunicationType;
  channel: LeadCommunicationChannel;
  direction?: LeadCommunicationDirection;
  outcome?: LeadContactOutcome;
  parentConcern?: LeadParentConcern;
  summary: string;
}): Promise<LeadCommunicationRecord> {
  const leadId = input.leadId.trim();
  const summary = input.summary.trim();
  if (!leadId) throw new Error('Lead ID is required.');
  if (!summary) throw new Error('Communication summary is required.');
  // Staff-reported direction, never inferred from opening a WhatsApp link.
  // Notes remain internal; legacy callers without a direction keep outbound semantics.
  const direction: LeadCommunicationDirection = input.type === 'note'
    ? 'internal'
    : input.direction === 'inbound' ? 'inbound' : 'outbound';
  const outcomes = leadContactOutcomeOptions(input.type, direction);
  if (input.outcome && !outcomes.some((option) => option.value === input.outcome)) {
    throw new Error('Contact result does not match the communication type or direction.');
  }
  // A concern is separate from the communication result. In an active
  // conversation it must be supported by a confirmed reply/conversation.
  if (input.parentConcern && !(
    input.type === 'note' ||
    input.outcome === 'spoke_to_parent' ||
    input.outcome === 'parent_replied'
  )) {
    throw new Error('Parent concern requires a conversation or an internal note documenting earlier evidence.');
  }
  const createdAtMs = Date.now();
  const ref = await addDoc(collection(db, 'leads', leadId, 'communications'), {
    type: input.type,
    channel: input.channel,
    direction,
    ...(input.outcome ? { outcome: input.outcome } : {}),
    ...(input.parentConcern ? { parentConcern: input.parentConcern } : {}),
    summary,
    ...(auth?.currentUser?.uid ? { createdBy: auth.currentUser.uid } : {}),
    followUpNeeded: false,
    status: 'logged',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    type: input.type,
    channel: input.channel,
    direction,
    outcome: input.outcome || null,
    parentConcern: input.parentConcern || null,
    summary,
    createdAtMs,
    createdBy: auth?.currentUser?.uid || null,
  };
}
