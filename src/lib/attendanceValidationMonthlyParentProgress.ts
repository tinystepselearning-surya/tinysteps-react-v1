import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

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
    const status = data.status;
    if (status !== 'in_progress' && status !== 'completed') return [];
    const parentId = typeof data.parentId === 'string' ? data.parentId.trim() : '';
    if (!parentId) return [];
    return [{
      parentId,
      monthKey: selectedMonth,
      status,
      updatedAt: timestampIso(data.updatedAt),
      completedAt: timestampIso(data.completedAt),
    }];
  });
}
