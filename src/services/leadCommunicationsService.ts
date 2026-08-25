import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export type LeadCommunicationType = 'message' | 'call' | 'follow_up' | 'note';
export type LeadCommunicationChannel = 'whatsapp' | 'phone' | 'internal' | 'other';

export interface LeadCommunicationRecord {
  id: string;
  type: LeadCommunicationType;
  channel: LeadCommunicationChannel;
  direction: 'inbound' | 'outbound' | 'internal';
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
    const direction = directionRaw === 'inbound' || directionRaw === 'outbound' ? directionRaw : 'internal';
    return {
      id: item.id,
      type: normalizeType(data.type),
      channel: normalizeChannel(data.channel),
      direction,
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
  summary: string;
}): Promise<LeadCommunicationRecord> {
  const leadId = input.leadId.trim();
  const summary = input.summary.trim();
  if (!leadId) throw new Error('Lead ID is required.');
  if (!summary) throw new Error('Communication summary is required.');
  const direction = input.type === 'note' ? 'internal' : 'outbound';
  const createdAtMs = Date.now();
  const ref = await addDoc(collection(db, 'leads', leadId, 'communications'), {
    type: input.type,
    channel: input.channel,
    direction,
    summary,
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
    summary,
    createdAtMs,
  };
}
