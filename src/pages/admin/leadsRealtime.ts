import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  documentId,
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

const LEADS_COLLECTION = 'leads';
const NEW_LEAD_HIGHLIGHT_MS = 10_000;
const NEW_LEAD_NOTIFICATION_BUFFER_MS = 400;
const NOTIFIED_ID_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_NOTIFIED_IDS = 500;

export const ACTIVE_LEAD_STATUSES = [
  'new',
  'attempted_contact',
  'contacted',
  'qualified',
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
] as const;

export const CLOSED_LEAD_STATUSES = [
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
] as const;

export const CLOSED_LEAD_PAGE_SIZE = 100;

export interface RealtimeLeadRecord {
  id: string;
  source?: unknown;
  status?: unknown;
  parentName?: unknown;
  childName?: unknown;
  programInterest?: unknown;
  interestTrack?: unknown;
  mainConcern?: unknown;
}

export type LeadLifecycleStage =
  | 'enquiry'
  | 'demo_active'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted'
  | 'lost';

export interface UseRealtimeLeadsOptions<T extends RealtimeLeadRecord> {
  onError: (error: Error) => void;
  onNewWebsiteLeads: (leads: T[]) => void;
  includeClosed?: boolean;
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toLeadRecord = <T extends RealtimeLeadRecord>(docSnapshot: QueryDocumentSnapshot<DocumentData>): T => ({
  id: docSnapshot.id,
  ...(docSnapshot.data() as Record<string, unknown>),
}) as T;

export function mergeLeadCollections<T extends RealtimeLeadRecord>(active: T[], closed: T[]): T[] {
  const merged = new Map<string, T>();
  active.forEach((lead) => merged.set(lead.id, lead));
  // During a status transition Firestore can briefly deliver the same document through
  // both query streams. Closed/history state wins so a finalized lead never reopens in UI.
  closed.forEach((lead) => merged.set(lead.id, lead));
  return Array.from(merged.values());
}

const pruneNotifiedIds = (notifiedIds: Map<string, number>, now: number) => {
  for (const [id, notifiedAt] of notifiedIds) {
    if (now - notifiedAt > NOTIFIED_ID_TTL_MS) notifiedIds.delete(id);
  }
  while (notifiedIds.size >= MAX_NOTIFIED_IDS) {
    const oldestId = notifiedIds.keys().next().value as string | undefined;
    if (!oldestId) break;
    notifiedIds.delete(oldestId);
  }
};

export function deriveLeadLifecycleStage(
  leadStatusValue: unknown,
  demoStatusValue: unknown,
  conversionStatusValue: unknown,
): LeadLifecycleStage {
  const leadStatus = normalizeText(leadStatusValue).toLowerCase();
  const demoStatus = normalizeText(demoStatusValue).toLowerCase();
  const conversionStatus = normalizeText(conversionStatusValue).toLowerCase();

  if (leadStatus === 'admitted_confirmed' || conversionStatus === 'enrolled') return 'admitted';
  if (
    ['not_interested', 'wrong_fit', 'no_response', 'lost'].includes(leadStatus) ||
    ['not_interested', 'wrong_fit', 'no_response'].includes(conversionStatus)
  ) {
    return 'lost';
  }
  if (
    leadStatus === 'admission_follow_up' ||
    conversionStatus === 'interested' ||
    conversionStatus === 'follow_up_later'
  ) {
    return 'admission_follow_up';
  }
  if (demoStatus === 'open' || demoStatus === 'assigned') return 'demo_active';
  if (demoStatus === 'completed' || demoStatus === 'cancelled') return 'demo_completed';
  return 'enquiry';
}

const formatInterestTrack = (value: unknown): string =>
  normalizeText(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function buildNewWebsiteLeadToastDescription(
  leads: RealtimeLeadRecord[],
  hiddenLeadCount: number,
): string {
  const hiddenSuffix =
    hiddenLeadCount > 0 ? ' It may be hidden by the current filters.' : '';

  if (leads.length !== 1) {
    return `${leads.length} new website assessment requests were added.${hiddenSuffix}`;
  }

  const lead = leads[0];
  const details = [
    normalizeText(lead.parentName) ? `Parent: ${normalizeText(lead.parentName)}` : '',
    normalizeText(lead.childName) ? `Child: ${normalizeText(lead.childName)}` : '',
    normalizeText(lead.programInterest) || formatInterestTrack(lead.interestTrack)
      ? `Programme: ${normalizeText(lead.programInterest) || formatInterestTrack(lead.interestTrack)}`
      : '',
    normalizeText(lead.mainConcern) ? `Support: ${normalizeText(lead.mainConcern)}` : '',
  ].filter(Boolean);

  const safeDetails = details.length > 0 ? details.join(' · ') : 'A new assessment request was added.';
  return `${safeDetails}${hiddenSuffix}`;
}

export function useRealtimeLeads<T extends RealtimeLeadRecord>({
  onError,
  onNewWebsiteLeads,
  includeClosed = false,
}: UseRealtimeLeadsOptions<T>) {
  const [activeLeads, setActiveLeads] = useState<T[]>([]);
  const [closedLiveLeads, setClosedLiveLeads] = useState<T[]>([]);
  const [closedOlderLeads, setClosedOlderLeads] = useState<T[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(false);
  const [closedCount, setClosedCount] = useState(0);
  const [closedHistoryHasMore, setClosedHistoryHasMore] = useState(false);
  const [isLoadingMoreClosed, setIsLoadingMoreClosed] = useState(false);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(() => new Set());
  const onErrorRef = useRef(onError);
  const onNewWebsiteLeadsRef = useRef(onNewWebsiteLeads);
  const notifiedIdsRef = useRef(new Map<string, number>());
  const highlightTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingNotificationsRef = useRef(new Map<string, T>());
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedCursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedOlderClosedRef = useRef(false);

  onErrorRef.current = onError;
  onNewWebsiteLeadsRef.current = onNewWebsiteLeads;

  const refreshClosedCount = useCallback(async () => {
    try {
      const countSnapshot = await getCountFromServer(
        query(
          collection(db, LEADS_COLLECTION),
          where('status', 'in', [...CLOSED_LEAD_STATUSES]),
        ),
      );
      setClosedCount(Number(countSnapshot.data().count || 0));
    } catch (error) {
      // Count is a convenience metric only. Never break the operational workspace if an
      // aggregate query is temporarily unavailable while an index/rule deployment settles.
      console.error('[useRealtimeLeads] closed lead count failed', error);
    }
  }, []);

  useEffect(() => {
    void refreshClosedCount();
  }, [refreshClosedCount]);

  useEffect(() => {
    setActiveLoading(true);
    let hasBootstrappedFromServer = false;
    const unsubscribe = onSnapshot(
      query(
        collection(db, LEADS_COLLECTION),
        where('status', 'in', [...ACTIVE_LEAD_STATUSES]),
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        setActiveLeads(snapshot.docs.map((docSnapshot) => toLeadRecord<T>(docSnapshot)));
        setActiveLoading(false);

        // The first authoritative snapshot establishes the baseline. Cached snapshots
        // and query reinitialisation must never generate historical "new lead" alerts.
        if (snapshot.metadata.fromCache) return;
        if (!hasBootstrappedFromServer) {
          hasBootstrappedFromServer = true;
          return;
        }

        const now = Date.now();
        pruneNotifiedIds(notifiedIdsRef.current, now);
        const newWebsiteLeads = snapshot
          .docChanges()
          .filter(
            (change) =>
              change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              normalizeText(change.doc.data().source).toLowerCase() === 'website' &&
              !notifiedIdsRef.current.has(change.doc.id),
          )
          .map((change) => ({
            id: change.doc.id,
            ...(change.doc.data() as Record<string, unknown>),
          })) as T[];

        if (newWebsiteLeads.length === 0) return;

        for (const lead of newWebsiteLeads) {
          while (notifiedIdsRef.current.size >= MAX_NOTIFIED_IDS) {
            const oldestId = notifiedIdsRef.current.keys().next().value as string | undefined;
            if (!oldestId) break;
            notifiedIdsRef.current.delete(oldestId);
          }
          notifiedIdsRef.current.set(lead.id, now);
        }

        const evictedHighlightIds: string[] = [];
        for (const lead of newWebsiteLeads) {
          const existingTimer = highlightTimersRef.current.get(lead.id);
          if (existingTimer) {
            clearTimeout(existingTimer);
            highlightTimersRef.current.delete(lead.id);
          }
          while (highlightTimersRef.current.size >= MAX_NOTIFIED_IDS) {
            const oldestId = highlightTimersRef.current.keys().next().value as string | undefined;
            if (!oldestId) break;
            const oldestTimer = highlightTimersRef.current.get(oldestId);
            if (oldestTimer) clearTimeout(oldestTimer);
            highlightTimersRef.current.delete(oldestId);
            evictedHighlightIds.push(oldestId);
          }
          const timer = setTimeout(() => {
            highlightTimersRef.current.delete(lead.id);
            setNewLeadIds((current) => {
              if (!current.has(lead.id)) return current;
              const next = new Set(current);
              next.delete(lead.id);
              return next;
            });
          }, NEW_LEAD_HIGHLIGHT_MS);
          highlightTimersRef.current.set(lead.id, timer);
        }
        setNewLeadIds((current) => {
          const next = new Set(current);
          evictedHighlightIds.forEach((id) => next.delete(id));
          newWebsiteLeads.forEach((lead) => {
            if (highlightTimersRef.current.has(lead.id)) next.add(lead.id);
          });
          return next;
        });
        newWebsiteLeads.forEach((lead) => pendingNotificationsRef.current.set(lead.id, lead));
        if (!notificationTimerRef.current) {
          notificationTimerRef.current = setTimeout(() => {
            notificationTimerRef.current = null;
            const pendingLeads = Array.from(pendingNotificationsRef.current.values());
            pendingNotificationsRef.current.clear();
            if (pendingLeads.length > 0) onNewWebsiteLeadsRef.current(pendingLeads);
          }, NEW_LEAD_NOTIFICATION_BUFFER_MS);
        }
      },
      (error) => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
        pendingNotificationsRef.current.clear();
        setActiveLeads([]);
        setActiveLoading(false);
        onErrorRef.current(error as Error);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    setClosedOlderLeads([]);
    setClosedHistoryHasMore(false);
    setIsLoadingMoreClosed(false);
    closedCursorRef.current = null;
    hasLoadedOlderClosedRef.current = false;

    if (!includeClosed) {
      setClosedLiveLeads([]);
      setClosedLoading(false);
      return undefined;
    }

    setClosedLoading(true);
    const closedQuery = query(
      collection(db, LEADS_COLLECTION),
      where('status', 'in', [...CLOSED_LEAD_STATUSES]),
      orderBy('updatedAt', 'desc'),
      orderBy(documentId(), 'desc'),
      limit(CLOSED_LEAD_PAGE_SIZE + 1),
    );

    const unsubscribe = onSnapshot(
      closedQuery,
      (snapshot) => {
        const visibleDocs = snapshot.docs.slice(0, CLOSED_LEAD_PAGE_SIZE);
        setClosedLiveLeads(visibleDocs.map((docSnapshot) => toLeadRecord<T>(docSnapshot)));
        setClosedHistoryHasMore(snapshot.docs.length > CLOSED_LEAD_PAGE_SIZE);
        if (!hasLoadedOlderClosedRef.current) {
          closedCursorRef.current = visibleDocs.length > 0 ? visibleDocs[visibleDocs.length - 1] : null;
        }
        setClosedLoading(false);
        void refreshClosedCount();
      },
      (error) => {
        setClosedLiveLeads([]);
        setClosedLoading(false);
        onErrorRef.current(error as Error);
      },
    );

    return unsubscribe;
  }, [includeClosed, refreshClosedCount]);

  const loadMoreClosed = useCallback(async () => {
    if (!includeClosed || isLoadingMoreClosed || !closedHistoryHasMore || !closedCursorRef.current) return;
    setIsLoadingMoreClosed(true);
    try {
      const pageQuery = query(
        collection(db, LEADS_COLLECTION),
        where('status', 'in', [...CLOSED_LEAD_STATUSES]),
        orderBy('updatedAt', 'desc'),
        orderBy(documentId(), 'desc'),
        startAfter(closedCursorRef.current),
        limit(CLOSED_LEAD_PAGE_SIZE + 1),
      );
      const snapshot = await getDocs(pageQuery);
      const visibleDocs = snapshot.docs.slice(0, CLOSED_LEAD_PAGE_SIZE);
      const nextRows = visibleDocs.map((docSnapshot) => toLeadRecord<T>(docSnapshot));
      setClosedOlderLeads((current) => mergeLeadCollections(current, nextRows));
      hasLoadedOlderClosedRef.current = hasLoadedOlderClosedRef.current || visibleDocs.length > 0;
      if (visibleDocs.length > 0) {
        closedCursorRef.current = visibleDocs[visibleDocs.length - 1];
      }
      setClosedHistoryHasMore(snapshot.docs.length > CLOSED_LEAD_PAGE_SIZE);
    } catch (error) {
      onErrorRef.current(error as Error);
    } finally {
      setIsLoadingMoreClosed(false);
    }
  }, [closedHistoryHasMore, includeClosed, isLoadingMoreClosed]);

  useEffect(
    () => () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
      pendingNotificationsRef.current.clear();
      highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
      highlightTimersRef.current.clear();
      notifiedIdsRef.current.clear();
    },
    [],
  );

  const closedLeads = useMemo(
    () => mergeLeadCollections(closedLiveLeads, closedOlderLeads),
    [closedLiveLeads, closedOlderLeads],
  );
  const leads = useMemo(
    () => mergeLeadCollections(activeLeads, includeClosed ? closedLeads : []),
    [activeLeads, closedLeads, includeClosed],
  );
  const isLoading = activeLoading || (includeClosed && closedLoading);

  return {
    leads,
    isLoading,
    newLeadIds,
    closedCount,
    closedHistoryLoaded: includeClosed && !closedLoading,
    closedHistoryHasMore,
    isLoadingMoreClosed,
    loadMoreClosed,
    refreshClosedCount,
  };
}
