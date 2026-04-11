import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { ChevronDown } from 'lucide-react';
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import {
  cancelDemoSession,
  checkDemoPhoneConflicts,
  createDemoSession,
  deleteDemoSession,
  listenAllDemoSessions,
  listenDemoSessionPrivatePhones,
  reassignDemoSession,
  releaseDemoSession,
  reopenDemoSession,
  updateDemoSessionAdminDetails,
  updateDemoConversion,
} from '../../services/demoSessionsService';
import {
  formatStatusLabel as formatGenericStatusLabel,
  normalizeDemoStatus,
} from '../../lib/statuses';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  buildPhoneFromParts,
  splitPhoneForForm,
} from '../../lib/phone';

interface DemoSessionsManagementProps {
  openCreateRequestSignal?: number;
  mode?: 'full' | 'trend_only';
}

interface DemoFormState {
  parentName: string;
  parentPhone: string;
  parentPhoneCountryCode: string;
  parentPhoneLocal: string;
  childName: string;
  childGrade: string;
  childAge: string;
  courseInterested: string;
  source: string;
  demoMode: string;
  requestReceivedDate: string;
  preferredDateTimeText: string;
  timezone: string;
  adminNotes: string;
}

type DemoTrendRangePreset = 'week' | 'month' | 'till_date' | 'custom';

interface DemoTrendPoint {
  dateKey: string;
  label: string;
  received: number;
  assigned: number;
  completed: number;
  enrolled: number;
}

type TrendMetricKey = 'received' | 'assigned' | 'completed' | 'enrolled';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_TREND_ONBOARDING_START_KEY = '2026-03-18';
const TREND_METRIC_KEYS: TrendMetricKey[] = ['received', 'assigned', 'completed', 'enrolled'];
const TREND_METRIC_CONFIG: Record<TrendMetricKey, { label: string; stroke: string }> = {
  received: { label: 'Received', stroke: '#2563eb' },
  assigned: { label: 'Assigned', stroke: '#f59e0b' },
  completed: { label: 'Completed', stroke: '#16a34a' },
  enrolled: { label: 'Enrolled', stroke: '#db2777' },
};

const toDateInput = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getTodayDateInput = (): string => {
  return toDateInput(new Date());
};

const getMonthStartDateInput = (): string => {
  const now = new Date();
  return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
};

const parseDateInput = (value?: string | null): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(year, month - 1, day);
};

const normalizeDateInputKey = (value?: string | null): string | null => {
  const date = parseDateInput(value);
  if (!date) return null;
  return toDateInput(date);
};

const formatDateKeyLabel = (dateKey: string): string => {
  const date = parseDateInput(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
};

const clampTrendStartKey = (startKey: string): string =>
  startKey < DEMO_TREND_ONBOARDING_START_KEY ? DEMO_TREND_ONBOARDING_START_KEY : startKey;

const buildInitialForm = (): DemoFormState => ({
  parentName: '',
  parentPhone: '',
  parentPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  parentPhoneLocal: '',
  childName: '',
  childGrade: '',
  childAge: '',
  courseInterested: '',
  source: '',
  demoMode: '',
  requestReceivedDate: getTodayDateInput(),
  preferredDateTimeText: '',
  timezone: '',
  adminNotes: '',
});

const INITIAL_FORM: DemoFormState = buildInitialForm();

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

const formatTrendLabelValue = (value: unknown): string => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return String(parsed);
};

interface TrendLabelRendererProps {
  x?: number | string;
  y?: number | string;
  value?: unknown;
  stroke?: string;
}

const renderTrendLabel = ({ x, y, value, stroke }: TrendLabelRendererProps) => {
  const numericX = typeof x === 'number' ? x : Number(x);
  const numericY = typeof y === 'number' ? y : Number(y);
  const label = formatTrendLabelValue(value);
  if (!label || !Number.isFinite(numericX) || !Number.isFinite(numericY)) return null;

  return (
    <text
      x={numericX}
      y={numericY}
      dy={-8}
      textAnchor="middle"
      fill={stroke || '#0f172a'}
      fontSize={15}
      fontWeight={700}
      stroke="#ffffff"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {label}
    </text>
  );
};

const formatTs = (value: unknown): string => {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const toDateKeyFromTimestamp = (value: unknown): string | null => {
  const date = asDate(value);
  if (!date) return null;
  return toDateInput(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
};

const getTrendReceivedDateKey = (session: DemoSession): string | null => {
  const requestReceivedKey = normalizeDateInputKey(session.requestReceivedDate);
  const entryDateKey = toDateKeyFromTimestamp(session.createdAt);

  if (requestReceivedKey && entryDateKey) {
    // Guard against backfilled defaults later than actual entry date.
    return requestReceivedKey <= entryDateKey ? requestReceivedKey : entryDateKey;
  }

  return requestReceivedKey || entryDateKey;
};

const statusBadgeVariant = (status: DemoSessionStatus): 'default' | 'secondary' | 'outline' => {
  const normalized = normalizeDemoStatus(status);
  if (normalized === 'open') return 'outline';
  if (normalized === 'assigned') return 'secondary';
  return 'default';
};

const formatStatusLabel = (status: DemoSessionStatus) => {
  return formatGenericStatusLabel(normalizeDemoStatus(status));
};

const formatConfirmedSlot = (session: DemoSession) => {
  if (!session.teacherConfirmedDate && !session.teacherConfirmedTime) return '—';
  return `${session.teacherConfirmedDate || '—'} ${session.teacherConfirmedTime || ''}`.trim();
};

const buildTimelineRows = (session: DemoSession): string[] =>
  [
    `Created: ${formatTs(session.createdAt)}`,
    `Request Received Date: ${session.requestReceivedDate || '—'}`,
    `Assigned: ${formatTs(session.assignedAt)}`,
    `Confirmed For: ${formatConfirmedSlot(session)}`,
    `Completed: ${formatTs(session.completedAt)}`,
    `Released: ${formatTs(session.releasedAt)}`,
    `Reopened: ${formatTs(session.reopenedAt)}`,
    session.rescheduledFromDemoId ? `Rescheduled From: ${session.rescheduledFromDemoId}` : null,
    session.rescheduledToDemoId ? `Rescheduled To: ${session.rescheduledToDemoId}` : null,
    `Last Updated: ${formatTs(session.lastUpdatedAt || session.createdAt)}`,
  ].filter((value): value is string => Boolean(value));

const formatHistoryAction = (action?: string) => {
  if (!action) return 'Updated';
  if (action === 'created') return 'Created';
  if (action === 'claimed') return 'Claimed';
  if (action === 'assigned') return 'Assigned';
  if (action === 'schedule_updated') return 'Schedule Updated';
  if (action === 'completed') return 'Completed';
  if (action === 'reschedule_created') return 'Reschedule Follow-up Created';
  if (action === 'reassigned') return 'Reassigned';
  if (action === 'cancelled') return 'Cancelled';
  if (action === 'released') return 'Released';
  if (action === 'reopened') return 'Reopened';
  if (action === 'admin_details_updated') return 'Details Updated';
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
    `Request received date: ${session.requestReceivedDate || '—'}`,
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

export default function DemoSessionsManagement({
  openCreateRequestSignal = 0,
  mode = 'full',
}: DemoSessionsManagementProps) {
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
  const [editTarget, setEditTarget] = useState<DemoSession | null>(null);
  const [editForm, setEditForm] = useState<DemoFormState>(INITIAL_FORM);
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
  const [timelineViewTarget, setTimelineViewTarget] = useState<DemoSession | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trendRangePreset, setTrendRangePreset] = useState<DemoTrendRangePreset>('month');
  const [trendCustomStartDate, setTrendCustomStartDate] = useState<string>(DEMO_TREND_ONBOARDING_START_KEY);
  const [trendCustomEndDate, setTrendCustomEndDate] = useState<string>(getTodayDateInput);
  const [activeTrendMetrics, setActiveTrendMetrics] = useState<TrendMetricKey[]>(TREND_METRIC_KEYS);

  useEffect(() => {
    if (!openCreateRequestSignal) return;
    setForm(buildInitialForm());
    setCreateDialogOpen(true);
  }, [openCreateRequestSignal]);

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
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribe = onSnapshot(
      teachersQuery,
      (teachersSnap) => {
        const options = teachersSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as {
              name?: string;
              displayName?: string;
              email?: string;
              status?: string;
              isDeleted?: boolean;
              archivedAt?: unknown;
              deletedAt?: unknown;
            };
            const status = normalizeDemoStatus(data.status);
            const isArchived = status === 'archived' || Boolean(data.archivedAt);
            const isDeleted = Boolean(data.isDeleted) || Boolean(data.deletedAt);
            if (isArchived || isDeleted) return null;
            const name = data.name || data.displayName || data.email || 'Teacher';
            return { id: docSnap.id, name };
          })
          .filter((option): option is TeacherOption => Boolean(option))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(options);
      },
      (error: any) => {
        toast({
          title: 'Failed to load teachers',
          description: error?.message || 'Please refresh and try again.',
          variant: 'destructive',
        });
      },
    );

    return unsubscribe;
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

  const liveTeacherNameById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.name])),
    [teachers],
  );

  const liveTeacherNames = useMemo(
    () =>
      new Set(
        teachers
          .map((teacher) => teacher.name.trim().toLowerCase())
          .filter(Boolean),
      ),
    [teachers],
  );

  const resolveLiveTeacherName = useCallback(
    (session: DemoSession): string => {
      const teacherId = (session.assignedTeacherId || '').trim();
      if (teacherId && liveTeacherNameById.has(teacherId)) {
        return liveTeacherNameById.get(teacherId) || '';
      }

      const snapshotName = (session.assignedTeacherName || '').trim();
      if (snapshotName && liveTeacherNames.has(snapshotName.toLowerCase())) {
        return snapshotName;
      }

      return '';
    },
    [liveTeacherNameById, liveTeacherNames],
  );

  const createdTillDateCount = useMemo(() => sessions.length, [sessions]);

  const completedTillDateCount = useMemo(
    () => sessions.filter((session) => session.status === 'completed').length,
    [sessions],
  );

  const convertedTillDateCount = useMemo(
    () => sessions.filter((session) => session.conversionStatus === 'enrolled').length,
    [sessions],
  );

  const lostTillDateCount = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.conversionStatus === 'not_interested' || session.conversionStatus === 'wrong_fit',
      ).length,
    [sessions],
  );

  const noShowTillDateCount = useMemo(
    () =>
      sessions.filter(
        (session) => session.outcome === 'parent_no_show' || session.outcome === 'teacher_no_show',
      ).length,
    [sessions],
  );

  const teacherHandledTillDate = useMemo(() => {
    const counts = new Map<string, number>();
    sessions.forEach((session) => {
      if (session.status !== 'assigned' && session.status !== 'completed') return;
      const teacherName = resolveLiveTeacherName(session);
      if (!teacherName) return;
      counts.set(teacherName, (counts.get(teacherName) || 0) + 1);
    });

    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [sessions, resolveLiveTeacherName]);

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
        new Set(sessions.map((session) => resolveLiveTeacherName(session)).filter(Boolean)),
      ).sort(),
    [sessions, resolveLiveTeacherName],
  );

  const visibleSessions = useMemo(
    () =>
      tabSessions.filter((session) => {
        if (statusFilter !== 'all' && session.status !== statusFilter) return false;
        if (courseFilter !== 'all' && session.courseInterested !== courseFilter) return false;
        if (sourceFilter !== 'all' && (session.source || '') !== sourceFilter) return false;
        const sessionTeacherName = resolveLiveTeacherName(session);
        if (assignedTeacherFilter !== 'all' && sessionTeacherName !== assignedTeacherFilter) {
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
    [
      assignedTeacherFilter,
      courseFilter,
      phoneMap,
      resolveLiveTeacherName,
      searchQuery,
      sourceFilter,
      statusFilter,
      tabSessions,
    ],
  );

  const earliestTrendDateKey = useMemo(() => {
    let earliest: string | null = null;
    const setEarliest = (dateKey: string | null) => {
      if (!dateKey) return;
      if (!earliest || dateKey < earliest) earliest = dateKey;
    };

    sessions.forEach((session) => {
      setEarliest(normalizeDateInputKey(session.requestReceivedDate));
      setEarliest(toDateKeyFromTimestamp(session.createdAt));
      setEarliest(toDateKeyFromTimestamp(session.assignedAt));
      setEarliest(toDateKeyFromTimestamp(session.completedAt));
      if (session.conversionStatus === 'enrolled') {
        setEarliest(toDateKeyFromTimestamp(session.lastUpdatedAt || session.completedAt || session.createdAt));
      }
    });

    return earliest || getTodayDateInput();
  }, [sessions]);

  const trendRangeBounds = useMemo(() => {
    const todayKey = getTodayDateInput();

    if (trendRangePreset === 'week') {
      const todayDate = parseDateInput(todayKey) || new Date();
      const startDate = new Date(todayDate.getTime() - 6 * DAY_MS);
      return { startKey: clampTrendStartKey(toDateInput(startDate)), endKey: todayKey };
    }

    if (trendRangePreset === 'month') {
      return { startKey: clampTrendStartKey(getMonthStartDateInput()), endKey: todayKey };
    }

    if (trendRangePreset === 'till_date') {
      return { startKey: clampTrendStartKey(earliestTrendDateKey), endKey: todayKey };
    }

    let startKey = clampTrendStartKey(normalizeDateInputKey(trendCustomStartDate) || todayKey);
    let endKey = normalizeDateInputKey(trendCustomEndDate) || todayKey;
    if (startKey > endKey) {
      const swap = startKey;
      startKey = endKey;
      endKey = swap;
    }
    return { startKey, endKey };
  }, [earliestTrendDateKey, trendCustomEndDate, trendCustomStartDate, trendRangePreset]);

  const trendData = useMemo<DemoTrendPoint[]>(() => {
    const startDate = parseDateInput(trendRangeBounds.startKey);
    const endDate = parseDateInput(trendRangeBounds.endKey);
    if (!startDate || !endDate || startDate.getTime() > endDate.getTime()) return [];

    const points: DemoTrendPoint[] = [];
    const pointByDate = new Map<string, DemoTrendPoint>();

    for (let ms = startDate.getTime(); ms <= endDate.getTime(); ms += DAY_MS) {
      const dateKey = toDateInput(new Date(ms));
      const point: DemoTrendPoint = {
        dateKey,
        label: formatDateKeyLabel(dateKey),
        received: 0,
        assigned: 0,
        completed: 0,
        enrolled: 0,
      };
      points.push(point);
      pointByDate.set(dateKey, point);
    }

    const increment = (dateKey: string | null, key: 'received' | 'assigned' | 'completed' | 'enrolled') => {
      if (!dateKey) return;
      const point = pointByDate.get(dateKey);
      if (!point) return;
      point[key] += 1;
    };

    sessions.forEach((session) => {
      const receivedDateKey = getTrendReceivedDateKey(session);
      increment(receivedDateKey, 'received');
      increment(toDateKeyFromTimestamp(session.assignedAt), 'assigned');
      increment(toDateKeyFromTimestamp(session.completedAt), 'completed');
      if (session.conversionStatus === 'enrolled') {
        increment(
          toDateKeyFromTimestamp(session.lastUpdatedAt || session.completedAt || session.createdAt),
          'enrolled',
        );
      }
    });

    return points;
  }, [sessions, trendRangeBounds.endKey, trendRangeBounds.startKey]);

  const trendTotals = useMemo(
    () =>
      trendData.reduce(
        (acc, point) => ({
          received: acc.received + point.received,
          assigned: acc.assigned + point.assigned,
          completed: acc.completed + point.completed,
          enrolled: acc.enrolled + point.enrolled,
        }),
        { received: 0, assigned: 0, completed: 0, enrolled: 0 },
      ),
    [trendData],
  );

  const visibleTrendMetrics = useMemo(
    () => TREND_METRIC_KEYS.filter((metric) => activeTrendMetrics.includes(metric)),
    [activeTrendMetrics],
  );

  const singleVisibleTrendMetric = visibleTrendMetrics.length === 1 ? visibleTrendMetrics[0] : null;

  const handleTrendMetricToggle = (metric: TrendMetricKey) => {
    setActiveTrendMetrics((prev) => {
      if (prev.length === 1 && prev[0] === metric) return TREND_METRIC_KEYS;
      return [metric];
    });
  };

  const onFieldChange = (key: keyof DemoFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onEditFieldChange = (key: keyof DemoFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
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
    const parentPhone = buildPhoneFromParts(form.parentPhoneCountryCode, form.parentPhoneLocal);

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
      !parentPhone ||
      !form.childName.trim() ||
      !form.childGrade.trim() ||
      !form.courseInterested.trim() ||
      !form.requestReceivedDate.trim() ||
      !form.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill all required fields before creating the demo request.',
        variant: 'destructive',
      });
      return;
    }

    let forceCreate = false;
    try {
      const conflictResult = await checkDemoPhoneConflicts(parentPhone);
      if (conflictResult.hasConflicts) {
        const warningLines = [
          'This phone number already exists in the system.',
          '',
          `Demo requests: ${conflictResult.counts.demoRequests}`,
          `Leads/Inquiries: ${conflictResult.counts.leads}`,
          `Parent profiles: ${conflictResult.counts.parentProfiles}`,
          `Enrollments: ${conflictResult.counts.enrollments}`,
          '',
          'Please double-check before creating another demo request.',
          'Press OK to proceed, or Cancel to review existing records.',
        ];
        const proceed = window.confirm(warningLines.join('\n'));
        if (!proceed) {
          return;
        }
        forceCreate = true;
      }
    } catch (error: any) {
      toast({
        title: 'Unable to verify existing phone records',
        description: error?.message || 'Please try again before creating this demo request.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateDemoSessionInput = {
      parentName: form.parentName,
      parentPhone,
      forceCreate,
      childName: form.childName,
      childGrade: form.childGrade,
      childAge: parsedAge,
      courseInterested: form.courseInterested,
      source: form.source || null,
      demoMode: form.demoMode || null,
      requestReceivedDate: form.requestReceivedDate || null,
      preferredDateTimeText: form.preferredDateTimeText,
      timezone: form.timezone || null,
      adminNotes: form.adminNotes || null,
    };

    setCreating(true);
    try {
      await createDemoSession(payload, user.uid);
      setForm(buildInitialForm());
      setActiveTab('open');
      setCreateDialogOpen(false);
      toast({
        title: 'Demo session created',
        description: 'The demo request is now available in the assignment pool.',
      });
    } catch (error: any) {
      const isDuplicate = error?.code === 'already-exists' || String(error?.message || '').includes('already exists');
      toast({
        title: isDuplicate ? 'Duplicate demo detected' : 'Failed to create demo session',
        description:
          error?.message ||
          (isDuplicate
            ? 'A demo with the same child name and parent phone already exists.'
            : 'Please try again.'),
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

  const openEditDialog = (session: DemoSession) => {
    const { countryCode, phoneLocal } = splitPhoneForForm(phoneMap[session.id] || '');
    setEditTarget(session);
    setEditForm({
      parentName: session.parentName || '',
      parentPhone: phoneMap[session.id] || '',
      parentPhoneCountryCode: countryCode,
      parentPhoneLocal: phoneLocal,
      childName: session.childName || '',
      childGrade: session.childGrade || '',
      childAge: typeof session.childAge === 'number' ? String(session.childAge) : '',
      courseInterested: session.courseInterested || '',
      source: session.source || '',
      demoMode: session.demoMode || '',
      requestReceivedDate: session.requestReceivedDate || getTodayDateInput(),
      preferredDateTimeText: session.preferredDateTimeText || '',
      timezone: session.timezone || '',
      adminNotes: session.adminNotes || '',
    });
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget || !user?.uid) return;

    const normalizedAge = editForm.childAge.trim();
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
      !editForm.parentName.trim() ||
      !editForm.parentPhone.trim() ||
      !editForm.childName.trim() ||
      !editForm.childGrade.trim() ||
      !editForm.courseInterested.trim() ||
      !editForm.requestReceivedDate.trim() ||
      !editForm.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill all required fields before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSavingAction(`edit:${editTarget.id}`);
    try {
      await updateDemoSessionAdminDetails({
        demoId: editTarget.id,
        parentName: editForm.parentName.trim(),
        parentPhone: editForm.parentPhone.trim(),
        childName: editForm.childName.trim(),
        childGrade: editForm.childGrade.trim(),
        childAge: parsedAge,
        courseInterested: editForm.courseInterested.trim(),
        source: editForm.source.trim() || null,
        demoMode: editForm.demoMode.trim() || null,
        requestReceivedDate: editForm.requestReceivedDate.trim() || null,
        preferredDateTimeText: editForm.preferredDateTimeText.trim(),
        timezone: editForm.timezone.trim() || null,
        adminNotes: editForm.adminNotes.trim() || null,
      });

      setEditTarget(null);
      toast({ title: 'Demo details updated' });
    } catch (error: any) {
      const isDuplicate =
        error?.code === 'already-exists' || String(error?.message || '').includes('already exists');
      toast({
        title: isDuplicate ? 'Duplicate demo detected' : 'Failed to update demo details',
        description:
          error?.message ||
          (isDuplicate
            ? 'A demo with the same child name and parent phone already exists.'
            : 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSavingAction(null);
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
      `Delete demo for ${session.childName} (${session.parentName})? This permanently removes demo data and linked teacher demo earnings.`,
    );
    if (!shouldDelete) return;

    setSavingAction(`delete:${session.id}`);
    try {
      await deleteDemoSession({ demoId: session.id });
      toast({ title: 'Demo deleted with earnings cleanup' });
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
    const isSavingFor = (prefix: string) => savingAction === `${prefix}:${session.id}`;

    if (!isMobile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
              Actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => openConversionDialog(session)} disabled={isSavingFor('conversion')}>
              Follow-up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openEditDialog(session)} disabled={isSavingFor('edit')}>
              Edit details
            </DropdownMenuItem>
            {session.status === 'assigned' && (
              <DropdownMenuItem onSelect={() => openReassignDialog(session)} disabled={isSavingFor('reassign')}>
                Reassign
              </DropdownMenuItem>
            )}
            {session.status === 'assigned' && (
              <DropdownMenuItem onSelect={() => handleRelease(session)} disabled={isSavingFor('release')}>
                Release to open
              </DropdownMenuItem>
            )}
            {session.status !== 'cancelled' && (
              <DropdownMenuItem onSelect={() => handleCancel(session)} disabled={isSavingFor('cancel')}>
                Cancel
              </DropdownMenuItem>
            )}
            {(session.status === 'cancelled' || session.status === 'completed') && (
              <DropdownMenuItem onSelect={() => handleReopen(session)} disabled={isSavingFor('reopen')}>
                Reopen
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleCopyPhone(session)}>Copy Phone</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCopySummary(session)}>Copy Summary</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleCopyFollowUpMessage(session)}>
              Copy Follow-up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOpenWhatsApp(session)}>Open WhatsApp</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() => handleDelete(session)}
              disabled={isSavingFor('delete')}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap justify-end gap-2'}>
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          onClick={() => openConversionDialog(session)}
          disabled={isSavingFor('conversion')}
        >
          Follow-up
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={buttonClass}
          onClick={() => openEditDialog(session)}
          disabled={isSavingFor('edit')}
        >
          Edit
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
            disabled={isSavingFor('reassign')}
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
            disabled={isSavingFor('release')}
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
            disabled={isSavingFor('cancel')}
          >
            Cancel
          </Button>
        )}
        {(session.status === 'cancelled' || session.status === 'completed') && (
          <Button
            size="sm"
            className={buttonClass}
            onClick={() => handleReopen(session)}
            disabled={isSavingFor('reopen')}
          >
            Reopen
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className={buttonClass}
          onClick={() => handleDelete(session)}
          disabled={isSavingFor('delete')}
        >
          Delete
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {mode === 'full' ? (
        <Card className="border-sky-100 bg-gradient-to-b from-sky-50/70 to-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Demo Sessions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create new demo requests from one place.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setForm(buildInitialForm());
                setCreateDialogOpen(true);
              }}
            >
              Create Demo Request
            </Button>
          </div>
        </Card>
      ) : null}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Demo Request</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleCreate}>
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
                <Label>Parent Phone *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex h-10 items-center rounded-md border bg-background">
                    <span className="px-3 text-sm text-muted-foreground">+</span>
                    <Input
                      className="border-0 shadow-none focus-visible:ring-0"
                      inputMode="numeric"
                      placeholder="Country"
                      value={form.parentPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
                      onChange={(e) =>
                        onFieldChange('parentPhoneCountryCode', e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                  <Input
                    className="col-span-2"
                    value={form.parentPhoneLocal}
                    onChange={(e) => onFieldChange('parentPhoneLocal', e.target.value.replace(/\D/g, ''))}
                    placeholder="Phone number"
                    inputMode="numeric"
                    required
                  />
                </div>
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

            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label htmlFor="demo-request-received-date">Request Received Date *</Label>
                <Input
                  id="demo-request-received-date"
                  type="date"
                  value={form.requestReceivedDate}
                  onChange={(e) => onFieldChange('requestReceivedDate', e.target.value)}
                  required
                />
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Demo Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {mode === 'full' ? (
      <Card className="border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold">Demo Tracking</h3>
          <Badge variant="outline">Open: {openSessions.length}</Badge>
          <Badge variant="secondary">Assigned: {assignedSessions.length}</Badge>
          <Badge>Completed: {closedSessions.length}</Badge>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Open Demos</div>
            <div className="mt-1 text-xl font-semibold">{openSessions.length}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Total</div>
            <div className="mt-1 text-xl font-semibold">{assignedSessions.length}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Created Till Date</div>
            <div className="mt-1 text-xl font-semibold">{createdTillDateCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Completed Till Date</div>
            <div className="mt-1 text-xl font-semibold">{completedTillDateCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Converted Till Date</div>
            <div className="mt-1 text-xl font-semibold">{convertedTillDateCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Lost Till Date</div>
            <div className="mt-1 text-xl font-semibold">{lostTillDateCount}</div>
          </Card>
          <Card className="border-slate-200 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">No-show Till Date</div>
            <div className="mt-1 text-xl font-semibold">{noShowTillDateCount}</div>
          </Card>
        </div>
        <div className="mb-4 rounded-lg border border-slate-200 bg-white/80 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Teacher-wise Demos (Assigned + Completed, Live Teachers)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {teacherHandledTillDate.length === 0 ? (
              <span className="text-sm text-muted-foreground">No assigned or completed demos for live teachers yet.</span>
            ) : (
              teacherHandledTillDate.map(([teacherName, count]) => (
                <Badge key={teacherName} variant="outline">
                  {teacherName}: {count}
                </Badge>
              ))
            )}
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Overall totals across all demo records. Reschedule requested closes this record and auto-creates a new Open demo.
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
                    const timelineRows = buildTimelineRows(session);
                    const historyRows = Array.isArray(session.history) ? [...session.history].reverse() : [];
                    const latestHistory = historyRows[0];
                    const timelinePreview = latestHistory
                      ? `Latest: ${formatHistoryAction(latestHistory.action)} · ${formatTs(new Date(latestHistory.atMs))}`
                      : timelineRows[0];

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
                          <div className="text-xs text-muted-foreground">Teacher: {resolveLiveTeacherName(session) || '—'}</div>
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
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 truncate">{timelinePreview}</div>
                              <button
                                type="button"
                                className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                                onClick={() => setTimelineViewTarget(session)}
                              >
                                View more
                              </button>
                            </div>
                          </div>
                          {renderSessionActions(session, 'mobile')}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Course</TableHead>
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
                    return (
                    <TableRow key={session.id} className="transition-colors hover:bg-slate-50/70">
                      <TableCell className="whitespace-nowrap font-medium">{session.childName}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{session.childGrade || '—'}</TableCell>
                      <TableCell className="max-w-[200px] whitespace-nowrap truncate" title={session.parentName}>
                        {session.parentName}
                      </TableCell>
                      <TableCell className="min-w-[150px] whitespace-nowrap">{phoneMap[session.id] || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{session.courseInterested}</TableCell>
                      <TableCell
                        className="min-w-[230px] max-w-[320px] whitespace-nowrap truncate text-xs text-muted-foreground"
                        title={session.preferredDateTimeText}
                      >
                        {session.preferredDateTimeText}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{resolveLiveTeacherName(session) || '—'}</TableCell>
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
                      <TableCell className="whitespace-nowrap">
                        <button
                          type="button"
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() => setTimelineViewTarget(session)}
                        >
                          View more
                        </button>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
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
      ) : null}

      <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Demo Trend Analysis</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Day-wise trend of demos received, assigned, completed, and converted to enrollment.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={trendRangePreset === 'week' ? 'default' : 'outline'}
              onClick={() => setTrendRangePreset('week')}
            >
              Week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={trendRangePreset === 'month' ? 'default' : 'outline'}
              onClick={() => setTrendRangePreset('month')}
            >
              Month
            </Button>
            <Button
              type="button"
              size="sm"
              variant={trendRangePreset === 'till_date' ? 'default' : 'outline'}
              onClick={() => setTrendRangePreset('till_date')}
            >
              Till Date
            </Button>
            <Button
              type="button"
              size="sm"
              variant={trendRangePreset === 'custom' ? 'default' : 'outline'}
              onClick={() => setTrendRangePreset('custom')}
            >
              Custom
            </Button>
          </div>
        </div>

        {trendRangePreset === 'custom' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="demo-trend-start-date">Start Date</Label>
              <Input
                id="demo-trend-start-date"
                type="date"
                value={trendCustomStartDate}
                min={DEMO_TREND_ONBOARDING_START_KEY}
                max={trendCustomEndDate || undefined}
                onChange={(event) => setTrendCustomStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="demo-trend-end-date">End Date</Label>
              <Input
                id="demo-trend-end-date"
                type="date"
                value={trendCustomEndDate}
                min={trendCustomStartDate || undefined}
                max={getTodayDateInput()}
                onChange={(event) => setTrendCustomEndDate(event.target.value)}
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Showing: {trendRangeBounds.startKey} to {trendRangeBounds.endKey}
        </p>
        <div className="mt-4 h-[320px] min-h-[320px] w-full rounded-lg border border-slate-200 bg-white p-3">
          {trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No trend data available for this range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {visibleTrendMetrics.map((metric) => {
                  const config = TREND_METRIC_CONFIG[metric];
                  return (
                    <Line
                      key={metric}
                      type="linear"
                      dataKey={metric}
                      name={config.label}
                      stroke={config.stroke}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    >
                      {singleVisibleTrendMetric === metric ? (
                        <LabelList
                          dataKey={metric}
                          position="top"
                          content={(props) =>
                            renderTrendLabel({
                              x: props.x,
                              y: props.y,
                              value: props.value,
                              stroke: config.stroke,
                            })
                          }
                        />
                      ) : null}
                    </Line>
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Click a metric card to isolate a single trend with data labels. Click the same card again to show all trends.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TREND_METRIC_KEYS.map((metric) => {
            const config = TREND_METRIC_CONFIG[metric];
            const isActive = visibleTrendMetrics.includes(metric);
            const totalValue = trendTotals[metric];
            return (
              <button
                key={metric}
                type="button"
                onClick={() => handleTrendMetricToggle(metric)}
                className={`rounded-lg border bg-white/90 p-3 text-left shadow-sm transition ${
                  isActive ? 'ring-1 ring-offset-0' : 'opacity-70'
                }`}
                style={isActive ? { borderColor: config.stroke, boxShadow: `inset 0 0 0 1px ${config.stroke}33` } : undefined}
              >
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{config.label}</div>
                <div className="mt-1 text-xl font-semibold">{totalValue}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Dialog open={!!timelineViewTarget} onOpenChange={(open) => (!open ? setTimelineViewTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Timeline Details</DialogTitle>
          </DialogHeader>
          {timelineViewTarget && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="font-medium text-foreground">
                  {timelineViewTarget.childName} · {timelineViewTarget.parentName}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Status: {formatStatusLabel(timelineViewTarget.status)} · Course: {timelineViewTarget.courseInterested}
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Timeline</div>
                {buildTimelineRows(timelineViewTarget).map((line, index) => (
                  <div key={`${timelineViewTarget.id}-full-timeline-${index}`}>{line}</div>
                ))}
              </div>

              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Recent Activity</div>
                {Array.isArray(timelineViewTarget.history) && timelineViewTarget.history.length > 0 ? (
                  [...timelineViewTarget.history].reverse().map((entry, index) => (
                    <div key={`${timelineViewTarget.id}-full-history-${entry.atMs}-${index}`}>
                      {formatHistoryAction(entry.action)}: {formatTs(new Date(entry.atMs))}
                      {entry.actorName ? ` by ${entry.actorName}` : ''}
                      {entry.note ? ` (${entry.note})` : ''}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => (!open ? setEditTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Demo Details</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSaveEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-demo-parent-name">Parent Name *</Label>
                <Input
                  id="edit-demo-parent-name"
                  value={editForm.parentName}
                  onChange={(e) => onEditFieldChange('parentName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-demo-parent-phone">Parent Phone *</Label>
                <Input
                  id="edit-demo-parent-phone"
                  value={editForm.parentPhone}
                  onChange={(e) => onEditFieldChange('parentPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-demo-child-name">Child Name *</Label>
                <Input
                  id="edit-demo-child-name"
                  value={editForm.childName}
                  onChange={(e) => onEditFieldChange('childName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-demo-child-grade">Child Grade *</Label>
                <Input
                  id="edit-demo-child-grade"
                  value={editForm.childGrade}
                  onChange={(e) => onEditFieldChange('childGrade', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-demo-child-age">Child Age</Label>
                <Input
                  id="edit-demo-child-age"
                  type="number"
                  min={0}
                  value={editForm.childAge}
                  onChange={(e) => onEditFieldChange('childAge', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-demo-course">Course Interested *</Label>
                <Select
                  value={editForm.courseInterested || undefined}
                  onValueChange={(value) => onEditFieldChange('courseInterested', value)}
                >
                  <SelectTrigger id="edit-demo-course">
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
                <Label htmlFor="edit-demo-timezone">Timezone</Label>
                <Select
                  value={editForm.timezone || 'not_set'}
                  onValueChange={(value) => onEditFieldChange('timezone', value === 'not_set' ? '' : value)}
                >
                  <SelectTrigger id="edit-demo-timezone">
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-demo-source">Source</Label>
                <Select
                  value={editForm.source || 'not_set'}
                  onValueChange={(value) => onEditFieldChange('source', value === 'not_set' ? '' : value)}
                >
                  <SelectTrigger id="edit-demo-source">
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
                <Label htmlFor="edit-demo-mode">Demo Mode</Label>
                <Select
                  value={editForm.demoMode || 'not_set'}
                  onValueChange={(value) => onEditFieldChange('demoMode', value === 'not_set' ? '' : value)}
                >
                  <SelectTrigger id="edit-demo-mode">
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
              <div className="space-y-2">
                <Label htmlFor="edit-demo-request-received-date">Request Received Date *</Label>
                <Input
                  id="edit-demo-request-received-date"
                  type="date"
                  value={editForm.requestReceivedDate}
                  onChange={(e) => onEditFieldChange('requestReceivedDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-demo-preferred-slot">Parent Preferred Date/Time *</Label>
              <Textarea
                id="edit-demo-preferred-slot"
                value={editForm.preferredDateTimeText}
                onChange={(e) => onEditFieldChange('preferredDateTimeText', e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-demo-admin-notes">Notes for Teacher</Label>
              <Textarea
                id="edit-demo-admin-notes"
                value={editForm.adminNotes}
                onChange={(e) => onEditFieldChange('adminNotes', e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editTarget || !!savingAction}>
                {savingAction && savingAction.startsWith('edit:') ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
