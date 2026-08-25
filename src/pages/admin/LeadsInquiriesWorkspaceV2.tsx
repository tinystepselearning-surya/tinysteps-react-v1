import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import {
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  MessageCircle,
  Search,
  Settings2,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import { normalizeDemoStatus } from '../../lib/statuses';
import type { DemoConversionStatus, DemoSession } from '../../types/models';
import {
  listenDemoSessionsByIds,
  listenDemoSessionPrivatePhonesByIds,
  reassignDemoSession,
  updateDemoConversion,
} from '../../services/demoSessionsService';
import {
  adminDeleteLeadWorkflowRecord,
  adminUpdateLeadWorkflowRecord,
} from '../../services/leadsAdminService';
import { buildNewWebsiteLeadToastDescription, useRealtimeLeads } from './leadsRealtime';
import LegacyLeadsInquiriesWorkspace from './LeadsInquiriesWorkspaceLegacy';
import LeadAdminToolsMenu from './LeadAdminToolsMenu';
import {
  isSimpleFollowUpDecision,
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
  simpleOutcomeNeedsReason,
  type SimpleLeadAction,
  type SimpleLeadBucket,
} from './leadsWorkflowBuckets';

export type LeadsWorkspaceView = 'leads' | 'demos';

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
  archived?: boolean;
  parentName?: string;
  primaryPhone?: string;
  phoneNormalized?: string;
  whatsappNumber?: string;
  parentEmail?: string | null;
  childName?: string;
  childAge?: number | null;
  childGrade?: string | null;
  interestTrack?: string | null;
  programInterest?: string | null;
  source?: string | null;
  preferredTimingText?: string | null;
  timezone?: string | null;
  notes?: string | null;
  status?: LeadStatus | null;
  nextFollowUpAt?: Timestamp | null;
  demoSessionId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  dedupeCanonicalLeadId?: string | null;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface SimpleRow {
  id: string;
  lead: LeadRecord | null;
  demo: DemoSession | null;
  bucket: SimpleLeadBucket;
  parentName: string;
  childName: string;
  parentPhone: string;
  course: string;
  source: string;
  teacherName: string;
  createdAtMs: number;
  updatedAtMs: number;
  followUpAtMs: number;
  statusLabel: string;
}

interface OutcomeFormState {
  conversionStatus: DemoConversionStatus | 'none';
  followUpDate: string;
  recommendedCourse: string;
  recommendedFrequency: string;
  feeDiscussed: string;
  reason: string;
}

interface LeadEditFormState {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childAge: string;
  childGrade: string;
  course: string;
  source: string;
  preferredTimingText: string;
  timezone: string;
  notes: string;
}

interface LeadsInquiriesWorkspaceProps {
  view?: LeadsWorkspaceView;
  onViewChange?: (nextView: LeadsWorkspaceView) => void;
}

const OUTCOME_OPTIONS: Array<{ value: DemoConversionStatus; label: string; help: string }> = [
  { value: 'interested', label: 'Interested — follow up', help: 'Keep in Admin Review and set the next follow-up date.' },
  { value: 'follow_up_later', label: 'Follow up later', help: 'Keep in Admin Review and set the next follow-up date.' },
  { value: 'enrolled', label: 'Enrolled', help: 'Move to Closed.' },
  { value: 'not_interested', label: 'Not interested', help: 'Move to Closed. Add a short reason.' },
  { value: 'wrong_fit', label: 'Wrong fit', help: 'Move to Closed. Add a short reason.' },
  { value: 'no_response', label: 'No response — close', help: 'Move to Closed after follow-up is complete.' },
];

const EMPTY_OUTCOME: OutcomeFormState = {
  conversionStatus: 'none',
  followUpDate: '',
  recommendedCourse: '',
  recommendedFrequency: '',
  feeDiscussed: '',
  reason: '',
};

const EMPTY_EDIT_FORM: LeadEditFormState = {
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  childName: '',
  childAge: '',
  childGrade: '',
  course: '',
  source: '',
  preferredTimingText: '',
  timezone: '',
  notes: '',
};

const normalizeText = (value: unknown): string => String(value || '').trim();
const phoneDigits = (value: unknown): string => normalizeText(value).replace(/[^\d]/g, '');
const normalizeIdentityPhone = (value: unknown): string => {
  const digits = phoneDigits(value);
  if (digits.length === 14 && digits.startsWith('0091')) return digits.slice(4);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};
const normalizeIdentityChild = (value: unknown): string =>
  normalizeText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const buildLeadDemoUiIdentity = (phone: unknown, childName: unknown): string | null => {
  const normalizedPhone = normalizeIdentityPhone(phone);
  const normalizedChild = normalizeIdentityChild(childName);
  if (normalizedPhone.length < 7 || normalizedChild.length < 2) return null;
  return `${normalizedPhone}|${normalizedChild}`;
};

const isSyntheticLeadId = (value: unknown): boolean => normalizeText(value).startsWith('demo_');
const isArchived = (value: unknown): boolean =>
  Boolean(value && typeof value === 'object' && (value as { archived?: boolean }).archived);

const toMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return 0;
};

const parseDateInputMs = (value: unknown): number => {
  const raw = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 0;
  const [year, month, day] = raw.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
};

const dateBoundaryMs = (value: string, endOfDay = false): number => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 0;
  const suffix = endOfDay ? 'T23:59:59.999+05:30' : 'T00:00:00.000+05:30';
  const parsed = Date.parse(`${value}${suffix}`);
  return Number.isFinite(parsed) ? parsed : 0;
};

const monthKeyFromMs = (ms: number): string => {
  if (!ms) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date(ms));
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
};

const formatMonthKey = (value: string): string => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', month: 'short', year: 'numeric',
  }).format(new Date(year, month - 1, 15, 12, 0, 0, 0));
};

const formatTrack = (value: unknown): string =>
  normalizeText(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatUpdated = (ms: number): string => {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(ms));
};
const formatFollowUp = (ms: number): string => {
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
  }).format(new Date(ms));
};
const buildWhatsAppUrl = (phone: string): string => `https://wa.me/${phoneDigits(phone)}`;

const bucketMeta: Record<SimpleLeadBucket, { title: string; subtitle: string; icon: React.ElementType; accent: string }> = {
  open: { title: 'Open', subtitle: 'Demo ready, waiting for teacher', icon: CircleDot, accent: 'border-blue-200 bg-blue-50/70 text-blue-950' },
  in_progress: { title: 'With Teacher', subtitle: 'Assigned to teacher for the demo', icon: Clock3, accent: 'border-amber-200 bg-amber-50/70 text-amber-950' },
  admin_review: { title: 'Admin Review', subtitle: 'Teacher finished — admin action needed', icon: ClipboardCheck, accent: 'border-violet-200 bg-violet-50/70 text-violet-950' },
  closed: { title: 'Closed', subtitle: 'Final admin decision saved', icon: CheckCircle2, accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-950' },
};

const bucketGuidance: Record<SimpleLeadBucket, string> = {
  open: 'Open contains unassigned demo requests.',
  in_progress: 'Teacher owns this bucket until the demo is completed.',
  admin_review: 'Teacher work is finished. Admin should review, follow up or close the lead.',
  closed: 'Final decision is saved. Admin tools remain available from the row menu.',
};

const isActiveTeacherStatus = (value: unknown): boolean => {
  const status = normalizeText(value).toLowerCase();
  return !['suspended', 'archived', 'inactive', 'terminated', 'disabled'].includes(status);
};

const rowTeacherWasAssigned = (row: SimpleRow): boolean => Boolean(row.demo?.assignedTeacherId);

export default function LeadsInquiriesWorkspaceV2({ view = 'leads', onViewChange }: LeadsInquiriesWorkspaceProps) {
  const { toast } = useToast();
  const [bucket, setBucket] = useState<SimpleLeadBucket>('open');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [demosLoaded, setDemosLoaded] = useState(false);
  const [demoPhones, setDemoPhones] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [assignRow, setAssignRow] = useState<SimpleRow | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [outcomeRow, setOutcomeRow] = useState<SimpleRow | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeFormState>(EMPTY_OUTCOME);
  const [outcomeSaving, setOutcomeSaving] = useState(false);
  const [editRow, setEditRow] = useState<SimpleRow | null>(null);
  const [editForm, setEditForm] = useState<LeadEditFormState>(EMPTY_EDIT_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  const {
    leads,
    isLoading: leadsLoading,
    closedCount,
    closedHistoryHasMore,
    isLoadingMoreClosed,
    loadMoreClosed,
    refreshClosedCount,
  } = useRealtimeLeads<LeadRecord>({
    includeClosed: bucket === 'closed',
    onNewWebsiteLeads: (newLeads) => {
      toast({
        title: newLeads.length === 1 ? 'New demo enquiry received' : `${newLeads.length} new demo enquiries received`,
        description: buildNewWebsiteLeadToastDescription(newLeads, 0),
      });
    },
    onError: (error) => toast({ title: 'Could not load enquiries', description: error.message, variant: 'destructive' }),
  });

  const scopedDemoIdsKey = useMemo(
    () => Array.from(new Set(leads.map((lead) => normalizeText(lead.demoSessionId)).filter(Boolean))).sort().join('|'),
    [leads],
  );

  useEffect(() => {
    setDemosLoaded(false);
    const demoIds = scopedDemoIdsKey ? scopedDemoIdsKey.split('|') : [];
    return listenDemoSessionsByIds(
      demoIds,
      (next) => { setDemos(next); setDemosLoaded(true); },
      (error) => {
        setDemosLoaded(true);
        toast({ title: 'Could not load demos', description: error.message, variant: 'destructive' });
      },
    );
  }, [scopedDemoIdsKey, toast]);

  const privatePhoneDemoIdsKey = useMemo(() => {
    const leadById = new Map(leads.map((lead) => [lead.id, lead]));
    return Array.from(new Set(
      demos.filter((demo) => {
        const lead = leadById.get(normalizeText(demo.leadId));
        return !normalizeText(lead?.primaryPhone || lead?.whatsappNumber || lead?.phoneNormalized);
      }).map((demo) => demo.id),
    )).sort().join('|');
  }, [demos, leads]);

  useEffect(() => {
    const demoIds = privatePhoneDemoIdsKey ? privatePhoneDemoIdsKey.split('|') : [];
    if (demoIds.length === 0) {
      setDemoPhones({});
      return undefined;
    }
    return listenDemoSessionPrivatePhonesByIds(
      demoIds,
      setDemoPhones,
      (error) => console.error('[LeadsInquiriesWorkspaceV2] compatibility demo phone load failed', error),
    );
  }, [privatePhoneDemoIdsKey]);

  const loadTeachersIfNeeded = useCallback(async () => {
    if (teachersLoaded || teachersLoading) return;
    setTeachersLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
      const next = snapshot.docs
        .map((item) => {
          const data = item.data() as Record<string, unknown>;
          if (!isActiveTeacherStatus(data.status) || data.isDeleted || data.archivedAt || data.deletedAt) return null;
          return { id: item.id, name: normalizeText(data.name || data.displayName || data.email) || 'Teacher' };
        })
        .filter((item): item is TeacherOption => Boolean(item))
        .sort((a, b) => a.name.localeCompare(b.name));
      setTeachers(next);
      setTeachersLoaded(true);
    } catch (error: any) {
      toast({ title: 'Could not load teachers', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setTeachersLoading(false);
    }
  }, [teachersLoaded, teachersLoading, toast]);

  const rows = useMemo<SimpleRow[]>(() => {
    const activeLeads = leads.filter((lead) => !isArchived(lead));
    const activeDemos = demos.filter((demo) => !isArchived(demo));
    const leadById = new Map(activeLeads.map((lead) => [lead.id, lead]));
    const identityToRealLeadIds = new Map<string, string[]>();

    activeLeads.forEach((lead) => {
      if (isSyntheticLeadId(lead.id)) return;
      const identity = buildLeadDemoUiIdentity(lead.primaryPhone || lead.whatsappNumber || lead.phoneNormalized, lead.childName);
      if (!identity) return;
      identityToRealLeadIds.set(identity, [...(identityToRealLeadIds.get(identity) || []), lead.id]);
    });

    const uniqueRealLeadForIdentity = (identity: string | null): string | null => {
      if (!identity) return null;
      const ids = identityToRealLeadIds.get(identity) || [];
      if (ids.length === 1) return ids[0];
      const canonical = ids.filter((id) => leadById.get(id)?.dedupeCanonicalLeadId === id);
      return canonical.length === 1 ? canonical[0] : null;
    };

    const effectiveLeadIdForDemo = new Map<string, string>();
    activeDemos.forEach((demo) => {
      const explicitLeadId = normalizeText(demo.leadId);
      if (explicitLeadId && !isSyntheticLeadId(explicitLeadId) && leadById.has(explicitLeadId)) {
        effectiveLeadIdForDemo.set(demo.id, explicitLeadId);
        return;
      }
      const explicitLead = explicitLeadId ? leadById.get(explicitLeadId) : undefined;
      const identityPhone = normalizeText(explicitLead?.primaryPhone || explicitLead?.whatsappNumber || explicitLead?.phoneNormalized) || demoPhones[demo.id];
      const recoveredLeadId = uniqueRealLeadForIdentity(buildLeadDemoUiIdentity(identityPhone, demo.childName));
      if (recoveredLeadId) effectiveLeadIdForDemo.set(demo.id, recoveredLeadId);
      else if (explicitLeadId && leadById.has(explicitLeadId)) effectiveLeadIdForDemo.set(demo.id, explicitLeadId);
    });

    const demoByLeadId = new Map<string, DemoSession>();
    activeDemos.forEach((demo) => {
      const effectiveLeadId = effectiveLeadIdForDemo.get(demo.id);
      if (!effectiveLeadId) return;
      const current = demoByLeadId.get(effectiveLeadId);
      if (!current || toMs(demo.lastUpdatedAt || demo.createdAt) > toMs(current.lastUpdatedAt || current.createdAt)) {
        demoByLeadId.set(effectiveLeadId, demo);
      }
    });

    const buildRow = (lead: LeadRecord | null, demo: DemoSession | null, id: string): SimpleRow => {
      const demoStatus = demo ? normalizeDemoStatus(demo.status) : '';
      const followUpAtMs = (demo ? parseDateInputMs(demo.followUpDate) : 0) || toMs(lead?.nextFollowUpAt);
      const createdAtMs = toMs(lead?.createdAt) || toMs(demo?.createdAt) || toMs(lead?.updatedAt) || toMs(demo?.lastUpdatedAt);
      const workflow = { leadStatus: lead?.status, demoStatus, conversionStatus: demo?.conversionStatus, hasDemo: Boolean(demo), hasFollowUp: followUpAtMs > 0 };
      return {
        id, lead, demo,
        bucket: resolveSimpleLeadBucket(workflow),
        parentName: normalizeText(demo?.parentName || lead?.parentName) || '—',
        childName: normalizeText(demo?.childName || lead?.childName) || '—',
        parentPhone: normalizeText(lead?.primaryPhone || lead?.whatsappNumber || lead?.phoneNormalized || (demo ? demoPhones[demo.id] : '')) || '—',
        course: normalizeText(demo?.courseInterested || lead?.programInterest) || formatTrack(lead?.interestTrack) || '—',
        source: normalizeText(demo?.source || lead?.source) || '—',
        teacherName: normalizeText(demo?.assignedTeacherName) || (demo?.assignedTeacherId ? 'Assigned teacher' : '—'),
        createdAtMs,
        updatedAtMs: Math.max(toMs(lead?.updatedAt || lead?.createdAt), toMs(demo?.lastUpdatedAt || demo?.createdAt)),
        followUpAtMs,
        statusLabel: resolveSimpleStatusLabel(workflow),
      };
    };

    const next: SimpleRow[] = [];
    activeLeads.forEach((lead) => {
      if (isSyntheticLeadId(lead.id)) {
        const demoId = normalizeText(lead.demoSessionId) || lead.id.slice('demo_'.length);
        const effectiveLeadId = effectiveLeadIdForDemo.get(demoId);
        if (effectiveLeadId && effectiveLeadId !== lead.id) return;
      }
      next.push(buildRow(lead, demoByLeadId.get(lead.id) || null, `lead_${lead.id}`));
    });
    activeDemos.forEach((demo) => {
      const effectiveLeadId = effectiveLeadIdForDemo.get(demo.id);
      if (effectiveLeadId && leadById.has(effectiveLeadId)) return;
      next.push(buildRow(null, demo, `demo_${demo.id}`));
    });
    return next;
  }, [demoPhones, demos, leads]);

  const monthOptions = useMemo(() => Array.from(new Set(rows.map((row) => monthKeyFromMs(row.createdAtMs)).filter(Boolean))).sort((a, b) => b.localeCompare(a)).map((value) => ({ value, label: formatMonthKey(value) })), [rows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const fromMs = dateBoundaryMs(dateFrom);
    const toMsInclusive = dateBoundaryMs(dateTo, true);
    return rows.filter((row) => {
      if (monthFilter !== 'all' && monthKeyFromMs(row.createdAtMs) !== monthFilter) return false;
      if (fromMs && row.createdAtMs < fromMs) return false;
      if (toMsInclusive && row.createdAtMs > toMsInclusive) return false;
      if (!needle) return true;
      return [row.parentName, row.childName, row.parentPhone, row.course, row.source, row.teacherName, row.statusLabel].join(' ').toLowerCase().includes(needle);
    });
  }, [dateFrom, dateTo, monthFilter, rows, search]);

  const filtersActive = Boolean(search.trim() || monthFilter !== 'all' || dateFrom || dateTo);
  const counts = useMemo(() => {
    const next = filteredRows.reduce((acc, row) => ({ ...acc, [row.bucket]: acc[row.bucket] + 1 }), { open: 0, in_progress: 0, admin_review: 0, closed: 0 });
    if (!filtersActive) next.closed = Math.max(next.closed, closedCount);
    return next;
  }, [closedCount, filteredRows, filtersActive]);

  const actionForRow = (row: SimpleRow): SimpleLeadAction => resolveSimpleLeadAction({
    leadStatus: row.lead?.status,
    demoStatus: row.demo ? normalizeDemoStatus(row.demo.status) : '',
    conversionStatus: row.demo?.conversionStatus,
    hasDemo: Boolean(row.demo),
    hasFollowUp: row.followUpAtMs > 0,
  });

  const visibleRows = useMemo(() => {
    const list = filteredRows.filter((row) => row.bucket === bucket);
    const rank: Record<SimpleLeadAction, number> = { review_outcome: 0, follow_up_lead: 1, assign_teacher: 1, awaiting_demo: 2, wait_teacher: 3, view_outcome: 4 };
    return list.sort((a, b) => {
      if (bucket === 'closed') return b.updatedAtMs - a.updatedAtMs;
      const actionDiff = rank[actionForRow(a)] - rank[actionForRow(b)];
      if (actionDiff !== 0) return actionDiff;
      if (a.followUpAtMs && b.followUpAtMs) return a.followUpAtMs - b.followUpAtMs;
      return a.updatedAtMs - b.updatedAtMs;
    });
  }, [bucket, filteredRows]);

  const clearFilters = () => { setSearch(''); setMonthFilter('all'); setDateFrom(''); setDateTo(''); };

  const openAssign = (row: SimpleRow) => {
    if (!row.demo) return;
    setAssignRow(row);
    setAssignTeacherId(row.demo.assignedTeacherId || '');
    void loadTeachersIfNeeded();
  };

  const submitAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignRow?.demo || !assignTeacherId) return;
    const teacher = teachers.find((item) => item.id === assignTeacherId);
    if (!teacher) return;
    setAssignSaving(true);
    try {
      await reassignDemoSession({ demoId: assignRow.demo.id, assignedTeacherId: teacher.id, assignedTeacherName: teacher.name });
      const wasAssigned = rowTeacherWasAssigned(assignRow);
      setAssignRow(null);
      toast({ title: wasAssigned ? 'Teacher reassigned' : 'Teacher assigned', description: 'The demo ownership state updates automatically.' });
    } catch (error: any) {
      toast({ title: 'Could not assign teacher', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { setAssignSaving(false); }
  };

  const openOutcome = (row: SimpleRow) => {
    if (!row.demo) return;
    setOutcomeRow(row);
    setOutcomeForm({
      conversionStatus: row.demo.conversionStatus || 'none',
      followUpDate: row.demo.followUpDate || '',
      recommendedCourse: row.demo.recommendedCourse || row.course || '',
      recommendedFrequency: row.demo.recommendedFrequency || '',
      feeDiscussed: row.demo.feeDiscussed || '',
      reason: row.demo.admissionNotConfirmedReason || '',
    });
  };

  const submitOutcome = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!outcomeRow?.demo || outcomeForm.conversionStatus === 'none') return;
    const conversionStatus = outcomeForm.conversionStatus as DemoConversionStatus;
    const needsFollowUp = isSimpleFollowUpDecision(conversionStatus);
    if (needsFollowUp && !outcomeForm.followUpDate) { toast({ title: 'Follow-up date required', variant: 'destructive' }); return; }
    if (simpleOutcomeNeedsReason(conversionStatus) && !outcomeForm.reason.trim()) { toast({ title: 'Add a short closing reason', variant: 'destructive' }); return; }
    setOutcomeSaving(true);
    try {
      await updateDemoConversion({
        demoId: outcomeRow.demo.id,
        conversionStatus,
        recommendedCourse: outcomeForm.recommendedCourse.trim() || null,
        recommendedFrequency: outcomeForm.recommendedFrequency.trim() || null,
        feeDiscussed: outcomeForm.feeDiscussed.trim() || null,
        followUpDate: needsFollowUp ? outcomeForm.followUpDate : null,
        admissionNotConfirmedReason: outcomeForm.reason.trim() || null,
      });
      const closesLead = ['enrolled', 'not_interested', 'wrong_fit', 'no_response'].includes(conversionStatus);
      if (closesLead) void refreshClosedCount();
      setOutcomeRow(null);
      toast({ title: closesLead ? 'Lead closed' : 'Admin follow-up saved', description: closesLead ? 'The final decision moves this lead to Closed automatically.' : 'This lead remains in Admin Review until a final decision is saved.' });
    } catch (error: any) {
      toast({ title: 'Could not save decision', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { setOutcomeSaving(false); }
  };

  const openEdit = (row: SimpleRow) => {
    setEditRow(row);
    setEditForm({
      parentName: row.parentName === '—' ? '' : row.parentName,
      parentPhone: row.parentPhone === '—' ? '' : row.parentPhone,
      parentEmail: row.lead?.parentEmail || '',
      childName: row.childName === '—' ? '' : row.childName,
      childAge: typeof row.demo?.childAge === 'number' ? String(row.demo.childAge) : typeof row.lead?.childAge === 'number' ? String(row.lead.childAge) : '',
      childGrade: normalizeText(row.demo?.childGrade || row.lead?.childGrade),
      course: row.course === '—' ? '' : row.course,
      source: row.source === '—' ? 'Manual' : row.source,
      preferredTimingText: normalizeText(row.demo?.preferredDateTimeText || row.lead?.preferredTimingText),
      timezone: normalizeText(row.demo?.timezone || row.lead?.timezone) || 'IST',
      notes: normalizeText(row.demo?.adminNotes || row.lead?.notes),
    });
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editRow) return;
    if (!editForm.parentName.trim() || !editForm.parentPhone.trim() || !editForm.childName.trim() || !editForm.course.trim()) {
      toast({ title: 'Required details missing', description: 'Parent name, phone, child name and course are required.', variant: 'destructive' }); return;
    }
    const ageText = editForm.childAge.trim();
    const childAge = ageText ? Number(ageText) : null;
    if (ageText && (!Number.isFinite(childAge) || Number(childAge) < 0)) { toast({ title: 'Enter a valid child age', variant: 'destructive' }); return; }
    setEditSaving(true);
    try {
      await adminUpdateLeadWorkflowRecord({
        leadId: editRow.lead?.id || null, demoId: editRow.demo?.id || null,
        parentName: editForm.parentName.trim(), parentPhone: editForm.parentPhone.trim(), parentEmail: editForm.parentEmail.trim() || null,
        childName: editForm.childName.trim(), childAge, childGrade: editForm.childGrade.trim() || null,
        course: editForm.course.trim(), source: editForm.source.trim() || null,
        preferredTimingText: editForm.preferredTimingText.trim() || null, timezone: editForm.timezone.trim() || null, notes: editForm.notes.trim() || null,
      });
      setEditRow(null);
      toast({ title: 'Lead updated', description: 'The lead and linked demo details are now in sync.' });
    } catch (error: any) {
      toast({ title: 'Could not update lead', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { setEditSaving(false); }
  };

  const deleteRow = async (row: SimpleRow) => {
    if (deletingRowId) return;
    if (!window.confirm(`Delete ${row.parentName} / ${row.childName} from Leads & Enquiries?\n\nThis removes the record from the active workflow. Demo audit and financial history are preserved.`)) return;
    setDeletingRowId(row.id);
    try {
      await adminDeleteLeadWorkflowRecord({ leadId: row.lead?.id || null, demoId: row.demo?.id || null });
      if (row.bucket === 'closed') void refreshClosedCount();
      toast({ title: 'Lead deleted', description: 'The record was removed from the active leads workflow.' });
    } catch (error: any) {
      toast({ title: 'Could not delete lead', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally { setDeletingRowId(null); }
  };

  const renderAction = (row: SimpleRow) => {
    const action = actionForRow(row);
    if (action === 'awaiting_demo') return <Badge variant="outline" className="px-3 py-2">Preparing demo…</Badge>;
    if (action === 'assign_teacher') return <Button size="sm" onClick={() => openAssign(row)}>Assign teacher</Button>;
    if (action === 'wait_teacher') return <Badge variant="outline" className="px-3 py-2">With teacher</Badge>;
    if (action === 'follow_up_lead') return <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Open details</Button>;
    if (action === 'review_outcome') return <Button size="sm" onClick={() => openOutcome(row)}>{isSimpleFollowUpDecision(row.demo?.conversionStatus) ? 'Update follow-up' : 'Review & update'}</Button>;
    return <Button size="sm" variant="outline" onClick={() => openOutcome(row)}>View outcome</Button>;
  };

  if (view === 'demos') {
    return <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-semibold text-slate-900">Legacy / bulk tools</p><p className="text-sm text-slate-500">Reserved for exceptional corrections, exports and old-data maintenance.</p></div>
        <Button variant="outline" onClick={() => onViewChange?.('leads')}>Back to Leads & Enquiries</Button>
      </Card>
      <LegacyLeadsInquiriesWorkspace view="leads" />
    </div>;
  }

  const loading = leadsLoading || !demosLoaded;
  const showLoadMoreClosed = bucket === 'closed' && closedHistoryHasMore;

  return <div className="space-y-4">
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-950">Leads & Enquiries</h1><p className="mt-1 text-sm text-slate-600">Open → With Teacher → Admin Review → Closed.</p></div>
        <Button variant="outline" className="gap-2" onClick={() => onViewChange?.('demos')}><Settings2 className="h-4 w-4" /> Legacy / bulk tools</Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(['open', 'in_progress', 'admin_review', 'closed'] as SimpleLeadBucket[]).map((item) => {
          const meta = bucketMeta[item]; const Icon = meta.icon;
          return <button key={item} type="button" onClick={() => setBucket(item)} className={`rounded-xl border p-4 text-left transition ${meta.accent} ${bucket === item ? 'ring-2 ring-slate-900/10 shadow-sm' : 'hover:shadow-sm'}`}>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5" />{meta.title}</div><span className="text-2xl font-bold">{loading ? '—' : counts[item]}</span></div>
            <p className="mt-2 text-sm opacity-75">{meta.subtitle}</p>
          </button>;
        })}
      </div>
    </Card>

    <Card className="p-4"><div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_160px_auto] lg:items-end">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parent, child, phone, course or teacher" className="pl-9" /></div>
      <div><Label className="mb-1 block text-xs text-slate-500">Enquiry month</Label><Select value={monthFilter} onValueChange={setMonthFilter}><SelectTrigger aria-label="Filter by enquiry month"><SelectValue placeholder="All months" /></SelectTrigger><SelectContent><SelectItem value="all">All months</SelectItem>{monthOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="lead-date-from" className="mb-1 block text-xs text-slate-500">From date</Label><Input id="lead-date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div>
      <div><Label htmlFor="lead-date-to" className="mb-1 block text-xs text-slate-500">To date</Label><Input id="lead-date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></div>
      <Button type="button" variant="outline" onClick={clearFilters} disabled={!filtersActive}>Clear</Button>
    </div></Card>

    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div><h2 className="font-semibold text-slate-950">{bucketMeta[bucket].title}</h2><p className="text-sm text-slate-500">{loading ? 'Checking workflow…' : bucket === 'closed' && !filtersActive && closedCount > visibleRows.length ? `${visibleRows.length} of ${closedCount} closed leads loaded` : `${visibleRows.length} lead${visibleRows.length === 1 ? '' : 's'} in this list`}</p></div>
        {!loading && <p className="text-xs font-medium text-slate-500">{bucketGuidance[bucket]}</p>}
      </div>
      {loading ? <div className="p-8 text-center text-sm text-slate-500">Loading leads and demo ownership…</div> : visibleRows.length === 0 ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 font-medium text-slate-700">Nothing here right now.</p>{showLoadMoreClosed && <div className="mt-4"><Button type="button" variant="outline" onClick={() => void loadMoreClosed()} disabled={isLoadingMoreClosed}>{isLoadingMoreClosed ? 'Loading older leads…' : 'Check older closed leads'}</Button></div>}</div> : <div>
        <div className="divide-y">{visibleRows.map((row) => <div key={row.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.35fr_1fr_1fr_1fr_auto] lg:items-center">
          <div><div className="font-semibold text-slate-950">{row.parentName}</div><div className="text-sm text-slate-600">{row.childName} · {row.parentPhone}</div></div>
          <div><div className="text-sm font-medium text-slate-800">{row.course}</div><div className="text-xs text-slate-500">{row.source}</div></div>
          <div><div className="text-sm font-medium text-slate-800">{row.teacherName}</div><div className="text-xs text-slate-500">Teacher</div></div>
          <div><Badge variant="outline">{row.statusLabel}</Badge><div className="mt-1 text-xs text-slate-500">{row.followUpAtMs ? `Follow-up ${formatFollowUp(row.followUpAtMs)}` : `Updated ${formatUpdated(row.updatedAtMs)}`}</div></div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {row.parentPhone !== '—' && <Button size="sm" variant="ghost" className="gap-1" onClick={() => window.open(buildWhatsAppUrl(row.parentPhone), '_blank', 'noopener,noreferrer')}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>}
            {renderAction(row)}
            <LeadAdminToolsMenu row={row as any} deleting={deletingRowId === row.id} onEdit={() => openEdit(row)} onDelete={() => void deleteRow(row)} onReassign={() => openAssign(row)} onOutcome={() => openOutcome(row)} onWorkflowChanged={() => { if (row.bucket === 'closed') void refreshClosedCount(); }} />
          </div>
        </div>)}</div>
        {showLoadMoreClosed && <div className="border-t px-4 py-4 text-center"><Button type="button" variant="outline" onClick={() => void loadMoreClosed()} disabled={isLoadingMoreClosed}>{isLoadingMoreClosed ? 'Loading older leads…' : 'Load older closed leads'}</Button><p className="mt-2 text-xs text-slate-500">Older closed history loads only when requested.</p></div>}
      </div>}
    </Card>

    <Dialog open={Boolean(assignRow)} onOpenChange={(open) => !open && setAssignRow(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{assignRow && rowTeacherWasAssigned(assignRow) ? 'Reassign teacher' : 'Assign teacher'}</DialogTitle><DialogDescription>Teacher options load only when this dialog is opened; there is no background teacher listener.</DialogDescription></DialogHeader><form onSubmit={submitAssign} className="space-y-4"><div className="rounded-lg bg-slate-50 p-3 text-sm"><span className="font-semibold">{assignRow?.childName}</span> · {assignRow?.course}</div><div><Label>Teacher *</Label><Select value={assignTeacherId} onValueChange={setAssignTeacherId}><SelectTrigger className="mt-1"><SelectValue placeholder={teachersLoading ? 'Loading teachers…' : teachersLoaded ? 'Select active teacher' : 'Teacher list not loaded'} /></SelectTrigger><SelectContent>{teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}</SelectContent></Select></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAssignRow(null)}>Cancel</Button><Button type="submit" disabled={teachersLoading || !teachersLoaded || !assignTeacherId || assignSaving}>{assignSaving ? 'Saving…' : assignRow && rowTeacherWasAssigned(assignRow) ? 'Reassign teacher' : 'Assign teacher'}</Button></div></form></DialogContent></Dialog>

    <Dialog open={Boolean(outcomeRow)} onOpenChange={(open) => !open && setOutcomeRow(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{outcomeRow?.bucket === 'closed' ? 'Outcome' : 'Review teacher response & update'}</DialogTitle><DialogDescription>{outcomeRow?.bucket === 'closed' ? 'The final workflow decision is read-only here. Admin tools remain available from the row menu.' : 'Teacher completion is in Admin Review. Save a final decision to close, or a follow-up decision to keep it here.'}</DialogDescription></DialogHeader>
      {outcomeRow?.demo && <div className="rounded-xl border bg-slate-50 p-4 text-sm"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher response</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><div><span className="text-slate-500">Remarks:</span> {outcomeRow.demo.teacherRemarks || 'Not submitted yet'}</div><div><span className="text-slate-500">Recommendation:</span> {outcomeRow.demo.teacherRecommendation || '—'}</div><div><span className="text-slate-500">Next step:</span> {formatTrack(outcomeRow.demo.recommendedNextStep) || '—'}</div><div><span className="text-slate-500">Demo outcome:</span> {formatTrack(outcomeRow.demo.outcome) || '—'}</div></div></div>}
      {outcomeRow?.bucket === 'closed' ? <div className="space-y-4"><div className="rounded-xl border p-4"><Badge>{outcomeRow.statusLabel}</Badge>{outcomeRow.demo?.admissionNotConfirmedReason && <p className="mt-3 text-sm text-slate-700">{outcomeRow.demo.admissionNotConfirmedReason}</p>}</div><div className="flex justify-end"><Button variant="outline" onClick={() => setOutcomeRow(null)}>Close</Button></div></div> : <form onSubmit={submitOutcome} className="space-y-4"><div><Label>Admin decision *</Label><Select value={outcomeForm.conversionStatus} onValueChange={(value) => setOutcomeForm((current) => ({ ...current, conversionStatus: value as DemoConversionStatus | 'none' }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not decided</SelectItem>{OUTCOME_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{outcomeForm.conversionStatus !== 'none' && <p className="mt-1 text-xs text-slate-500">{OUTCOME_OPTIONS.find((item) => item.value === outcomeForm.conversionStatus)?.help}</p>}</div>
        {isSimpleFollowUpDecision(outcomeForm.conversionStatus) && <div><Label>Next follow-up date *</Label><Input type="date" className="mt-1" value={outcomeForm.followUpDate} onChange={(event) => setOutcomeForm((current) => ({ ...current, followUpDate: event.target.value }))} /></div>}
        <div className="grid gap-3 sm:grid-cols-2"><div><Label>Fee discussed</Label><Input className="mt-1" value={outcomeForm.feeDiscussed} onChange={(event) => setOutcomeForm((current) => ({ ...current, feeDiscussed: event.target.value }))} placeholder="Example: ₹4,800 / 12 classes" /></div><div><Label>Recommended course</Label><Input className="mt-1" value={outcomeForm.recommendedCourse} onChange={(event) => setOutcomeForm((current) => ({ ...current, recommendedCourse: event.target.value }))} /></div><div><Label>Recommended frequency</Label><Input className="mt-1" value={outcomeForm.recommendedFrequency} onChange={(event) => setOutcomeForm((current) => ({ ...current, recommendedFrequency: event.target.value }))} placeholder="Example: 3 classes / week" /></div></div>
        <div><Label>{simpleOutcomeNeedsReason(outcomeForm.conversionStatus) ? 'Reason / note *' : 'Reason / note'}</Label><Textarea className="mt-1" value={outcomeForm.reason} onChange={(event) => setOutcomeForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Add only what the next admin needs to know" /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOutcomeRow(null)}>Cancel</Button><Button type="submit" disabled={outcomeSaving || outcomeForm.conversionStatus === 'none'}>{outcomeSaving ? 'Saving…' : 'Save decision'}</Button></div></form>}
    </DialogContent></Dialog>

    <Dialog open={Boolean(editRow)} onOpenChange={(open) => !open && setEditRow(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Edit lead information</DialogTitle><DialogDescription>Update parent, child and enquiry details. Workflow status and teacher outcome are not changed here.</DialogDescription></DialogHeader><form onSubmit={submitEdit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><div><Label>Parent name *</Label><Input className="mt-1" value={editForm.parentName} onChange={(event) => setEditForm((current) => ({ ...current, parentName: event.target.value }))} /></div><div><Label>Parent phone *</Label><Input className="mt-1" value={editForm.parentPhone} onChange={(event) => setEditForm((current) => ({ ...current, parentPhone: event.target.value }))} /></div><div className="sm:col-span-2"><Label>Parent email</Label><Input type="email" className="mt-1" value={editForm.parentEmail} onChange={(event) => setEditForm((current) => ({ ...current, parentEmail: event.target.value }))} /></div></div>
      <div className="grid gap-3 sm:grid-cols-3"><div><Label>Child name *</Label><Input className="mt-1" value={editForm.childName} onChange={(event) => setEditForm((current) => ({ ...current, childName: event.target.value }))} /></div><div><Label>Child age</Label><Input inputMode="numeric" className="mt-1" value={editForm.childAge} onChange={(event) => setEditForm((current) => ({ ...current, childAge: event.target.value }))} /></div><div><Label>Child grade</Label><Input className="mt-1" value={editForm.childGrade} onChange={(event) => setEditForm((current) => ({ ...current, childGrade: event.target.value }))} /></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><Label>Course *</Label><Input className="mt-1" value={editForm.course} onChange={(event) => setEditForm((current) => ({ ...current, course: event.target.value }))} /></div><div><Label>Source</Label><Input className="mt-1" value={editForm.source} onChange={(event) => setEditForm((current) => ({ ...current, source: event.target.value }))} /></div><div className="sm:col-span-2"><Label>Preferred timing</Label><Input className="mt-1" value={editForm.preferredTimingText} onChange={(event) => setEditForm((current) => ({ ...current, preferredTimingText: event.target.value }))} /></div><div><Label>Timezone</Label><Input className="mt-1" value={editForm.timezone} onChange={(event) => setEditForm((current) => ({ ...current, timezone: event.target.value }))} /></div></div>
      <div><Label>Admin notes</Label><Textarea className="mt-1" rows={4} value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditRow(null)}>Cancel</Button><Button type="submit" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</Button></div>
    </form></DialogContent></Dialog>
  </div>;
}
