import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { useToast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../store/useAuthStore';
import type {
  CreateDemoSessionInput,
  DemoClassType,
  DemoConversionStatus,
  DemoFollowUpCallStatus,
  DemoSession,
  DemoSessionStatus,
} from '../../types/models';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import {
  cancelDemoSession,
  createDemoSession,
  deleteDemoSession,
  listenAllDemoSessions,
  listenDemoSessionPrivatePhones,
  reassignDemoSession,
  releaseDemoSession,
  reopenDemoSession,
  updateDemoConversion,
} from '../../services/demoSessionsService';

interface DemoFormState {
  parentName: string;
  parentPhone: string;
  childName: string;
  childGrade: string;
  childAge: string;
  courseInterested: string;
  source: string;
  demoMode: string;
  preferredDateTimeText: string;
  timezone: string;
  adminNotes: string;
}

const INITIAL_FORM: DemoFormState = {
  parentName: '',
  parentPhone: '',
  childName: '',
  childGrade: '',
  childAge: '',
  courseInterested: '',
  source: '',
  demoMode: '',
  preferredDateTimeText: '',
  timezone: '',
  adminNotes: '',
};

const COURSE_OPTIONS = [
  'Phonics',
  'Grammar',
  'Public Speaking',
  'Reading',
  'Writing',
  'Combo',
  'Not Sure Yet',
] as const;

const SOURCE_OPTIONS = [
  'WhatsApp',
  'Website',
  'Referral',
  'Instagram',
  'Facebook',
  'Existing Parent',
  'Other',
] as const;

const DEMO_MODE_OPTIONS = [
  'Zoom',
  'Google Meet',
  'Microsoft Teams',
  'Phone Call',
  'WhatsApp Call',
] as const;

const TIMEZONE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'IST', label: 'IST (UTC+05:30) - India Standard Time' },
  { value: 'PST', label: 'PST (UTC-08:00) - Pacific Standard Time' },
  { value: 'CST', label: 'CST (UTC-06:00) - Central Standard Time' },
  { value: 'EST', label: 'EST (UTC-05:00) - Eastern Standard Time' },
  { value: 'UAE', label: 'UAE (UTC+04:00) - Gulf Standard Time' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+05:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (UTC+01:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+01:00)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+01:00)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-05:00)' },
  { value: 'America/Chicago', label: 'America/Chicago (UTC-06:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-08:00)' },
  { value: 'America/Denver', label: 'America/Denver (UTC-07:00)' },
  { value: 'America/Toronto', label: 'America/Toronto (UTC-05:00)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (UTC-08:00)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (UTC-03:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10:00)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (UTC+02:00)' },
  { value: 'Other', label: 'Other' },
];

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') return maybe.toDate();
    if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000);
  }
  return null;
};

const formatTs = (value: unknown): string => {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const toMs = (value: unknown): number => {
  const date = asDate(value);
  return date ? date.getTime() : 0;
};

const getWeekStartMs = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};

const statusBadgeVariant = (status: DemoSessionStatus): 'default' | 'secondary' | 'outline' => {
  if (status === 'open') return 'outline';
  if (status === 'assigned') return 'secondary';
  return 'default';
};

const formatStatusLabel = (status: DemoSessionStatus) => {
  if (status === 'open') return 'Open';
  if (status === 'assigned') return 'Assigned';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
};

const formatConfirmedSlot = (session: DemoSession) => {
  if (!session.teacherConfirmedDate && !session.teacherConfirmedTime) return '—';
  return `${session.teacherConfirmedDate || '—'} ${session.teacherConfirmedTime || ''}`.trim();
};

const formatHistoryAction = (action?: string) => {
  if (!action) return 'Updated';
  if (action === 'created') return 'Created';
  if (action === 'claimed') return 'Claimed';
  if (action === 'schedule_updated') return 'Schedule Updated';
  if (action === 'completed') return 'Completed';
  if (action === 'reschedule_created') return 'Reschedule Follow-up Created';
  if (action === 'reassigned') return 'Reassigned';
  if (action === 'cancelled') return 'Cancelled';
  if (action === 'released') return 'Released';
  if (action === 'reopened') return 'Reopened';
  if (action === 'follow_up_updated') return 'Follow-up Updated';
  return action;
};

interface TeacherOption {
  id: string;
  name: string;
}

const CONVERSION_OPTIONS: Array<{ value: DemoConversionStatus; label: string }> = [
  { value: 'interested', label: 'Interested' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up_later', label: 'Follow Up Later' },
  { value: 'wrong_fit', label: 'Wrong Fit' },
  { value: 'no_response', label: 'No Response' },
];

const formatConversionStatus = (status?: DemoConversionStatus | null) => {
  if (!status) return '—';
  return status
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

const formatCallStatus = (status?: DemoFollowUpCallStatus | null) => {
  if (!status) return '—';
  if (status === 'not_reachable') return 'Not Reachable';
  if (status === 'not_required') return 'Not Required';
  return status[0].toUpperCase() + status.slice(1);
};

const sanitizePhoneForWhatsApp = (value: string) => value.replace(/[^\d]/g, '');

const copyText = async (value: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document !== 'undefined') {
    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return;
  }

  throw new Error('Clipboard is not available');
};

const buildDemoSummary = (session: DemoSession, parentPhone: string) => {
  const rows = [
    `Parent: ${session.parentName}`,
    `Phone: ${parentPhone || '—'}`,
    `Child: ${session.childName} (Grade ${session.childGrade}${typeof session.childAge === 'number' ? `, Age ${session.childAge}` : ''})`,
    `Course: ${session.courseInterested}`,
    `Preferred slot: ${session.preferredDateTimeText}`,
    `Timezone: ${session.timezone || '—'}`,
    `Status: ${formatStatusLabel(session.status)}`,
    `Assigned teacher: ${session.assignedTeacherName || '—'}`,
    `Confirmed: ${formatConfirmedSlot(session)}`,
  ];
  return rows.join('\n');
};

const buildWhatsappMessage = (session: DemoSession) => {
  const confirmedSlot = formatConfirmedSlot(session);
  return [
    `Hi ${session.parentName},`,
    `This is Tiny Steps regarding ${session.childName}'s ${session.courseInterested} demo.`,
    `We noted your preferred slot: ${session.preferredDateTimeText}${session.timezone ? ` (${session.timezone})` : ''}.`,
    confirmedSlot !== '—' ? `Current confirmed slot: ${confirmedSlot}.` : '',
    'Please confirm if this works for you, or share a suitable time.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');
};

const buildFollowUpMessage = (session: DemoSession) => {
  return [
    `Hi ${session.parentName},`,
    `Following up on ${session.childName}'s demo class.`,
    session.recommendedCourse ? `Recommended course: ${session.recommendedCourse}.` : '',
    session.recommendedClassType
      ? `Suggested format: ${session.recommendedClassType === 'one_to_one' ? '1:1' : 'Group'}.`
      : '',
    session.recommendedFrequency ? `Suggested frequency: ${session.recommendedFrequency}.` : '',
    session.followUpDate ? `Next follow-up date: ${session.followUpDate}.` : '',
    session.followUpCallStatus ? `Call status: ${formatCallStatus(session.followUpCallStatus)}.` : '',
    session.admissionNotConfirmedReason
      ? `If not confirmed yet, reason noted: ${session.admissionNotConfirmedReason}.`
      : '',
    'Please let us know your preferred next step.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');
};

export default function DemoSessionsManagement() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [form, setForm] = useState<DemoFormState>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'assigned' | 'completed'>('open');
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [phoneMap, setPhoneMap] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [assignedTeacherFilter, setAssignedTeacherFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reassignTarget, setReassignTarget] = useState<DemoSession | null>(null);
  const [reassignTeacherId, setReassignTeacherId] = useState<string>('');
  const [conversionTarget, setConversionTarget] = useState<DemoSession | null>(null);
  const [conversionStatus, setConversionStatus] = useState<string>('none');
  const [recommendedCourse, setRecommendedCourse] = useState('');
  const [recommendedClassType, setRecommendedClassType] = useState<string>('none');
  const [recommendedFrequency, setRecommendedFrequency] = useState('');
  const [feeDiscussed, setFeeDiscussed] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpCallStatus, setFollowUpCallStatus] = useState<string>('none');
  const [followUpCallCompletedAt, setFollowUpCallCompletedAt] = useState('');
  const [admissionNotConfirmedReason, setAdmissionNotConfirmedReason] = useState('');
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [expandedTimelineRows, setExpandedTimelineRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubSessions = listenAllDemoSessions(
      (next) => setSessions(next),
      (error) => {
        toast({
          title: 'Failed to load demo sessions',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    const unsubPrivate = listenDemoSessionPrivatePhones(
      (next) => setPhoneMap(next),
      (error) => {
        toast({
          title: 'Failed to load private demo details',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    return () => {
      unsubSessions();
      unsubPrivate();
    };
  }, [toast]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const teachersSnap = await getDocs(teachersQuery);
        const options = teachersSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as { name?: string; displayName?: string; email?: string };
            const name = data.name || data.displayName || data.email || 'Teacher';
            return { id: docSnap.id, name };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(options);
      } catch (error: any) {
        toast({
          title: 'Failed to load teachers',
          description: error?.message || 'Please refresh and try again.',
          variant: 'destructive',
        });
      }
    };

    loadTeachers();
  }, [toast]);

  const openSessions = useMemo(
    () => sessions.filter((session) => session.status === 'open'),
    [sessions],
  );

  const assignedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'assigned'),
    [sessions],
  );

  const closedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'completed' || session.status === 'cancelled'),
    [sessions],
  );

  const weekStartMs = useMemo(() => getWeekStartMs(), []);

  const createdThisWeekCount = useMemo(
    () => sessions.filter((session) => toMs(session.createdAt) >= weekStartMs).length,
    [sessions, weekStartMs],
  );

  const completedThisWeekCount = useMemo(
    () => sessions.filter((session) => toMs(session.completedAt) >= weekStartMs).length,
    [sessions, weekStartMs],
  );

  const convertedThisWeekCount = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.conversionStatus === 'enrolled' &&
          toMs(session.lastUpdatedAt || session.createdAt) >= weekStartMs,
      ).length,
    [sessions, weekStartMs],
  );

  const lostThisWeekCount = useMemo(
    () =>
      sessions.filter(
        (session) =>
          (session.conversionStatus === 'not_interested' || session.conversionStatus === 'wrong_fit') &&
          toMs(session.lastUpdatedAt || session.createdAt) >= weekStartMs,
      ).length,
    [sessions, weekStartMs],
  );

  const noShowThisWeekCount = useMemo(
    () =>
      sessions.filter(
        (session) =>
          (session.outcome === 'parent_no_show' || session.outcome === 'teacher_no_show') &&
          toMs(session.completedAt) >= weekStartMs,
      ).length,
    [sessions, weekStartMs],
  );

  const teacherHandledThisWeek = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((session) => {
      if (toMs(session.completedAt) < weekStartMs) return;
      const teacherName = (session.assignedTeacherName || '').trim();
      if (!teacherName) return;
      counts.set(teacherName, (counts.get(teacherName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [sessions, weekStartMs]);

  const tabSessions = useMemo(() => {
    if (activeTab === 'open') return openSessions;
    if (activeTab === 'assigned') return assignedSessions;
    return closedSessions;
  }, [activeTab, assignedSessions, closedSessions, openSessions]);

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(sessions.map((session) => (session.courseInterested || '').trim()).filter(Boolean)),
      ).sort(),
    [sessions],
  );

  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(sessions.map((session) => (session.source || '').trim()).filter(Boolean))).sort(),
    [sessions],
  );

  const assignedTeacherOptions = useMemo(
    () =>
      Array.from(
        new Set(sessions.map((session) => (session.assignedTeacherName || '').trim()).filter(Boolean)),
      ).sort(),
    [sessions],
  );

  const visibleSessions = useMemo(
    () =>
      tabSessions.filter((session) => {
        if (statusFilter !== 'all' && session.status !== statusFilter) return false;
        if (courseFilter !== 'all' && session.courseInterested !== courseFilter) return false;
        if (sourceFilter !== 'all' && (session.source || '') !== sourceFilter) return false;
        if (assignedTeacherFilter !== 'all' && (session.assignedTeacherName || '') !== assignedTeacherFilter) {
          return false;
        }
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (normalizedQuery) {
          const parentName = (session.parentName || '').toLowerCase();
          const childName = (session.childName || '').toLowerCase();
          const parentPhone = (phoneMap[session.id] || '').toLowerCase();
          const matchesSearch =
            parentName.includes(normalizedQuery) ||
            childName.includes(normalizedQuery) ||
            parentPhone.includes(normalizedQuery);
          if (!matchesSearch) return false;
        }
        return true;
      }),
    [assignedTeacherFilter, courseFilter, phoneMap, searchQuery, sourceFilter, statusFilter, tabSessions],
  );

  const onFieldChange = (key: keyof DemoFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug('[DemoSessions:create] submit clicked', {
      uid: user?.uid,
      email: user?.email,
      role: user?.role,
    });

    if (!user?.uid) {
      toast({
        title: 'Unable to create demo session',
        description: 'User context is missing.',
        variant: 'destructive',
      });
      return;
    }

    const normalizedAge = form.childAge.trim();
    const parsedAge = normalizedAge ? Number(normalizedAge) : null;

    if (normalizedAge && Number.isNaN(parsedAge)) {
      toast({
        title: 'Invalid child age',
        description: 'Child age must be a number.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !form.parentName.trim() ||
      !form.parentPhone.trim() ||
      !form.childName.trim() ||
      !form.childGrade.trim() ||
      !form.courseInterested.trim() ||
      !form.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill all required fields before creating the demo request.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateDemoSessionInput = {
      parentName: form.parentName,
      parentPhone: form.parentPhone,
      childName: form.childName,
      childGrade: form.childGrade,
      childAge: parsedAge,
      courseInterested: form.courseInterested,
      source: form.source || null,
      demoMode: form.demoMode || null,
      preferredDateTimeText: form.preferredDateTimeText,
      timezone: form.timezone || null,
      adminNotes: form.adminNotes || null,
    };

    setCreating(true);
    try {
      await createDemoSession(payload, user.uid);
      setForm(INITIAL_FORM);
      setActiveTab('open');
      toast({
        title: 'Demo session created',
        description: 'The demo request is now available in the assignment pool.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create demo session',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
      console.error('[DemoSessions:create] submit failed', {
        code: error?.code,
        message: error?.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const openConversionDialog = (session: DemoSession) => {
    setConversionTarget(session);
    setConversionStatus(session.conversionStatus || 'none');
    setRecommendedCourse(session.recommendedCourse || '');
    setRecommendedClassType(session.recommendedClassType || 'none');
    setRecommendedFrequency(session.recommendedFrequency || '');
    setFeeDiscussed(session.feeDiscussed || '');
    setFollowUpDate(session.followUpDate || '');
    setFollowUpCallStatus(session.followUpCallStatus || 'none');
    setFollowUpCallCompletedAt(session.followUpCallCompletedAt || '');
    setAdmissionNotConfirmedReason(session.admissionNotConfirmedReason || '');
  };

  const handleSaveConversion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversionTarget || !user?.uid) return;

    setSavingAction(`conversion:${conversionTarget.id}`);
    try {
      await updateDemoConversion({
        demoId: conversionTarget.id,
        conversionStatus:
          conversionStatus === 'none' ? null : (conversionStatus as DemoConversionStatus),
        recommendedCourse: recommendedCourse.trim() || null,
        recommendedClassType:
          recommendedClassType === 'none' ? null : (recommendedClassType as DemoClassType),
        recommendedFrequency: recommendedFrequency.trim() || null,
        feeDiscussed: feeDiscussed.trim() || null,
        followUpDate: followUpDate || null,
        followUpCallStatus:
          followUpCallStatus === 'none' ? null : (followUpCallStatus as DemoFollowUpCallStatus),
        followUpCallCompletedAt: followUpCallCompletedAt || null,
        admissionNotConfirmedReason: admissionNotConfirmedReason.trim() || null,
        updatedBy: user.uid,
      });
      setConversionTarget(null);
      toast({ title: 'Follow-up updated' });
    } catch (error: any) {
      toast({
        title: 'Failed to update follow-up',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const openReassignDialog = (session: DemoSession) => {
    setReassignTarget(session);
    setReassignTeacherId('');
  };

  const handleReassign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reassignTarget || !reassignTeacherId) {
      toast({
        title: 'Select a teacher',
        description: 'Please choose a teacher for reassignment.',
        variant: 'destructive',
      });
      return;
    }

    const selectedTeacher = teachers.find((teacher) => teacher.id === reassignTeacherId);
    setSavingAction(`reassign:${reassignTarget.id}`);
    try {
      await reassignDemoSession({
        demoId: reassignTarget.id,
        assignedTeacherId: reassignTeacherId,
        assignedTeacherName: selectedTeacher?.name,
      });
      setReassignTarget(null);
      toast({ title: 'Demo reassigned' });
    } catch (error: any) {
      toast({
        title: 'Failed to reassign demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleCancel = async (session: DemoSession) => {
    const shouldCancel = window.confirm('Cancel this demo session?');
    if (!shouldCancel) return;

    setSavingAction(`cancel:${session.id}`);
    try {
      await cancelDemoSession({ demoId: session.id });
      toast({ title: 'Demo cancelled' });
    } catch (error: any) {
      toast({
        title: 'Failed to cancel demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleRelease = async (session: DemoSession) => {
    const shouldRelease = window.confirm('Release this assigned demo back to the open pool?');
    if (!shouldRelease) return;

    setSavingAction(`release:${session.id}`);
    try {
      await releaseDemoSession({ demoId: session.id });
      toast({ title: 'Demo released to open pool' });
    } catch (error: any) {
      toast({
        title: 'Failed to release demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleReopen = async (session: DemoSession) => {
    const shouldReopen = window.confirm('Reopen this demo to Open state?');
    if (!shouldReopen) return;

    setSavingAction(`reopen:${session.id}`);
    try {
      await reopenDemoSession({ demoId: session.id });
      toast({ title: 'Demo reopened to Open' });
    } catch (error: any) {
      toast({
        title: 'Failed to reopen demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleDelete = async (session: DemoSession) => {
    const shouldDelete = window.confirm(
      `Delete demo for ${session.childName} (${session.parentName})? This cannot be undone.`,
    );
    if (!shouldDelete) return;

    setSavingAction(`delete:${session.id}`);
    try {
      await deleteDemoSession({ demoId: session.id });
      toast({ title: 'Demo deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleCopyPhone = async (session: DemoSession) => {
    const parentPhone = (phoneMap[session.id] || '').trim();
    if (!parentPhone) {
      toast({
        title: 'Phone not available',
        description: 'No parent phone is stored for this demo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await copyText(parentPhone);
      toast({ title: 'Phone copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy phone',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleCopySummary = async (session: DemoSession) => {
    const parentPhone = (phoneMap[session.id] || '').trim();
    try {
      await copyText(buildDemoSummary(session, parentPhone));
      toast({ title: 'Demo summary copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy summary',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyFollowUpMessage = async (session: DemoSession) => {
    try {
      await copyText(buildFollowUpMessage(session));
      toast({ title: 'Follow-up message copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy follow-up message',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenWhatsApp = (session: DemoSession) => {
    const parentPhone = (phoneMap[session.id] || '').trim();
    if (!parentPhone) {
      toast({
        title: 'Phone not available',
        description: 'No parent phone is stored for this demo.',
        variant: 'destructive',
      });
      return;
    }

    const cleanedPhone = sanitizePhoneForWhatsApp(parentPhone);
    if (!cleanedPhone) {
      toast({
        title: 'Invalid phone number',
        description: 'Unable to open WhatsApp for this phone number.',
        variant: 'destructive',
      });
      return;
    }

    const message = buildWhatsappMessage(session);
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderSessionActions = (session: DemoSession, layout: 'desktop' | 'mobile' = 'desktop') => {
    const isMobile = layout === 'mobile';
    const buttonClass = isMobile ? 'w-full justify-center' : undefined;

    return (
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap justify-end gap-2'}>
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          onClick={() => openConversionDialog(session)}
          disabled={savingAction === `conversion:${session.id}`}
        >
          Follow-up
        </Button>
        <Button variant="outline" size="sm" className={buttonClass} onClick={() => handleCopyPhone(session)}>
          Copy Phone
        </Button>
        <Button variant="outline" size="sm" className={buttonClass} onClick={() => handleCopySummary(session)}>
          Copy Summary
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          onClick={() => handleCopyFollowUpMessage(session)}
        >
          Copy Follow-up
        </Button>
        <Button variant="outline" size="sm" className={buttonClass} onClick={() => handleOpenWhatsApp(session)}>
          WhatsApp
        </Button>
        {session.status === 'assigned' && (
          <Button
            variant="outline"
            size="sm"
            className={buttonClass}
            onClick={() => openReassignDialog(session)}
            disabled={savingAction === `reassign:${session.id}`}
          >
            Reassign
          </Button>
        )}
        {session.status === 'assigned' && (
          <Button
            variant="outline"
            size="sm"
            className={buttonClass}
            onClick={() => handleRelease(session)}
            disabled={savingAction === `release:${session.id}`}
          >
            Release
          </Button>
        )}
        {session.status !== 'cancelled' && (
          <Button
            variant="outline"
            size="sm"
            className={buttonClass}
            onClick={() => handleCancel(session)}
            disabled={savingAction === `cancel:${session.id}`}
          >
            Cancel
          </Button>
        )}
        {(session.status === 'cancelled' || session.status === 'completed') && (
          <Button
            size="sm"
            className={buttonClass}
            onClick={() => handleReopen(session)}
            disabled={savingAction === `reopen:${session.id}`}
          >
            Reopen
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className={buttonClass}
          onClick={() => handleDelete(session)}
          disabled={savingAction === `delete:${session.id}`}
        >
          Delete
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-sky-100 bg-gradient-to-b from-sky-50/70 to-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Create Demo Request</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new demo request once. Teachers can claim from the shared assignment board.
        </p>

        <form className="mt-4 grid gap-4" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-parent-name">Parent Name *</Label>
              <Input
                id="demo-parent-name"
                value={form.parentName}
                onChange={(e) => onFieldChange('parentName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-parent-phone">Parent Phone *</Label>
              <Input
                id="demo-parent-phone"
                value={form.parentPhone}
                onChange={(e) => onFieldChange('parentPhone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="demo-child-name">Child Name *</Label>
              <Input
                id="demo-child-name"
                value={form.childName}
                onChange={(e) => onFieldChange('childName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-child-grade">Child Grade *</Label>
              <Input
                id="demo-child-grade"
                value={form.childGrade}
                onChange={(e) => onFieldChange('childGrade', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-child-age">Child Age</Label>
              <Input
                id="demo-child-age"
                type="number"
                min={0}
                value={form.childAge}
                onChange={(e) => onFieldChange('childAge', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-course">Course Interested *</Label>
              <Select
                value={form.courseInterested || undefined}
                onValueChange={(value) => onFieldChange('courseInterested', value)}
              >
                <SelectTrigger id="demo-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-timezone">Timezone</Label>
              <Select
                value={form.timezone || 'not_set'}
                onValueChange={(value) => onFieldChange('timezone', value === 'not_set' ? '' : value)}
              >
                <SelectTrigger id="demo-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_set">Not set</SelectItem>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-source">Source</Label>
              <Select
                value={form.source || 'not_set'}
                onValueChange={(value) => onFieldChange('source', value === 'not_set' ? '' : value)}
              >
                <SelectTrigger id="demo-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_set">Not set</SelectItem>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-mode">Demo Mode</Label>
              <Select
                value={form.demoMode || 'not_set'}
                onValueChange={(value) => onFieldChange('demoMode', value === 'not_set' ? '' : value)}
              >
                <SelectTrigger id="demo-mode">
                  <SelectValue placeholder="Select demo mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_set">Not set</SelectItem>
                  {DEMO_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-preferred-slot">Parent Preferred Date/Time *</Label>
            <Textarea
              id="demo-preferred-slot"
              value={form.preferredDateTimeText}
              onChange={(e) => onFieldChange('preferredDateTimeText', e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-admin-notes">Notes for Teacher</Label>
            <Textarea
              id="demo-admin-notes"
              value={form.adminNotes}
              onChange={(e) => onFieldChange('adminNotes', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={creating}
              className="w-full transition-all duration-200 hover:-translate-y-0.5 sm:w-auto"
            >
              {creating ? 'Creating...' : 'Create Demo Request'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold">Demo Tracking</h3>
          <Badge variant="outline">Open: {openSessions.length}</Badge>
          <Badge variant="secondary">Assigned: {assignedSessions.length}</Badge>
          <Badge>Completed: {closedSessions.length}</Badge>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Created This Week</div>
            <div className="mt-1 text-xl font-semibold">{createdThisWeekCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Now</div>
            <div className="mt-1 text-xl font-semibold">{assignedSessions.length}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Completed This Week</div>
            <div className="mt-1 text-xl font-semibold">{completedThisWeekCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Converted This Week</div>
            <div className="mt-1 text-xl font-semibold">{convertedThisWeekCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Lost This Week</div>
            <div className="mt-1 text-xl font-semibold">{lostThisWeekCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">No-show This Week</div>
            <div className="mt-1 text-xl font-semibold">{noShowThisWeekCount}</div>
          </Card>
        </div>
        <div className="mb-4 rounded-lg border border-slate-200 bg-white/80 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Teacher-wise Demos Handled (This Week)
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {teacherHandledThisWeek.length === 0 ? (
              <span className="text-sm text-muted-foreground">No completed demos this week yet.</span>
            ) : (
              teacherHandledThisWeek.map(([teacherName, count]) => (
                <Badge key={teacherName} variant="outline">
                  {teacherName}: {count}
                </Badge>
              ))
            )}
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Completed includes closed outcomes like no-show and follow-up needed. Reschedule requested closes this record and auto-creates a new Open demo.
        </p>
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1 md:col-span-2 xl:col-span-4">
            <Label htmlFor="demo-search">Search</Label>
            <Input
              id="demo-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search parent, child, or parent phone"
            />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Course</Label>
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
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label>Assigned Teacher</Label>
            <Select value={assignedTeacherFilter} onValueChange={setAssignedTeacherFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {assignedTeacherOptions.map((teacherName) => (
                  <SelectItem key={teacherName} value={teacherName}>
                    {teacherName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'open' | 'assigned' | 'completed')}>
          <TabsList className="mb-4 grid h-auto w-full grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="open" className="px-2 text-xs sm:text-sm">Open</TabsTrigger>
            <TabsTrigger value="assigned" className="px-2 text-xs sm:text-sm">Assigned</TabsTrigger>
            <TabsTrigger value="completed" className="px-2 text-xs sm:text-sm">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {visibleSessions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                No demo sessions in this state.
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {visibleSessions.map((session) => {
                    const isTimelineExpanded = Boolean(expandedTimelineRows[session.id]);
                    const timelineRows = [
                      `Created: ${formatTs(session.createdAt)}`,
                      `Assigned: ${formatTs(session.assignedAt)}`,
                      `Confirmed For: ${formatConfirmedSlot(session)}`,
                      `Completed: ${formatTs(session.completedAt)}`,
                      `Released: ${formatTs(session.releasedAt)}`,
                      `Reopened: ${formatTs(session.reopenedAt)}`,
                      session.rescheduledFromDemoId ? `Rescheduled From: ${session.rescheduledFromDemoId}` : null,
                      session.rescheduledToDemoId ? `Rescheduled To: ${session.rescheduledToDemoId}` : null,
                      `Last Updated: ${formatTs(session.lastUpdatedAt || session.createdAt)}`,
                    ].filter((value): value is string => Boolean(value));

                    const visibleTimelineRows = isTimelineExpanded ? timelineRows : timelineRows.slice(0, 3);
                    const historyRows = Array.isArray(session.history)
                      ? isTimelineExpanded
                        ? [...session.history].reverse()
                        : session.history.slice(-2).reverse()
                      : [];

                    return (
                      <Card key={`mobile-${session.id}`} className="border-slate-200 bg-white/90 p-4 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">{session.childName}</div>
                            <Badge variant={statusBadgeVariant(session.status)}>{formatStatusLabel(session.status)}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Parent: {session.parentName}</div>
                          <div className="text-xs text-muted-foreground">Phone: {phoneMap[session.id] || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {session.courseInterested} {session.source ? `· ${session.source}` : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Preferred Slot: {session.preferredDateTimeText}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Teacher: {session.assignedTeacherName || '—'}
                          </div>
                          <div className="text-xs">
                            Conversion: <span className="font-medium">{formatConversionStatus(session.conversionStatus)}</span>
                          </div>
                          {(session.followUpCallStatus || session.followUpDate || session.admissionNotConfirmedReason) && (
                            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-muted-foreground">
                              {session.followUpCallStatus && <div>Call: {formatCallStatus(session.followUpCallStatus)}</div>}
                              {session.followUpDate && <div>Next follow-up: {session.followUpDate}</div>}
                              {session.admissionNotConfirmedReason && (
                                <div>Not confirmed: {session.admissionNotConfirmedReason}</div>
                              )}
                            </div>
                          )}
                          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-muted-foreground">
                            {visibleTimelineRows.map((line, index) => (
                              <div key={`${session.id}-mobile-timeline-${index}`}>{line}</div>
                            ))}
                            {historyRows.length > 0 && (
                              <div className="pt-1">
                                <div className="font-medium text-foreground">Recent activity</div>
                                {historyRows.map((entry, idx) => (
                                  <div key={`${session.id}-mobile-history-${entry.atMs}-${idx}`}>
                                    {formatHistoryAction(entry.action)}: {formatTs(new Date(entry.atMs))}
                                  </div>
                                ))}
                              </div>
                            )}
                            {timelineRows.length > 3 && (
                              <button
                                type="button"
                                className="pt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                                onClick={() =>
                                  setExpandedTimelineRows((prev) => ({
                                    ...prev,
                                    [session.id]: !isTimelineExpanded,
                                  }))
                                }
                              >
                                {isTimelineExpanded ? 'Show less' : 'View details'}
                              </button>
                            )}
                          </div>
                          {renderSessionActions(session, 'mobile')}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Preferred Slot</TableHead>
                    <TableHead>Assigned Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conversion</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSessions.map((session) => {
                    const isTimelineExpanded = Boolean(expandedTimelineRows[session.id]);
                    const timelineRows = [
                      `Created: ${formatTs(session.createdAt)}`,
                      `Assigned: ${formatTs(session.assignedAt)}`,
                      `Confirmed For: ${formatConfirmedSlot(session)}`,
                      `Completed: ${formatTs(session.completedAt)}`,
                      `Released: ${formatTs(session.releasedAt)}`,
                      `Reopened: ${formatTs(session.reopenedAt)}`,
                      session.rescheduledFromDemoId ? `Rescheduled From: ${session.rescheduledFromDemoId}` : null,
                      session.rescheduledToDemoId ? `Rescheduled To: ${session.rescheduledToDemoId}` : null,
                      `Last Updated: ${formatTs(session.lastUpdatedAt || session.createdAt)}`,
                    ].filter((value): value is string => Boolean(value));

                    const visibleTimelineRows = isTimelineExpanded ? timelineRows : timelineRows.slice(0, 3);
                    const historyRows = Array.isArray(session.history)
                      ? isTimelineExpanded
                        ? [...session.history].reverse()
                        : session.history.slice(-2).reverse()
                      : [];

                    return (
                    <TableRow key={session.id} className="transition-colors hover:bg-slate-50/70">
                      <TableCell>
                        <div className="font-medium">{session.childName}</div>
                        <div className="text-xs text-muted-foreground">Grade {session.childGrade}</div>
                      </TableCell>
                      <TableCell>{session.parentName}</TableCell>
                      <TableCell>{phoneMap[session.id] || '—'}</TableCell>
                      <TableCell>{session.courseInterested}</TableCell>
                      <TableCell>{session.source || '—'}</TableCell>
                      <TableCell className="max-w-[240px] whitespace-pre-wrap text-xs text-muted-foreground">
                        {session.preferredDateTimeText}
                      </TableCell>
                      <TableCell>{session.assignedTeacherName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(session.status)}>
                          {formatStatusLabel(session.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatConversionStatus(session.conversionStatus)}</div>
                        {(session.followUpCallStatus || session.followUpDate || session.admissionNotConfirmedReason) && (
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {session.followUpCallStatus && (
                              <div>Call: {formatCallStatus(session.followUpCallStatus)}</div>
                            )}
                            {session.followUpDate && <div>Next follow-up: {session.followUpDate}</div>}
                            {session.admissionNotConfirmedReason && (
                              <div>Not confirmed: {session.admissionNotConfirmedReason}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[230px]">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {visibleTimelineRows.map((line, index) => (
                            <div key={`${session.id}-timeline-${index}`}>{line}</div>
                          ))}
                          {historyRows.length > 0 && (
                            <div className="pt-1">
                              <div className="font-medium text-foreground">Recent activity</div>
                              {historyRows.map((entry, idx) => (
                                <div key={`${session.id}-history-${entry.atMs}-${idx}`}>
                                  {formatHistoryAction(entry.action)}: {formatTs(new Date(entry.atMs))}
                                  {entry.actorName ? ` by ${entry.actorName}` : ''}
                                  {entry.note ? ` (${entry.note})` : ''}
                                </div>
                              ))}
                            </div>
                          )}
                          {timelineRows.length > 3 && (
                            <button
                              type="button"
                              className="pt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                              onClick={() =>
                                setExpandedTimelineRows((prev) => ({
                                  ...prev,
                                  [session.id]: !isTimelineExpanded,
                                }))
                              }
                            >
                              {isTimelineExpanded ? 'Show less' : 'View details'}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderSessionActions(session)}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={!!conversionTarget} onOpenChange={(open) => (!open ? setConversionTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demo Follow-up</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleSaveConversion}>
            <div className="text-sm text-muted-foreground">
              {conversionTarget ? `Child: ${conversionTarget.childName} | Parent: ${conversionTarget.parentName}` : ''}
            </div>

            <div className="space-y-2">
              <Label>Conversion Status</Label>
              <Select value={conversionStatus} onValueChange={setConversionStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversion status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {CONVERSION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conversion-course">Recommended Course</Label>
                <Input
                  id="conversion-course"
                  value={recommendedCourse}
                  onChange={(e) => setRecommendedCourse(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recommended Class Type</Label>
                <Select value={recommendedClassType} onValueChange={setRecommendedClassType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="one_to_one">1:1</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conversion-frequency">Recommended Frequency</Label>
                <Input
                  id="conversion-frequency"
                  value={recommendedFrequency}
                  onChange={(e) => setRecommendedFrequency(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversion-fee">Fee Discussed</Label>
                <Input
                  id="conversion-fee"
                  value={feeDiscussed}
                  onChange={(e) => setFeeDiscussed(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion-follow-up-date">Follow-up Date</Label>
              <Input
                id="conversion-follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Follow-up Call Status</Label>
                <Select value={followUpCallStatus} onValueChange={setFollowUpCallStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select call status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="not_reachable">Not Reachable</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversion-call-completed-at">Call Completed Date</Label>
                <Input
                  id="conversion-call-completed-at"
                  type="date"
                  value={followUpCallCompletedAt}
                  onChange={(e) => setFollowUpCallCompletedAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion-not-confirmed-reason">If Not Confirmed, Reason</Label>
              <Textarea
                id="conversion-not-confirmed-reason"
                value={admissionNotConfirmedReason}
                onChange={(e) => setAdmissionNotConfirmedReason(e.target.value)}
                rows={2}
                placeholder="e.g. fee concern, timing issue, wants to decide later"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={!conversionTarget || !!savingAction}>
                {savingAction && savingAction.startsWith('conversion:') ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassignTarget} onOpenChange={(open) => (!open ? setReassignTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reassign Demo</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleReassign}>
            <div className="text-sm text-muted-foreground">
              {reassignTarget ? `Child: ${reassignTarget.childName} | Parent: ${reassignTarget.parentName}` : ''}
            </div>
            <div className="space-y-2">
              <Label>Select Teacher</Label>
              <Select value={reassignTeacherId} onValueChange={setReassignTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={!reassignTeacherId || !!savingAction}>
                {savingAction && savingAction.startsWith('reassign:') ? 'Saving...' : 'Reassign Demo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
