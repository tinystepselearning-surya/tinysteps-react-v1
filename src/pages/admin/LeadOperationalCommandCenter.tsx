import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, Clock3, MessageCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import {
  ACTIVE_FOLLOW_UP_STATUSES,
  EMPTY_LEAD_AGE_BANDS,
  LEAD_AGE_BANDS,
  LEAD_OPERATIONAL_QUEUES,
  deriveLeadAttention,
  istDayBounds,
  leadAgeBand,
  leadAgeDays,
  matchesOperationalQueue,
  operationalQueueDefinition,
  stageAgeDays,
  toOperationalMs,
  type LeadAgeBandCounts,
  type LeadAttentionLevel,
  type LeadOperationalQueueKey,
  type LeadOperationalRecord,
} from './leadsOperationalAnalytics';

const LEADS_COLLECTION = 'leads';
const DETAIL_LIMIT = 50;

const EMPTY_COUNTS = LEAD_OPERATIONAL_QUEUES.reduce(
  (acc, item) => ({ ...acc, [item.key]: 0 }),
  {} as Record<LeadOperationalQueueKey, number>,
);

const normalizeText = (value: unknown): string => String(value || '').trim();
const phoneDigits = (value: unknown): string => normalizeText(value).replace(/[^\d]/g, '');
const courseLabel = (lead: LeadOperationalRecord): string => {
  const explicit = normalizeText(lead.programInterest);
  if (explicit) return explicit;
  const track = normalizeText(lead.interestTrack);
  if (!track) return '—';
  return track
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatDate = (value: unknown): string => {
  const ms = toOperationalMs(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
};

const toneClass = (tone: 'neutral' | 'warning' | 'urgent' | 'success'): string => {
  if (tone === 'urgent') return 'border-rose-200 bg-rose-50/70 hover:bg-rose-50';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50/70 hover:bg-amber-50';
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50';
  return 'border-slate-200 bg-white hover:bg-slate-50';
};

const attentionMeta: Record<LeadAttentionLevel, { label: string; className: string }> = {
  needs_attention: { label: 'Needs attention', className: 'border-rose-200 bg-rose-50 text-rose-800' },
  follow_up_today: { label: 'Follow up today', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  waiting_parent: { label: 'Waiting / follow-up', className: 'border-violet-200 bg-violet-50 text-violet-800' },
  on_track: { label: 'On track', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  closed: { label: 'Closed', className: 'border-slate-200 bg-slate-50 text-slate-700' },
};

const statusConstraints = (statuses: readonly string[]): QueryConstraint[] => [
  statuses.length === 1
    ? where('status', '==', statuses[0])
    : where('status', 'in', [...statuses]),
];

const getStatusCount = async (statuses: readonly string[]): Promise<number> => {
  const snapshot = await getCountFromServer(
    query(collection(db, LEADS_COLLECTION), ...statusConstraints(statuses)),
  );
  return Number(snapshot.data().count || 0);
};

const readFollowUpRecords = async (
  key: 'follow_up_today' | 'overdue_follow_up',
  nowMs: number,
): Promise<LeadOperationalRecord[]> => {
  const { startMs, endMs } = istDayBounds(nowMs);
  if (!startMs) return [];
  const constraints: QueryConstraint[] = key === 'follow_up_today'
    ? [
        where('nextFollowUpAt', '>=', Timestamp.fromMillis(startMs)),
        where('nextFollowUpAt', '<', Timestamp.fromMillis(endMs)),
        orderBy('nextFollowUpAt', 'asc'),
      ]
    : [
        where('nextFollowUpAt', '<', Timestamp.fromMillis(startMs)),
        orderBy('nextFollowUpAt', 'asc'),
      ];
  const snapshot = await getDocs(query(collection(db, LEADS_COLLECTION), ...constraints));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<LeadOperationalRecord, 'id'>) }))
    .filter((lead) => matchesOperationalQueue(lead, key, nowMs));
};

const loadStatusQueueRows = async (statuses: readonly string[]): Promise<LeadOperationalRecord[]> => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, LEADS_COLLECTION),
        ...statusConstraints(statuses),
        orderBy('createdAt', 'desc'),
        limit(DETAIL_LIMIT),
      ),
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<LeadOperationalRecord, 'id'>) }));
  } catch (error) {
    console.warn('[LeadOperationalCommandCenter] status + createdAt detail query unavailable; using status-only fallback', error);
    const snapshot = await getDocs(
      query(collection(db, LEADS_COLLECTION), ...statusConstraints(statuses)),
    );
    return snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<LeadOperationalRecord, 'id'>) }))
      .sort((a, b) => toOperationalMs(b.createdAt) - toOperationalMs(a.createdAt))
      .slice(0, DETAIL_LIMIT);
  }
};

const countAgeBands = async (
  statuses: readonly string[],
  nowMs: number,
): Promise<LeadAgeBandCounts | null> => {
  const dayMs = 24 * 60 * 60 * 1000;
  try {
    const values = await Promise.all(LEAD_AGE_BANDS.map(async (band) => {
      const constraints: QueryConstraint[] = [...statusConstraints(statuses)];
      const upperMs = nowMs - band.minDays * dayMs;
      if (band.maxDaysExclusive === null) {
        constraints.push(where('createdAt', '<', Timestamp.fromMillis(upperMs)));
      } else {
        const lowerMs = nowMs - band.maxDaysExclusive * dayMs;
        constraints.push(where('createdAt', '>=', Timestamp.fromMillis(lowerMs)));
        constraints.push(where('createdAt', '<=', Timestamp.fromMillis(upperMs)));
      }
      const snapshot = await getCountFromServer(query(collection(db, LEADS_COLLECTION), ...constraints));
      return [band.key, Number(snapshot.data().count || 0)] as const;
    }));
    return values.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), { ...EMPTY_LEAD_AGE_BANDS });
  } catch (error) {
    console.warn('[LeadOperationalCommandCenter] global lead-age bands unavailable', error);
    return null;
  }
};

const selectedQueueFromUrl = (): LeadOperationalQueueKey | null => {
  if (typeof window === 'undefined') return null;
  const candidate = new URLSearchParams(window.location.search).get('leadOps') as LeadOperationalQueueKey | null;
  return candidate && LEAD_OPERATIONAL_QUEUES.some((item) => item.key === candidate) ? candidate : null;
};

export default function LeadOperationalCommandCenter(): JSX.Element {
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<LeadOperationalQueueKey, number>>(EMPTY_COUNTS);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsUnavailable, setCountsUnavailable] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<LeadOperationalQueueKey | null>(() => selectedQueueFromUrl());
  const [detailRows, setDetailRows] = useState<LeadOperationalRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ageBands, setAgeBands] = useState<LeadAgeBandCounts | null>(null);
  const [ageBandsLoading, setAgeBandsLoading] = useState(false);
  const nowMs = Date.now();

  const refreshCounts = useCallback(async () => {
    setCountsLoading(true);
    setCountsUnavailable(false);
    try {
      const statusDefinitions = LEAD_OPERATIONAL_QUEUES.filter((item) => item.statuses);
      const statusPairs = await Promise.all(statusDefinitions.map(async (definition) => [
        definition.key,
        await getStatusCount(definition.statuses || []),
      ] as const));
      const [dueToday, overdue] = await Promise.all([
        readFollowUpRecords('follow_up_today', Date.now()),
        readFollowUpRecords('overdue_follow_up', Date.now()),
      ]);
      const next = { ...EMPTY_COUNTS };
      statusPairs.forEach(([key, value]) => { next[key] = value; });
      next.follow_up_today = dueToday.length;
      next.overdue_follow_up = overdue.length;
      setCounts(next);
    } catch (error: any) {
      console.error('[LeadOperationalCommandCenter] operational count refresh failed', error);
      setCountsUnavailable(true);
      toast({
        title: 'Operational lead counts unavailable',
        description: error?.message || 'The workflow list below is still available.',
        variant: 'destructive',
      });
    } finally {
      setCountsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!selectedQueue) {
      setDetailRows([]);
      setAgeBands(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setDetailLoading(true);
      setAgeBandsLoading(true);
      setAgeBands(null);
      try {
        const definition = operationalQueueDefinition(selectedQueue);
        const rows = selectedQueue === 'follow_up_today' || selectedQueue === 'overdue_follow_up'
          ? await readFollowUpRecords(selectedQueue, Date.now())
          : await loadStatusQueueRows(definition.statuses || []);
        if (cancelled) return;
        const sortedRows = [...rows]
          .sort((a, b) => {
            if (selectedQueue === 'overdue_follow_up' || selectedQueue === 'follow_up_today') {
              return toOperationalMs(a.nextFollowUpAt) - toOperationalMs(b.nextFollowUpAt);
            }
            const aAttention = deriveLeadAttention(a).level === 'needs_attention' ? 0 : 1;
            const bAttention = deriveLeadAttention(b).level === 'needs_attention' ? 0 : 1;
            if (aAttention !== bAttention) return aAttention - bAttention;
            return toOperationalMs(b.createdAt) - toOperationalMs(a.createdAt);
          });
        setDetailRows(sortedRows.slice(0, DETAIL_LIMIT));

        if (selectedQueue === 'overdue_follow_up') {
          const exactBands = sortedRows.reduce((acc, lead) => {
            const followUpMs = toOperationalMs(lead.nextFollowUpAt);
            if (!followUpMs) return acc;
            const overdueDays = Math.max(0, Math.floor((Date.now() - followUpMs) / (24 * 60 * 60 * 1000)));
            const key = overdueDays <= 1 ? '0_1' : overdueDays <= 3 ? '2_3' : overdueDays <= 7 ? '4_7' : overdueDays <= 14 ? '8_14' : '15_plus';
            acc[key] += 1;
            return acc;
          }, { ...EMPTY_LEAD_AGE_BANDS });
          setAgeBands(exactBands);
        } else if (selectedQueue === 'follow_up_today') {
          setAgeBands(null);
        } else if (definition.statuses?.length) {
          const expectedCount = counts[selectedQueue];
          if (expectedCount <= rows.length) {
            const exactBands = rows.reduce((acc, lead) => {
              const key = leadAgeBand(lead);
              if (key) acc[key] += 1;
              return acc;
            }, { ...EMPTY_LEAD_AGE_BANDS });
            setAgeBands(exactBands);
          } else {
            setAgeBands(await countAgeBands(definition.statuses, Date.now()));
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          setDetailRows([]);
          toast({
            title: 'Could not open operational queue',
            description: error?.message || 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
          setAgeBandsLoading(false);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [counts, selectedQueue, toast]);

  const selectQueue = (key: LeadOperationalQueueKey) => {
    setSelectedQueue((current) => current === key ? null : key);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (selectedQueue === key) params.delete('leadOps');
      else params.set('leadOps', key);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    }
  };

  const selectedDefinition = selectedQueue ? operationalQueueDefinition(selectedQueue) : null;
  const attentionSummary = useMemo(() => {
    return detailRows.reduce(
      (acc, lead) => {
        const level = deriveLeadAttention(lead, nowMs).level;
        if (level === 'needs_attention') acc.needsAttention += 1;
        if (level === 'follow_up_today') acc.dueToday += 1;
        return acc;
      },
      { needsAttention: 0, dueToday: 0 },
    );
  }, [detailRows, nowMs]);

  return (
    <Card className="border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="lead-ops-command-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="lead-ops-command-heading" className="text-lg font-bold text-slate-950">Today’s lead operations</h2>
            <Badge variant="outline">Asia/Kolkata</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Action queues are built from saved lifecycle statuses and follow-up timestamps. Cards can overlap where the same lead genuinely belongs to more than one operational queue.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void refreshCounts()} disabled={countsLoading}>
          <RefreshCw className={`h-4 w-4 ${countsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {countsUnavailable ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Operational counts are unavailable. The main Leads &amp; Enquiries workflow below is unaffected; no zeroes are being substituted for failed data.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {LEAD_OPERATIONAL_QUEUES.map((item) => {
          const selected = selectedQueue === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => selectQueue(item.key)}
              className={`rounded-xl border p-3 text-left transition ${toneClass(item.tone)} ${selected ? 'ring-2 ring-slate-900/15 shadow-sm' : ''}`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                <span className="text-xl font-bold tabular-nums text-slate-950">{countsLoading || countsUnavailable ? '—' : counts[item.key]}</span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-600">{item.shortHelp}</p>
            </button>
          );
        })}
      </div>

      {selectedDefinition ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-slate-50/70 px-4 py-3">
            <div>
              <div className="font-semibold text-slate-950">{selectedDefinition.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{selectedDefinition.shortHelp}</div>
            </div>
            {!detailLoading ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Showing up to {DETAIL_LIMIT}</Badge>
                {attentionSummary.needsAttention > 0 ? <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">Needs attention {attentionSummary.needsAttention}</Badge> : null}
              </div>
            ) : null}
          </div>

          {selectedQueue !== 'follow_up_today' ? (
            <div className="border-b px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {selectedQueue === 'overdue_follow_up' ? 'Days overdue' : 'Lead age since enquiry received'}
              </div>
              {ageBandsLoading ? (
                <div className="text-sm text-slate-500">Calculating aging…</div>
              ) : ageBands ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {LEAD_AGE_BANDS.map((band) => (
                    <div key={band.key} className="rounded-lg border bg-white px-3 py-2">
                      <div className="text-[11px] text-slate-500">{band.label}</div>
                      <div className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{ageBands[band.key]}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">Global aging is unavailable for this queue; the lead rows below remain available.</div>
              )}
            </div>
          ) : null}

          {detailLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">Loading operational queue…</div>
          ) : detailRows.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No leads currently match this queue.</div>
          ) : (
            <div className="divide-y">
              {detailRows.map((lead) => {
                const attention = deriveLeadAttention(lead, nowMs);
                const attentionStyle = attentionMeta[attention.level];
                const phone = normalizeText(lead.primaryPhone || lead.whatsappNumber || lead.phoneNormalized);
                const leadDays = leadAgeDays(lead, nowMs);
                const stageDays = stageAgeDays(lead, nowMs);
                return (
                  <div key={lead.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1.35fr_1fr_1fr_auto] lg:items-center">
                    <div>
                      <div className="font-semibold text-slate-950">{normalizeText(lead.parentName) || 'Unnamed parent'}</div>
                      <div className="text-sm text-slate-600">{normalizeText(lead.childName) || 'Child not set'}{phone ? ` · ${phone}` : ''}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{courseLabel(lead)}</div>
                      <div className="text-xs text-slate-500">{normalizeText(lead.source) || 'Source unavailable'} · {normalizeText(lead.status) || 'status unavailable'}</div>
                    </div>
                    <div>
                      <Badge variant="outline" className={attentionStyle.className}>{attentionStyle.label}</Badge>
                      <div className="mt-1 text-xs text-slate-500" title={attention.reason}>{attention.reason}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        Lead age {leadDays === null ? '—' : `${leadDays}d`} · Stage age {stageDays === null ? '—' : `${stageDays}d`}
                        {lead.nextFollowUpAt ? ` · Follow-up ${formatDate(lead.nextFollowUpAt)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:justify-end">
                      {attention.level === 'needs_attention' ? <AlertTriangle className="h-4 w-4 text-rose-500" aria-hidden="true" /> : attention.level === 'follow_up_today' ? <Clock3 className="h-4 w-4 text-amber-500" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
                      {phoneDigits(phone) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => window.open(`https://wa.me/${phoneDigits(phone)}`, '_blank', 'noopener,noreferrer')}
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Select any action card to inspect the exact queue and its aging. Detailed queue reads happen only after selection.</p>
      )}
    </Card>
  );
}
