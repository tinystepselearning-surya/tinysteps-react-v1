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

type MonthRange = {
  startDate: string;
  endDate: string;
  startAt: Date;
  nextMonthStartAt: Date;
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

type SessionDetailRow = MonthSessionRow & {
  studentKey: string;
  sessionTypeLabel: string;
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
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
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
  for (const candidate of [
    session.attendanceStatus,
    session.attendance_state,
    session.classStatus,
    session.class_status,
    session.sessionAttendanceStatus,
  ]) {
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

  return normalizeClassStatus(session.status) || 'not_marked';
};

const getClassStatusLabel = (value: string): string => {
  switch (normalizeClassStatus(value)) {
    case 'present': return 'Present';
    case 'late': return 'Late';
    case 'absent': return 'Absent';
    case 'cancelled': return 'Cancelled';
    case 'rescheduled': return 'Rescheduled';
    case 'reschedule_requested': return 'Reschedule requested';
    case 'no_show': return 'No-show';
    case 'scheduled': return 'Scheduled';
    default: return 'Not marked';
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
  if (!token) return classStatus.startsWith('reschedul') ? 'Rescheduled' : 'Regular';
  if (token === 'regular') return 'Regular';
  if (token === 'makeup' || token === 'make_up') return 'Makeup';
  if (token === 'rescheduled' || token === 'reschedule_requested') return 'Rescheduled';
  if (token === 'one_off' || token === 'oneoff') return 'One-off';
  if (token === 'enrollmentschedulereplace') return classStatus.startsWith('reschedul') ? 'Rescheduled' : 'Regular';
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
  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12 ? { year, month } : null;
};

const buildMonthOptions = (monthsBack = 18): MonthOption[] => {
  const current = parseMonthKey(getCurrentMonthKeyInIndia());
  const base = current ? new Date(Date.UTC(current.year, current.month - 1, 1)) : new Date();
  return Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - index, 1));
    return {
      value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    };
  });
};

const getMonthRange = (monthKey: string): MonthRange | null => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const nextMonth = parsed.month === 12
    ? { year: parsed.year + 1, month: 1 }
    : { year: parsed.year, month: parsed.month + 1 };
  const startDate = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-01`;
  const endDate = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const nextStartDate = `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-01`;
  return {
    startDate,
    endDate,
    startAt: new Date(`${startDate}T00:00:00+05:30`),
    nextMonthStartAt: new Date(`${nextStartDate}T00:00:00+05:30`),
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

const mapSessionDoc = (docSnap: { id: string; data: () => Record<string, unknown> }): MonthSessionRow | null => {
  const data = docSnap.data();
  const startAt = getSessionStartDate(data);
  const endAt = getSessionEndDate(data);
  const rawDate = toCleanString(data.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : startAt ? formatYmdInIndia(startAt) : '';
  if (!date) return null;

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

  return {
    id: docSnap.id,
    date,
    startTime: normalizeStartTime(data.startTime) || (startAt ? formatTimeInIndia(startAt) : ''),
    endTime: normalizeStartTime(data.endTime) || (endAt ? formatTimeInIndia(endAt) : ''),
    startAt,
    endAt,
    studentId,
    studentName:
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
      ) || 'Student',
    courseName:
      pickReadableName(data.courseName, data.courseTitle, data.courseLabel, data.subject, getObjectName(data.course)) || 'Course',
    sessionTypeRaw:
      toCleanString(data.sessionType) ||
      toCleanString(data.type) ||
      toCleanString(data.source) ||
      toCleanString(data.sessionKind) ||
      'regular',
    makeupForSessionId: toId(data.makeupForSessionId),
    classStatus: resolveSessionClassStatus(data),
  };
};

export const EarningsSummary: FC<EarningsSummaryProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const resolvedTeacherId = teacherId || user?.uid;
  const monthOptions = useMemo(() => buildMonthOptions(18), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKeyInIndia());
  const selectedMonthRef = useRef(selectedMonth);

  const earningsQuery = useEarnings(resolvedTeacherId, selectedMonth);
  const earnings = earningsQuery.data || { ...EMPTY_SUMMARY, month: selectedMonth };

  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [selectedSessionStudentKey, setSelectedSessionStudentKey] = useState<string | null>(null);

  const [ledgerStatus, setLedgerStatus] = useState<LoadStatus>('idle');
  const [ledgerRows, setLedgerRows] = useState<DetailLedgerRow[]>([]);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const ledgerCacheRef = useRef(new Map<string, DetailLedgerRow[]>());
  const ledgerPromiseRef = useRef(new Map<string, Promise<DetailLedgerRow[]>>());

  const [sessionStatus, setSessionStatus] = useState<LoadStatus>('idle');
  const [monthSessions, setMonthSessions] = useState<MonthSessionRow[]>([]);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionCacheRef = useRef(new Map<string, MonthSessionRow[]>());
  const sessionPromiseRef = useRef(new Map<string, Promise<MonthSessionRow[]>>());

  const handleMonthChange = (monthKey: string) => {
    if (monthKey === selectedMonth) return;
    selectedMonthRef.current = monthKey;
    setSelectedMonth(monthKey);
    setShowSessionDetails(false);
    setShowDemoDetails(false);
    setSelectedSessionStudentKey(null);
    setLedgerError(null);
    setSessionError(null);

    const cachedLedger = ledgerCacheRef.current.get(monthKey);
    setLedgerRows(cachedLedger || []);
    setLedgerStatus(cachedLedger ? 'loaded' : 'idle');

    const cachedSessions = sessionCacheRef.current.get(monthKey);
    setMonthSessions(cachedSessions || []);
    setSessionStatus(cachedSessions ? 'loaded' : 'idle');
  };

  const ensureLedgerLoaded = async (monthKey = selectedMonth): Promise<DetailLedgerRow[]> => {
    if (!resolvedTeacherId) return [];
    const cached = ledgerCacheRef.current.get(monthKey);
    if (cached) {
      if (selectedMonthRef.current === monthKey) {
        setLedgerRows(cached);
        setLedgerStatus('loaded');
      }
      return cached;
    }

    const existingPromise = ledgerPromiseRef.current.get(monthKey);
    if (existingPromise) return existingPromise;

    if (selectedMonthRef.current === monthKey) {
      setLedgerStatus('loading');
      setLedgerError(null);
    }

    const promise = (async () => {
      try {
        const ledgerQuery = query(
          collection(db, 'teacherEarnings'),
          where('teacherId', '==', resolvedTeacherId),
          where('monthKey', '==', monthKey),
        );
        const snap = await getDocs(ledgerQuery);
        const rows = mapLedgerDocs(snap.docs as Array<{ id: string; data: () => Record<string, unknown> }>);
        ledgerCacheRef.current.set(monthKey, rows);
        if (selectedMonthRef.current === monthKey) {
          setLedgerRows(rows);
          setLedgerStatus('loaded');
        }
        return rows;
      } catch (error) {
        console.error('Failed to load bounded teacher earnings details', error);
        if (selectedMonthRef.current === monthKey) {
          setLedgerRows([]);
          setLedgerStatus('error');
          setLedgerError('Unable to load earnings details.');
        }
        throw error;
      } finally {
        ledgerPromiseRef.current.delete(monthKey);
      }
    })();

    ledgerPromiseRef.current.set(monthKey, promise);
    return promise;
  };

  const ensureSessionDetailsLoaded = async (monthKey = selectedMonth): Promise<MonthSessionRow[]> => {
    if (!resolvedTeacherId) return [];
    const cached = sessionCacheRef.current.get(monthKey);
    if (cached) {
      if (selectedMonthRef.current === monthKey) {
        setMonthSessions(cached);
        setSessionStatus('loaded');
      }
      return cached;
    }

    const existingPromise = sessionPromiseRef.current.get(monthKey);
    if (existingPromise) return existingPromise;

    const monthRange = getMonthRange(monthKey);
    if (!monthRange) {
      setSessionStatus('error');
      setSessionError('Unable to load session details.');
      return [];
    }

    if (selectedMonthRef.current === monthKey) {
      setSessionStatus('loading');
      setSessionError(null);
    }

    const promise = (async () => {
      try {
        // Canonical service-date contract: session.date first, session.startAt in IST second.
        // Both queries remain month-bounded; there is deliberately no teacher-history fallback.
        const byDateQuery = query(
          collection(db, 'classSessions'),
          where('teacherId', '==', resolvedTeacherId),
          where('date', '>=', monthRange.startDate),
          where('date', '<=', monthRange.endDate),
        );
        const byStartAtQuery = query(
          collection(db, 'classSessions'),
          where('teacherId', '==', resolvedTeacherId),
          where('startAt', '>=', monthRange.startAt),
          where('startAt', '<', monthRange.nextMonthStartAt),
        );

        const [byDateSnap, byStartAtSnap] = await Promise.all([
          getDocs(byDateQuery),
          getDocs(byStartAtQuery),
        ]);

        const deduped = new Map<string, MonthSessionRow>();
        for (const docSnap of [...byDateSnap.docs, ...byStartAtSnap.docs]) {
          const row = mapSessionDoc(docSnap as { id: string; data: () => Record<string, unknown> });
          if (!row) continue;
          if (row.date < monthRange.startDate || row.date > monthRange.endDate) continue;
          deduped.set(row.id, row);
        }

        const rows = Array.from(deduped.values()).sort(
          (a, b) => (getSessionStartDate(b)?.getTime() || 0) - (getSessionStartDate(a)?.getTime() || 0),
        );
        sessionCacheRef.current.set(monthKey, rows);
        if (selectedMonthRef.current === monthKey) {
          setMonthSessions(rows);
          setSessionStatus('loaded');
        }
        return rows;
      } catch (error) {
        console.error('Failed to load bounded teacher session details', error);
        if (selectedMonthRef.current === monthKey) {
          setMonthSessions([]);
          setSessionStatus('error');
          setSessionError('Unable to load session details.');
        }
        throw error;
      } finally {
        sessionPromiseRef.current.delete(monthKey);
      }
    })();

    sessionPromiseRef.current.set(monthKey, promise);
    return promise;
  };

  const toggleSessionDetails = () => {
    if (showSessionDetails) {
      setShowSessionDetails(false);
      setSelectedSessionStudentKey(null);
      return;
    }
    setShowSessionDetails(true);
    if (sessionStatus === 'idle' || sessionStatus === 'error' || ledgerStatus === 'idle' || ledgerStatus === 'error') {
      const monthKey = selectedMonth;
      void Promise.all([ensureSessionDetailsLoaded(monthKey), ensureLedgerLoaded(monthKey)]).catch(() => undefined);
    }
  };

  const toggleDemoDetails = () => {
    if (showDemoDetails) {
      setShowDemoDetails(false);
      return;
    }
    setShowDemoDetails(true);
    if (ledgerStatus === 'idle' || ledgerStatus === 'error') {
      void ensureLedgerLoaded(selectedMonth).catch(() => undefined);
    }
  };

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
        pickReadableName(session.studentName, earning?.studentName, earning?.kidName, earning?.childName) || 'Student';
      const studentKey = session.studentId || earning?.kidId || studentName.toLowerCase();
      const detailRow: SessionDetailRow = {
        ...session,
        studentKey,
        studentName,
        sessionTypeLabel: getSessionTypeLabel(session.sessionTypeRaw, session.classStatus, session.makeupForSessionId),
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

  const loadedSessionEarnings = useMemo(
    () => studentSessionSummary.reduce((sum, row) => sum + row.totalEarning, 0),
    [studentSessionSummary],
  );

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
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
              <div className="text-sm text-muted-foreground">Saved monthly count</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Earnings</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(earnings.totalEarnings)}</div>
              <div className="text-sm text-muted-foreground">Pending: {formatCurrency(earnings.pendingEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo Earnings</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(earnings.demoEarnings)}</div>
              <div className="text-sm text-muted-foreground">{demoEventCount} saved demo earning events</div>
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
              <TableCell className="text-right">
                {sessionStatus === 'loaded' && ledgerStatus === 'loaded' ? formatCurrency(loadedSessionEarnings) : 'Load details'}
              </TableCell>
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
              <TableCell className="font-medium">—</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(earnings.totalEarnings)}</TableCell>
              <TableCell className="text-right">Monthly rollup</TableCell>
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
            ) : sessionStatus === 'loaded' && ledgerStatus === 'loaded' && studentSessionSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions found for this month.</p>
            ) : sessionStatus === 'loaded' && ledgerStatus === 'loaded' ? (
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
                              onClick={() => setSelectedSessionStudentKey((current) => current === row.studentKey ? null : row.studentKey)}
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
