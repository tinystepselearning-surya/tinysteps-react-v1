// src/pages/admin/AdminDashboard.tsx
import React, { Suspense, startTransition, useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent } from '@components/ui/tabs';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import {
  BellDot,
  BookCopy,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ContactRound,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  LineChart,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Timestamp, collection, doc, documentId, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, functions } from '../../lib/firebaseConfig';
import { type FunctionsError, httpsCallable } from 'firebase/functions';
import { useToast } from '@components/hooks/use-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import callFunction from '../../lib/callFunctions';

// 🔁 CHANGE START
import UserManagement from './UserManagement/UserManagement';
// 🔁 CHANGE END

import RefreshPublicKbTool from './RefreshPublicKbTool';

import StudentManagementTab from './StudentManagement/StudentManagementTab';
import RelationshipManagement from './RelationshipManagement/RelationshipManagement';
import CourseManagement from './CourseManagement/CourseManagement';
import EnrollmentsList from './EnrollmentManagement/EnrollmentsList';
import LessonLibrary from './LessonLibrary/LessonLibraryAdminPage';
import ClassRecordingsManagement from './ClassRecordings/ClassRecordingsManagement';
import ClassSamplesManagement from './ClassSamplesManagement';
import TestimonialsManagement from './TestimonialsManagement';
import LeadsInquiriesWorkspace, { type LeadsWorkspaceView } from './LeadsInquiriesWorkspace';
import TodaysNotifications from './TodaysNotifications';
import AnalyticsDashboard from './AnalyticsDashboard';
import TeacherPayments from './TeacherPayments';
import ParentPayments from './ParentPayments';
import ParentWorksheetLibraryManagement from './ParentWorksheetLibraryManagement';
import TeacherScheduleManagement from './TeacherScheduleManagement';
import FinanceReconciliationRunsCard from './FinanceReconciliationRunsCard';
import EnrollmentCanonicalMigrationCard from './EnrollmentCanonicalMigrationCard';
import { isSuperUserEmail } from '../../constants/accessControl';
import AdminOverviewCard from '../../components/admin/AdminOverviewCard';
import MobileTabBar, { type MobileTabBarItem } from '../../components/common/MobileTabBar';
import HolidayCalendar2026 from '../../components/common/HolidayCalendar2026';
import { useAdminStats } from '../../hooks/useAdminStats';

const ROLE_SHORTCUTS = [
  { id: 'admin', label: 'Admin', path: '/surya' },
  { id: 'teacher', label: 'Teacher', path: '/teacher' },
  { id: 'parent', label: 'Parent', path: '/parent' },
  {
    id: 'learningPartner',
    label: 'Learning Partner',
    path: '/learning-partner/dashboard',
  },
  {
    id: 'schoolAdmin',
    label: 'School Admin',
    path: '/school',
  },
  { id: 'kid', label: 'Kid', path: '/parent/kids' },
];

const ADMIN_MOBILE_TABS: MobileTabBarItem[] = [
  { id: 'users', label: 'Users', icon: UserCog },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'leads', label: 'Leads', icon: ContactRound },
  { id: 'enrollments', label: 'Enroll', icon: ClipboardList },
  { id: 'attendance-corrections', label: 'Attendance', icon: ClipboardList },
  { id: 'relationships', label: 'Relations', icon: Handshake },
  { id: 'courses', label: 'Courses', icon: BookCopy },
  { id: 'today-notifications', label: 'Sessions', icon: BellDot },
  { id: 'lessons', label: 'Lessons', icon: BookOpen },
  { id: 'class-recordings', label: 'Recordings', icon: Users },
  { id: 'class-samples', label: 'Samples', icon: Users },
  { id: 'testimonials', label: 'Reviews', icon: MessageSquareQuote },
  { id: 'parent-worksheets', label: 'Worksheets', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'teacher-schedule', label: 'Schedules', icon: CalendarClock },
  { id: 'holidays', label: 'Holidays', icon: CalendarDays },
  { id: 'teacher-payments', label: 'Teacher Pay', icon: Wallet },
  { id: 'parent-payments', label: 'Parent Pay', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AccessMessage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
    <Card className="p-8 text-center space-y-2">
      <h2 className="text-2xl font-bold text-red-600">Access Restricted</h2>
      <p>{children}</p>
    </Card>
  </div>
);

type AttendanceCorrectionStatus =
  | 'present'
  | 'absent'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show'
  | 'reschedule_requested'
  | 'late';
type AttendanceCorrectionSession = {
  id: string;
  date: string;
  startTime: string;
  courseLabel: string;
  kidIds: string[];
  attendance: Record<string, unknown>;
};

const ATTENDANCE_CORRECTION_STATUS_OPTIONS: AttendanceCorrectionStatus[] = [
  'present',
  'absent',
  'cancelled',
  'rescheduled',
  'no_show',
  'reschedule_requested',
  'late',
];

const toIsoDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTimeForLabel = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
};

const toDateMaybe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const dt = (value as { toDate: () => Date }).toDate();
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
};

const resolveAttendanceStatus = (entry: unknown): string => {
  if (typeof entry === 'string') return entry.trim().toLowerCase();
  if (entry && typeof entry === 'object' && typeof (entry as { status?: unknown }).status === 'string') {
    return String((entry as { status: string }).status).trim().toLowerCase();
  }
  return '';
};

// ---------- Insights Kill Switch Component ----------
function InsightsKillSwitch() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load current state from Firestore
  const loadConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'insights');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        setEnabled(data?.enabled ?? true);
        
        // Format last updated time
        if (data?.lastRunAt) {
          const timestamp = data.lastRunAt.toDate?.() || new Date(data.lastRunAt.seconds * 1000);
          const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(timestamp);
          setLastUpdated(`${formatted} IST (${data?.lastRunLabel || 'unknown'})`);
        }
      } else {
        // Doc doesn't exist, treat as enabled (server will auto-create)
        setEnabled(true);
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to load config:', err);
      setError('Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggle = async () => {
    const nextEnabled = !enabled;
    setSaving(true);
    setError(null);

    try {
      const setInsightsEnabled = httpsCallable<{ enabled: boolean }, { ok: boolean; enabled: boolean }>(
        functions,
        'setInsightsEnabled'
      );

      const result = await setInsightsEnabled({ enabled: nextEnabled });

      if (result.data.ok) {
        setEnabled(nextEnabled);
        toast({
          title: nextEnabled ? 'Insights Enabled' : 'Insights Disabled',
          description: nextEnabled
            ? 'Game session summaries will now update.'
            : 'Game session summaries will NOT update.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to toggle:', err);
      setError(err.message || 'Failed to update');
      toast({
        title: 'Error',
        description: err.message || 'Failed to update kill switch',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setError(null);

    try {
      const runInsightsRollupNow = httpsCallable<
        Record<string, never>,
        { ok: boolean; message?: string; kidsUpdated?: number; sessionsProcessed?: number }
      >(functions, 'runInsightsRollupNow');

      const result = await runInsightsRollupNow({});

      if (result.data.ok) {
        toast({
          title: 'Insights Updated',
          description: `Updated ${result.data.kidsUpdated || 0} kids, processed ${result.data.sessionsProcessed || 0} sessions.`,
          variant: 'default',
        });
        
        // Reload config to show new last updated time
        await loadConfig();
      } else {
        toast({
          title: 'Update Not Run',
          description: result.data.message || 'Insights are disabled',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('[InsightsKillSwitch] Failed to run rollup:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to run insights update',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Insights Kill Switch</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Control whether game session summaries are updated in real-time.
          </p>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <p className="font-medium">{enabled ? '✅ Enabled' : '❌ Disabled'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enabled
                ? 'Game sessions will update kids/{kidId}.summary'
                : 'Game sessions will NOT update summaries (trigger skipped)'}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              onClick={handleRunNow}
              disabled={running || saving}
              variant="outline"
              size="sm"
            >
              {running ? 'Running...' : 'Run Update Now'}
            </Button>
            
            <Button
              onClick={handleToggle}
              disabled={saving || running}
              variant={enabled ? 'destructive' : 'default'}
            >
              {saving ? 'Saving...' : enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• When disabled, the Cloud Function trigger <code>onGameSessionCreate</code> will skip.</p>
          <p>• Config stored at: <code>config/insights.enabled</code></p>
          <p>• Changes take effect immediately for all new game sessions.</p>
          <p>• "Run Update Now" triggers batch rollup manually regardless of schedule.</p>
        </div>
      </div>
    </Card>
  );
}

function MessagingBackendTestCard() {
  const [kidId, setKidId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const normalizeError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null) {
      const maybeMessage = (err as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        return maybeMessage;
      }
    }
    return 'Request failed. Please check logs and try again.';
  };

  const handleCreateOrSync = async () => {
    const trimmedKidId = kidId.trim();
    if (!trimmedKidId) {
      setError('kidId is required.');
      setResult(null);
      return;
    }

    setIsSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<{ threadId: string }, { kidId: string }>(
        'createOrSyncMessageThread',
        { kidId: trimmedKidId }
      );
      setThreadId(response.threadId || '');
      setResult(`Thread ready: ${response.threadId}`);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const resolvedThreadId = threadId.trim();
    const resolvedText = (textOverride ?? messageText).trim();

    if (!resolvedThreadId) {
      setError('threadId is required. Create/Sync thread first.');
      setResult(null);
      return;
    }

    if (!resolvedText) {
      setError('Message text is required.');
      setResult(null);
      return;
    }

    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<{ messageId: string }, { threadId: string; text: string }>(
        'sendMessage',
        {
          threadId: resolvedThreadId,
          text: resolvedText,
        }
      );
      setResult(`Message sent: ${response.messageId}`);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleSyncAllActiveStudentThreads = async () => {
    setIsBulkSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await callFunction<
        { scanned: number; synced: number; skipped: number; errors?: string[] },
        Record<string, never>
      >('syncMessageThreadsForActiveStudents', {});
      const scanned = Number(response?.scanned || 0);
      const synced = Number(response?.synced || 0);
      const skipped = Number(response?.skipped || 0);
      const hasErrors = Array.isArray(response?.errors) && response.errors.length > 0;
      setResult(
        `Synced ${synced} threads, skipped ${skipped}. Scanned ${scanned} active students.${hasErrors ? ' Check function logs for details.' : ''}`
      );
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setIsBulkSyncing(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Messaging Backend Test (Admin)</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Internal callable test only. Uses Cloud Functions, no direct Firestore writes.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kid ID</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={kidId}
            onChange={(event) => setKidId(event.target.value)}
            placeholder="Enter kidId"
          />
          <Button
            type="button"
            onClick={handleCreateOrSync}
            disabled={isSyncing}
            className="sm:w-auto"
          >
            {isSyncing ? 'Syncing...' : 'Create/Sync Thread'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">Bulk sync</p>
        <p className="mt-1 text-xs text-slate-600">
          Create or refresh conversation threads for all active students.
        </p>
        <Button
          type="button"
          className="mt-2"
          variant="outline"
          onClick={handleSyncAllActiveStudentThreads}
          disabled={isBulkSyncing}
        >
          {isBulkSyncing ? 'Syncing all...' : 'Sync All Active Student Threads'}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Thread ID</label>
        <Input
          value={threadId}
          onChange={(event) => setThreadId(event.target.value)}
          placeholder="student_<kidId>"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Test Message</label>
        <Textarea
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Type test message"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send Test Message'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSendMessage('Please call me at +91 98765 43210')}
          disabled={isSending}
        >
          Send Phone Number Test Message
        </Button>
      </div>

      {result && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {result}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </Card>
  );
}

function AttendanceCorrectionsPanel() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [sessionRows, setSessionRows] = useState<AttendanceCorrectionSession[]>([]);
  const [kidNameById, setKidNameById] = useState<Record<string, string>>({});
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<AttendanceCorrectionStatus>('present');
  const [reason, setReason] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
        if (cancelled) return;
        const options = snap.docs
          .map((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const fullName =
              typeof data.fullName === 'string' && data.fullName.trim()
                ? data.fullName.trim()
                : typeof data.name === 'string' && data.name.trim()
                  ? data.name.trim()
                  : '';
            const email = typeof data.email === 'string' ? data.email.trim() : '';
            return {
              id: docSnap.id,
              label: fullName || email || docSnap.id,
            };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
        setTeacherOptions(options);
        if (options.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(options[0].id);
        }
      } catch (err) {
        console.error('Failed to load teacher options', err);
        if (!cancelled) {
          toast({
            title: 'Unable to load teachers',
            description: err instanceof Error ? err.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    };
    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      if (!selectedTeacherId || !selectedDate) {
        setSessionRows([]);
        setKidNameById({});
        return;
      }

      setLoadingSessions(true);
      try {
        const sessionMap = new Map<string, Record<string, unknown>>();
        try {
          const primarySnap = await getDocs(
            query(
              collection(db, 'classSessions'),
              where('teacherId', '==', selectedTeacherId),
              where('date', '==', selectedDate),
            ),
          );
          primarySnap.docs.forEach((docSnap) => {
            sessionMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
          });
        } catch (primaryErr) {
          console.warn('Attendance correction date query failed, falling back', primaryErr);
        }

        if (sessionMap.size === 0) {
          const dayStart = new Date(`${selectedDate}T00:00:00`);
          const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          try {
            const boundedStartAtSnap = await getDocs(
              query(
                collection(db, 'classSessions'),
                where('teacherId', '==', selectedTeacherId),
                where('startAt', '>=', Timestamp.fromDate(dayStart)),
                where('startAt', '<', Timestamp.fromDate(nextDayStart)),
              ),
            );
            boundedStartAtSnap.docs.forEach((docSnap) => {
              sessionMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
            });
          } catch (boundedErr) {
            console.warn('Attendance correction bounded startAt query failed, falling back', boundedErr);
          }
        }

        if (sessionMap.size === 0) {
          const fallbackSnap = await getDocs(
            query(collection(db, 'classSessions'), where('teacherId', '==', selectedTeacherId)),
          );
          fallbackSnap.docs.forEach((docSnap) => {
            sessionMap.set(docSnap.id, (docSnap.data() || {}) as Record<string, unknown>);
          });
        }
        if (cancelled) return;

        const rows: AttendanceCorrectionSession[] = Array.from(sessionMap.entries())
          .map(([id, data]) => {
            const startAtDate = toDateMaybe(data.startAt);
            const date = typeof data.date === 'string' && data.date.trim()
              ? data.date.trim()
              : startAtDate
                ? toIsoDate(startAtDate)
                : '';
            const fallbackStartTime = startAtDate
              ? `${String(startAtDate.getHours()).padStart(2, '0')}:${String(startAtDate.getMinutes()).padStart(2, '0')}`
              : '';
            const startTime = normalizeTimeForLabel(data.startTime) || fallbackStartTime;
            const kidIds = Array.isArray(data.kidIds)
              ? data.kidIds.map((id) => String(id || '').trim()).filter(Boolean)
              : [];
            const courseLabel =
              (typeof data.courseLabel === 'string' && data.courseLabel.trim()) ||
              (typeof data.courseName === 'string' && data.courseName.trim()) ||
              (typeof data.courseId === 'string' && data.courseId.trim()) ||
              'Course';
            const attendance =
              data.attendance && typeof data.attendance === 'object' && !Array.isArray(data.attendance)
                ? (data.attendance as Record<string, unknown>)
                : {};
            return {
              id,
              date,
              startTime,
              courseLabel,
              kidIds,
              attendance,
            };
          })
          .filter((row) => row.date === selectedDate)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        const kidIds = Array.from(new Set(rows.flatMap((row) => row.kidIds)));
        const kidMap: Record<string, string> = {};

        for (let i = 0; i < kidIds.length; i += 10) {
          const chunk = kidIds.slice(i, i + 10);
          const kidSnap = await getDocs(query(collection(db, 'kids'), where(documentId(), 'in', chunk)));
          kidSnap.docs.forEach((kidDoc) => {
            const kid = (kidDoc.data() || {}) as Record<string, unknown>;
            const label =
              (typeof kid.fullName === 'string' && kid.fullName.trim()) ||
              (typeof kid.studentName === 'string' && kid.studentName.trim()) ||
              (typeof kid.name === 'string' && kid.name.trim()) ||
              kidDoc.id;
            kidMap[kidDoc.id] = label;
          });
        }

        if (!cancelled) {
          setSessionRows(rows);
          setKidNameById(kidMap);
        }
      } catch (err) {
        console.error('Failed to load attendance correction sessions', err);
        if (!cancelled) {
          setSessionRows([]);
          setKidNameById({});
          toast({
            title: 'Unable to load sessions',
            description: err instanceof Error ? err.message : 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    };

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedTeacherId, selectedDate, reloadKey, toast]);

  const kidOptions = useMemo(() => {
    const ids = Array.from(new Set(sessionRows.flatMap((row) => row.kidIds)));
    return ids
      .map((id) => ({ id, label: kidNameById[id] || id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [kidNameById, sessionRows]);

  const sessionOptions = useMemo(() => {
    const filtered = selectedKidId
      ? sessionRows.filter((row) => row.kidIds.includes(selectedKidId))
      : sessionRows;
    return filtered.map((row) => ({
      id: row.id,
      label: `${row.startTime || '--:--'} • ${row.courseLabel} • ${row.id.slice(0, 8)}`,
      kidIds: row.kidIds,
      attendance: row.attendance,
    }));
  }, [selectedKidId, sessionRows]);

  useEffect(() => {
    if (kidOptions.length === 0) {
      setSelectedKidId('');
      return;
    }
    if (!selectedKidId || !kidOptions.some((opt) => opt.id === selectedKidId)) {
      setSelectedKidId(kidOptions[0].id);
    }
  }, [kidOptions, selectedKidId]);

  useEffect(() => {
    if (sessionOptions.length === 0) {
      setSelectedSessionId('');
      return;
    }
    if (!selectedSessionId || !sessionOptions.some((opt) => opt.id === selectedSessionId)) {
      setSelectedSessionId(sessionOptions[0].id);
    }
  }, [selectedSessionId, sessionOptions]);

  const selectedSession = useMemo(
    () => sessionOptions.find((opt) => opt.id === selectedSessionId) || null,
    [selectedSessionId, sessionOptions],
  );

  const previousStatus = selectedSession && selectedKidId
    ? resolveAttendanceStatus(selectedSession.attendance[selectedKidId]) || 'not_marked'
    : 'not_marked';

  const handleSave = async () => {
    if (!selectedTeacherId || !selectedKidId || !selectedSessionId) {
      toast({
        title: 'Incomplete selection',
        description: 'Choose teacher, student, and session before saving.',
        variant: 'destructive',
      });
      return;
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Reason required',
        description: 'Please add a reason for this attendance correction.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const fn = httpsCallable<
        { sessionId: string; kidId: string; newStatus: AttendanceCorrectionStatus; reason: string },
        { ok: boolean }
      >(functions, 'adminAttendanceCorrection');

      await fn({
        sessionId: selectedSessionId,
        kidId: selectedKidId,
        newStatus,
        reason: trimmedReason,
      });

      toast({
        title: 'Attendance corrected',
        description: 'Attendance correction saved with audit trail.',
      });
      setReason('');
      setReloadKey((value) => value + 1);
    } catch (err) {
      const firebaseError = err as FunctionsError;
      const errorCode = typeof firebaseError?.code === 'string' ? firebaseError.code : 'unknown';
      const errorMessage =
        typeof firebaseError?.message === 'string' && firebaseError.message.trim()
          ? firebaseError.message
          : err instanceof Error
            ? err.message
            : 'Please try again.';
      console.error('Failed to save attendance correction', {
        code: errorCode,
        message: errorMessage,
        details: firebaseError?.details,
      });
      toast({
        title: 'Unable to save correction',
        description: `${errorCode}: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Attendance Corrections</h3>
        <p className="text-sm text-slate-600">
          Admin-only corrections for sessions outside the teacher attendance window.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teacher</label>
          <select
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={selectedTeacherId}
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            disabled={loadingTeachers}
          >
            {teacherOptions.length === 0 ? (
              <option value="">{loadingTeachers ? 'Loading teachers...' : 'No teachers found'}</option>
            ) : (
              teacherOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Session Date</label>
          <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
          <select
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={selectedKidId}
            onChange={(event) => setSelectedKidId(event.target.value)}
            disabled={loadingSessions || kidOptions.length === 0}
          >
            {kidOptions.length === 0 ? (
              <option value="">{loadingSessions ? 'Loading students...' : 'No students for selected filters'}</option>
            ) : (
              kidOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Session</label>
          <select
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            disabled={loadingSessions || sessionOptions.length === 0}
          >
            {sessionOptions.length === 0 ? (
              <option value="">{loadingSessions ? 'Loading sessions...' : 'No sessions found'}</option>
            ) : (
              sessionOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Previous Status</label>
          <div className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm flex items-center">
            {previousStatus}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">New Status</label>
          <select
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
            value={newStatus}
            onChange={(event) => setNewStatus(event.target.value as AttendanceCorrectionStatus)}
          >
            {ATTENDANCE_CORRECTION_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason (required)</label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why this correction is needed."
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !user || user.role !== 'admin'}>
          {saving ? 'Saving...' : 'Save Correction'}
        </Button>
      </div>
    </Card>
  );
}

// ---------- Main Admin Dashboard ----------
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState('users');
  const [leadsWorkspaceView, setLeadsWorkspaceView] = useState<LeadsWorkspaceView>('leads');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ FIX: local reload key for EnrollmentsList (required prop)
  const [enrollmentsReloadKey] = useState(0);

  const isSuperUser = isSuperUserEmail(user?.email);
  const canViewAdmin = isSuperUser || user?.role === 'admin';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    const validTabs = new Set([
      'users',
      'students',
      'leads',
      'enrollments',
      'attendance-corrections',
      'relationships',
      'courses',
      'today-notifications',
      'lessons',
      'class-recordings',
      'class-samples',
      'testimonials',
      'parent-worksheets',
      'analytics',
      'teacher-schedule',
      'holidays',
      'teacher-payments',
      'parent-payments',
      'settings',
    ]);

    if (tabFromUrl === 'leads') {
      setLeadsWorkspaceView(params.get('leadView') === 'demos' ? 'demos' : 'leads');
    } else {
      setLeadsWorkspaceView('leads');
    }

    if (tabFromUrl && validTabs.has(tabFromUrl)) {
      setSelectedTab(tabFromUrl);
      return;
    }

    if (location.pathname.includes('/surya/analytics')) {
      setSelectedTab('analytics');
    }
  }, [location.pathname, location.search, navigate]);

  const handleLeadsWorkspaceViewChange = (nextView: LeadsWorkspaceView) => {
    startTransition(() => {
      setLeadsWorkspaceView(nextView);
      const params = new URLSearchParams(location.search);
      params.set('tab', 'leads');
      if (nextView === 'demos') params.set('leadView', 'demos');
      else params.delete('leadView');
      navigate(`/surya?${params.toString()}`, { replace: true });
    });
  };

  const handleTabChange = (nextTab: string) => {
    startTransition(() => {
      setSelectedTab(nextTab);
    });
  };

  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats(canViewAdmin);

  if (authLoading) return <AccessMessage>Checking your permissions...</AccessMessage>;
  if (!user) return <AccessMessage>Login required.</AccessMessage>;
  if (!canViewAdmin) return <AccessMessage>No permission.</AccessMessage>;

  return (
    <div className="mobile-app-scroll h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-gray-900">
      <Header onOpenMenu={() => setMobileMenuOpen(true)} />

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="left-0 top-0 h-screen w-[85vw] max-w-[320px] translate-x-0 translate-y-0 rounded-none border-r border-slate-200 p-0 sm:rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Admin menu</DialogTitle>
            <DialogDescription>Navigate between admin sections</DialogDescription>
          </DialogHeader>
          <Sidebar
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
            onNavigate={() => setMobileMenuOpen(false)}
            className="w-full h-full overflow-y-auto"
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 min-w-0 min-h-0 pb-24 lg:pb-0">
        <Sidebar
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          className="hidden h-[calc(100vh-57px)] overflow-y-auto lg:sticky lg:top-[57px] lg:block"
        />

        <main className="flex min-h-0 flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mx-auto w-full max-w-[1280px] min-w-0">
          <Card className="mb-4 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Attendance Corrections
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/messages')}
              >
                <MessageSquareQuote className="h-4 w-4" />
                Messages
              </Button>
            </div>
          </Card>

          {isSuperUser && (
            <Card className="mb-4 p-3">
              <div className="flex gap-2 flex-wrap">
                {ROLE_SHORTCUTS.map((r) => (
                  <Button key={r.id} size="sm" onClick={() => navigate(r.path)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>

            <TabsContent value="students" className="mt-0">
              <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading students...</div>}>
                <StudentManagementTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="leads" className="mt-0">
              <LeadsInquiriesWorkspace
                view={leadsWorkspaceView}
                onViewChange={handleLeadsWorkspaceViewChange}
              />
            </TabsContent>

            {/* ✅ FIXED: pass required prop */}
            <TabsContent value="enrollments" className="mt-0">
              <EnrollmentsList reloadKey={enrollmentsReloadKey} />
            </TabsContent>

            <TabsContent value="attendance-corrections" className="mt-0">
              <AttendanceCorrectionsPanel />
            </TabsContent>

            <TabsContent value="relationships" className="mt-0">
              <RelationshipManagement />
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <CourseManagement />
            </TabsContent>

            <TabsContent value="today-notifications" className="mt-0">
              <TodaysNotifications />
            </TabsContent>

            <TabsContent value="lessons" className="mt-0">
              <LessonLibrary />
            </TabsContent>

            <TabsContent value="class-recordings" className="mt-0">
              <ClassRecordingsManagement />
            </TabsContent>

            <TabsContent value="class-samples" className="mt-0">
              <ClassSamplesManagement />
            </TabsContent>

            <TabsContent value="testimonials" className="mt-0">
              <TestimonialsManagement />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div className="space-y-4">
                <AdminOverviewCard />
                <AnalyticsDashboard />
              </div>
            </TabsContent>

            <TabsContent value="teacher-schedule" className="mt-0">
              <TeacherScheduleManagement />
            </TabsContent>

            <TabsContent value="holidays" className="mt-0">
              <HolidayCalendar2026 />
            </TabsContent>

            <TabsContent value="teacher-payments" className="mt-0">
              <TeacherPayments />
            </TabsContent>

            <TabsContent value="parent-payments" className="mt-0">
              <ParentPayments />
            </TabsContent>

            <TabsContent value="parent-worksheets" className="mt-0">
              <ParentWorksheetLibraryManagement />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="space-y-4">
                <MessagingBackendTestCard />
                <InsightsKillSwitch />
                <FinanceReconciliationRunsCard />
                <EnrollmentCanonicalMigrationCard />
                <RefreshPublicKbTool />
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </main>
      </div>

      <footer className="hidden border-t p-4 text-sm sm:block">
        {statsLoading ? (
          'Loading…'
        ) : statsError ? (
          'Error'
        ) : (
          <>
            Users: {stats?.totalUsers} | Students: {stats?.totalStudents} | Courses:{' '}
            {stats?.totalCourses}
          </>
        )}
      </footer>

      <MobileTabBar
        items={ADMIN_MOBILE_TABS}
        activeId={selectedTab}
        onSelect={(nextTab) => {
          startTransition(() => {
            setSelectedTab(nextTab);
            navigate(`/surya?tab=${nextTab}`, { replace: true });
          });
        }}
      />
    </div>
  );
}
