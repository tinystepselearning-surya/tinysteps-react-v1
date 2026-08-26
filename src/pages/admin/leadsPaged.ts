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
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
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
  dateFromMs?: number;
  dateToMs?: number;
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

const isWithinDateRange = (
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
  dateFromMs: number,
  dateToMs: number,
): boolean => {
  const createdAtMs = timestampToMillis(docSnapshot.data().createdAt);
  if (!createdAtMs) return false;
  if (dateFromMs && createdAtMs < dateFromMs) return false;
  if (dateToMs && createdAtMs > dateToMs) return false;
  return true;
};

const buildCreatedAtConstraints = (
  dateFromMs: number,
  dateToMs: number,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
  batchSize?: number,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];
  if (dateFromMs) constraints.push(where('createdAt', '>=', Timestamp.fromMillis(dateFromMs)));
  if (dateToMs) constraints.push(where('createdAt', '<=', Timestamp.fromMillis(dateToMs)));
  constraints.push(orderBy('createdAt', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  if (batchSize) constraints.push(limit(batchSize));
  return constraints;
};

interface PageState {
  key: string;
  index: number;
}

export function usePagedLeads<T extends PagedLeadRecord>({
  bucket,
  pageSize,
  dateFromMs = 0,
  dateToMs = 0,
  onError,
  onNewWebsiteLeads,
}: UsePagedLeadsOptions<T>) {
  const hasDateFilter = Boolean(dateFromMs || dateToMs);
  const invalidDateRange = Boolean(dateFromMs && dateToMs && dateFromMs > dateToMs);
  const optionKey = `${bucket}:${pageSize}:${dateFromMs || 0}:${dateToMs || 0}`;
  const [pageState, setPageState] = useState<PageState>({ key: optionKey, index: 0 });
  const effectivePageIndex = pageState.key === optionKey ? pageState.index : 0;
  const [leads, setLeads] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bucketCounts, setBucketCounts] = useState<LeadBucketCounts>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null);
  const [filteredHasNext, setFilteredHasNext] = useState(false);
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
    setFilteredTotal(null);
    setFilteredHasNext(false);
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
      setFilteredHasNext(false);
      setIsLoading(false);
      onErrorRef.current(error as Error);
    };

    const load = async () => {
      setIsLoading(true);
      setFilteredHasNext(false);
      if (invalidDateRange) {
        setFilteredTotal(0);
        publish([]);
        return;
      }

      try {
        const statuses = [...LEAD_STATUSES_BY_BUCKET[bucket]];

        if (pageSize === 'all') {
          if (hasDateFilter) {
            const snapshot = await getDocs(
              query(
                collection(db, LEADS_COLLECTION),
                ...buildCreatedAtConstraints(dateFromMs, dateToMs, null),
              ),
            );
            const matching = snapshot.docs.filter((docSnapshot) =>
              leadStatusBelongsToBucket(docSnapshot.data().status, bucket));
            setFilteredTotal(matching.length);
            publish(matching);
          } else {
            const snapshot = await getDocs(
              query(collection(db, LEADS_COLLECTION), where('status', 'in', statuses)),
            );
            setFilteredTotal(null);
            publish([...snapshot.docs].sort(sortLeadDocsByCreatedAtDesc));
          }
          return;
        }

        // With Teacher / Admin Review / Closed are normally small operational queues.
        // For <=100 rows, fetch the exact status-filtered queue once and paginate the
        // cached result locally. Date filtering then happens inside that small cache, so
        // no composite status + createdAt Firestore index is required.
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
            const matching = hasDateFilter
              ? cached.filter((docSnapshot) => isWithinDateRange(docSnapshot, dateFromMs, dateToMs))
              : cached;
            const start = effectivePageIndex * pageSize;
            setFilteredTotal(hasDateFilter ? matching.length : null);
            setFilteredHasNext(start + pageSize < matching.length);
            publish(matching.slice(start, start + pageSize));
            return;
          }
        }

        // Open can be large. Walk the built-in createdAt index from newest to oldest,
        // applying the requested month/custom-date bounds at the query itself. We do not
        // add a status predicate here because status + createdAt would require a new
        // composite index; bucket membership is checked only for the small bounded scan.
        let cursor = pageStartCursorsRef.current[effectivePageIndex] || null;
        const matchingDocs: QueryDocumentSnapshot<DocumentData>[] = [];
        let reachedEnd = false;
        let pageBoundaryCursor: QueryDocumentSnapshot<DocumentData> | null = null;
        const targetMatches = pageSize + (hasDateFilter ? 1 : 0);

        while (matchingDocs.length < targetMatches && !reachedEnd) {
          const remaining = targetMatches - matchingDocs.length;
          const batchSize = Math.min(100, Math.max(remaining, Math.min(5, pageSize)));
          const snapshot = await getDocs(
            query(
              collection(db, LEADS_COLLECTION),
              ...buildCreatedAtConstraints(dateFromMs, dateToMs, cursor, batchSize),
            ),
          );
          if (snapshot.empty) {
            reachedEnd = true;
            break;
          }

          for (const docSnapshot of snapshot.docs) {
            cursor = docSnapshot;
            if (!leadStatusBelongsToBucket(docSnapshot.data().status, bucket)) continue;
            matchingDocs.push(docSnapshot);
            if (matchingDocs.length === pageSize) pageBoundaryCursor = docSnapshot;
            if (matchingDocs.length === targetMatches) break;
          }

          if (snapshot.docs.length < batchSize) reachedEnd = true;
        }

        const pageDocs = matchingDocs.slice(0, pageSize);
        const hasFilteredNextPage = hasDateFilter
          ? matchingDocs.length > pageSize
          : false;
        setFilteredHasNext(hasFilteredNextPage);

        if (pageDocs.length === pageSize && pageBoundaryCursor) {
          pageStartCursorsRef.current[effectivePageIndex + 1] = pageBoundaryCursor;
        } else {
          pageStartCursorsRef.current.splice(effectivePageIndex + 1);
        }

        if (hasDateFilter) {
          if (!hasFilteredNextPage && reachedEnd) {
            setFilteredTotal(effectivePageIndex * pageSize + pageDocs.length);
          } else {
            setFilteredTotal(null);
          }
        } else {
          setFilteredTotal(null);
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
  }, [
    bucket,
    dateFromMs,
    dateToMs,
    effectivePageIndex,
    hasDateFilter,
    invalidDateRange,
    optionKey,
    pageSize,
    pageState.key,
    reloadVersion,
  ]);

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
        const rangeIncludesNow =
          (!dateFromMs || now >= dateFromMs) && (!dateToMs || now <= dateToMs);
        if (bucket === 'open' && effectivePageIndex === 0 && rangeIncludesNow) {
          pageStartCursorsRef.current = [null];
          setReloadVersion((current) => current + 1);
        }
      },
      (error) => onErrorRef.current(error as Error),
    );
  }, [bucket, dateFromMs, dateToMs, effectivePageIndex, refreshCounts]);

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
    : hasDateFilter
      ? filteredTotal === null
        ? null
        : Math.max(1, Math.ceil(filteredTotal / pageSize))
      : Math.max(1, Math.ceil(currentTotal / pageSize));
  const hasPrevious = pageSize !== 'all' && effectivePageIndex > 0;
  const hasNext = pageSize !== 'all' && leads.length > 0 && (
    hasDateFilter
      ? filteredHasNext
      : pageNumber < (totalPages || 1)
  );

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
    filteredTotal,
    dateFilterActive: hasDateFilter,
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
    filteredTotal,
    hasDateFilter,
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
