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
export type LeadQueryBucket = SimpleLeadBucket | 'all';
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
  receivedAt?: unknown;
  requestedAt?: unknown;
  createdAt?: unknown;
  parentName?: unknown;
  childName?: unknown;
  programInterest?: unknown;
  interestTrack?: unknown;
  mainConcern?: unknown;
}

export interface UsePagedLeadsOptions<T extends PagedLeadRecord> {
  bucket: LeadQueryBucket;
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
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const candidate = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
    }
    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000 + Math.floor((candidate.nanoseconds || 0) / 1_000_000);
    }
  }
  return 0;
};

/**
 * Universal lead-received timestamp. receivedAt is authoritative; requestedAt and
 * createdAt are compatibility fallbacks only for historical records. Do not replace
 * this first-touch date with a later returning-enquiry timestamp.
 */
export const leadReceivedAtMillis = (lead: Record<string, unknown>): number =>
  timestampToMillis(lead.receivedAt) ||
  timestampToMillis(lead.requestedAt) ||
  timestampToMillis(lead.createdAt);

/** Latest submitted website enquiry; not an edit timestamp or a new unique child. */
export const leadLatestInquiryAtMillis = (lead: Record<string, unknown>): number =>
  timestampToMillis(lead.lastInquiryAt) || leadReceivedAtMillis(lead);

const enquiryIstDay = (ms: number): string => {
  if (!ms) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
  }).formatToParts(new Date(ms));
  const value = (kind: string) => parts.find((item) => item.type === kind)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

/**
 * A different IST calendar date constitutes a new operational enquiry.
 * Do not rewrite receivedAt (first-touch cohort) or infer activity from updatedAt.
 */
export const isReturningWebsiteEnquiryInRange = (
  lead: Record<string, unknown>,
  dateFromMs: number,
  dateToMs: number,
): boolean => {
  if (normalizeText(lead.source) !== 'website' || (!dateFromMs && !dateToMs)) return false;
  const first = leadReceivedAtMillis(lead);
  const latest = timestampToMillis(lead.lastInquiryAt);
  return Boolean(first && latest &&
    enquiryIstDay(first) !== enquiryIstDay(latest) &&
    latest >= first &&
    (!dateFromMs || latest >= dateFromMs) &&
    (!dateToMs || latest <= dateToMs));
};

const enquiryActivityInRange = (
  lead: Record<string, unknown>,
  from: number,
  to: number,
): number => isReturningWebsiteEnquiryInRange(lead, from, to)
  ? leadLatestInquiryAtMillis(lead) : leadReceivedAtMillis(lead);

const leadReceivedAtValue = (lead: Record<string, unknown>): unknown => {
  if (timestampToMillis(lead.receivedAt)) return lead.receivedAt;
  if (timestampToMillis(lead.requestedAt)) return lead.requestedAt;
  return lead.createdAt;
};

const toLeadRecord = <T extends PagedLeadRecord>(
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
): T => {
  const data = docSnapshot.data() as Record<string, unknown>;
  const receivedValue = leadReceivedAtValue(data);
  return {
    id: docSnapshot.id,
    ...data,
    // LeadsInquiriesWorkspaceV2 calls this visible value createdAt. Alias only in
    // memory so the row displays the same canonical receipt anchor as Analytics.
    createdAt: receivedValue,
  } as T;
};

export const leadStatusBelongsToBucket = (status: unknown, bucket: SimpleLeadBucket): boolean =>
  LEAD_STATUSES_BY_BUCKET[bucket].includes(normalizeText(status));

const sortLeadDocsByReceivedAtDesc = (
  left: QueryDocumentSnapshot<DocumentData>,
  right: QueryDocumentSnapshot<DocumentData>,
): number => {
  const timeDiff = leadReceivedAtMillis(right.data()) - leadReceivedAtMillis(left.data());
  if (timeDiff !== 0) return timeDiff;
  return right.id.localeCompare(left.id);
};

const buildCreatedAtConstraints = (
  cursor: QueryDocumentSnapshot<DocumentData> | null,
  batchSize?: number,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (cursor) constraints.push(startAfter(cursor));
  if (batchSize) constraints.push(limit(batchSize));
  return constraints;
};

const buildReceiptRangeConstraints = (
  field: 'receivedAt' | 'requestedAt' | 'createdAt' | 'lastInquiryAt',
  dateFromMs: number,
  dateToMs: number,
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];
  if (dateFromMs) constraints.push(where(field, '>=', Timestamp.fromMillis(dateFromMs)));
  if (dateToMs) constraints.push(where(field, '<=', Timestamp.fromMillis(dateToMs)));
  constraints.push(orderBy(field, 'desc'));
  return constraints;
};

const isWithinReceivedDateRange = (
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
  dateFromMs: number,
  dateToMs: number,
): boolean => {
  const lead = docSnapshot.data();
  const receivedAtMs = leadReceivedAtMillis(lead);
  const originalInRange = receivedAtMs > 0 &&
    (!dateFromMs || receivedAtMs >= dateFromMs) &&
    (!dateToMs || receivedAtMs <= dateToMs);
  return originalInRange || isReturningWebsiteEnquiryInRange(lead, dateFromMs, dateToMs);
};

/**
 * Date-scoped operational read. First-touch receivedAt remains immutable; legacy
 * requestedAt/createdAt lanes remain. A fourth indexed lastInquiryAt lane makes
 * returning website parents visible on the day of their newest submission.
 * Rows stay unique by canonical lead ID, including repeated same-day submits.
 */
const getReceivedDateRangeDocs = async (
  dateFromMs: number,
  dateToMs: number,
): Promise<QueryDocumentSnapshot<DocumentData>[]> => {
  const [receivedSnapshot, requestedSnapshot, createdSnapshot, returningSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, LEADS_COLLECTION),
      ...buildReceiptRangeConstraints('receivedAt', dateFromMs, dateToMs),
    )),
    getDocs(query(
      collection(db, LEADS_COLLECTION),
      ...buildReceiptRangeConstraints('requestedAt', dateFromMs, dateToMs),
    )),
    getDocs(query(
      collection(db, LEADS_COLLECTION),
      ...buildReceiptRangeConstraints('createdAt', dateFromMs, dateToMs),
    )),
    getDocs(query(
      collection(db, LEADS_COLLECTION),
      ...buildReceiptRangeConstraints('lastInquiryAt', dateFromMs, dateToMs),
    )),
  ]);

  const docsById = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  receivedSnapshot.docs.forEach((docSnapshot) => docsById.set(docSnapshot.id, docSnapshot));
  requestedSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (!timestampToMillis(data.receivedAt)) docsById.set(docSnapshot.id, docSnapshot);
  });
  createdSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (!timestampToMillis(data.receivedAt) && !timestampToMillis(data.requestedAt)) {
      docsById.set(docSnapshot.id, docSnapshot);
    }
  });
  returningSnapshot.docs.forEach((docSnapshot) => {
    if (isReturningWebsiteEnquiryInRange(docSnapshot.data(), dateFromMs, dateToMs)) {
      docsById.set(docSnapshot.id, docSnapshot);
    }
  });

  return Array.from(docsById.values())
    .filter((docSnapshot) => isWithinReceivedDateRange(docSnapshot, dateFromMs, dateToMs))
    .sort((left, right) =>
      enquiryActivityInRange(right.data(), dateFromMs, dateToMs) -
      enquiryActivityInRange(left.data(), dateFromMs, dateToMs) ||
      right.id.localeCompare(left.id));
};

const getBucketDocs = async (bucket: SimpleLeadBucket): Promise<QueryDocumentSnapshot<DocumentData>[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, LEADS_COLLECTION),
      where('status', 'in', [...LEAD_STATUSES_BY_BUCKET[bucket]]),
    ),
  );
  return snapshot.docs;
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

const countDocsByBucket = (docs: QueryDocumentSnapshot<DocumentData>[]): LeadBucketCounts => {
  const counts: LeadBucketCounts = { ...EMPTY_COUNTS };
  for (const docSnapshot of docs) {
    const status = docSnapshot.data().status;
    if (leadStatusBelongsToBucket(status, 'open')) counts.open += 1;
    else if (leadStatusBelongsToBucket(status, 'in_progress')) counts.in_progress += 1;
    else if (leadStatusBelongsToBucket(status, 'admin_review')) counts.admin_review += 1;
    else if (leadStatusBelongsToBucket(status, 'closed')) counts.closed += 1;
  }
  return counts;
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
  // Only an already-loaded, complete all-bucket range can be safely updated
  // in memory. Cursor pages and in-flight requests retain the server refresh.
  const completeRangeKeyRef = useRef<string | null>(null);
  const pageStartCursorsRef = useRef<Array<QueryDocumentSnapshot<DocumentData> | null>>([null]);
  const smallBucketCacheRef = useRef(new Map<SimpleLeadBucket, QueryDocumentSnapshot<DocumentData>[]>());
  const receivedRangeCacheRef = useRef<{
    key: string;
    promise: Promise<QueryDocumentSnapshot<DocumentData>[]>;
  } | null>(null);

  onErrorRef.current = onError;
  onNewWebsiteLeadsRef.current = onNewWebsiteLeads;

  const loadReceivedRangeDocs = useCallback(() => {
    const key = `${dateFromMs || 0}:${dateToMs || 0}:${reloadVersion}`;
    if (receivedRangeCacheRef.current?.key === key) return receivedRangeCacheRef.current.promise;
    const promise = getReceivedDateRangeDocs(dateFromMs, dateToMs);
    receivedRangeCacheRef.current = { key, promise };
    return promise;
  }, [dateFromMs, dateToMs, reloadVersion]);

  // The operational workspace already has every lead in the selected range:
  // bucket='all', pageSize='all'. Server-authoritative listener changes can
  // update those exact records without rerunning four overlapping date queries.
  // Preserve the first-touch and returning enquiry filters, and never use this
  // shortcut for a cursor page or a loading/changed range.
  const applyLiveLeadDocs = useCallback((
    changedDocs: QueryDocumentSnapshot<DocumentData>[],
  ): boolean => {
    if (bucket !== 'all' || pageSize !== 'all' ||
      completeRangeKeyRef.current !== optionKey) return false;
    if (changedDocs.length === 0) return true;

    setLeads((current) => {
      const byId = new Map(current.map((lead) => [lead.id, lead]));
      changedDocs.forEach((snapshot) => {
        if (hasDateFilter && !isWithinReceivedDateRange(snapshot, dateFromMs, dateToMs)) {
          byId.delete(snapshot.id);
        } else {
          byId.set(snapshot.id, toLeadRecord<T>(snapshot));
        }
      });
      return [...byId.values()].sort((left, right) => {
        const timeDiff = hasDateFilter
          ? enquiryActivityInRange(right, dateFromMs, dateToMs) -
            enquiryActivityInRange(left, dateFromMs, dateToMs)
          : leadReceivedAtMillis(right) - leadReceivedAtMillis(left);
        return timeDiff || right.id.localeCompare(left.id);
      });
    });
    return true;
  }, [bucket, dateFromMs, dateToMs, hasDateFilter, optionKey, pageSize]);

  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      if (invalidDateRange) {
        setBucketCounts({ ...EMPTY_COUNTS });
        return;
      }

      // The range-first Leads workspace asks for bucket='all' and derives distinct
      // workflow counts after demo reconciliation. Skip count reads in both bounded
      // and all-history modes; the workspace never consumes these raw status counts.
      if (bucket === 'all') {
        setBucketCounts({ ...EMPTY_COUNTS });
        return;
      }

      if (hasDateFilter) {
        setBucketCounts(countDocsByBucket(await loadReceivedRangeDocs()));
        return;
      }

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
  }, [bucket, hasDateFilter, invalidDateRange, loadReceivedRangeDocs]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (pageState.key === optionKey) return;
    pageStartCursorsRef.current = [null];
    receivedRangeCacheRef.current = null;
    setFilteredTotal(null);
    setFilteredHasNext(false);
    setPageState({ key: optionKey, index: 0 });
  }, [optionKey, pageState.key]);

  useEffect(() => {
    if (pageState.key !== optionKey) return;
    completeRangeKeyRef.current = null;
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    const publish = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setLeads(docs.map((docSnapshot) => toLeadRecord<T>(docSnapshot)));
      completeRangeKeyRef.current =
        bucket === 'all' && pageSize === 'all' ? optionKey : null;
      setIsLoading(false);
    };

    const fail = (error: unknown) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      completeRangeKeyRef.current = null;
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
        if (hasDateFilter) {
          const rangeDocs = await loadReceivedRangeDocs();
          const matching = bucket === 'all'
            ? rangeDocs
            : rangeDocs.filter((docSnapshot) =>
                leadStatusBelongsToBucket(docSnapshot.data().status, bucket));
          const start = pageSize === 'all' ? 0 : effectivePageIndex * pageSize;
          const pageDocs = pageSize === 'all' ? matching : matching.slice(start, start + pageSize);
          setFilteredTotal(matching.length);
          setFilteredHasNext(pageSize !== 'all' && start + pageSize < matching.length);
          publish(pageDocs);
          return;
        }

        const statuses = bucket === 'all' ? [] : [...LEAD_STATUSES_BY_BUCKET[bucket]];

        if (pageSize === 'all') {
          const docs = bucket === 'all'
            ? (await getDocs(collection(db, LEADS_COLLECTION))).docs
            : await getBucketDocs(bucket);
          setFilteredTotal(null);
          publish([...docs].sort(sortLeadDocsByReceivedAtDesc));
          return;
        }

        // With Teacher / Admin Review / Closed are normally small operational queues.
        // For <=100 rows, fetch the exact status-filtered queue once and paginate locally.
        if (bucket !== 'open' && bucket !== 'all') {
          let cached = smallBucketCacheRef.current.get(bucket);
          if (!cached) {
            const count = await getBucketCount(bucket);
            if (count <= SMALL_BUCKET_CACHE_LIMIT) {
              const snapshot = await getDocs(
                query(collection(db, LEADS_COLLECTION), where('status', 'in', statuses)),
              );
              cached = [...snapshot.docs].sort(sortLeadDocsByReceivedAtDesc);
              smallBucketCacheRef.current.set(bucket, cached);
            }
          }
          if (cached) {
            const start = effectivePageIndex * pageSize;
            setFilteredTotal(null);
            publish(cached.slice(start, start + pageSize));
            return;
          }
        }

        // Open can be large. Preserve the existing bounded createdAt cursor for ordinary
        // unfiltered browsing. Date-filtered views use the canonical received-date path above.
        let cursor = pageStartCursorsRef.current[effectivePageIndex] || null;
        const matchingDocs: QueryDocumentSnapshot<DocumentData>[] = [];
        let reachedEnd = false;
        let pageBoundaryCursor: QueryDocumentSnapshot<DocumentData> | null = null;

        while (matchingDocs.length < pageSize && !reachedEnd) {
          const remaining = pageSize - matchingDocs.length;
          const batchSize = Math.min(100, Math.max(remaining, Math.min(5, pageSize)));
          const snapshot = await getDocs(
            query(
              collection(db, LEADS_COLLECTION),
              ...buildCreatedAtConstraints(cursor, batchSize),
            ),
          );
          if (snapshot.empty) {
            reachedEnd = true;
            break;
          }

          for (const docSnapshot of snapshot.docs) {
            cursor = docSnapshot;
            if (bucket !== 'all' && !leadStatusBelongsToBucket(docSnapshot.data().status, bucket)) continue;
            matchingDocs.push(docSnapshot);
            if (matchingDocs.length === pageSize) {
              pageBoundaryCursor = docSnapshot;
              break;
            }
          }

          if (snapshot.docs.length < batchSize) reachedEnd = true;
        }

        if (matchingDocs.length === pageSize && pageBoundaryCursor) {
          pageStartCursorsRef.current[effectivePageIndex + 1] = pageBoundaryCursor;
        } else {
          pageStartCursorsRef.current.splice(effectivePageIndex + 1);
        }

        setFilteredTotal(null);
        publish(matchingDocs);
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
    effectivePageIndex,
    hasDateFilter,
    invalidDateRange,
    loadReceivedRangeDocs,
    optionKey,
    pageSize,
    pageState.key,
    reloadVersion,
  ]);

  // Preserve new website-enquiry alerts without reopening the former unbounded active
  // leads listener. Notification recency uses the same canonical receipt anchor.
  useEffect(() => {
    let hasServerBaseline = false;
    let observedDemoLinks = new Map<string, string>();
    return onSnapshot(
      query(
        collection(db, LEADS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(NEW_LEAD_WATCH_SIZE),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        // Reuse the existing five-document watch to notice the asynchronous
        // canonical lead -> demo link. Without this, the one-time page query can
        // keep showing "Demo request not linked" after the trigger succeeds.
        const nextDemoLinks = new Map(snapshot.docs.map((document) => [
          document.id,
          normalizeText(document.data().demoSessionId),
        ]));
        if (!hasServerBaseline) {
          hasServerBaseline = true;
          observedDemoLinks = nextDemoLinks;
          return;
        }
        const changes = snapshot.docChanges();
        const changedDemoLinks = changes.filter((change) => {
          if (change.type !== 'modified' || change.doc.metadata.hasPendingWrites) return false;
          const previousLink = observedDemoLinks.get(change.doc.id);
          return previousLink !== undefined &&
            previousLink !== normalizeText(change.doc.data().demoSessionId) &&
            (!hasDateFilter || isWithinReceivedDateRange(change.doc, dateFromMs, dateToMs));
        });
        const demoLinkChangedWithinRange = changedDemoLinks.length > 0;
        observedDemoLinks = nextDemoLinks;

        const now = Date.now();
        const newWebsiteLeads = changes
          .filter((change) => {
            if (change.type !== 'added' || change.doc.metadata.hasPendingWrites) return false;
            const data = change.doc.data();
            if (normalizeText(data.source) !== 'website') return false;
            const receivedAtMs = leadReceivedAtMillis(data);
            return receivedAtMs > 0 && now - receivedAtMs <= RECENT_NOTIFICATION_WINDOW_MS;
          })
          .map((change) => toLeadRecord<T>(change.doc));
        if (newWebsiteLeads.length === 0 && !demoLinkChangedWithinRange) return;
        if (newWebsiteLeads.length > 0) onNewWebsiteLeadsRef.current(newWebsiteLeads);
        smallBucketCacheRef.current.clear();
        if (bucket !== 'all') void refreshCounts();
        const rangeIncludesNow =
          (!dateFromMs || now >= dateFromMs) && (!dateToMs || now <= dateToMs);
        if ((bucket === 'open' || bucket === 'all') && effectivePageIndex === 0 &&
          (demoLinkChangedWithinRange || (newWebsiteLeads.length > 0 && rangeIncludesNow))) {
          const changedDocs = [
            ...changedDemoLinks.map((change) => change.doc),
            ...changes.filter((change) => change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              normalizeText(change.doc.data().source) === 'website' &&
              now - leadReceivedAtMillis(change.doc.data()) <= RECENT_NOTIFICATION_WINDOW_MS &&
              now >= leadReceivedAtMillis(change.doc.data()))
              .map((change) => change.doc),
          ];
          if (!applyLiveLeadDocs(changedDocs)) {
            receivedRangeCacheRef.current = null;
            pageStartCursorsRef.current = [null];
            setReloadVersion((current) => current + 1);
          }
        }
      },
      (error) => onErrorRef.current(error as Error),
    );
  }, [applyLiveLeadDocs, bucket, dateFromMs, dateToMs, effectivePageIndex,
    hasDateFilter, refreshCounts]);

  // A returning parent updates an older canonical lead, not a newly created
  // document. The existing createdAt watcher won't see that row; this additional
  // five-row watch refreshes Today when the server-side merge arrives.
  useEffect(() => {
    if (!hasDateFilter || (bucket !== 'all' && bucket !== 'open') || effectivePageIndex !== 0) return undefined;
    let hasBaseline = false;
    let priorInquiryTimes = new Map<string, number>();
    return onSnapshot(
      query(collection(db, LEADS_COLLECTION), orderBy('lastInquiryAt', 'desc'), limit(NEW_LEAD_WATCH_SIZE)),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) return;
        const nextTimes = new Map(snapshot.docs.map((document) =>
          [document.id, leadLatestInquiryAtMillis(document.data())]));
        if (!hasBaseline) {
          hasBaseline = true;
          priorInquiryTimes = nextTimes;
          return;
        }
        const now = Date.now();
        const freshReturningDocs = snapshot.docChanges()
          .filter((change) => {
            if (change.type === 'removed' || change.doc.metadata.hasPendingWrites) return false;
            const data = change.doc.data();
            const latest = leadLatestInquiryAtMillis(data);
            return isReturningWebsiteEnquiryInRange(data, dateFromMs, dateToMs) &&
              priorInquiryTimes.get(change.doc.id) !== latest &&
              latest > 0 && now - latest >= 0 &&
              now - latest <= RECENT_NOTIFICATION_WINDOW_MS;
          })
          .map((change) => change.doc);
        priorInquiryTimes = nextTimes;
        if (freshReturningDocs.length === 0) return;
        if (!applyLiveLeadDocs(freshReturningDocs)) {
          receivedRangeCacheRef.current = null;
          setReloadVersion((current) => current + 1);
        }
      },
      (error) => onErrorRef.current(error as Error),
    );
  }, [applyLiveLeadDocs, bucket, dateFromMs, dateToMs, effectivePageIndex, hasDateFilter]);

  const reloadPage = useCallback((resetToFirst = false) => {
    if (bucket !== 'all') smallBucketCacheRef.current.delete(bucket);
    receivedRangeCacheRef.current = null;
    if (resetToFirst) {
      pageStartCursorsRef.current = [null];
      if (effectivePageIndex !== 0) {
        setPageState({ key: optionKey, index: 0 });
        return;
      }
    }
    setReloadVersion((current) => current + 1);
  }, [bucket, effectivePageIndex, optionKey]);

  const currentTotal = bucket === 'all' ? leads.length : bucketCounts[bucket];
  const exactFilteredTotal = hasDateFilter && !countsLoading
    ? currentTotal
    : filteredTotal;
  const pageNumber = effectivePageIndex + 1;
  const totalPages = pageSize === 'all'
    ? 1
    : hasDateFilter
      ? exactFilteredTotal === null
        ? null
        : Math.max(1, Math.ceil(exactFilteredTotal / pageSize))
      : Math.max(1, Math.ceil(currentTotal / pageSize));
  const hasPrevious = pageSize !== 'all' && effectivePageIndex > 0;
  const hasNext = pageSize !== 'all' && leads.length > 0 && (
    hasDateFilter
      ? exactFilteredTotal !== null
        ? pageNumber < (totalPages || 1)
        : filteredHasNext
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
    filteredTotal: exactFilteredTotal,
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
    exactFilteredTotal,
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
