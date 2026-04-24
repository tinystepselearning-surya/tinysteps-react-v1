import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

type RawThreadData = {
  kidId?: unknown;
  kidName?: unknown;
  studentName?: unknown;
  childName?: unknown;
  participantIds?: unknown;
  participantNames?: unknown;
  participantRoles?: unknown;
  parentIds?: unknown;
  parentNames?: unknown;
  teacherId?: unknown;
  teacherIds?: unknown;
  teacherNames?: unknown;
  learningPartnerIds?: unknown;
  learningPartnerNames?: unknown;
  lastMessagePreview?: unknown;
  lastMessageAt?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
  unreadCounts?: unknown;
  adminVisible?: unknown;
  status?: unknown;
};

export interface MessageThread {
  id: string;
  kidId: string;
  kidName: string;
  studentName: string;
  childName: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  parentIds: string[];
  parentNames: string[];
  teacherId: string;
  teacherIds: string[];
  teacherNames: string[];
  learningPartnerIds: string[];
  learningPartnerNames: string[];
  lastMessagePreview: string;
  unreadCounts: Record<string, number>;
  adminVisible: boolean;
  status: string;
  lastMessageAtMs: number | null;
  updatedAtMs: number | null;
  createdAtMs: number | null;
}

interface UseMessageThreadsArgs {
  userId?: string;
  isAdmin: boolean;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const asStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  value.forEach((item) => {
    const normalized = asString(item);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });
  return out;
};

const asTimestampMs = (value: unknown): number | null => {
  if (value && typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return null;
    }
  }
  return null;
};

const asStringMap = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const normalizedKey = asString(key);
    const normalizedValue = asString(raw);
    if (!normalizedKey || !normalizedValue) return;
    out[normalizedKey] = normalizedValue;
  });
  return out;
};

const asNumberMap = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, number> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const normalizedKey = asString(key);
    if (!normalizedKey) return;
    const nextValue = Number(raw);
    out[normalizedKey] = Number.isFinite(nextValue) ? nextValue : 0;
  });
  return out;
};

const resolveStudentTitle = (raw: RawThreadData): string =>
  asString(raw.kidName) ||
  asString(raw.studentName) ||
  asString(raw.childName) ||
  'Student conversation';

const sortByMostRecent = (threads: MessageThread[]) =>
  [...threads].sort((a, b) => {
    const aMs = a.updatedAtMs ?? a.lastMessageAtMs ?? a.createdAtMs ?? 0;
    const bMs = b.updatedAtMs ?? b.lastMessageAtMs ?? b.createdAtMs ?? 0;
    return bMs - aMs;
  });

export function useMessageThreads({ userId, isAdmin }: UseMessageThreadsArgs) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setThreads([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const baseRef = collection(db, 'messageThreads');
    const constraints: QueryConstraint[] = isAdmin
      ? [where('adminVisible', '==', true), orderBy('updatedAt', 'desc'), limit(100)]
      : [where('participantIds', 'array-contains', userId), orderBy('updatedAt', 'desc'), limit(100)];

    const threadsQuery = query(baseRef, ...constraints);

    const unsubscribe = onSnapshot(
      threadsQuery,
      (snapshot) => {
        const nextThreads = snapshot.docs.map((docSnap) => {
          const raw = (docSnap.data() || {}) as RawThreadData;
          return {
            id: docSnap.id,
            kidId: asString(raw.kidId),
            kidName: resolveStudentTitle(raw),
            studentName: asString(raw.studentName),
            childName: asString(raw.childName),
            participantIds: asStringList(raw.participantIds),
            participantNames: asStringMap(raw.participantNames),
            participantRoles: asStringMap(raw.participantRoles),
            parentIds: asStringList(raw.parentIds),
            parentNames: asStringList(raw.parentNames),
            teacherId: asString(raw.teacherId),
            teacherIds: asStringList(raw.teacherIds),
            teacherNames: asStringList(raw.teacherNames),
            learningPartnerIds: asStringList(raw.learningPartnerIds),
            learningPartnerNames: asStringList(raw.learningPartnerNames),
            lastMessagePreview: asString(raw.lastMessagePreview),
            unreadCounts: asNumberMap(raw.unreadCounts),
            adminVisible: raw.adminVisible === true,
            status: asString(raw.status) || 'active',
            lastMessageAtMs: asTimestampMs(raw.lastMessageAt),
            updatedAtMs: asTimestampMs(raw.updatedAt),
            createdAtMs: asTimestampMs(raw.createdAt),
          } as MessageThread;
        });
        setThreads(sortByMostRecent(nextThreads));
        setIsLoading(false);
      },
      (nextError) => {
        setError(nextError.message || 'Failed to load conversations');
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isAdmin, userId]);

  return { threads, isLoading, error };
}

export default useMessageThreads;
