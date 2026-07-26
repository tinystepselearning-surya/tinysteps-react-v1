import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

const LEADS_COLLECTION = 'leads';
const NEW_LEAD_HIGHLIGHT_MS = 10_000;
const NEW_LEAD_NOTIFICATION_BUFFER_MS = 400;
const NOTIFIED_ID_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_NOTIFIED_IDS = 500;

export interface RealtimeLeadRecord {
  id: string;
  source?: unknown;
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
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

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
}: UseRealtimeLeadsOptions<T>) {
  const [leads, setLeads] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(() => new Set());
  const onErrorRef = useRef(onError);
  const onNewWebsiteLeadsRef = useRef(onNewWebsiteLeads);
  const notifiedIdsRef = useRef(new Map<string, number>());
  const highlightTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingNotificationsRef = useRef(new Map<string, T>());
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  onErrorRef.current = onError;
  onNewWebsiteLeadsRef.current = onNewWebsiteLeads;

  useEffect(() => {
    setIsLoading(true);
    let hasBootstrappedFromServer = false;
    const unsubscribe = onSnapshot(
      query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc')),
      { includeMetadataChanges: true },
      (snapshot) => {
        const nextLeads = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Record<string, unknown>),
        })) as T[];
        setLeads(nextLeads);
        setIsLoading(false);

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
        setLeads([]);
        setIsLoading(false);
        onErrorRef.current(error as Error);
      },
    );

    return unsubscribe;
  }, []);

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

  return { leads, isLoading, newLeadIds };
}
