import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteField,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import {
  TEACHER_INQUIRY_FINAL_STATUS_OPTIONS,
  TEACHER_INQUIRY_STAGE_OPTIONS,
  canCloseTeacherInquiry,
  normalizeTeacherInquiryFinalStatus,
  normalizeTeacherInquiryStage,
  teacherInquiryFinalStatusLabel,
  type TeacherInquiryFinalStatus,
  type TeacherInquiryStage,
} from './teacherInquiriesWorkflow';

type TeacherInquiryRecord = {
  id: string;
  candidateName: string;
  phone: string;
  email: string;
  location: string;
  experience: string;
  specialization: string;
  currentContext: string;
  availability: string;
  candidateNote: string;
  adminNotes: string;
  stage: TeacherInquiryStage;
  finalStatus: TeacherInquiryFinalStatus | '';
  createdAtMs: number;
  updatedAtMs: number;
};

const normalizeText = (value: unknown): string => String(value || '').trim();

const toMs = (value: unknown): number => {
  if (!value || typeof value !== 'object') return 0;
  const candidate = value as { toMillis?: () => number; seconds?: number };
  if (typeof candidate.toMillis === 'function') return candidate.toMillis();
  if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  return 0;
};

const formatDate = (ms: number): string => {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
};

const phoneDigits = (value: string): string => value.replace(/[^\d]/g, '');

const STAGE_META: Record<
  TeacherInquiryStage,
  { title: string; subtitle: string; icon: typeof CircleDot; className: string }
> = {
  open: {
    title: 'Open',
    subtitle: 'New applications',
    icon: CircleDot,
    className: 'border-blue-200 bg-blue-50/70 text-blue-950',
  },
  admin_review: {
    title: 'Admin Review',
    subtitle: 'Currently being handled',
    icon: ClipboardCheck,
    className: 'border-violet-200 bg-violet-50/70 text-violet-950',
  },
  closed: {
    title: 'Closed',
    subtitle: 'Selected / Not Selected',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
  },
};

export default function TeacherInquiriesWorkspace() {
  const { toast } = useToast();
  const [records, setRecords] = useState<TeacherInquiryRecord[]>([]);
  const [stage, setStage] = useState<TeacherInquiryStage>('open');
  const [closedFilter, setClosedFilter] = useState<TeacherInquiryFinalStatus>('selected');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TeacherInquiryRecord | null>(null);
  const [editStage, setEditStage] = useState<TeacherInquiryStage>('open');
  const [adminNotes, setAdminNotes] = useState('');
  const [finalStatus, setFinalStatus] = useState<TeacherInquiryFinalStatus | ''>('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, 'teacherInquiries'), orderBy('createdAt', 'desc'), limit(250)),
      );
      const next = snapshot.docs.map((item) => {
        const data = item.data() as Record<string, unknown>;
        return {
          id: item.id,
          candidateName: normalizeText(data.candidateName),
          phone: normalizeText(data.phone),
          email: normalizeText(data.email),
          location: normalizeText(data.location),
          experience: normalizeText(data.experience),
          specialization: normalizeText(data.specialization),
          currentContext: normalizeText(data.currentContext),
          availability: normalizeText(data.availability),
          candidateNote: normalizeText(data.candidateNote),
          adminNotes: normalizeText(data.adminNotes),
          stage: normalizeTeacherInquiryStage(data.stage),
          finalStatus: normalizeTeacherInquiryFinalStatus(data.finalStatus),
          createdAtMs: toMs(data.createdAt),
          updatedAtMs: toMs(data.updatedAt),
        } satisfies TeacherInquiryRecord;
      });
      setRecords(next);
    } catch (error: any) {
      toast({
        title: 'Could not load teacher enquiries',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () =>
      records.reduce<Record<TeacherInquiryStage, number>>(
        (acc, item) => {
          acc[item.stage] += 1;
          return acc;
        },
        { open: 0, admin_review: 0, closed: 0 },
      ),
    [records],
  );

  const closedCounts = useMemo(
    () =>
      records.reduce<Record<TeacherInquiryFinalStatus, number>>(
        (acc, item) => {
          if (item.stage === 'closed' && item.finalStatus) {
            acc[item.finalStatus] += 1;
          }
          return acc;
        },
        { selected: 0, not_selected: 0 },
      ),
    [records],
  );

  const visibleRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return records.filter((item) => {
      if (item.stage !== stage) return false;
      if (stage === 'closed' && item.finalStatus !== closedFilter) return false;
      if (!needle) return true;
      return [
        item.candidateName,
        item.phone,
        item.email,
        item.location,
        item.experience,
        item.specialization,
        item.availability,
        item.adminNotes,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [closedFilter, records, search, stage]);

  const openEditor = (record: TeacherInquiryRecord) => {
    setSelected(record);
    setEditStage(record.stage);
    setAdminNotes(record.adminNotes);
    setFinalStatus(record.finalStatus);
  };

  const saveSelected = async () => {
    if (!selected) return;
    const closedStatus = normalizeTeacherInquiryFinalStatus(finalStatus);
    if (editStage === 'closed' && !canCloseTeacherInquiry(closedStatus)) {
      toast({
        title: 'Select a closed outcome',
        description: 'Choose Selected & Closed or Not Selected & Closed.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const update: Record<string, unknown> = {
        stage: editStage,
        adminNotes: adminNotes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editStage === 'closed') {
        update.finalStatus = closedStatus;
        update.closedAt = serverTimestamp();
      } else {
        update.finalStatus = deleteField();
        update.closedAt = deleteField();
      }

      await updateDoc(doc(db, 'teacherInquiries', selected.id), update);
      toast({ title: 'Teacher enquiry updated' });
      setSelected(null);
      await load();
      setStage(editStage);
      if (editStage === 'closed' && closedStatus) {
        setClosedFilter(closedStatus);
      }
    } catch (error: any) {
      toast({
        title: 'Could not save teacher enquiry',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const startAdminReview = async (record: TeacherInquiryRecord) => {
    try {
      await updateDoc(doc(db, 'teacherInquiries', record.id), {
        stage: 'admin_review',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Moved to Admin Review' });
      await load();
      setStage('admin_review');
    } catch (error: any) {
      toast({
        title: 'Could not update teacher enquiry',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950">Teacher Enquiries</h1>
            <p className="mt-1 text-sm text-slate-600">Open → Admin Review → Selected & Closed / Not Selected & Closed.</p>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {TEACHER_INQUIRY_STAGE_OPTIONS.map((option) => {
            const meta = STAGE_META[option.value];
            const Icon = meta.icon;
            const active = stage === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStage(option.value)}
                className={`rounded-2xl border p-4 text-left transition ${meta.className} ${
                  active ? 'ring-2 ring-slate-900/10 shadow-sm' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-2xl font-bold">{counts[option.value]}</span>
                </div>
                <p className="mt-3 font-semibold">{meta.title}</p>
                <p className="mt-1 text-xs opacity-75">{meta.subtitle}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">{STAGE_META[stage].title}</h2>
            <p className="text-xs text-slate-500">{STAGE_META[stage].subtitle}</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email, location..."
              className="pl-9"
            />
          </div>
        </div>

        {stage === 'closed' ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TEACHER_INQUIRY_FINAL_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setClosedFilter(option.value)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  closedFilter === option.value
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{option.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  closedFilter === option.value ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {closedCounts[option.value]}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading teacher enquiries...</div>
          ) : visibleRecords.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No teacher enquiries in this section.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {visibleRecords.map((record) => (
                <div key={record.id} className="grid gap-4 p-4 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{record.candidateName || 'Unnamed candidate'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.phone || 'No phone'}{record.email ? ` · ${record.email}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Received {formatDate(record.createdAtMs)}</p>
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-slate-800">{record.specialization || '—'}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{record.experience || 'Experience not provided'}</p>
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="truncate text-slate-700">{record.location || '—'}</p>
                    {record.stage === 'closed' ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700">{teacherInquiryFinalStatusLabel(record.finalStatus)}</p>
                    ) : (
                      <p className="mt-1 truncate text-xs text-slate-500">{record.availability || 'Availability not provided'}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {record.phone ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => window.open(`https://wa.me/${phoneDigits(record.phone)}`, '_blank', 'noopener,noreferrer')}
                      >
                        WhatsApp
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {record.stage === 'open' ? (
                      <Button type="button" size="sm" onClick={() => void startAdminReview(record)}>
                        Start Review
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" variant={record.stage === 'open' ? 'outline' : 'default'} onClick={() => openEditor(record)}>
                      View / Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.candidateName || 'Teacher application'}</DialogTitle>
            <DialogDescription>Review the application, keep one admin note, and update its stage.</DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-xs font-semibold uppercase text-slate-500">Phone</span><p className="mt-1 text-slate-900">{selected.phone || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500">Email</span><p className="mt-1 break-all text-slate-900">{selected.email || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500">Location</span><p className="mt-1 text-slate-900">{selected.location || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500">Specialization</span><p className="mt-1 text-slate-900">{selected.specialization || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500">Experience</span><p className="mt-1 text-slate-900">{selected.experience || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-slate-500">Availability</span><p className="mt-1 text-slate-900">{selected.availability || '—'}</p></div>
                {selected.currentContext ? (
                  <div className="sm:col-span-2"><span className="text-xs font-semibold uppercase text-slate-500">Current / recent context</span><p className="mt-1 whitespace-pre-wrap text-slate-900">{selected.currentContext}</p></div>
                ) : null}
                {selected.candidateNote ? (
                  <div className="sm:col-span-2"><span className="text-xs font-semibold uppercase text-slate-500">Candidate note</span><p className="mt-1 whitespace-pre-wrap text-slate-900">{selected.candidateNote}</p></div>
                ) : null}
              </div>

              <label className="block text-sm font-semibold text-slate-800">
                Workflow status
                <select
                  value={
                    editStage === 'closed' && finalStatus
                      ? `closed:${finalStatus}`
                      : editStage
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value.startsWith('closed:')) {
                      setEditStage('closed');
                      setFinalStatus(
                        normalizeTeacherInquiryFinalStatus(value.slice('closed:'.length)),
                      );
                      return;
                    }
                    setEditStage(value as TeacherInquiryStage);
                    setFinalStatus('');
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  {TEACHER_INQUIRY_STAGE_OPTIONS.filter((option) => option.value !== 'closed').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                  {TEACHER_INQUIRY_FINAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={`closed:${option.value}`}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Admin notes
                <Textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={6}
                  className="mt-2"
                  placeholder="Enter whatever the admin needs to remember about this application..."
                />
              </label>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelected(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void saveSelected()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
