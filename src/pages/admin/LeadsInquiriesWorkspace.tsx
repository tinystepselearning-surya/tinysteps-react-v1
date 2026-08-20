import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { ArrowRight, CheckCircle2, CircleDot, Clock3, Filter, MessageCircle, Plus, Search, Settings2 } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import { DEFAULT_PHONE_COUNTRY_CODE, buildPhoneFromParts, splitPhoneForForm } from '../../lib/phone';
import { normalizeDemoStatus } from '../../lib/statuses';
import { useAuthStore } from '../../store/useAuthStore';
import type { DemoConversionStatus, DemoSession } from '../../types/models';
import {
  checkDemoPhoneConflicts,
  createDemoSession,
  listenAllDemoSessions,
  listenDemoSessionPrivatePhones,
  reassignDemoSession,
  updateDemoConversion,
} from '../../services/demoSessionsService';
import { buildNewWebsiteLeadToastDescription, useRealtimeLeads } from './leadsRealtime';
import LegacyLeadsInquiriesWorkspace from './LeadsInquiriesWorkspaceLegacy';
import {
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
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

type LeadType = '1:1' | 'Group Class';

interface LeadRecord {
  id: string;
  archived?: boolean;
  parentName?: string;
  primaryPhone?: string;
  phoneNormalized?: string;
  childName?: string;
  childAge?: number | null;
  childGrade?: string | null;
  interestTrack?: string | null;
  programInterest?: string | null;
  source?: string | null;
  preferredTimingText?: string | null;
  timezone?: string | null;
  status?: LeadStatus | null;
  notes?: string | null;
  demoSessionId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
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
  updatedAtMs: number;
  statusLabel: string;
}

interface DemoFormState {
  parentName: string;
  countryCode: string;
  phoneLocal: string;
  childName: string;
  childGrade: string;
  childAge: string;
  course: string;
  source: string;
  leadType: LeadType;
  preferredTime: string;
  timezone: string;
  notes: string;
}

interface OutcomeFormState {
  conversionStatus: DemoConversionStatus | 'none';
  followUpDate: string;
  recommendedCourse: string;
  recommendedFrequency: string;
  feeDiscussed: string;
  reason: string;
}

interface LeadsInquiriesWorkspaceProps {
  view?: LeadsWorkspaceView;
  onViewChange?: (nextView: LeadsWorkspaceView) => void;
}

const COURSE_OPTIONS = ['Phonics', 'Grammar', 'Public Speaking', 'Reading', 'Writing', 'Combo', 'Not Sure Yet'];
const SOURCE_OPTIONS = ['Website', 'WhatsApp', 'Referral', 'Instagram', 'Facebook', 'Existing Parent', 'Other'];
const OUTCOME_OPTIONS: Array<{ value: DemoConversionStatus; label: string; help: string }> = [
  { value: 'interested', label: 'Interested — follow up', help: 'Keep this lead in In Progress.' },
  { value: 'follow_up_later', label: 'Follow up later', help: 'Keep this lead in In Progress.' },
  { value: 'enrolled', label: 'Enrolled', help: 'Move this lead to Closed.' },
  { value: 'not_interested', label: 'Not interested', help: 'Move this lead to Closed.' },
  { value: 'wrong_fit', label: 'Wrong fit', help: 'Move this lead to Closed.' },
  { value: 'no_response', label: 'No response', help: 'Move this lead to Closed.' },
];

const EMPTY_OUTCOME_FORM: OutcomeFormState = {
  conversionStatus: 'none',
  followUpDate: '',
  recommendedCourse: '',
  recommendedFrequency: '',
  feeDiscussed: '',
  reason: '',
};

const normalizeText = (value: unknown): string => String(value || '').trim();
const normalizePhone = (value: string): string => value.replace(/[^\d]/g, '');
const isArchived = (value: unknown): boolean => Boolean(value && typeof value === 'object' && (value as { archived?: boolean }).archived);

const toMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as { toMillis?: () => number; seconds?: number };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.seconds === 'number') return timestamp.seconds * 1000;
  }
  if (typeof value === 'number') return value;
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatUpdated = (ms: number): string => {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms));
};

const formatTrack = (value: string): string =>
  value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const toDemoSource = (value: string): string => {
  const source = value.trim().toLowerCase();
  if (source === 'website') return 'Website';
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'instagram') return 'Instagram';
  if (source === 'referral') return 'Referral';
  return value || 'Website';
};

const buildEmptyDemoForm = (): DemoFormState => ({
  parentName: '',
  countryCode: DEFAULT_PHONE_COUNTRY_CODE,
  phoneLocal: '',
  childName: '',
  childGrade: '',
  childAge: '',
  course: 'Phonics',
  source: 'Website',
  leadType: '1:1',
  preferredTime: '',
  timezone: 'IST',
  notes: '',
});

const buildDemoFormFromLead = (lead: LeadRecord): DemoFormState => {
  const phone = splitPhoneForForm(lead.primaryPhone || lead.phoneNormalized || '');
  return {
    parentName: lead.parentName || '',
    countryCode: phone.countryCode,
    phoneLocal: phone.phoneLocal,
    childName: lead.childName || '',
    childGrade: lead.childGrade || '',
    childAge: typeof lead.childAge === 'number' ? String(lead.childAge) : '',
    course: lead.programInterest || (lead.interestTrack ? formatTrack(lead.interestTrack) : 'Phonics'),
    source: toDemoSource(lead.source || 'Website'),
    leadType: '1:1',
    preferredTime: lead.preferredTimingText || '',
    timezone: lead.timezone || 'IST',
    notes: lead.notes || '',
  };
};

const mapConversionToLeadStatus = (status: DemoConversionStatus): LeadStatus => {
  if (status === 'enrolled') return 'admitted_confirmed';
  if (status === 'interested' || status === 'follow_up_later') return 'admission_follow_up';
  if (status === 'not_interested') return 'not_interested';
  if (status === 'wrong_fit') return 'wrong_fit';
  return 'no_response';
};

const buildWhatsAppUrl = (phone: string): string => `https://wa.me/${normalizePhone(phone)}`;

const bucketMeta: Record<SimpleLeadBucket, { title: string; subtitle: string; icon: React.ElementType; accent: string }> = {
  open: {
    title: 'Open',
    subtitle: 'Needs action now',
    icon: CircleDot,
    accent: 'border-blue-200 bg-blue-50/70 text-blue-950',
  },
  in_progress: {
    title: 'In Progress',
    subtitle: 'Assigned, waiting or following up',
    icon: Clock3,
    accent: 'border-amber-200 bg-amber-50/70 text-amber-950',
  },
  closed: {
    title: 'Closed',
    subtitle: 'Finished by admin',
    icon: CheckCircle2,
    accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
  },
};

export default function LeadsInquiriesWorkspace({ view = 'leads', onViewChange }: LeadsInquiriesWorkspaceProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [bucket, setBucket] = useState<SimpleLeadBucket>('open');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [demoPhones, setDemoPhones] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [demoLeadId, setDemoLeadId] = useState<string | null>(null);
  const [demoForm, setDemoForm] = useState<DemoFormState>(buildEmptyDemoForm());
  const [demoSaving, setDemoSaving] = useState(false);
  const [assignRow, setAssignRow] = useState<SimpleRow | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [outcomeRow, setOutcomeRow] = useState<SimpleRow | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeFormState>(EMPTY_OUTCOME_FORM);
  const [outcomeSaving, setOutcomeSaving] = useState(false);

  const { leads, isLoading } = useRealtimeLeads<LeadRecord>({
    onNewWebsiteLeads: (newLeads) => {
      toast({
        title: newLeads.length === 1 ? 'New enquiry received' : `${newLeads.length} new enquiries received`,
        description: buildNewWebsiteLeadToastDescription(newLeads, 0),
      });
    },
    onError: (error) => {
      toast({ title: 'Could not load enquiries', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    const stopDemos = listenAllDemoSessions(
      setDemos,
      (error) => toast({ title: 'Could not load demos', description: error.message, variant: 'destructive' }),
    );
    const stopPhones = listenDemoSessionPrivatePhones(setDemoPhones);
    return () => {
      stopDemos();
      stopPhones();
    };
  }, [toast]);

  useEffect(() => {
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    return onSnapshot(teachersQuery, (snapshot) => {
      const next = snapshot.docs
        .map((item) => {
          const data = item.data() as Record<string, unknown>;
          const status = normalizeText(data.status).toLowerCase();
          if (status === 'archived' || data.isDeleted || data.archivedAt || data.deletedAt) return null;
          return {
            id: item.id,
            name: normalizeText(data.name) || normalizeText(data.displayName) || normalizeText(data.email) || 'Teacher',
          };
        })
        .filter((item): item is TeacherOption => Boolean(item))
        .sort((a, b) => a.name.localeCompare(b.name));
      setTeachers(next);
    });
  }, []);

  const rows = useMemo<SimpleRow[]>(() => {
    const activeLeads = leads.filter((lead) => !isArchived(lead));
    const activeDemos = demos.filter((demo) => !isArchived(demo));
    const leadById = new Map(activeLeads.map((lead) => [lead.id, lead]));
    const demoByLeadId = new Map<string, DemoSession>();

    activeDemos.forEach((demo) => {
      const leadId = normalizeText(demo.leadId);
      if (!leadId) return;
      const current = demoByLeadId.get(leadId);
      if (!current || toMs(demo.lastUpdatedAt || demo.createdAt) > toMs(current.lastUpdatedAt || current.createdAt)) {
        demoByLeadId.set(leadId, demo);
      }
    });

    const buildRow = (lead: LeadRecord | null, demo: DemoSession | null, id: string): SimpleRow => {
      const demoStatus = demo ? normalizeDemoStatus(demo.status) : '';
      const input = {
        leadStatus: lead?.status,
        demoStatus,
        conversionStatus: demo?.conversionStatus,
        hasDemo: Boolean(demo),
      };
      return {
        id,
        lead,
        demo,
        bucket: resolveSimpleLeadBucket(input),
        parentName: normalizeText(demo?.parentName) || normalizeText(lead?.parentName) || '—',
        childName: normalizeText(demo?.childName) || normalizeText(lead?.childName) || '—',
        parentPhone:
          normalizeText(demo ? demoPhones[demo.id] : '') ||
          normalizeText(lead?.primaryPhone) ||
          normalizeText(lead?.phoneNormalized) ||
          '—',
        course:
          normalizeText(demo?.courseInterested) ||
          normalizeText(lead?.programInterest) ||
          (normalizeText(lead?.interestTrack) ? formatTrack(normalizeText(lead?.interestTrack)) : '—'),
        source: normalizeText(demo?.source) || normalizeText(lead?.source) || '—',
        teacherName:
          normalizeText(demo?.assignedTeacherName) || (normalizeText(demo?.assignedTeacherId) ? 'Assigned teacher' : '—'),
        updatedAtMs: Math.max(toMs(lead?.updatedAt || lead?.createdAt), toMs(demo?.lastUpdatedAt || demo?.createdAt)),
        statusLabel: resolveSimpleStatusLabel(input),
      };
    };

    const next: SimpleRow[] = activeLeads.map((lead) => {
      const linkedDemo =
        demoByLeadId.get(lead.id) ||
        (lead.demoSessionId ? activeDemos.find((demo) => demo.id === lead.demoSessionId) || null : null);
      return buildRow(lead, linkedDemo, `lead_${lead.id}`);
    });

    activeDemos.forEach((demo) => {
      const leadId = normalizeText(demo.leadId);
      if (leadId && leadById.has(leadId)) return;
      next.push(buildRow(null, demo, `demo_${demo.id}`));
    });

    return next.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [demos, demoPhones, leads]);

  const counts = useMemo(
    () => rows.reduce((acc, row) => ({ ...acc, [row.bucket]: acc[row.bucket] + 1 }), { open: 0, in_progress: 0, closed: 0 }),
    [rows],
  );

  const courseOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.course).filter((value) => value && value !== '—'))).sort(),
    [rows],
  );
  const teacherOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.teacherName).filter((value) => value && value !== '—' && value !== 'Assigned teacher'))).sort(),
    [rows],
  );

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.bucket !== bucket) return false;
      if (courseFilter !== 'all' && row.course !== courseFilter) return false;
      if (teacherFilter !== 'all' && row.teacherName !== teacherFilter) return false;
      if (!needle) return true;
      return [row.parentName, row.childName, row.parentPhone, row.course, row.source, row.teacherName, row.statusLabel]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [bucket, courseFilter, rows, search, teacherFilter]);

  if (view === 'demos') {
    return (
      <div className="space-y-3">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-slate-900">Advanced leads workspace</p>
            <p className="text-sm text-slate-500">Use this only for detailed records, exports or exceptional corrections.</p>
          </div>
          <Button variant="outline" onClick={() => onViewChange?.('leads')}>Back to simple view</Button>
        </Card>
        <LegacyLeadsInquiriesWorkspace view="leads" />
      </div>
    );
  }

  const openNewDemo = (lead?: LeadRecord | null) => {
    if (lead) {
      setDemoLeadId(lead.id);
      setDemoForm(buildDemoFormFromLead(lead));
    } else {
      setDemoLeadId(null);
      setDemoForm(buildEmptyDemoForm());
    }
    setDemoDialogOpen(true);
  };

  const submitDemo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;
    const parentPhone = buildPhoneFromParts(demoForm.countryCode, demoForm.phoneLocal);
    const childAge = demoForm.childAge.trim() ? Number(demoForm.childAge) : null;
    if (!demoForm.parentName.trim() || !parentPhone || !demoForm.childName.trim() || !demoForm.childGrade.trim() || !demoForm.course.trim() || !demoForm.preferredTime.trim()) {
      toast({ title: 'Complete the required fields', description: 'Parent, phone, child, grade, course and preferred time are required.', variant: 'destructive' });
      return;
    }
    if (demoForm.childAge.trim() && Number.isNaN(childAge)) {
      toast({ title: 'Child age must be a number', variant: 'destructive' });
      return;
    }

    let forceCreate = false;
    try {
      const conflicts = await checkDemoPhoneConflicts(parentPhone);
      if (conflicts.hasConflicts) {
        const proceed = window.confirm('This phone already exists in Tiny Steps records. Create another demo request anyway?');
        if (!proceed) return;
        forceCreate = true;
      }
    } catch (error: any) {
      toast({ title: 'Could not verify the phone number', description: error?.message || 'Please try again.', variant: 'destructive' });
      return;
    }

    setDemoSaving(true);
    try {
      await createDemoSession(
        {
          parentName: demoForm.parentName.trim(),
          parentPhone,
          forceCreate,
          childName: demoForm.childName.trim(),
          childGrade: demoForm.childGrade.trim(),
          childAge,
          courseInterested: demoForm.course,
          source: demoForm.source,
          leadType: demoForm.leadType,
          preferredDateTimeText: demoForm.preferredTime.trim(),
          requestReceivedDate: new Date().toISOString().slice(0, 10),
          timezone: demoForm.timezone.trim() || null,
          adminNotes: demoForm.notes.trim() || null,
          leadId: demoLeadId,
        },
        user.uid,
      );
      setDemoDialogOpen(false);
      toast({ title: 'Demo request created', description: 'It is now in the Open pool, ready to assign.' });
    } catch (error: any) {
      toast({ title: 'Could not create demo', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setDemoSaving(false);
    }
  };

  const openAssign = (row: SimpleRow) => {
    setAssignRow(row);
    setAssignTeacherId(row.demo?.assignedTeacherId || '');
  };

  const submitAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignRow?.demo || !assignTeacherId) return;
    const teacher = teachers.find((item) => item.id === assignTeacherId);
    setAssignSaving(true);
    try {
      await reassignDemoSession({
        demoId: assignRow.demo.id,
        assignedTeacherId: assignTeacherId,
        assignedTeacherName: teacher?.name,
      });
      setAssignRow(null);
      toast({ title: 'Teacher assigned', description: 'This lead has moved to In Progress.' });
    } catch (error: any) {
      toast({ title: 'Could not assign teacher', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setAssignSaving(false);
    }
  };

  const openOutcome = (row: SimpleRow) => {
    setOutcomeRow(row);
    setOutcomeForm({
      conversionStatus: row.demo?.conversionStatus || 'none',
      followUpDate: row.demo?.followUpDate || '',
      recommendedCourse: row.demo?.recommendedCourse || row.course || '',
      recommendedFrequency: row.demo?.recommendedFrequency || '',
      feeDiscussed: row.demo?.feeDiscussed || '',
      reason: row.demo?.admissionNotConfirmedReason || '',
    });
  };

  const submitOutcome = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!outcomeRow?.demo || outcomeForm.conversionStatus === 'none') {
      toast({ title: 'Select an admin decision', variant: 'destructive' });
      return;
    }
    const conversionStatus = outcomeForm.conversionStatus as DemoConversionStatus;
    setOutcomeSaving(true);
    try {
      await updateDemoConversion({
        demoId: outcomeRow.demo.id,
        conversionStatus,
        recommendedCourse: outcomeForm.recommendedCourse.trim() || null,
        recommendedFrequency: outcomeForm.recommendedFrequency.trim() || null,
        feeDiscussed: outcomeForm.feeDiscussed.trim() || null,
        followUpDate: outcomeForm.followUpDate || null,
        admissionNotConfirmedReason: outcomeForm.reason.trim() || null,
      });
      if (outcomeRow.lead?.id && user?.uid) {
        await updateDoc(doc(db, 'leads', outcomeRow.lead.id), {
          status: mapConversionToLeadStatus(conversionStatus),
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      const nextBucket = resolveSimpleLeadBucket({ conversionStatus, demoStatus: outcomeRow.demo.status });
      setOutcomeRow(null);
      toast({
        title: nextBucket === 'closed' ? 'Lead closed' : 'Follow-up saved',
        description: nextBucket === 'closed' ? 'This lead has moved to Closed.' : 'This lead remains in In Progress until the final decision.',
      });
    } catch (error: any) {
      toast({ title: 'Could not save outcome', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setOutcomeSaving(false);
    }
  };

  const renderPrimaryAction = (row: SimpleRow) => {
    const action = resolveSimpleLeadAction({
      leadStatus: row.lead?.status,
      demoStatus: row.demo ? normalizeDemoStatus(row.demo.status) : '',
      conversionStatus: row.demo?.conversionStatus,
      hasDemo: Boolean(row.demo),
    });
    if (action === 'create_demo') return <Button size="sm" onClick={() => openNewDemo(row.lead)}>Create demo</Button>;
    if (action === 'assign_teacher') return <Button size="sm" onClick={() => openAssign(row)}>Assign teacher</Button>;
    if (action === 'wait_teacher') return <Badge variant="outline" className="whitespace-nowrap px-3 py-2">Waiting for teacher</Badge>;
    if (action === 'review_outcome') return <Button size="sm" onClick={() => openOutcome(row)}>Review & update</Button>;
    return <Button size="sm" variant="outline" onClick={() => openOutcome(row)}>View outcome</Button>;
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950">Leads & Enquiries</h1>
            <p className="mt-1 text-sm text-slate-600">One simple rule: work from Open → In Progress → Closed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openNewDemo()} className="gap-2"><Plus className="h-4 w-4" />New demo request</Button>
            <Button variant="outline" className="gap-2" onClick={() => onViewChange?.('demos')}><Settings2 className="h-4 w-4" />Advanced tools</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(['open', 'in_progress', 'closed'] as SimpleLeadBucket[]).map((item) => {
            const meta = bucketMeta[item];
            const Icon = meta.icon;
            const active = bucket === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setBucket(item)}
                className={`rounded-xl border p-4 text-left transition ${meta.accent} ${active ? 'ring-2 ring-slate-900/10 shadow-sm' : 'hover:shadow-sm'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5" />{meta.title}</div>
                  <span className="text-2xl font-bold">{counts[item]}</span>
                </div>
                <p className="mt-2 text-sm opacity-75">{meta.subtitle}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parent, child or phone" className="pl-9" />
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setFiltersOpen((value) => !value)}>
            <Filter className="h-4 w-4" />Filters
          </Button>
        </div>
        {filtersOpen && (
          <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
            <div>
              <Label>Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All courses</SelectItem>{courseOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All teachers</SelectItem>{teacherOptions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-950">{bucketMeta[bucket].title}</h2>
            <p className="text-sm text-slate-500">{visibleRows.length} lead{visibleRows.length === 1 ? '' : 's'} in this list</p>
          </div>
          {bucket !== 'closed' && <p className="text-xs font-medium text-slate-500">Do the action shown on the right. That is the next step.</p>}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading leads…</div>
        ) : visibleRows.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-medium text-slate-700">Nothing here right now.</p>
            <p className="text-sm text-slate-500">This bucket is clear with the current search and filters.</p>
          </div>
        ) : (
          <div className="divide-y">
            {visibleRows.map((row) => (
              <div key={row.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-center">
                <div>
                  <div className="font-semibold text-slate-950">{row.parentName}</div>
                  <div className="text-sm text-slate-600">{row.childName} · {row.parentPhone}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{row.course}</div>
                  <div className="text-xs text-slate-500">{row.source}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{row.teacherName}</div>
                  <div className="text-xs text-slate-500">Teacher</div>
                </div>
                <div>
                  <Badge variant="outline">{row.statusLabel}</Badge>
                  <div className="mt-1 text-xs text-slate-500">Updated {formatUpdated(row.updatedAtMs)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {row.parentPhone !== '—' && (
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => window.open(buildWhatsAppUrl(row.parentPhone), '_blank', 'noopener,noreferrer')}>
                      <MessageCircle className="h-4 w-4" />WhatsApp
                    </Button>
                  )}
                  {renderPrimaryAction(row)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{demoLeadId ? 'Create demo' : 'New demo request'}</DialogTitle>
            <DialogDescription>Add only what the teacher needs. After saving, assign it from the Open pool.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDemo} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Parent name *</Label><Input className="mt-1" value={demoForm.parentName} onChange={(e) => setDemoForm((p) => ({ ...p, parentName: e.target.value }))} /></div>
              <div>
                <Label>Parent phone *</Label>
                <div className="mt-1 grid grid-cols-[110px_1fr] gap-2">
                  <Input value={demoForm.countryCode} onChange={(e) => setDemoForm((p) => ({ ...p, countryCode: e.target.value }))} />
                  <Input value={demoForm.phoneLocal} onChange={(e) => setDemoForm((p) => ({ ...p, phoneLocal: e.target.value }))} />
                </div>
              </div>
              <div><Label>Child name *</Label><Input className="mt-1" value={demoForm.childName} onChange={(e) => setDemoForm((p) => ({ ...p, childName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Grade *</Label><Input className="mt-1" value={demoForm.childGrade} onChange={(e) => setDemoForm((p) => ({ ...p, childGrade: e.target.value }))} /></div>
                <div><Label>Age</Label><Input className="mt-1" value={demoForm.childAge} onChange={(e) => setDemoForm((p) => ({ ...p, childAge: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Course *</Label>
                <Select value={demoForm.course} onValueChange={(value) => setDemoForm((p) => ({ ...p, course: value }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{COURSE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={demoForm.source} onValueChange={(value) => setDemoForm((p) => ({ ...p, source: value }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{SOURCE_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <Label>Class type</Label>
                <Select value={demoForm.leadType} onValueChange={(value) => setDemoForm((p) => ({ ...p, leadType: value as LeadType }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1:1">1:1</SelectItem><SelectItem value="Group Class">Group Class</SelectItem></SelectContent></Select>
              </div>
              <div><Label>Timezone</Label><Input className="mt-1" value={demoForm.timezone} onChange={(e) => setDemoForm((p) => ({ ...p, timezone: e.target.value }))} /></div>
            </div>
            <div><Label>Parent preferred date / time *</Label><Input className="mt-1" value={demoForm.preferredTime} onChange={(e) => setDemoForm((p) => ({ ...p, preferredTime: e.target.value }))} placeholder="Example: 22 Aug, 6:00 PM" /></div>
            <div><Label>Note for teacher</Label><Textarea className="mt-1" value={demoForm.notes} onChange={(e) => setDemoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Only important learning or scheduling notes" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDemoDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={demoSaving}>{demoSaving ? 'Saving…' : 'Create demo'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignRow)} onOpenChange={(open) => !open && setAssignRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign teacher</DialogTitle><DialogDescription>Choose one teacher. Saving moves this lead to In Progress.</DialogDescription></DialogHeader>
          <form onSubmit={submitAssign} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm"><span className="font-semibold">{assignRow?.childName}</span> · {assignRow?.course}</div>
            <div><Label>Teacher *</Label><Select value={assignTeacherId} onValueChange={setAssignTeacherId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher" /></SelectTrigger><SelectContent>{teachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAssignRow(null)}>Cancel</Button><Button type="submit" disabled={!assignTeacherId || assignSaving}>{assignSaving ? 'Assigning…' : 'Assign teacher'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(outcomeRow)} onOpenChange={(open) => !open && setOutcomeRow(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{outcomeRow?.bucket === 'closed' ? 'Outcome' : 'Review teacher response & update'}</DialogTitle>
            <DialogDescription>The admin decision controls whether this lead stays In Progress or moves to Closed.</DialogDescription>
          </DialogHeader>
          {outcomeRow?.demo && (
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher response</div>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-slate-500">Remarks:</span> {outcomeRow.demo.teacherRemarks || 'Not submitted yet'}</div>
                <div><span className="text-slate-500">Recommendation:</span> {outcomeRow.demo.teacherRecommendation || '—'}</div>
                <div><span className="text-slate-500">Recommended next step:</span> {formatTrack(outcomeRow.demo.recommendedNextStep || '') || '—'}</div>
                <div><span className="text-slate-500">Demo outcome:</span> {formatTrack(outcomeRow.demo.outcome || '') || '—'}</div>
              </div>
            </div>
          )}
          <form onSubmit={submitOutcome} className="space-y-4">
            <div>
              <Label>Admin decision *</Label>
              <Select value={outcomeForm.conversionStatus} onValueChange={(value) => setOutcomeForm((p) => ({ ...p, conversionStatus: value as DemoConversionStatus }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select what happened" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Not decided</SelectItem>{OUTCOME_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              {outcomeForm.conversionStatus !== 'none' && <p className="mt-1 text-xs text-slate-500">{OUTCOME_OPTIONS.find((item) => item.value === outcomeForm.conversionStatus)?.help}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Follow-up date</Label><Input type="date" className="mt-1" value={outcomeForm.followUpDate} onChange={(e) => setOutcomeForm((p) => ({ ...p, followUpDate: e.target.value }))} /></div>
              <div><Label>Fee discussed</Label><Input className="mt-1" value={outcomeForm.feeDiscussed} onChange={(e) => setOutcomeForm((p) => ({ ...p, feeDiscussed: e.target.value }))} placeholder="Example: ₹4,800 / 12 classes" /></div>
              <div><Label>Recommended course</Label><Input className="mt-1" value={outcomeForm.recommendedCourse} onChange={(e) => setOutcomeForm((p) => ({ ...p, recommendedCourse: e.target.value }))} /></div>
              <div><Label>Recommended frequency</Label><Input className="mt-1" value={outcomeForm.recommendedFrequency} onChange={(e) => setOutcomeForm((p) => ({ ...p, recommendedFrequency: e.target.value }))} placeholder="Example: 3 classes / week" /></div>
            </div>
            <div><Label>Reason / note</Label><Textarea className="mt-1" value={outcomeForm.reason} onChange={(e) => setOutcomeForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Add only what the next admin needs to know" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOutcomeRow(null)}>Cancel</Button><Button type="submit" disabled={outcomeSaving || outcomeForm.conversionStatus === 'none'}>{outcomeSaving ? 'Saving…' : 'Save decision'}<ArrowRight className="ml-1 h-4 w-4" /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
