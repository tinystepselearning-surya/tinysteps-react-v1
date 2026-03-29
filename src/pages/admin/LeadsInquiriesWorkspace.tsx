import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import { normalizeDemoStatus } from '../../lib/statuses';
import { useAuthStore } from '../../store/useAuthStore';
import type { DemoConversionStatus, DemoSession } from '../../types/models';
import {
  cancelDemoSession,
  createDemoSession,
  listenAllDemoSessions,
  listenDemoSessionPrivatePhones,
  releaseDemoSession,
  reopenDemoSession,
  updateDemoConversion,
} from '../../services/demoSessionsService';
import LeadsEnquiriesManagement from './LeadsEnquiriesManagement';
import DemoSessionsManagement from './DemoSessionsManagement';

export type LeadsWorkspaceView = 'leads' | 'demos';

type LegacyPanel = 'lead' | 'demo';
type LeadStatus =
  | 'new'
  | 'attempted_contact'
  | 'contacted'
  | 'qualified'
  | 'demo_pending_schedule'
  | 'demo_booked'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted_confirmed'
  | 'not_interested'
  | 'wrong_fit'
  | 'no_response'
  | 'lost';

interface LeadRecord {
  id: string;
  parentName?: string;
  primaryPhone?: string;
  phoneNormalized?: string;
  childName?: string;
  childAge?: number | null;
  childGrade?: string | null;
  interestTrack?: string | null;
  source?: string | null;
  preferredTimingText?: string | null;
  timezone?: string | null;
  status?: LeadStatus | null;
  nextFollowUpAt?: Timestamp | null;
  demoSessionId?: string | null;
  updatedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
}

type LifecycleStage =
  | 'enquiry'
  | 'demo_active'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted'
  | 'lost';

type SummaryCardFilter = 'all' | 'enquiry' | 'demo_active' | 'admission_follow_up' | 'admitted' | 'lost';
type FocusFilter = 'all' | 'due_today' | 'overdue' | 'no_demo' | 'all_demos' | 'open' | 'assigned' | 'completed' | 'no_response';
type OperationsMode = 'optimized' | 'legacy_full';

interface UnifiedRow {
  id: string;
  lead: LeadRecord | null;
  demo: DemoSession | null;
  lifecycleStage: LifecycleStage;
  source: string;
  courseLabel: string;
  teacherName: string;
  nextFollowUpLabel: string;
  updatedAtMs: number;
  parentName: string;
  childName: string;
  parentPhone: string;
}

interface LeadsInquiriesWorkspaceProps {
  view?: LeadsWorkspaceView;
  onViewChange?: (nextView: LeadsWorkspaceView) => void;
}

const LEADS_COLLECTION = 'leads';
const TODAY_DATE_INPUT = (() => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
})();

const LOST_LEAD_STATUSES = new Set<LeadStatus>(['not_interested', 'wrong_fit', 'no_response', 'lost']);
const TERMINAL_DEMO_BLOCK_LEAD_STATUSES = new Set<LeadStatus>([
  'not_interested',
  'wrong_fit',
  'lost',
  'admitted_confirmed',
]);

const toMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') {
      const ms = maybe.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof maybe.seconds === 'number') {
      return maybe.seconds * 1000;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.getTime() : 0;
  }
  return 0;
};

const formatTs = (value: unknown): string => {
  const ms = toMs(value);
  if (!ms) return '—';
  const d = new Date(ms);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

const normalizeText = (value: unknown): string => String(value || '').trim();

const formatLabel = (value: string): string => {
  if (!value) return '—';
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const interestTrackToCourse = (track: string): string => {
  const normalized = track.trim().toLowerCase();
  if (normalized === 'phonics') return 'Phonics';
  if (normalized === 'grammar') return 'Grammar';
  if (normalized === 'public_speaking') return 'Public Speaking';
  return formatLabel(normalized) || '—';
};

const leadSourceToDemoSource = (source: string): string => {
  const normalized = source.trim().toLowerCase();
  if (normalized === 'whatsapp') return 'WhatsApp';
  if (normalized === 'website') return 'Website';
  if (normalized === 'instagram') return 'Instagram';
  if (normalized === 'referral') return 'Referral';
  return formatLabel(normalized) || 'Manual';
};

const lifecycleLabel = (stage: LifecycleStage): string => {
  if (stage === 'enquiry') return 'Enquiry';
  if (stage === 'demo_active') return 'Demo In Progress';
  if (stage === 'demo_completed') return 'Demo Completed';
  if (stage === 'admission_follow_up') return 'Admission Follow-up';
  if (stage === 'admitted') return 'Admitted';
  return 'Lost';
};

const lifecycleVariant = (stage: LifecycleStage): 'default' | 'secondary' | 'outline' => {
  if (stage === 'admitted') return 'default';
  if (stage === 'lost') return 'secondary';
  return 'outline';
};

const dayRangeBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
};

const parseDateOnlyMs = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(trimmed)) {
    const local = new Date(`${trimmed}T00:00:00`);
    const ms = local.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
};

const getRowFollowUpMs = (row: UnifiedRow): number => {
  const demoFollowUp = parseDateOnlyMs(normalizeText(row.demo?.followUpDate));
  if (demoFollowUp) return demoFollowUp;
  return toMs(row.lead?.nextFollowUpAt);
};

const isTerminalLifecycleStage = (stage: LifecycleStage): boolean => stage === 'admitted' || stage === 'lost';

const resolveDemoWorkflowState = (demo: DemoSession | null): 'open' | 'assigned' | 'completed' | '' => {
  if (!demo) return '';
  const status = normalizeDemoStatus(demo.status);
  if (status === 'open') return 'open';
  if (status === 'assigned') return 'assigned';
  if (status === 'completed' || status === 'cancelled') return 'completed';
  return '';
};

function deriveLifecycleStage(lead: LeadRecord | null, demo: DemoSession | null): LifecycleStage {
  const leadStatus = normalizeText(lead?.status).toLowerCase() as LeadStatus;
  const conversionStatus = normalizeText(demo?.conversionStatus).toLowerCase() as DemoConversionStatus;
  const demoStatus = normalizeDemoStatus(demo?.status || '');

  if (leadStatus === 'admitted_confirmed' || conversionStatus === 'enrolled') return 'admitted';
  if (
    LOST_LEAD_STATUSES.has(leadStatus) ||
    conversionStatus === 'not_interested' ||
    conversionStatus === 'wrong_fit' ||
    conversionStatus === 'no_response'
  ) {
    return 'lost';
  }
  if (leadStatus === 'admission_follow_up' || conversionStatus === 'interested' || conversionStatus === 'follow_up_later') {
    return 'admission_follow_up';
  }
  if (demoStatus === 'open' || demoStatus === 'assigned') return 'demo_active';
  if (demoStatus === 'completed' || demoStatus === 'cancelled') return 'demo_completed';
  return 'enquiry';
}

function nextFollowUpLabel(lead: LeadRecord | null, demo: DemoSession | null): string {
  const demoFollowUp = normalizeText(demo?.followUpDate);
  if (demoFollowUp) return demoFollowUp;
  if (lead?.nextFollowUpAt) return formatTs(lead.nextFollowUpAt);
  return '—';
}

export default function LeadsInquiriesWorkspace({
  view = 'leads',
  onViewChange,
}: LeadsInquiriesWorkspaceProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [demoPhoneMap, setDemoPhoneMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [summaryCardFilter, setSummaryCardFilter] = useState<SummaryCardFilter>('all');
  const [focusFilter, setFocusFilter] = useState<FocusFilter>(view === 'demos' ? 'all_demos' : 'all');
  const [creatingDemoRowId, setCreatingDemoRowId] = useState<string | null>(null);
  const [savingConversionRowId, setSavingConversionRowId] = useState<string | null>(null);
  const [rowActionBusyKey, setRowActionBusyKey] = useState<string | null>(null);
  const [openDemoCreateSignal, setOpenDemoCreateSignal] = useState(0);
  const [legacyPanel, setLegacyPanel] = useState<LegacyPanel>(view === 'demos' ? 'demo' : 'lead');
  const [operationsMode, setOperationsMode] = useState<OperationsMode>('optimized');

  useEffect(() => {
    setLegacyPanel(view === 'demos' ? 'demo' : 'lead');
    setFocusFilter(view === 'demos' ? 'all_demos' : 'all');
  }, [view]);

  useEffect(() => {
    const q = query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as LeadRecord[];
        setLeads(next);
      },
      (error) => {
        console.error('[LeadsInquiriesWorkspace] leads load failed', error);
        toast({
          title: 'Failed to load leads',
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
      },
    );
    return () => unsub();
  }, [toast]);

  useEffect(() => {
    const unsubDemos = listenAllDemoSessions(
      (rows) => setDemos(rows),
      (error) => {
        console.error('[LeadsInquiriesWorkspace] demos load failed', error);
        toast({
          title: 'Failed to load demo sessions',
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
      },
    );
    const unsubPhones = listenDemoSessionPrivatePhones(
      (map) => setDemoPhoneMap(map),
      (error) => {
        console.error('[LeadsInquiriesWorkspace] demo phones load failed', error);
      },
    );
    return () => {
      unsubDemos();
      unsubPhones();
    };
  }, [toast]);

  const mergedRows = useMemo<UnifiedRow[]>(() => {
    const demoByLeadId = new Map<string, DemoSession>();
    const leadById = new Map<string, LeadRecord>();
    const rows: UnifiedRow[] = [];

    leads.forEach((lead) => {
      leadById.set(lead.id, lead);
    });

    demos.forEach((demo) => {
      const leadId = normalizeText((demo as any).leadId);
      if (!leadId) return;
      const existing = demoByLeadId.get(leadId);
      if (!existing || toMs(demo.lastUpdatedAt || demo.createdAt) > toMs(existing.lastUpdatedAt || existing.createdAt)) {
        demoByLeadId.set(leadId, demo);
      }
    });

    leads.forEach((lead) => {
      const linkedDemo =
        demoByLeadId.get(lead.id) ||
        (lead.demoSessionId ? demos.find((demo) => demo.id === lead.demoSessionId) || null : null);
      const parentName = normalizeText(lead.parentName) || normalizeText(linkedDemo?.parentName) || '—';
      const childName = normalizeText(lead.childName) || normalizeText(linkedDemo?.childName) || '—';
      const parentPhone =
        normalizeText(lead.primaryPhone) ||
        normalizeText(lead.phoneNormalized) ||
        normalizeText(linkedDemo?.id ? demoPhoneMap[linkedDemo.id] : '') ||
        '—';
      const source = normalizeText(lead.source) || normalizeText(linkedDemo?.source) || 'manual';
      const courseLabel =
        normalizeText(lead.interestTrack)
          ? interestTrackToCourse(normalizeText(lead.interestTrack))
          : normalizeText(linkedDemo?.courseInterested) || '—';
      const teacherName =
        normalizeText(linkedDemo?.assignedTeacherName) ||
        (normalizeText(linkedDemo?.assignedTeacherId) ? 'Assigned' : '—');
      const stage = deriveLifecycleStage(lead, linkedDemo || null);
      const updatedAtMs = Math.max(
        toMs(lead.updatedAt || lead.createdAt),
        toMs(linkedDemo?.lastUpdatedAt || linkedDemo?.createdAt),
      );
      rows.push({
        id: `lead_${lead.id}`,
        lead,
        demo: linkedDemo || null,
        lifecycleStage: stage,
        source,
        courseLabel,
        teacherName,
        nextFollowUpLabel: nextFollowUpLabel(lead, linkedDemo || null),
        updatedAtMs,
        parentName,
        childName,
        parentPhone,
      });
    });

    demos.forEach((demo) => {
      const leadId = normalizeText((demo as any).leadId);
      if (leadId && leadById.has(leadId)) return;
      const stage = deriveLifecycleStage(null, demo);
      rows.push({
        id: `demo_${demo.id}`,
        lead: null,
        demo,
        lifecycleStage: stage,
        source: normalizeText(demo.source) || 'manual',
        courseLabel: normalizeText(demo.courseInterested) || '—',
        teacherName:
          normalizeText(demo.assignedTeacherName) ||
          (normalizeText(demo.assignedTeacherId) ? 'Assigned' : '—'),
        nextFollowUpLabel: nextFollowUpLabel(null, demo),
        updatedAtMs: toMs(demo.lastUpdatedAt || demo.createdAt),
        parentName: normalizeText(demo.parentName) || '—',
        childName: normalizeText(demo.childName) || '—',
        parentPhone: normalizeText(demoPhoneMap[demo.id]) || '—',
      });
    });

    return rows.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [demoPhoneMap, demos, leads]);

  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(mergedRows.map((row) => normalizeText(row.source)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const courseOptions = useMemo(
    () =>
      Array.from(new Set(mergedRows.map((row) => normalizeText(row.courseLabel)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const teacherOptions = useMemo(
    () =>
      Array.from(
        new Set(
          mergedRows
            .map((row) => normalizeText(row.teacherName))
            .filter((name) => name && name !== '—' && name !== 'Assigned'),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const filteredRows = useMemo(() => {
    const search = normalizeText(searchQuery).toLowerCase();
    const { startMs, endMs } = dayRangeBounds();
    return mergedRows.filter((row) => {
      const demoWorkflowState = resolveDemoWorkflowState(row.demo);
      if (summaryCardFilter !== 'all' && row.lifecycleStage !== summaryCardFilter) return false;
      if (stageFilter !== 'all' && row.lifecycleStage !== stageFilter) return false;
      if (sourceFilter !== 'all' && normalizeText(row.source) !== sourceFilter) return false;
      if (courseFilter !== 'all' && normalizeText(row.courseLabel) !== courseFilter) return false;
      if (teacherFilter !== 'all' && normalizeText(row.teacherName) !== teacherFilter) return false;

      const followUpMs = getRowFollowUpMs(row);
      const hasFollowUp = followUpMs > 0;
      const isOverdue = hasFollowUp && followUpMs < startMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const isDueToday = hasFollowUp && followUpMs >= startMs && followUpMs < endMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const leadStatus = normalizeText(row.lead?.status).toLowerCase();
      const conversionStatus = normalizeText(row.demo?.conversionStatus).toLowerCase();

      if (focusFilter === 'due_today' && !isDueToday) return false;
      if (focusFilter === 'overdue' && !isOverdue) return false;
      if (focusFilter === 'no_demo' && Boolean(row.demo)) return false;
      if (focusFilter === 'all_demos' && !row.demo) return false;
      if (focusFilter === 'open' && demoWorkflowState !== 'open') return false;
      if (focusFilter === 'assigned' && demoWorkflowState !== 'assigned') return false;
      if (focusFilter === 'completed' && demoWorkflowState !== 'completed') return false;
      if (focusFilter === 'no_response' && leadStatus !== 'no_response' && conversionStatus !== 'no_response') return false;

      if (!search) return true;
      const haystack = [
        row.parentName,
        row.childName,
        row.parentPhone,
        row.source,
        row.courseLabel,
        row.teacherName,
        normalizeText(row.lead?.id),
        normalizeText(row.demo?.id),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [
    courseFilter,
    focusFilter,
    mergedRows,
    searchQuery,
    sourceFilter,
    stageFilter,
    summaryCardFilter,
    teacherFilter,
  ]);

  const summary = useMemo(() => {
    return mergedRows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.lifecycleStage === 'enquiry') acc.enquiry += 1;
        if (row.lifecycleStage === 'demo_active') acc.demoActive += 1;
        if (row.lifecycleStage === 'admission_follow_up') acc.followUp += 1;
        if (row.lifecycleStage === 'admitted') acc.admitted += 1;
        if (row.lifecycleStage === 'lost') acc.lost += 1;
        return acc;
      },
      { total: 0, enquiry: 0, demoActive: 0, followUp: 0, admitted: 0, lost: 0 },
    );
  }, [mergedRows]);

  const demoSnapshot = useMemo(() => {
    const summary = { open: 0, assigned: 0, completed: 0 };
    const teacherCountMap = new Map<string, number>();
    demos.forEach((demo) => {
      const state = resolveDemoWorkflowState(demo);
      if (!state) return;
      if (state === 'open') summary.open += 1;
      if (state === 'assigned') summary.assigned += 1;
      if (state === 'completed') summary.completed += 1;

      if (state === 'assigned' || state === 'completed') {
        const teacherName = normalizeText((demo as any).assignedTeacherName) || normalizeText((demo as any).teacherName);
        if (teacherName) {
          teacherCountMap.set(teacherName, (teacherCountMap.get(teacherName) || 0) + 1);
        }
      }
    });
    const teacherWise = Array.from(teacherCountMap.entries()).sort((a, b) => b[1] - a[1]);
    return { ...summary, teacherWise };
  }, [demos]);

  const focusCounts = useMemo<Record<FocusFilter, number>>(() => {
    const counts: Record<FocusFilter, number> = {
      all: 0,
      due_today: 0,
      overdue: 0,
      no_demo: 0,
      all_demos: 0,
      open: 0,
      assigned: 0,
      completed: 0,
      no_response: 0,
    };
    const { startMs, endMs } = dayRangeBounds();
    mergedRows.forEach((row) => {
      counts.all += 1;
      const demoWorkflowState = resolveDemoWorkflowState(row.demo);
      const followUpMs = getRowFollowUpMs(row);
      const hasFollowUp = followUpMs > 0;
      const isOverdue = hasFollowUp && followUpMs < startMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const isDueToday = hasFollowUp && followUpMs >= startMs && followUpMs < endMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const leadStatus = normalizeText(row.lead?.status).toLowerCase();
      const conversionStatus = normalizeText(row.demo?.conversionStatus).toLowerCase();

      if (isDueToday) counts.due_today += 1;
      if (isOverdue) counts.overdue += 1;
      if (!row.demo) counts.no_demo += 1;
      if (row.demo) counts.all_demos += 1;
      if (demoWorkflowState === 'open') counts.open += 1;
      if (demoWorkflowState === 'assigned') counts.assigned += 1;
      if (demoWorkflowState === 'completed') counts.completed += 1;
      if (leadStatus === 'no_response' || conversionStatus === 'no_response') counts.no_response += 1;
    });
    return counts;
  }, [mergedRows]);

  const focusChips: Array<{ key: FocusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'due_today', label: 'Due Today' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'no_demo', label: 'No Demo' },
    { key: 'all_demos', label: 'Demo Linked' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'completed', label: 'Completed' },
    { key: 'no_response', label: 'No Response' },
  ];

  const setPanel = (next: LegacyPanel) => {
    setLegacyPanel(next);
    onViewChange?.(next === 'demo' ? 'demos' : 'leads');
  };

  const toggleSummaryCard = (next: SummaryCardFilter) => {
    setSummaryCardFilter((current) => (current === next || next === 'all' ? 'all' : next));
  };

  const openToolset = (next: LegacyPanel) => {
    setOperationsMode('legacy_full');
    setPanel(next);
    const element = document.getElementById('full-operations-toolset');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateDemoRequest = () => {
    if (operationsMode === 'legacy_full') setPanel('demo');
    setOpenDemoCreateSignal((current) => current + 1);
    const element = document.getElementById('full-operations-toolset');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isBusyFor = (row: UnifiedRow, action: string) => rowActionBusyKey === `${action}:${row.id}`;

  const handleQuickCreateDemo = async (row: UnifiedRow) => {
    if (!user?.uid || !row.lead || row.demo) return;
    const lead = row.lead;
    const confirmed = window.confirm(
      `Create demo for ${normalizeText(lead.parentName) || 'this lead'} / ${normalizeText(lead.childName) || 'child'}?`,
    );
    if (!confirmed) return;

    setCreatingDemoRowId(row.id);
    try {
      const demoId = await createDemoSession(
        {
          parentName: normalizeText(lead.parentName) || 'Parent',
          parentPhone: normalizeText(lead.primaryPhone) || normalizeText(lead.phoneNormalized),
          childName: normalizeText(lead.childName) || 'Child',
          childGrade: normalizeText(lead.childGrade) || 'Not provided',
          childAge: typeof lead.childAge === 'number' ? lead.childAge : null,
          courseInterested: interestTrackToCourse(normalizeText(lead.interestTrack) || 'phonics'),
          source: leadSourceToDemoSource(normalizeText(lead.source) || 'manual'),
          preferredDateTimeText: normalizeText(lead.preferredTimingText) || 'To be confirmed with parent',
          requestReceivedDate: TODAY_DATE_INPUT,
          timezone: normalizeText(lead.timezone) || 'Asia/Kolkata',
          adminNotes: `Created from unified workflow (lead ${lead.id}).`,
          leadId: lead.id,
        },
        user.uid,
      );

      const leadStatus = normalizeText(lead.status).toLowerCase() as LeadStatus;
      const nextLeadStatus: LeadStatus = TERMINAL_DEMO_BLOCK_LEAD_STATUSES.has(leadStatus)
        ? leadStatus
        : 'demo_booked';

      await updateDoc(doc(db, LEADS_COLLECTION, lead.id), {
        demoSessionId: demoId,
        status: nextLeadStatus,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
      });

      toast({
        title: 'Demo created',
        description: `Lead linked to demo ${demoId}.`,
      });
      setPanel('demo');
    } catch (error: any) {
      toast({
        title: 'Unable to create demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingDemoRowId(null);
    }
  };

  const handleMarkEnrolled = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Mark this demo as Enrolled for ${row.childName}?`);
    if (!confirmed) return;

    setSavingConversionRowId(row.id);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'enrolled',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'admitted_confirmed',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Marked as enrolled' });
    } catch (error: any) {
      toast({
        title: 'Failed to update conversion',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingConversionRowId(null);
    }
  };

  const handleSetFollowUp = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Move ${row.childName} to Admission Follow-up?`);
    if (!confirmed) return;

    setRowActionBusyKey(`follow_up:${row.id}`);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'follow_up_later',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'admission_follow_up',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Moved to admission follow-up' });
    } catch (error: any) {
      toast({
        title: 'Failed to update follow-up',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleMarkLost = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Mark ${row.childName} as Not Interested / Lost?`);
    if (!confirmed) return;

    setRowActionBusyKey(`lost:${row.id}`);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'not_interested',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'not_interested',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Marked as lost' });
    } catch (error: any) {
      toast({
        title: 'Failed to mark as lost',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleCancelDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Cancel demo for ${row.childName}?`);
    if (!confirmed) return;
    setRowActionBusyKey(`cancel:${row.id}`);
    try {
      await cancelDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo cancelled' });
    } catch (error: any) {
      toast({
        title: 'Failed to cancel demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleReleaseDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Release demo for ${row.childName} back to open pool?`);
    if (!confirmed) return;
    setRowActionBusyKey(`release:${row.id}`);
    try {
      await releaseDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo released to open pool' });
    } catch (error: any) {
      toast({
        title: 'Failed to release demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleReopenDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Reopen demo for ${row.childName} to Open state?`);
    if (!confirmed) return;
    setRowActionBusyKey(`reopen:${row.id}`);
    try {
      await reopenDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo reopened to open state' });
    } catch (error: any) {
      toast({
        title: 'Failed to reopen demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  return (
    <div className="space-y-2">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Leads &amp; Inquiries</h3>
            <p className="text-sm text-muted-foreground">
              Unified enquiry-to-admission operations console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={handleCreateDemoRequest}>
              Create Demo Request
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => toggleSummaryCard('all')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Total Records</div>
            <div className="text-xl font-semibold">{summary.total}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('enquiry')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'enquiry' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Enquiries</div>
            <div className="text-xl font-semibold">{summary.enquiry}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('demo_active')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'demo_active' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Demo In Progress</div>
            <div className="text-xl font-semibold">{summary.demoActive}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('admission_follow_up')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'admission_follow_up'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Admission Follow-up</div>
            <div className="text-xl font-semibold">{summary.followUp}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('admitted')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'admitted' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Admitted</div>
            <div className="text-xl font-semibold">{summary.admitted}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('lost')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'lost' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Lost</div>
            <div className="text-xl font-semibold">{summary.lost}</div>
          </button>
        </div>
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Operational Focus
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focusChips.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                size="sm"
                variant={focusFilter === chip.key ? 'default' : 'outline'}
                onClick={() => setFocusFilter(chip.key)}
              >
                {chip.label} {focusCounts[chip.key]}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 rounded-md border bg-slate-50/60 p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo Ops Snapshot</div>
          <div className="text-xs text-muted-foreground">
            Teacher-wise demos (assigned + completed):
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {demoSnapshot.teacherWise.length === 0 ? (
              <span className="text-xs text-muted-foreground">No assigned/completed demos yet.</span>
            ) : (
              demoSnapshot.teacherWise.map(([teacherName, count]) => (
                <Badge key={teacherName} variant="outline">
                  {teacherName}: {count}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Label htmlFor="workflow-search">Search</Label>
            <Input
              id="workflow-search"
              placeholder="Parent, child, phone, lead ID, demo ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div>
            <Label>Lifecycle Stage</Label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="demo_active">Demo In Progress</SelectItem>
                <SelectItem value="demo_completed">Demo Completed</SelectItem>
                <SelectItem value="admission_follow_up">Admission Follow-up</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Course / Track</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned Teacher</Label>
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {teacherOptions.map((teacherName) => (
                  <SelectItem key={teacherName} value={teacherName}>
                    {teacherName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setStageFilter('all');
              setSourceFilter('all');
              setCourseFilter('all');
              setTeacherFilter('all');
              setSummaryCardFilter('all');
              setFocusFilter(view === 'demos' ? 'all_demos' : 'all');
            }}
          >
            Clear filters
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No workflow records found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Course / Track</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const demoStatus = row.demo ? normalizeDemoStatus(row.demo.status) : '';
                  const demoWorkflowState = resolveDemoWorkflowState(row.demo);
                  const isCompletedDemo = demoStatus === 'completed';
                  const isCancelledDemo = demoStatus === 'cancelled';
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.parentName}</div>
                        <div className="text-xs text-muted-foreground">{row.parentPhone}</div>
                      </TableCell>
                      <TableCell>{row.childName}</TableCell>
                      <TableCell>{row.source || '—'}</TableCell>
                      <TableCell>{row.courseLabel}</TableCell>
                      <TableCell>
                        <Badge variant={lifecycleVariant(row.lifecycleStage)}>
                          {lifecycleLabel(row.lifecycleStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.demo ? (
                          <Badge variant="outline">{formatLabel(demoStatus || row.demo.status)}</Badge>
                        ) : (
                          <Badge variant="outline">Not Created</Badge>
                        )}
                      </TableCell>
                      <TableCell>{row.teacherName || '—'}</TableCell>
                      <TableCell>{row.nextFollowUpLabel}</TableCell>
                      <TableCell>{formatTs(row.updatedAtMs)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.lead && !row.demo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={creatingDemoRowId === row.id}
                              onClick={() => void handleQuickCreateDemo(row)}
                            >
                              {creatingDemoRowId === row.id ? 'Creating…' : 'Create Demo'}
                            </Button>
                          ) : null}
                          {row.demo && demoWorkflowState === 'open' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusyFor(row, 'cancel')}
                              onClick={() => void handleCancelDemo(row)}
                            >
                              {isBusyFor(row, 'cancel') ? 'Saving…' : 'Cancel Demo'}
                            </Button>
                          ) : null}
                          {row.demo && demoWorkflowState === 'assigned' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusyFor(row, 'release')}
                              onClick={() => void handleReleaseDemo(row)}
                            >
                              {isBusyFor(row, 'release') ? 'Saving…' : 'Release Demo'}
                            </Button>
                          ) : null}
                          {row.demo && isCompletedDemo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={savingConversionRowId === row.id}
                              onClick={() => void handleMarkEnrolled(row)}
                            >
                              {savingConversionRowId === row.id ? 'Saving…' : 'Mark Enrolled'}
                            </Button>
                          ) : null}
                          {row.demo && isCompletedDemo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusyFor(row, 'follow_up')}
                              onClick={() => void handleSetFollowUp(row)}
                            >
                              {isBusyFor(row, 'follow_up') ? 'Saving…' : 'Move Follow-up'}
                            </Button>
                          ) : null}
                          {row.demo && isCompletedDemo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusyFor(row, 'lost')}
                              onClick={() => void handleMarkLost(row)}
                            >
                              {isBusyFor(row, 'lost') ? 'Saving…' : 'Mark Lost'}
                            </Button>
                          ) : null}
                          {row.demo && isCancelledDemo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusyFor(row, 'reopen')}
                              onClick={() => void handleReopenDemo(row)}
                            >
                              {isBusyFor(row, 'reopen') ? 'Saving…' : 'Reopen Demo'}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openToolset(row.demo ? 'demo' : 'lead')}
                          >
                            {row.demo
                              ? demoWorkflowState === 'open'
                                ? 'Assign / Edit Demo'
                                : demoWorkflowState === 'assigned'
                                ? 'Reassign / Reschedule'
                                : demoStatus === 'cancelled'
                                ? 'Reopen / Details'
                                : 'Demo Details'
                              : 'Open Lead Toolset'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div id="full-operations-toolset" className="space-y-3">
        {operationsMode === 'optimized' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-slate-50/60 px-3 py-2">
              <div className="text-xs text-muted-foreground">
                Trend stays in this unified view. Open legacy toolsets only for detailed lead/demo operations.
              </div>
              <Button type="button" size="sm" onClick={() => setOperationsMode('legacy_full')}>
                Open Full Legacy Toolsets
              </Button>
            </div>
            <DemoSessionsManagement mode="trend_only" openCreateRequestSignal={openDemoCreateSignal} />
          </>
        ) : (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Advanced Operations (Legacy)
                </div>
                <div className="text-xs text-slate-500">
                  Use these detailed modules only when you need deep lead or demo controls.
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setOperationsMode('optimized')}>
                Back To Optimized View
              </Button>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={legacyPanel === 'lead' ? 'default' : 'outline'}
                onClick={() => setPanel('lead')}
              >
                Lead Operations
              </Button>
              <Button
                type="button"
                size="sm"
                variant={legacyPanel === 'demo' ? 'default' : 'outline'}
                onClick={() => setPanel('demo')}
              >
                Demo Operations
              </Button>
            </div>
            {legacyPanel === 'lead' ? (
              <LeadsEnquiriesManagement />
            ) : (
              <DemoSessionsManagement openCreateRequestSignal={openDemoCreateSignal} />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
