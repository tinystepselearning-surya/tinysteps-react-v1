import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import type { SimpleLeadBucket } from './leadsWorkflowBuckets';

const LEADS_COLLECTION = 'leads';
const SMALL_BUCKET_CACHE_LIMIT = 100;
const NEW_LEAD_WATCH_SIZE = 5;
const RECENT_NOTIFICATION_WINDOW_MS = 2 * 60 * 1000;

export type LeadPageSize = 10 | 25 | 50 | 100 | 'all';
export const LEAD_PAGE_SIZE_OPTIONS: readonly Exclude<LeadPageSize, 'all'>[] = [10, 25, 50, 100];

export const LEAD_STATUSES_BY_BUCKET: Record<SimpleLeadBucket, readonly string[]> = {
  open: ['new', 'attempted_contact', 'contacted', 'qualified', 'demo_pending_schedule'],
  in_progress: ['demo_booked'],
  admin_review: ['demo_completed', 'admission_follow_up'],
  closed: ['admitted_confirmed', 'not_interested', 'wrong_fit', 'no_response', 'lost'],
};

export interface PagedLeadRecord {
  id: string;
  status?: unknown;
  source?: unknown;
  createdAt?: unknown;
  parentName?: unknown;
  childName?: unknown;
  programInterest?: unknown;
  interestTrack?: unknown;
  mainConcern?: unknown;
}

export interface UsePagedLeadsOptions<T extends PagedLeadRecord> {
  bucket: SimpleLeadBucket;
  pageSize: LeadPageSize;
  onError: (error: Error) => void;
  onNewWebsiteLeads: (leads: T[]) => void;
}

export type LeadBucketCounts = Record<SimpleLeadBucket, number>;

const EMPTY_COUNTS: LeadBucketCounts = {
  open: 0,
  in_progress: 0,
  admin_review: 0,
  closed: 0,
};

const normalizeText = (value: unknown): string => String(value || '').trim().toLowerCase();

const timestampToMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const candidate = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof candidate.toMillis === 'function') return candidate.toMillis();
  if (typeof candidate.seconds === 'number') {
    return candidate.seconds * 1000 + Math.floor((candidate.nanoseconds || 0) / 1_000_000);
  }
  return 0;
};

const toLeadRecord = <T extends PagedLeadRecord>(
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
): T => ({
  id: docSnapshot.id,
  ...(docSnapshot.data() as Record<string, unknown>),
}) as T;

export const leadStatusBelongsToBucket = (status: unknown, bucket: SimpleLeadBucket): boolean =>
  LEAD_STATUSES_BY_BUCKET[bucket].includes(normalizeText(status));

const sortLeadDocsByCreatedAtDesc = (
  left: QueryDocumentSnapshot<DocumentData>,
  right: QueryDocumentSnapshot<DocumentData>,
): number => {
  const timeDiff = timestampToMillis(right.data().createdAt) - timestampToMillis(left.data().createdAt);
  if (timeDiff !== 0) return timeDiff;
  return right.id.localeCompare(left.id);
};

const getBucketCount = async (bucket: SimpleLeadBucket): Promise<number> => {
  const snapshot = await getCountFromServer(
    query(
      collection(db, LEADS_COLLECTION),
      where('status', 'in', [...LEAD_STATUSES_BY_BUCKET[bucket]]),
    ),
  );
  return Number(snapshot.data().count || 0);
};

interface PageState {
  key: string;
  index: number;
}

export function usePagedLeads<T extends PagedLeadRecord>({
  bucket,
  pageSize,
  onError,
  onNewWebsiteLeads,
}: UsePagedLeadsOptions<T>) {
  const optionKey = `${bucket}:${pageSize}`;
  const [pageState, setPageState] = useState<PageState>({ key: optionKey, index: 0 });
  const effectivePageIndex = pageState.key === optionKey ? pageState.index : 0;
  const [leads, setLeads] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bucketCounts, setBucketCounts] = useState<LeadBucketCounts>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);
  const [reloadVersion, setReloadVersion] = useState(0);
  const onErrorRef = useRef(onError);
  const onNewWebsiteLeadsRef = useRef(onNewWebsiteLeads);
  const requestIdRef = useRef(0);
  const pageStartCursorsRef = useRef<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]);
  const smallBucketCacheRef = useRef(new Map<SimpleLeadBucket, QueryDocumentSnapshot<DocumentData>[]>());

  onErrorRef.current = onError;
  onNewWebsiteLeadsRef.current = onNewWebsiteLeads;

  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const [open, inProgress, adminReview, closed] = await Promise.all([
        getBucketCount('open'),
        getBucketCount('in_progress'),
        getBucketCount('admin_review'),
        getBucketCount('closed'),
      ]);
      setBucketCounts({ open, in_progress: inProgress, admin_review: adminReview, closed });
    } catch (error) {
      console.error('[usePagedLeads] bucket count refresh failed', error);
      onErrorRef.current(error as Error);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (pageState.key === optionKey) return;
    pageStartCursorsRef.current = [null];
    setPageState({ key: optionKey, index: 0 });
  }, [optionKey, pageState.key]);

  useEffect(() => {
    if (pageState.key !== optionKey) return;
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const publish = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setLeads(docs.map((docSnapshot) => toLeadRecord<T>(docSnapshot)));
      setIsLoading(false);
    };

    const fail = (error: unknown) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setLeads([]);
      setIsLoading(false);
      onErrorRef.current(error as Error);
    };

    const load = async () => {
      setIsLoading(true);
      try {
        const statuses = [...LEAD_STATUSES_BY_BUCKET[bucket]];

        if (pageSize === 'all') {
          const snapshot = await getDocs(
            query(collection(db, LEADS_COLLECTION), where('status', 'in', statuses)),
          );
          publish([...snapshot.docs].sort(sortLeadDocsByCreatedAtDesc));
          return;
        }

        // With Teacher / Admin Review / Closed are normally small operational queues.
        // For <=100 rows, fetch the exact status-filtered queue once and paginate the
        // cached result locally. This avoids scanning the much larger Open population.
        if (bucket !== 'open') {
          let cached = smallBucketCacheRef.current.get(bucket);
          if (!cached) {
            const count = await getBucketCount(bucket);
            if (count <= SMALL_BUCKET_CACHE_LIMIT) {
              const snapshot = await getDocs(
                query(collection(db, LEADS_COLLECTION), where('status', 'in', statuses)),
              );
              cached = [...snapshot.docs].sort(sortLeadDocsByCreatedAtDesc);
              smallBucketCacheRef.current.set(bucket, cached);
            }
          }
          if (cached) {
            const start = effectivePageIndex * pageSize;
            publish(cached.slice(start, start + pageSize));
            return;
          }
        }

        // Open can be large. Do not download every Open lead and slice in React.
        // Instead walk the built-in createdAt index from newest to oldest, keeping only
        // this bucket's canonical lead statuses until the requested page is full.
        let cursor = pageStartCursorsRef.current[effectivePageIndex] || null;
        const pageDocs: QueryDocumentSnapshot<DocumentData>[] = [];
        let reachedEnd = false;

        while (pageDocs.length < pageSize && !reachedEnd) {
          const remaining = pageSize - pageDocs.length;
          // A tiny amount of over-fetch keeps latency reasonable when a non-Open record is
          // interleaved with Open records, while remaining tightly bounded.
          const batchSize = Math.min(100, Math.max(remaining, Math.min(5, pageSize)));
          const pageQuery = cursor
            ? query(
                collection(db, LEADS_COLLECTION),
                orderBy('createdAt', 'desc'),
                startAfter(cursor),
                limit(batchSize),
              )
            : query(
                collection(db, LEADS_COLLECTION),
                orderBy('createdAt', 'desc'),
                limit(batchSize),
              );
          const snapshot = await getDocs(pageQuery);
          if (snapshot.empty) {
            reachedEnd = true;
            break;
          }

          for (const docSnapshot of snapshot.docs) {
            cursor = docSnapshot;
            if (leadStatusBelongsToBucket(docSnapshot.data().status, bucket)) {
              pageDocs.push(docSnapshot);
              if (pageDocs.length === pageSize) break;
            }
          }

          if (snapshot.docs.length < batchSize) reachedEnd = true;
        }

        if (pageDocs.length === pageSize && cursor) {
          pageStartCursorsRef.current[effectivePageIndex + 1] = cursor;
        } else {
          pageStartCursorsRef.current.splice(effectivePageIndex + 1);
        }
        publish(pageDocs);
      } catch (error) {
        fail(error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [bucket, effectivePageIndex, optionKey, pageSize, pageState.key, reloadVersion]);

  // Preserve new website-enquiry alerts without reopening the former unbounded active
  // leads listener. Only the five newest lead documents stay live.
  useEffect(() => {
    let hasServerBaseline = false;
    return onSnapshot(
      query(
        collection(db, LEADS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(NEW_LEAD_WATCH_SIZE),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        if (!hasServerBaseline) {
          hasServerBaseline = true;
          return;
        }
        const now = Date.now();
        const newWebsiteLeads = snapshot
          .docChanges()
          .filter((change) => {
            if (change.type !== 'added' || change.doc.metadata.hasPendingWrites) return false;
            const data = change.doc.data();
            if (normalizeText(data.source) !== 'website') return false;
            const createdAtMs = timestampToMillis(data.createdAt);
            return createdAtMs > 0 && now - createdAtMs <= RECENT_NOTIFICATION_WINDOW_MS;
          })
          .map((change) => toLeadRecord<T>(change.doc));
        if (newWebsiteLeads.length === 0) return;
        onNewWebsiteLeadsRef.current(newWebsiteLeads);
        smallBucketCacheRef.current.clear();
        void refreshCounts();
        if (bucket === 'open' && effectivePageIndex === 0) {
          pageStartCursorsRef.current = [null];
          setReloadVersion((current) => current + 1);
        }
      },
      (error) => onErrorRef.current(error as Error),
    );
  }, [bucket, effectivePageIndex, refreshCounts]);

  const reloadPage = useCallback((resetToFirst = false) => {
    smallBucketCacheRef.current.delete(bucket);
    if (resetToFirst) {
      pageStartCursorsRef.current = [null];
      if (effectivePageIndex !== 0) {
        setPageState({ key: optionKey, index: 0 });
        return;
      }
    }
    setReloadVersion((current) => current + 1);
  }, [bucket, effectivePageIndex, optionKey]);

  const currentTotal = bucketCounts[bucket];
  const pageNumber = effectivePageIndex + 1;
  const totalPages = pageSize === 'all'
    ? 1
    : Math.max(1, Math.ceil(currentTotal / pageSize));
  const hasPrevious = pageSize !== 'all' && effectivePageIndex > 0;
  const hasNext = pageSize !== 'all' && leads.length > 0 && pageNumber < totalPages;

  const previousPage = useCallback(() => {
    if (pageSize === 'all') return;
    setPageState((current) => {
      if (current.key !== optionKey || current.index <= 0) return current;
      return { ...current, index: current.index - 1 };
    });
  }, [optionKey, pageSize]);

  const nextPage = useCallback(() => {
    if (pageSize === 'all' || !hasNext) return;
    setPageState((current) => {
      if (current.key !== optionKey) return { key: optionKey, index: 0 };
      return { ...current, index: current.index + 1 };
    });
  }, [hasNext, optionKey, pageSize]);

  return useMemo(() => ({
    leads,
    isLoading,
    bucketCounts,
    countsLoading,
    pageNumber,
    totalPages,
    hasPrevious,
    hasNext,
    previousPage,
    nextPage,
    reloadPage,
    refreshCounts,
  }), [
    bucketCounts,
    countsLoading,
    hasNext,
    hasPrevious,
    isLoading,
    leads,
    nextPage,
    pageNumber,
    previousPage,
    refreshCounts,
    reloadPage,
    totalPages,
  ]);
}
