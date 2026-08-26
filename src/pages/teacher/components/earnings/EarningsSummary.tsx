import type { FC } from 'react';
import { useMemo, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useAuthStore } from '../../../../store/useAuthStore';
import { db } from '../../../../lib/firebaseConfig';
import {
  INDIA_TIME_ZONE,
  formatSessionDate,
  formatSessionTimeRange,
  getSessionEndDate,
  getSessionStartDate,
} from '../../../../lib/sessionTime';
import { useEarnings } from '../../hooks/useEarnings';
import type { TeacherEarningsSummary } from '../../../../types/Teacher';

interface EarningsSummaryProps {
  teacherId?: string;
}

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

type MonthOption = {
  value: string;
  label: string;
};

type DetailLedgerRow = {
  id: string;
  amount: number;
  paidAmount: number;
  status: string;
  source: string;
  demoId: string;
  sessionId: string;
  kidId: string;
  studentName: string;
  childName: string;
  kidName: string;
};

type MonthSessionRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: Date | null;
  endAt: Date | null;
  studentId: string;
  studentName: string;
  courseName: string;
  sessionTypeRaw: string;
  makeupForSessionId: string;
  classStatus: string;
};

type SessionDetailRow = {
  id: string;
  studentKey: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: Date | null;
  endAt: Date | null;
  courseName: string;
  sessionTypeLabel: string;
  classStatus: string;
  classStatusLabel: string;
  earningStatusLabel: string;
  amount: number;
};

type StudentSessionSummaryRow = {
  studentKey: string;
  studentName: string;
  totalClasses: number;
  payableClasses: number;
  nonPayableClasses: number;
  totalEarning: number;
  rows: SessionDetailRow[];
};

const EMPTY_SUMMARY: TeacherEarningsSummary = {
  month: '',
  totalSessions: 0,
  sessionsCompleted: 0,
  sessionsPending: 0,
  ratePerSession: 0,
  totalEarnings: 0,
  pendingEarnings: 0,
  demoEarnings: 0,
  demoCompletedCount: 0,
  demoEnrollmentBonusCount: 0,
  breakdownByCourse: [],
  payments: [],
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
    const date = (value as any).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const toCleanString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';

const toId = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return toCleanString(row.id) || toCleanString(row.uid) || toCleanString(row.userId);
  }
  return '';
};

const getObjectName = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  return (
    toCleanString(row.name) ||
    toCleanString(row.fullName) ||
    toCleanString(row.displayName) ||
    toCleanString(row.studentName) ||
    toCleanString(row.kidName) ||
    toCleanString(row.childName)
  );
};

const isReadableName = (value: unknown): boolean => {
  const raw = toCleanString(value);
  if (!raw) return false;
  const lower = raw.toLowerCase();
  if (['unknown', 'name not found', 'n/a', 'na', 'null', 'undefined'].includes(lower)) return false;
  const looksLikeLongId = !/\s/.test(raw) && (/^[a-f0-9]{16,}$/i.test(raw) || /^[A-Za-z0-9_-]{20,}$/.test(raw));
  return !looksLikeLongId;
};

const pickReadableName = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (isReadableName(value)) return toCleanString(value);
  }
  return null;
};

const normalizeToken = (value: unknown): string =>
  toCleanString(value).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

const normalizeClassStatus = (value: unknown): string => {
  const token = normalizeToken(value);
  if (token === 'canceled') return 'cancelled';
  if (token === 'noshow' || token === 'no_showed') return 'no_show';
  if (token === 'reschedule_request' || token === 'rescheduled_requested') return 'reschedule_requested';
  return token;
};

const resolveSessionClassStatus = (session: Record<string, unknown>): string => {
  const directCandidates = [
    session.attendanceStatus,
    session.attendance_state,
    session.classStatus,
    session.class_status,
    session.sessionAttendanceStatus,
  ];

  for (const candidate of directCandidates) {
    const status = normalizeClassStatus(candidate);
    if (status) return status;
  }

  if (session.attendance && typeof session.attendance === 'object') {
    const statuses = Object.values(session.attendance as Record<string, unknown>)
      .map((value) => {
        if (typeof value === 'string') return normalizeClassStatus(value);
        if (value && typeof value === 'object' && 'status' in (value as Record<string, unknown>)) {
          return normalizeClassStatus((value as Record<string, unknown>).status);
        }
        return '';
      })
      .filter(Boolean);

    if (statuses.includes('present')) return 'present';
    if (statuses.includes('late')) return 'late';
    if (statuses.length > 0) return statuses[0];
  }

  const fallback = normalizeClassStatus(session.status);
  return fallback || 'not_marked';
};

const getClassStatusLabel = (value: string): string => {
  switch (normalizeClassStatus(value)) {
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'absent':
      return 'Absent';
    case 'cancelled':
      return 'Cancelled';
    case 'rescheduled':
      return 'Rescheduled';
    case 'reschedule_requested':
      return 'Reschedule requested';
    case 'no_show':
      return 'No-show';
    case 'scheduled':
      return 'Scheduled';
    default:
      return 'Not marked';
  }
};

const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const getSessionTypeLabel = (rawType: string, classStatus: string, makeupForSessionId: string): string => {
  if (makeupForSessionId) return 'Makeup';
  const token = normalizeToken(rawType);
  if (!token) {
    return classStatus === 'rescheduled' || classStatus === 'reschedule_requested' ? 'Rescheduled' : 'Regular';
  }
  if (token === 'regular') return 'Regular';
  if (token === 'makeup' || token === 'make_up') return 'Makeup';
  if (token === 'rescheduled' || token === 'reschedule_requested') return 'Rescheduled';
  if (token === 'one_off' || token === 'oneoff') return 'One-off';
  if (token === 'enrollmentschedulereplace') {
    return classStatus === 'rescheduled' || classStatus === 'reschedule_requested' ? 'Rescheduled' : 'Regular';
  }
  return toTitleCase(token.replace(/_/g, ' '));
};

const formatCurrency = (value: number): string => `₹${Math.round(value).toLocaleString('en-IN')}`;

const getCurrentMonthKeyInIndia = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
};

const parseMonthKey = (value: string): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
};

const buildMonthOptions = (monthsBack = 18): MonthOption[] => {
  const current = parseMonthKey(getCurrentMonthKeyInIndia());
  const base = current ? new Date(Date.UTC(current.year, current.month - 1, 1)) : new Date();
  return Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - index, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      value,
      label: date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    };
  });
};

const getMonthDateRange = (monthKey: string): { startDate: string; endDate: string } | null => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  return {
    startDate: `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`,
    endDate: `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
};

const normalizeStartTime = (rawValue: unknown): string => {
  const raw = toCleanString(rawValue);
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatTimeInIndia = (date: Date): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

const formatYmdInIndia = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return year && month && day ? `${year}-${month}-${day}` : '';
};

const isPaidLike = (status: string, paidAmount: number): boolean =>
  paidAmount > 0 || ['paid', 'settled', 'processed'].includes(normalizeToken(status));

const mapLedgerDocs = (docs: Array<{ id: string; data: () => Record<string, unknown> }>): DetailLedgerRow[] =>
  docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      amount: Math.max(toNumber(data.amount, 0), 0),
      paidAmount: Math.max(toNumber(data.paidAmount, 0), 0),
      status: normalizeToken(data.status),
      source: normalizeToken(data.source),
      demoId: toCleanString(data.demoId),
      sessionId: toCleanString(data.sessionId),
      kidId: toCleanString(data.kidId || data.studentId || data.childId),
      studentName: toCleanString(data.studentName),
      childName: toCleanString(data.childName),
      kidName: toCleanString(data.kidName),
    };
  });

export const EarningsSummary: FC<EarningsSummaryProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const resolvedTeacherId = teacherId || user?.uid;
  const monthOptions = useMemo(() => buildMonthOptions(18), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKeyInIndia());

  const earningsQuery = useEarnings(resolvedTeacherId, selectedMonth);
  const earnings = earningsQuery.data || { ...EMPTY_SUMMARY, month: selectedMonth };

  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [selectedSessionStudentKey, setSelectedSessionStudentKey] = useState<string | null>(null);

  const [ledgerStatus, setLedgerStatus] = useState<LoadStatus>('idle');
  const [ledgerRows, setLedgerRows] = useState<DetailLedgerRow[]>([]);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const ledgerPromiseRef = useRef<Promise<DetailLedgerRow[]> | null>(null);

  const [sessionStatus, setSessionStatus] = useState<LoadStatus>('idle');
  const [monthSessions, setMonthSessions] = useState<MonthSessionRow[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const resetDetailState = () => {
    setShowSessionDetails(false);
    setShowDemoDetails(false);
    setSelectedSessionStudentKey(null);
    setLedgerStatus('idle');
    setLedgerRows([]);
    setLedgerError(null);
    ledgerPromiseRef.current = null;
    setSessionStatus('idle');
    setMonthSessions([]);
    setSessionError(null);
  };

  const handleMonthChange = (monthKey: string) => {
    if (monthKey === selectedMonth) return;
    resetDetailState();
    setSelectedMonth(monthKey);
  };

  const ensureLedgerLoaded = async (): Promise<DetailLedgerRow[]> => {
    if (!resolvedTeacherId) return [];
    if (ledgerStatus === 'loaded') return ledgerRows;
    if (ledgerPromiseRef.current) return ledgerPromiseRef.current;

    setLedgerStatus('loading');
    setLedgerError(null);

    const promise = (async () => {
      try {
        const ledgerQuery = query(
          collection(db, 'teacherEarnings'),
          where('teacherId', '==', resolvedTeacherId),
          where('monthKey', '==', selectedMonth),
        );
        const snap = await getDocs(ledgerQuery);
        const rows = mapLedgerDocs(snap.docs as Array<{ id: string; data: () => Record<string, unknown> }>);
        setLedgerRows(rows);
        setLedgerStatus('loaded');
        return rows;
      } catch (error) {
        console.error('Failed to load bounded teacher earnings details', error);
        setLedgerRows([]);
        setLedgerStatus('error');
        setLedgerError('Unable to load earnings details.');
        throw error;
      } finally {
        ledgerPromiseRef.current = null;
      }
    })();

    ledgerPromiseRef.current = promise;
    return promise;
  };

  const loadSessionDetails = async () => {
    if (!resolvedTeacherId || sessionStatus === 'loaded' || sessionStatus === 'loading') return;
    const monthRange = getMonthDateRange(selectedMonth);
    if (!monthRange) {
      setSessionStatus('error');
      setSessionError('Unable to load session details.');
      return;
    }

    setSessionStatus('loading');
    setSessionError(null);

    try {
      const sessionsQuery = query(
        collection(db, 'classSessions'),
        where('teacherId', '==', resolvedTeacherId),
        where('date', '>=', monthRange.startDate),
        where('date', '<=', monthRange.endDate),
      );

      const [sessionSnap] = await Promise.all([getDocs(sessionsQuery), ensureLedgerLoaded()]);
      const rows: MonthSessionRow[] = sessionSnap.docs
        .map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const startAt = getSessionStartDate(data);
          const endAt = getSessionEndDate(data);
          const rawDate = toCleanString(data.date);
          const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
            ? rawDate
            : startAt
            ? formatYmdInIndia(startAt)
            : '';
          const studentId =
            toId(data.kidId) ||
            toId(data.studentId) ||
            toId(data.childId) ||
            toId(data.student) ||
            toId(data.kid) ||
            toId(data.child) ||
            (Array.isArray(data.kidIds) ? toId(data.kidIds[0]) : '') ||
            (Array.isArray(data.studentIds) ? toId(data.studentIds[0]) : '') ||
            (Array.isArray(data.childIds) ? toId(data.childIds[0]) : '');
          const studentName =
            pickReadableName(
              data.studentName,
              data.kidName,
              data.childName,
              getObjectName(data.student),
              getObjectName(data.kid),
              getObjectName(data.child),
              Array.isArray(data.studentNames) ? data.studentNames[0] : null,
              Array.isArray(data.kidNames) ? data.kidNames[0] : null,
              Array.isArray(data.childNames) ? data.childNames[0] : null,
            ) || 'Student';
          const classStatus = resolveSessionClassStatus(data);
          const courseName =
            pickReadableName(data.courseName, data.courseTitle, data.courseLabel, data.subject, getObjectName(data.course)) ||
            'Course';
          const sessionTypeRaw =
            toCleanString(data.sessionType) ||
            toCleanString(data.type) ||
            toCleanString(data.source) ||
            toCleanString(data.sessionKind) ||
            'regular';

          return {
            id: docSnap.id,
            date,
            startTime: normalizeStartTime(data.startTime) || (startAt ? formatTimeInIndia(startAt) : ''),
            endTime: normalizeStartTime(data.endTime) || (endAt ? formatTimeInIndia(endAt) : ''),
            startAt,
            endAt,
            studentId,
            studentName,
            courseName,
            sessionTypeRaw,
            makeupForSessionId: toId(data.makeupForSessionId),
            classStatus,
          };
        })
        .filter((row) => row.date >= monthRange.startDate && row.date <= monthRange.endDate)
        .sort((a, b) => (getSessionStartDate(b)?.getTime() || 0) - (getSessionStartDate(a)?.getTime() || 0));

      setMonthSessions(rows);
      setSessionStatus('loaded');
    } catch (error) {
      console.error('Failed to load bounded teacher session details', error);
      setMonthSessions([]);
      setSessionStatus('error');
      setSessionError('Unable to load session details.');
    }
  };

  const toggleSessionDetails = () => {
    if (showSessionDetails) {
      setShowSessionDetails(false);
      setSelectedSessionStudentKey(null);
      return;
    }
    setShowSessionDetails(true);
    if (sessionStatus === 'idle' || sessionStatus === 'error') {
      void loadSessionDetails();
    }
  };

  const toggleDemoDetails = () => {
    if (showDemoDetails) {
      setShowDemoDetails(false);
      return;
    }
    setShowDemoDetails(true);
    if (ledgerStatus === 'idle' || ledgerStatus === 'error') {
      void ensureLedgerLoaded().catch(() => undefined);
    }
  };

  const sessionEarnings = Math.max(earnings.totalEarnings - earnings.demoEarnings, 0);
  const demoEventCount = earnings.demoCompletedCount + earnings.demoEnrollmentBonusCount;

  const ledgerBySessionId = useMemo(() => {
    const map = new Map<string, DetailLedgerRow>();
    ledgerRows.forEach((row) => {
      if (!row.sessionId) return;
      const current = map.get(row.sessionId);
      if (!current || (current.status === 'void' && row.status !== 'void')) map.set(row.sessionId, row);
    });
    return map;
  }, [ledgerRows]);

  const studentSessionSummary = useMemo<StudentSessionSummaryRow[]>(() => {
    if (sessionStatus !== 'loaded' || ledgerStatus !== 'loaded') return [];

    const bucket = new Map<string, StudentSessionSummaryRow>();

    monthSessions.forEach((session) => {
      const earning = ledgerBySessionId.get(session.id);
      const isVoid = earning?.status === 'void';
      const isPresent = session.classStatus === 'present';
      const amount = isPresent && earning && !isVoid ? earning.amount : 0;
      const earningStatusLabel = isVoid
        ? 'Voided'
        : isPresent
        ? earning
          ? isPaidLike(earning.status, earning.paidAmount)
            ? 'Paid'
            : 'Payable'
          : 'Not found'
        : 'Not payable';
      const studentName =
        pickReadableName(
          session.studentName,
          earning?.studentName,
          earning?.kidName,
          earning?.childName,
        ) || 'Student';
      const studentKey = session.studentId || earning?.kidId || studentName.toLowerCase();
      const detailRow: SessionDetailRow = {
        id: session.id,
        studentKey,
        studentName,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        startAt: session.startAt,
        endAt: session.endAt,
        courseName: session.courseName,
        sessionTypeLabel: getSessionTypeLabel(session.sessionTypeRaw, session.classStatus, session.makeupForSessionId),
        classStatus: session.classStatus,
        classStatusLabel: getClassStatusLabel(session.classStatus),
        earningStatusLabel,
        amount,
      };

      const existing = bucket.get(studentKey) || {
        studentKey,
        studentName,
        totalClasses: 0,
        payableClasses: 0,
        nonPayableClasses: 0,
        totalEarning: 0,
        rows: [],
      };
      existing.totalClasses += 1;
      if (isPresent) existing.payableClasses += 1;
      else existing.nonPayableClasses += 1;
      existing.totalEarning += amount;
      existing.rows.push(detailRow);
      bucket.set(studentKey, existing);
    });

    return Array.from(bucket.values())
      .map((row) => ({
        ...row,
        rows: [...row.rows].sort(
          (a, b) => (getSessionStartDate(b)?.getTime() || 0) - (getSessionStartDate(a)?.getTime() || 0),
        ),
      }))
      .sort((a, b) => b.totalEarning - a.totalEarning || a.studentName.localeCompare(b.studentName));
  }, [ledgerBySessionId, ledgerStatus, monthSessions, sessionStatus]);

  const demoDetails = useMemo(() => {
    if (ledgerStatus !== 'loaded') return [];
    return ledgerRows
      .filter((row) => row.status !== 'void' && (row.source === 'demo_completed' || row.source === 'demo_enrolled_bonus'))
      .map((row) => ({
        id: row.id,
        name: pickReadableName(row.studentName, row.kidName, row.childName) || 'Student',
        label: row.source === 'demo_completed' ? 'Demo conducted' : 'Enrollment bonus',
        amount: row.amount,
      }))
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  }, [ledgerRows, ledgerStatus]);

  if (!resolvedTeacherId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Unable to load earnings. Please refresh and sign in again.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Earnings Overview</h3>
            <p className="text-sm text-muted-foreground">Monthly earnings summary</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {earningsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading monthly earnings…</p>
        ) : earningsQuery.isError ? (
          <p className="text-sm text-destructive">Unable to load monthly earnings.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Sessions Conducted</div>
              <div className="mt-1 text-2xl font-semibold">{earnings.sessionsCompleted}</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(sessionEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Earnings</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(earnings.totalEarnings)}</div>
              <div className="text-sm text-muted-foreground">Pending: {formatCurrency(earnings.pendingEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo Earnings</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(earnings.demoEarnings)}</div>
              <div className="text-sm text-muted-foreground">{demoEventCount} demo earning events</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demos Conducted</div>
              <div className="mt-1 text-2xl font-semibold">{earnings.demoCompletedCount}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo Enrollments</div>
              <div className="mt-1 text-2xl font-semibold">{earnings.demoEnrollmentBonusCount}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Recent Payments</div>
              <div className="mt-1 text-2xl font-semibold">{earnings.payments?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Saved in monthly rollup</div>
            </Card>
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-3">Earnings Breakdown</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Count</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Sessions Conducted</TableCell>
              <TableCell>{earnings.sessionsCompleted}</TableCell>
              <TableCell className="text-right">{formatCurrency(sessionEarnings)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={toggleSessionDetails}>
                  {showSessionDetails ? 'Hide' : 'View details'}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Demos Conducted</TableCell>
              <TableCell>{earnings.demoCompletedCount}</TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={toggleDemoDetails}>
                  {showDemoDetails ? 'Hide' : 'View details'}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Demo Enrollment Bonuses</TableCell>
              <TableCell>{earnings.demoEnrollmentBonusCount}</TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right">Included in demo details</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Demo Earnings</TableCell>
              <TableCell>{demoEventCount}</TableCell>
              <TableCell className="text-right">{formatCurrency(earnings.demoEarnings)}</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Total Earnings</TableCell>
              <TableCell className="font-medium">{earnings.sessionsCompleted + demoEventCount}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(earnings.totalEarnings)}</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {showSessionDetails && (
          <div className="mt-4 rounded-md border p-3">
            <h4 className="text-sm font-semibold mb-2">Sessions Conducted: Student-wise</h4>
            {sessionStatus === 'loading' || ledgerStatus === 'loading' ? (
              <p className="text-xs text-muted-foreground">Loading session details…</p>
            ) : sessionStatus === 'error' || ledgerStatus === 'error' ? (
              <p className="text-xs text-destructive">{sessionError || ledgerError || 'Unable to load session details.'}</p>
            ) : sessionStatus === 'loaded' && studentSessionSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions found for this month.</p>
            ) : sessionStatus === 'loaded' ? (
              <div className="overflow-x-auto space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Total classes</TableHead>
                      <TableHead>Payable classes</TableHead>
                      <TableHead>Non-payable classes</TableHead>
                      <TableHead className="text-right">Total earning</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentSessionSummary.map((row) => {
                      const isSelected = selectedSessionStudentKey === row.studentKey;
                      return [
                        <TableRow key={row.studentKey}>
                          <TableCell>{row.studentName}</TableCell>
                          <TableCell>{row.totalClasses}</TableCell>
                          <TableCell>{row.payableClasses}</TableCell>
                          <TableCell>{row.nonPayableClasses}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.totalEarning)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedSessionStudentKey((current) =>
                                  current === row.studentKey ? null : row.studentKey,
                                )
                              }
                            >
                              {isSelected ? 'Hide details' : 'View details'}
                            </Button>
                          </TableCell>
                        </TableRow>,
                        isSelected ? (
                          <TableRow key={`${row.studentKey}-details`}>
                            <TableCell colSpan={6} className="p-0">
                              <div className="border-t bg-slate-50/40 p-3">
                                <h5 className="text-sm font-semibold mb-2">Date-wise details: {row.studentName}</h5>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Day</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Course</TableHead>
                                      <TableHead>Session type</TableHead>
                                      <TableHead>Class status</TableHead>
                                      <TableHead>Earning status</TableHead>
                                      <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {row.rows.map((detailRow) => {
                                      const dateLabel = formatSessionDate(detailRow, {
                                        timeZone: INDIA_TIME_ZONE,
                                        dateOptions: { day: '2-digit', month: 'short', year: 'numeric' },
                                        fallbackText: detailRow.date || '—',
                                      });
                                      const dayLabel = formatSessionDate(detailRow, {
                                        timeZone: INDIA_TIME_ZONE,
                                        dateOptions: { weekday: 'short' },
                                        fallbackText: '—',
                                      });
                                      const timeLabel = formatSessionTimeRange(detailRow, {
                                        timeZone: INDIA_TIME_ZONE,
                                        fallbackText: '—',
                                      });
                                      return (
                                        <TableRow key={`${detailRow.id}-${detailRow.date}-${detailRow.startTime}`}>
                                          <TableCell>{dateLabel}</TableCell>
                                          <TableCell>{dayLabel}</TableCell>
                                          <TableCell>{timeLabel}</TableCell>
                                          <TableCell>{detailRow.courseName}</TableCell>
                                          <TableCell>{detailRow.sessionTypeLabel}</TableCell>
                                          <TableCell>{detailRow.classStatusLabel}</TableCell>
                                          <TableCell>{detailRow.earningStatusLabel}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(detailRow.amount)}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null,
                      ];
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        )}

        {showDemoDetails && (
          <div className="mt-4 rounded-md border p-3">
            <h4 className="text-sm font-semibold mb-2">Demo details</h4>
            {ledgerStatus === 'loading' ? (
              <p className="text-xs text-muted-foreground">Loading demo details…</p>
            ) : ledgerStatus === 'error' ? (
              <p className="text-xs text-destructive">{ledgerError || 'Unable to load demo details.'}</p>
            ) : ledgerStatus === 'loaded' && demoDetails.length === 0 ? (
              <p className="text-xs text-muted-foreground">No demo details for this month.</p>
            ) : ledgerStatus === 'loaded' ? (
              <div className="space-y-2">
                {demoDetails.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div>{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.label}</div>
                    </div>
                    <span className="font-medium">{formatCurrency(row.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {(earnings.payments?.length || 0) > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-3">Recent Payments</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(earnings.payments || []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{toTitleCase(normalizeToken(payment.status).replace(/_/g, ' ')) || 'Completed'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
