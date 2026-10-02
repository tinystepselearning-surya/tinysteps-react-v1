import { collection, collectionGroup, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { parentMonthCloseBillingSnapshot, type ParentMonthCloseBillingSnapshot } from './parentMonthClose';

export const AVS_MONTHLY_PARENT_PROGRESS_COLLECTION =
  'attendanceValidationMonthlyParentProgress';
export const AVS_MONTHLY_TRACKER_START_MONTH = '2026-09';

export type AvsMonthlyParentProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export interface AvsMonthlyParentProgress {
  parentId: string;
  monthKey: string;
  status: Exclude<AvsMonthlyParentProgressStatus, 'not_started'>;
  updatedAt: string | null;
  completedAt: string | null;
  billingReviewedAt: string | null;
  billingReviewedBy: string | null;
  billingReviewedFingerprint: string | null;
  invoiceSentAt: string | null;
  invoiceSentBy: string | null;
  sentBillingFingerprint: string | null;
  invoiceSentClassCount: number | null;
  invoiceSentBilledAmount: number | null;
  invoiceSentDueAmount: number | null;
}

function monthPartsInIst(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error('Unable to resolve the current IST month.');
  }
  return { year, month };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function previousCompletedMonthKey(now = new Date()): string {
  const current = monthPartsInIst(now);
  const previous = new Date(Date.UTC(current.year, current.month - 2, 1));
  return monthKey(previous.getUTCFullYear(), previous.getUTCMonth() + 1);
}

export function completedMonthOptions(
  now = new Date(),
  startMonth = AVS_MONTHLY_TRACKER_START_MONTH,
): string[] {
  const endMonth = previousCompletedMonthKey(now);
  if (endMonth < startMonth) return [];
  const [startYear, startMonthNumber] = startMonth.split('-').map(Number);
  const [endYear, endMonthNumber] = endMonth.split('-').map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonthNumber - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonthNumber - 1, 1));
  const result: string[] = [];
  while (cursor <= end) {
    result.push(monthKey(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return result.reverse();
}

export function monthDateRange(value: string): { fromDate: string; toDate: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error('Invalid attendance validation month.');
  }
  const [year, month] = value.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    fromDate: `${value}-01`,
    toDate: `${value}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function formatMonthKey(value: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function timestampIso(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { toDate?: () => Date };
  if (typeof candidate.toDate !== 'function') return null;
  const date = candidate.toDate();
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface AvsMonthlyParentSessionScope extends ParentMonthCloseBillingSnapshot {}

export function avsMonthlyReadModelSessionCount(data: Record<string, unknown>): number {
  return parentMonthCloseBillingSnapshot(data).sessionCount;
}

export function avsMonthlyReadModelHasSessions(data: Record<string, unknown>): boolean {
  return avsMonthlyReadModelSessionCount(data) > 0;
}

export async function loadAvsMonthlyParentsWithSessions(
  selectedMonth: string,
): Promise<AvsMonthlyParentSessionScope[]> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
    throw new Error('Invalid attendance validation month.');
  }
  const snapshot = await getDocs(query(
    collectionGroup(db, 'months'),
    where('monthKey', '==', selectedMonth),
    limit(2001),
  ));
  if (snapshot.docs.length > 2000) {
    throw new Error('Monthly parent read-model scope exceeds the 2,000-record safety bound.');
  }
  const rowsByParentId = new Map<string, AvsMonthlyParentSessionScope>();
  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    const row = parentMonthCloseBillingSnapshot(data);
    if (!row.parentId || row.sessionCount <= 0) return;
    const existing = rowsByParentId.get(row.parentId);
    if (!existing || row.sessionCount >= existing.sessionCount) {
      rowsByParentId.set(row.parentId, row);
    }
  });
  return Array.from(rowsByParentId.values());
}


function parseProgressData(
  data: Record<string, unknown>,
  parentId: string,
  selectedMonth: string,
): AvsMonthlyParentProgress | null {
  const status = data.status;
  if (status !== 'in_progress' && status !== 'completed') return null;
  const numberOrNull = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const stringOrNull = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  return {
    parentId,
    monthKey: selectedMonth,
    status,
    updatedAt: timestampIso(data.updatedAt),
    completedAt: timestampIso(data.completedAt),
    billingReviewedAt: timestampIso(data.billingReviewedAt),
    billingReviewedBy: stringOrNull(data.billingReviewedByEmail ?? data.billingReviewedByUid),
    billingReviewedFingerprint: stringOrNull(data.billingReviewedFingerprint),
    invoiceSentAt: timestampIso(data.invoiceSentAt),
    invoiceSentBy: stringOrNull(data.invoiceSentByEmail ?? data.invoiceSentByUid),
    sentBillingFingerprint: stringOrNull(data.sentBillingFingerprint),
    invoiceSentClassCount: numberOrNull(data.invoiceSentClassCount),
    invoiceSentBilledAmount: numberOrNull(data.invoiceSentBilledAmount),
    invoiceSentDueAmount: numberOrNull(data.invoiceSentDueAmount),
  };
}

export async function loadAvsMonthlyParentProgressForParent(
  parentId: string,
  selectedMonth: string,
): Promise<AvsMonthlyParentProgress | null> {
  const normalizedParentId = String(parentId || '').trim();
  if (!normalizedParentId || normalizedParentId.includes('/')) {
    throw new Error('Invalid attendance validation parent.');
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
    throw new Error('Invalid attendance validation month.');
  }
  const snapshot = await getDoc(doc(
    db,
    AVS_MONTHLY_PARENT_PROGRESS_COLLECTION,
    `${selectedMonth}__${normalizedParentId}`,
  ));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Record<string, unknown>;
  return parseProgressData(data, normalizedParentId, selectedMonth);
}


export async function loadParentMonthCloseBillingForParent(
  parentId: string,
  selectedMonth: string,
): Promise<ParentMonthCloseBillingSnapshot | null> {
  const normalizedParentId = String(parentId || '').trim();
  if (!normalizedParentId || normalizedParentId.includes('/')) {
    throw new Error('Invalid parent month close parent.');
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
    throw new Error('Invalid parent month close month.');
  }
  const snapshot = await getDoc(doc(
    db,
    'parentMonthlyReadModels',
    normalizedParentId,
    'months',
    selectedMonth,
  ));
  if (!snapshot.exists()) return null;
  return parentMonthCloseBillingSnapshot(
    snapshot.data() as Record<string, unknown>,
    normalizedParentId,
    selectedMonth,
  );
}

export async function loadAvsMonthlyParentProgress(
  selectedMonth: string,
): Promise<AvsMonthlyParentProgress[]> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
    throw new Error('Invalid attendance validation month.');
  }
  const snapshot = await getDocs(query(
    collection(db, AVS_MONTHLY_PARENT_PROGRESS_COLLECTION),
    where('monthKey', '==', selectedMonth),
    limit(2001),
  ));
  if (snapshot.docs.length > 2000) {
    throw new Error('Monthly validation tracker exceeds the 2,000-record safety bound.');
  }
  return snapshot.docs.flatMap((docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    const parentId = typeof data.parentId === 'string' ? data.parentId.trim() : '';
    if (!parentId) return [];
    const parsed = parseProgressData(data, parentId, selectedMonth);
    return parsed ? [parsed] : [];
  });
}
