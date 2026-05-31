import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
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
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';

type FilterPreset = 'week' | 'month' | 'custom';

interface EarningsSummaryProps {
  teacherId?: string;
}

interface TeacherEarningLedgerRow {
  id: string;
  amount: number;
  status: string;
  source: string;
  demoId: string;
  sessionId: string;
  kidId: string;
  courseId: string;
  paidAmount: number;
  perClassRate: number | null;
  monthKey: string;
  earnedAt: Date | null;
  enrollmentId: string;
  studentName: string;
  childName: string;
  kidName: string;
}

interface TeacherMonthSessionRow {
  id: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt: Date | null;
  studentId: string;
  studentName: string;
  studentAltName: string;
  childName: string;
  courseId: string;
  courseName: string;
  courseTitle: string;
  courseRaw: string;
  enrollmentId: string;
  makeupForSessionId: string;
  sessionTypeRaw: string;
  classStatus: string;
}

type EnrollmentRateDoc = {
  id: string;
  teacherId: string;
  courseId: string;
  courseName: string;
  kidId: string;
  studentId: string;
  childId: string;
  teacherRate: number | null;
  studentName: string;
  childName: string;
  kidName: string;
  updatedAtMs: number;
};

type ResolvedEarningRow = TeacherEarningLedgerRow & {
  effectiveAmount: number;
  effectiveRate: number | null;
  studentDisplayName: string;
  studentGroupKey: string;
};

interface MonthOption {
  value: string;
  label: string;
}

interface SessionDetailRow {
  id: string;
  studentKey: string;
  studentName: string;
  displayDate: Date | null;
  date: string;
  startTime: string;
  endTime: string;
  courseName: string;
  sessionTypeLabel: string;
  classStatusLabel: string;
  classStatus: string;
  earningStatusLabel: string;
  amount: number;
}

interface StudentSessionSummaryRow {
  studentKey: string;
  studentName: string;
  totalClasses: number;
  payableClasses: number;
  nonPayableClasses: number;
  totalEarning: number;
  rows: SessionDetailRow[];
}

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
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

const monthKeyFromDate = (date: Date): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const normalizeMonthKey = (value: unknown): string => {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : '';
};

const formatCurrency = (value: number): string => `₹${Math.round(value).toLocaleString('en-IN')}`;

const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const toCleanString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';

const getObjectName = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const row = value as Record<string, unknown>;
  return toCleanString(row.name) ||
    toCleanString(row.fullName) ||
    toCleanString(row.displayName) ||
    toCleanString(row.studentName) ||
    toCleanString(row.kidName) ||
    toCleanString(row.childName);
};

const toIdFromValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return toCleanString(row.id) || toCleanString(row.uid) || toCleanString(row.userId);
  }
  return '';
};

const normalizeStatusToken = (value: unknown): string => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  return raw.replace(/\s+/g, '_').replace(/-/g, '_');
};

const normalizeClassStatus = (value: unknown): string => {
  const normalized = normalizeStatusToken(value);
  if (normalized === 'canceled') return 'cancelled';
  if (normalized === 'noshow') return 'no_show';
  if (normalized === 'no_show') return 'no_show';
  if (normalized === 'no_showed') return 'no_show';
  if (normalized === 'reschedule_request') return 'reschedule_requested';
  if (normalized === 'rescheduled_requested') return 'reschedule_requested';
  return normalized;
};

const normalizeSessionTypeToken = (value: unknown): string =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

const getSessionTypeLabel = (
  rawType: unknown,
  classStatus: string,
  makeupForSessionId: string,
): string => {
  if (makeupForSessionId) return 'Makeup';

  const normalized = normalizeSessionTypeToken(rawType);
  if (!normalized) {
    if (classStatus === 'rescheduled' || classStatus === 'reschedule_requested') return 'Rescheduled';
    return 'Regular';
  }
  if (normalized === 'regular') return 'Regular';
  if (normalized === 'rescheduled' || normalized === 'reschedule_requested') return 'Rescheduled';
  if (normalized === 'makeup' || normalized === 'make_up') return 'Makeup';
  if (normalized === 'one_off' || normalized === 'oneoff') return 'One-off';
  if (normalized === 'enrollmentschedulereplace') {
    return classStatus === 'rescheduled' || classStatus === 'reschedule_requested' ? 'Rescheduled' : 'Regular';
  }

  return toTitleCase(normalized.replace(/_/g, ' '));
};

const getClassStatusLabel = (value: string): string => {
  switch (normalizeClassStatus(value)) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'cancelled':
      return 'Cancelled';
    case 'rescheduled':
      return 'Rescheduled';
    case 'no_show':
      return 'No-show';
    case 'reschedule_requested':
      return 'Reschedule requested';
    case 'late':
      return 'Late';
    case 'not_marked':
      return 'Not marked';
    default:
      return 'Not marked';
  }
};

const normalizeStartTime = (rawValue: unknown): string | null => {
  if (typeof rawValue !== 'string') return null;
  const value = rawValue.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getMonthDateRange = (monthKey: string): { startDate: string; endDate: string } | null => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const monthStart = new Date(parsed.year, parsed.monthIndex, 1);
  const monthEnd = new Date(parsed.year, parsed.monthIndex + 1, 0);
  const startDate = `${monthStart.getFullYear()}-${pad2(monthStart.getMonth() + 1)}-${pad2(monthStart.getDate())}`;
  const endDate = `${monthEnd.getFullYear()}-${pad2(monthEnd.getMonth() + 1)}-${pad2(monthEnd.getDate())}`;
  return { startDate, endDate };
};

const isReadableName = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower === 'unknown' ||
    lower === 'name not found' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return false;
  }
  const hasWhitespace = /\s/.test(trimmed);
  const looksLikeLongId =
    !hasWhitespace &&
    ((/^[a-f0-9]{16,}$/i.test(trimmed)) || (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)));
  return !looksLikeLongId;
};

const pickReadableName = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (isReadableName(value)) return String(value).trim();
  }
  return null;
};

const pickPerClassRate = (data: Record<string, unknown>): number | null => {
  const candidates = [
    data.perSessionRate,
    data.ratePerClass,
    data.teacherRate,
    data.payoutRate,
    data.rate,
  ];
  for (const candidate of candidates) {
    const value = toNumber(candidate, Number.NaN);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
};

const pickEnrollmentTeacherRate = (data: Record<string, unknown>): number | null => {
  const candidates = [
    data.teacherPayPerSession,
    data.teacherRatePerSession,
    data.teacherFee,
    data.teacherPayoutRate,
    data.rateTeacher,
    data.teacherRate,
    data.teacherPay,
    data.payoutRate,
    data.ratePerClass,
    data.ratePerSession,
  ];
  for (const candidate of candidates) {
    const value = toNumber(candidate, Number.NaN);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
};

const isPaidLikeStatus = (status: string): boolean => {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'paid' || normalized === 'settled' || normalized === 'processed';
};

const parseMonthKey = (value: string): { year: number; monthIndex: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
};

const buildMonthOptions = (monthsBack = 12): MonthOption[] => {
  const options: MonthOption[] = [];
  const now = new Date();

  for (let i = 0; i < monthsBack; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = monthKeyFromDate(date);
    const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
};

const todayDateInput = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const monthStartDateInput = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;
};

const parseDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const startOfDay = (date: Date): Date => {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
};

const endOfDay = (date: Date): Date => {
  const out = new Date(date);
  out.setHours(23, 59, 59, 999);
  return out;
};

const isSessionLinkedRow = (row: TeacherEarningLedgerRow): boolean => {
  const source = String(row.source || '').trim().toLowerCase();
  if (source === 'demo_completed' || source === 'demo_enrolled_bonus') return false;
  return String(row.sessionId || '').trim().length > 0;
};

const pickPreferredSessionRow = (
  current: TeacherEarningLedgerRow,
  incoming: TeacherEarningLedgerRow
): TeacherEarningLedgerRow => {
  const currentSessionId = String(current.sessionId || '').trim();
  const incomingSessionId = String(incoming.sessionId || '').trim();
  const currentCanonical = current.id === currentSessionId;
  const incomingCanonical = incoming.id === incomingSessionId;
  if (currentCanonical !== incomingCanonical) {
    return incomingCanonical ? incoming : current;
  }

  if ((current.status === 'void') !== (incoming.status === 'void')) {
    return incoming.status === 'void' ? current : incoming;
  }

  const currentMs = current.earnedAt?.getTime() || 0;
  const incomingMs = incoming.earnedAt?.getTime() || 0;
  return incomingMs > currentMs ? incoming : current;
};

const dedupeSessionLedgerRows = (
  rows: TeacherEarningLedgerRow[]
): TeacherEarningLedgerRow[] => {
  const sessionRowsBySessionId = new Map<string, TeacherEarningLedgerRow>();
  const nonSessionRows: TeacherEarningLedgerRow[] = [];

  rows.forEach((row) => {
    if (!isSessionLinkedRow(row)) {
      nonSessionRows.push(row);
      return;
    }

    const sessionId = String(row.sessionId || '').trim();
    if (!sessionId) {
      nonSessionRows.push(row);
      return;
    }

    const existing = sessionRowsBySessionId.get(sessionId);
    if (!existing) {
      sessionRowsBySessionId.set(sessionId, row);
      return;
    }

    sessionRowsBySessionId.set(sessionId, pickPreferredSessionRow(existing, row));
  });

  return [...nonSessionRows, ...Array.from(sessionRowsBySessionId.values())];
};

const resolveSessionClassStatus = (session: Record<string, unknown>): string => {
  const statusCandidates = [
    session.attendanceStatus,
    session.attendance_state,
    session.classStatus,
    session.class_status,
    session.sessionAttendanceStatus,
  ];
  for (const candidate of statusCandidates) {
    const normalized = normalizeClassStatus(candidate);
    if (normalized) return normalized;
  }

  const attendance = session.attendance;
  if (attendance && typeof attendance === 'object') {
    const statuses = Object.values(attendance as Record<string, unknown>)
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

  const fallbackStatus = normalizeClassStatus(session.status);
  if (
    fallbackStatus === 'absent' ||
    fallbackStatus === 'cancelled' ||
    fallbackStatus === 'rescheduled' ||
    fallbackStatus === 'no_show' ||
    fallbackStatus === 'reschedule_requested' ||
    fallbackStatus === 'late' ||
    fallbackStatus === 'not_marked' ||
    fallbackStatus === 'present'
  ) {
    return fallbackStatus;
  }

  return 'not_marked';
};

export const EarningsSummary: FC<EarningsSummaryProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const { students } = useTeacherFilteredStudents();
  const resolvedTeacherId = teacherId || user?.uid;

  const monthOptions = useMemo(() => buildMonthOptions(18), []);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKeyFromDate(new Date()));
  const [customStartDate, setCustomStartDate] = useState<string>(monthStartDateInput);
  const [customEndDate, setCustomEndDate] = useState<string>(todayDateInput);

  const [ledgerRows, setLedgerRows] = useState<TeacherEarningLedgerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionStudentKey, setSelectedSessionStudentKey] = useState<string | null>(null);
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [studentNameLookup, setStudentNameLookup] = useState<Map<string, string>>(new Map());
  const [enrollmentsById, setEnrollmentsById] = useState<Map<string, EnrollmentRateDoc>>(new Map());
  const [monthSessions, setMonthSessions] = useState<TeacherMonthSessionRow[]>([]);

  const baseStudentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student: any) => {
      const name = pickReadableName(
        student.fullName,
        student.studentName,
        student.displayName,
        student.name
      );
      if (!name) return;
      if (student.uid) map.set(String(student.uid), name);
      if (student.id) map.set(String(student.id), name);
      if (student.userId) map.set(String(student.userId), name);
    });
    return map;
  }, [students]);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>(baseStudentNameById);
    studentNameLookup.forEach((name, id) => {
      if (!map.has(id)) map.set(id, name);
    });
    return map;
  }, [baseStudentNameById, studentNameLookup]);

  useEffect(() => {
    let cancelled = false;

    const loadTeacherEnrollments = async () => {
      if (!resolvedTeacherId) {
        setEnrollmentsById(new Map());
        return;
      }
      try {
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('teacherId', '==', resolvedTeacherId)
        );
        const snap = await getDocs(enrollmentsQuery);
        if (cancelled) return;
        const map = new Map<string, EnrollmentRateDoc>();
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          map.set(docSnap.id, {
            id: docSnap.id,
            teacherId: String(data.teacherId || '').trim(),
            courseId: String(data.courseId || '').trim(),
            courseName:
              toCleanString(data.courseName) ||
              toCleanString(data.courseTitle) ||
              toCleanString(data.courseLabel) ||
              toCleanString(data.programName) ||
              toCleanString(data.subject),
            kidId: String(data.kidId || '').trim(),
            studentId: String(data.studentId || '').trim(),
            childId: String(data.childId || '').trim(),
            teacherRate: pickEnrollmentTeacherRate(data),
            studentName: String(data.studentName || ''),
            childName: String(data.childName || ''),
            kidName: String(data.kidName || ''),
            updatedAtMs:
              toDate(data.updatedAt)?.getTime() ||
              toDate(data.createdAt)?.getTime() ||
              0,
          });
        });
        setEnrollmentsById(map);
      } catch (error) {
        if (!cancelled) setEnrollmentsById(new Map());
      }
    };

    void loadTeacherEnrollments();

    return () => {
      cancelled = true;
    };
  }, [resolvedTeacherId]);

  useEffect(() => {
    let cancelled = false;

    const loadMonthSessions = async () => {
      if (!resolvedTeacherId) {
        setMonthSessions([]);
        return;
      }

      const monthRange = getMonthDateRange(selectedMonth);
      if (!monthRange) {
        setMonthSessions([]);
        return;
      }

      const mapDocs = (docs: Array<{ id: string; data: Record<string, unknown> }>): TeacherMonthSessionRow[] => {
        const sessionMap = new Map<string, TeacherMonthSessionRow>();
        docs.forEach((docRow) => {
          const session = docRow.data;
          const teacherId = String(session.teacherId || '').trim();
          if (teacherId !== resolvedTeacherId) return;
          const fallbackDate = String(session.date || '').trim();
          const startAt = toDate(session.startAt);
          const startTime = normalizeStartTime(session.startTime) || (startAt ? `${pad2(startAt.getHours())}:${pad2(startAt.getMinutes())}` : '');
          const endTime = normalizeStartTime(session.endTime);
          const studentId =
            toIdFromValue(session.kidId) ||
            toIdFromValue(session.studentId) ||
            toIdFromValue(session.childId) ||
            toIdFromValue(session.student) ||
            toIdFromValue(session.kid) ||
            toIdFromValue(session.child) ||
            (Array.isArray(session.kidIds) ? toIdFromValue(session.kidIds[0]) : '') ||
            (Array.isArray(session.studentIds) ? toIdFromValue(session.studentIds[0]) : '') ||
            (Array.isArray(session.childIds) ? toIdFromValue(session.childIds[0]) : '');
          const studentName =
            pickReadableName(
              session.studentName,
              session.kidName,
              session.childName,
              getObjectName(session.student),
              getObjectName(session.kid),
              Array.isArray(session.studentNames) ? session.studentNames[0] : null,
              Array.isArray(session.kidNames) ? session.kidNames[0] : null,
              Array.isArray(session.childNames) ? session.childNames[0] : null,
            ) ||
            '';

          const studentAltName =
            pickReadableName(
              session.kidName,
              session.childName,
              getObjectName(session.kid),
              getObjectName(session.child),
            ) || '';

          const sessionTypeRaw =
            String(session.sessionType || '').trim() ||
            String(session.type || '').trim() ||
            String(session.source || '').trim() ||
            String(session.sessionKind || '').trim() ||
            'regular';

          const classStatus = resolveSessionClassStatus(session);
          const date =
            /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)
              ? fallbackDate
              : startAt
              ? `${startAt.getFullYear()}-${pad2(startAt.getMonth() + 1)}-${pad2(startAt.getDate())}`
              : '';

          if (!date) return;
          if (date < monthRange.startDate || date > monthRange.endDate) return;

          sessionMap.set(docRow.id, {
            id: docRow.id,
            teacherId,
            date,
            startTime,
            endTime,
            startAt,
            studentId,
            studentName,
            studentAltName,
            childName: toCleanString(session.childName),
            courseId: toIdFromValue(session.courseId),
            courseName:
              toCleanString(session.courseName) ||
              toCleanString(session.courseLabel) ||
              toCleanString(session.subject),
            courseTitle:
              toCleanString(session.courseTitle) ||
              getObjectName(session.course),
            courseRaw: toCleanString(session.course),
            enrollmentId: toIdFromValue(session.enrollmentId),
            makeupForSessionId: toIdFromValue(session.makeupForSessionId),
            sessionTypeRaw,
            classStatus,
          });
        });

        return Array.from(sessionMap.values()).sort((a, b) => {
          const aStart = a.startAt
            ? a.startAt.getTime()
            : Date.parse(`${a.date}T${a.startTime || '00:00'}:00`);
          const bStart = b.startAt
            ? b.startAt.getTime()
            : Date.parse(`${b.date}T${b.startTime || '00:00'}:00`);
          const aMs = Number.isFinite(aStart) ? aStart : 0;
          const bMs = Number.isFinite(bStart) ? bStart : 0;
          return bMs - aMs;
        });
      };

      try {
        const primaryQuery = query(
          collection(db, 'classSessions'),
          where('teacherId', '==', resolvedTeacherId),
          where('date', '>=', monthRange.startDate),
          where('date', '<=', monthRange.endDate),
        );
        const snap = await getDocs(primaryQuery);
        if (!cancelled) {
          setMonthSessions(
            mapDocs(snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() as Record<string, unknown> }))),
          );
        }
      } catch (error) {
        const fallbackSnap = await getDocs(
          query(collection(db, 'classSessions'), where('teacherId', '==', resolvedTeacherId)),
        );
        if (!cancelled) {
          setMonthSessions(
            mapDocs(
              fallbackSnap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() as Record<string, unknown> })),
            ),
          );
        }
      }
    };

    void loadMonthSessions();

    return () => {
      cancelled = true;
    };
  }, [resolvedTeacherId, selectedMonth]);

  useEffect(() => {
    if (!showSessionDetails) {
      setSelectedSessionStudentKey(null);
    }
  }, [showSessionDetails]);

  useEffect(() => {
    setSelectedSessionStudentKey(null);
  }, [selectedMonth]);

  useEffect(() => {
    let cancelled = false;

    const loadStudentNamesFromDocs = async () => {
      const candidateIds = new Set<string>();
      ledgerRows.forEach((row) => {
        const kidId = String(row.kidId || '').trim();
        if (kidId) candidateIds.add(kidId);
      });
      enrollmentsById.forEach((enrollment) => {
        [enrollment.kidId, enrollment.studentId, enrollment.childId]
          .map((id) => String(id || '').trim())
          .filter(Boolean)
          .forEach((id) => candidateIds.add(id));
      });
      monthSessions.forEach((session) => {
        const studentId = String(session.studentId || '').trim();
        if (studentId) candidateIds.add(studentId);
      });

      const ids = Array.from(candidateIds);
      if (ids.length === 0) {
        setStudentNameLookup(new Map());
        return;
      }

      const map = new Map<string, string>();
      for (const id of ids) {
        if (baseStudentNameById.has(id)) continue;
        const collectionsToTry = ['kids', 'students', 'children'];
        for (const collectionName of collectionsToTry) {
          const snap = await getDoc(doc(db, collectionName, id));
          if (!snap.exists()) continue;
          const data = snap.data() as Record<string, unknown>;
          const name = pickReadableName(
            data.studentName,
            data.childName,
            data.kidName,
            data.fullName,
            data.displayName,
            data.name
          );
          if (name) {
            map.set(id, name);
            break;
          }
        }
      }

      if (!cancelled) {
        setStudentNameLookup(map);
      }
    };

    void loadStudentNamesFromDocs();

    return () => {
      cancelled = true;
    };
  }, [baseStudentNameById, enrollmentsById, ledgerRows, monthSessions]);

  useEffect(() => {
    let cancelled = false;

    const loadLedger = async () => {
      if (!resolvedTeacherId) {
        setLedgerRows([]);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const earningsQuery = query(
          collection(db, 'teacherEarnings'),
          where('teacherId', '==', resolvedTeacherId),
        );

        const snap = await getDocs(earningsQuery);
        const rows: TeacherEarningLedgerRow[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const earnedAt =
            toDate(data.earnedAt) || toDate(data.createdAt) || toDate(data.updatedAt) || null;
          const monthKey = normalizeMonthKey(data.monthKey) || (earnedAt ? monthKeyFromDate(earnedAt) : '');

          return {
            id: docSnap.id,
            amount: toNumber(data.amount, 0),
            status: String(data.status || '').toLowerCase(),
            source: String(data.source || '').toLowerCase(),
            demoId: String(data.demoId || ''),
            sessionId: String(data.sessionId || ''),
            kidId: String(data.kidId || data.studentId || data.childId || ''),
            courseId: String(data.courseId || ''),
            paidAmount: toNumber(data.paidAmount, 0),
            perClassRate: pickPerClassRate(data),
            monthKey,
            earnedAt,
            enrollmentId: String(data.enrollmentId || ''),
            studentName: String(data.studentName || ''),
            childName: String(data.childName || ''),
            kidName: String(data.kidName || ''),
          };
        });

        if (!cancelled) {
          setLedgerRows(rows);
        }
      } catch (error) {
        console.error('Failed to load teacher earnings ledger', error);
        if (!cancelled) {
          setErrorMessage('Unable to load earnings details right now.');
          setLedgerRows([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadLedger();

    return () => {
      cancelled = true;
    };
  }, [resolvedTeacherId]);

  const range = useMemo(() => {
    const today = new Date();

    if (filterPreset === 'week') {
      const end = endOfDay(today);
      const startBase = new Date(today);
      startBase.setDate(startBase.getDate() - 6);
      const start = startOfDay(startBase);
      return { start, end, label: 'Last 7 days' };
    }

    if (filterPreset === 'month') {
      const parsed = parseMonthKey(selectedMonth);
      if (!parsed) {
        const start = startOfDay(today);
        const end = endOfDay(today);
        return { start, end, label: selectedMonth };
      }

      const start = new Date(parsed.year, parsed.monthIndex, 1, 0, 0, 0, 0);
      const end = new Date(parsed.year, parsed.monthIndex + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      return { start, end, label };
    }

    const parsedStart = parseDateInput(customStartDate) || new Date();
    const parsedEnd = parseDateInput(customEndDate) || parsedStart;

    const start = startOfDay(parsedStart);
    const end = endOfDay(parsedEnd < parsedStart ? parsedStart : parsedEnd);
    return { start, end, label: `${customStartDate} to ${customEndDate}` };
  }, [customEndDate, customStartDate, filterPreset, selectedMonth]);

  const filteredRows = useMemo(
    () =>
      ledgerRows.filter((row) => {
        if (filterPreset === 'month') {
          if (row.monthKey) return row.monthKey === selectedMonth;
          if (!row.earnedAt) return false;
          return row.earnedAt >= range.start && row.earnedAt <= range.end;
        }
        if (!row.earnedAt) return false;
        return row.earnedAt >= range.start && row.earnedAt <= range.end;
      }),
    [filterPreset, ledgerRows, range.end, range.start, selectedMonth],
  );

  const resolveEnrollmentForRow = (row: TeacherEarningLedgerRow): EnrollmentRateDoc | null => {
    const directEnrollmentId = String(row.enrollmentId || '').trim();
    if (directEnrollmentId && enrollmentsById.has(directEnrollmentId)) {
      return enrollmentsById.get(directEnrollmentId) || null;
    }

    const rowKidId = String(row.kidId || '').trim();
    const rowCourseId = String(row.courseId || '').trim();
    let bestMatch: EnrollmentRateDoc | null = null;
    for (const enrollment of enrollmentsById.values()) {
      const enrollmentKidIds = [enrollment.kidId, enrollment.studentId, enrollment.childId]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      const kidMatch = rowKidId ? enrollmentKidIds.includes(rowKidId) : false;
      const courseMatch = rowCourseId ? String(enrollment.courseId || '').trim() === rowCourseId : true;
      if (!kidMatch || !courseMatch) continue;
      if (!bestMatch || enrollment.updatedAtMs > bestMatch.updatedAtMs) {
        bestMatch = enrollment;
      }
    }
    return bestMatch;
  };

  const resolvedRows = useMemo<ResolvedEarningRow[]>(() => {
    return dedupeSessionLedgerRows(filteredRows)
      .filter((row) => row.status !== 'void')
      .map((row) => {
        const enrollment = resolveEnrollmentForRow(row);
        const kidId = String(row.kidId || '').trim();
        const enrollmentKidId = String(
          enrollment?.kidId || enrollment?.studentId || enrollment?.childId || ''
        ).trim();
        const canonicalKidId = kidId || enrollmentKidId;
        const studentDisplayName =
          pickReadableName(
            row.studentName,
            row.childName,
            row.kidName,
            enrollment?.studentName,
            enrollment?.childName,
            enrollment?.kidName,
            canonicalKidId ? studentNameById.get(canonicalKidId) : null
          ) || 'Name not found';

        const enrollmentRate = enrollment?.teacherRate ?? null;
        const useEnrollmentRate =
          isSessionLinkedRow(row) && !isPaidLikeStatus(row.status) && Number.isFinite(enrollmentRate) && (enrollmentRate || 0) > 0;
        const effectiveRate = useEnrollmentRate ? (enrollmentRate as number) : row.perClassRate;
        const effectiveAmount = useEnrollmentRate ? (enrollmentRate as number) : toNumber(row.amount, 0);
        const studentGroupKey =
          canonicalKidId ||
          String(row.enrollmentId || '').trim() ||
          String(row.sessionId || '').trim() ||
          row.id;

        return {
          ...row,
          effectiveAmount,
          effectiveRate: Number.isFinite(effectiveRate) && (effectiveRate || 0) > 0 ? (effectiveRate as number) : null,
          studentDisplayName,
          studentGroupKey,
        };
      });
  }, [enrollmentsById, filteredRows, studentNameById]);

  const categorizedRows = useMemo(() => {
    const demoCompletedRows = resolvedRows.filter((row) => row.source === 'demo_completed');
    const demoConvertedRows = resolvedRows.filter((row) => row.source === 'demo_enrolled_bonus');
    const sessionRows = resolvedRows.filter((row) => {
      const hasDemoMarker = row.demoId.length > 0;
      const isDemoSource = row.source === 'demo_completed' || row.source === 'demo_enrolled_bonus';
      return !hasDemoMarker && !isDemoSource;
    });
    return { demoCompletedRows, demoConvertedRows, sessionRows };
  }, [resolvedRows]);

  const metrics = useMemo(() => {
    const { demoCompletedRows, demoConvertedRows, sessionRows } = categorizedRows;

    const demoCompletedIds = new Set(
      demoCompletedRows.map((row) => row.demoId).filter((value) => value.length > 0),
    );
    const demoConvertedIds = new Set(
      demoConvertedRows.map((row) => row.demoId).filter((value) => value.length > 0),
    );

    const sumAmount = (rows: ResolvedEarningRow[]) =>
      rows.reduce((acc, row) => acc + toNumber(row.effectiveAmount, 0), 0);

    const totalEarnings = sumAmount(resolvedRows);
    const sessionEarnings = sumAmount(sessionRows);
    const demoCompletedEarnings = sumAmount(demoCompletedRows);
    const demoConvertedEarnings = sumAmount(demoConvertedRows);

    const paymentsReceived = resolvedRows.reduce((acc, row) => {
      const paidAmount = toNumber(row.paidAmount, 0);
      if (paidAmount > 0) return acc + paidAmount;
      if (row.status === 'paid') return acc + toNumber(row.effectiveAmount, 0);
      return acc;
    }, 0);

    const pendingEarnings = Math.max(totalEarnings - paymentsReceived, 0);

    return {
      sessionCount: sessionRows.length,
      demoConductedCount: demoCompletedIds.size,
      demoConvertedCount: demoConvertedIds.size,
      totalEarnings,
      sessionEarnings,
      demoCompletedEarnings,
      demoConvertedEarnings,
      paymentsReceived,
      pendingEarnings,
    };
  }, [categorizedRows, resolvedRows]);

  const demoDetails = useMemo(() => {
    const bucket = new Map<string, { name: string; count: number; amount: number }>();
    categorizedRows.demoCompletedRows.forEach((row) => {
      const studentName = row.studentDisplayName || 'Name not found';
      const key = row.studentGroupKey || `${row.demoId || 'demo'}_${row.id}`;
      const existing = bucket.get(key) || { name: studentName, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += toNumber(row.effectiveAmount, 0);
      bucket.set(key, existing);
    });
    return Array.from(bucket.values()).sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [categorizedRows.demoCompletedRows]);

  const earningsBySessionId = useMemo(() => {
    const map = new Map<string, TeacherEarningLedgerRow>();
    dedupeSessionLedgerRows(ledgerRows)
      .filter((row) => isSessionLinkedRow(row))
      .forEach((row) => {
        const sessionId = String(row.sessionId || '').trim();
        if (!sessionId) return;
        map.set(sessionId, row);
      });
    return map;
  }, [ledgerRows]);

  const sessionDateWiseDetails = useMemo<SessionDetailRow[]>(() => {
    return monthSessions.map((session) => {
      const earning = earningsBySessionId.get(session.id);
      const classStatus = normalizeClassStatus(session.classStatus) || 'not_marked';
      const earningStatusRaw = String(earning?.status || '').trim().toLowerCase();
      const isVoid = earningStatusRaw === 'void';
      const isPaid = Boolean(earning && (isPaidLikeStatus(earningStatusRaw) || toNumber(earning.paidAmount, 0) > 0));
      const isPresent = classStatus === 'present';

      let earningStatusLabel = 'Not payable';
      if (isVoid) {
        earningStatusLabel = 'Voided';
      } else if (isPresent) {
        earningStatusLabel = isPaid ? 'Paid' : 'Payable';
      }

      const amount = !isVoid && isPresent && earning ? Math.max(toNumber(earning.amount, 0), 0) : 0;
      const displayDate = session.startAt || (/^\d{4}-\d{2}-\d{2}$/.test(session.date)
        ? new Date(`${session.date}T${session.startTime || '00:00'}:00`)
        : null);

      let enrollment = session.enrollmentId ? enrollmentsById.get(session.enrollmentId) || null : null;
      if (!enrollment) {
        for (const candidate of enrollmentsById.values()) {
          const candidateIds = [candidate.kidId, candidate.studentId, candidate.childId]
            .map((value) => String(value || '').trim())
            .filter(Boolean);
          const idMatch = session.studentId ? candidateIds.includes(session.studentId) : false;
          const courseMatch = session.courseId ? candidate.courseId === session.courseId : true;
          if (idMatch && courseMatch) {
            enrollment = candidate;
            break;
          }
        }
      }
      const studentName =
        pickReadableName(
          session.studentName,
          session.studentAltName,
          session.childName,
          enrollment?.studentName,
          enrollment?.kidName,
          enrollment?.childName,
          session.studentId ? studentNameById.get(session.studentId) : null,
        ) || 'Student';

      const studentKey = session.studentId || studentName.toLowerCase();
      const courseName =
        pickReadableName(
          session.courseName,
          session.courseTitle,
          session.courseRaw,
          enrollment?.courseName,
        ) || 'Course';

      return {
        id: session.id,
        studentKey,
        studentName,
        displayDate: displayDate && !Number.isNaN(displayDate.getTime()) ? displayDate : null,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        courseName,
        sessionTypeLabel: getSessionTypeLabel(session.sessionTypeRaw, classStatus, session.makeupForSessionId),
        classStatusLabel: getClassStatusLabel(classStatus),
        classStatus,
        earningStatusLabel,
        amount,
      };
    });
  }, [earningsBySessionId, enrollmentsById, monthSessions, studentNameById]);

  const studentSessionSummary = useMemo<StudentSessionSummaryRow[]>(() => {
    const bucket = new Map<string, StudentSessionSummaryRow>();

    sessionDateWiseDetails.forEach((row) => {
      const isPayable = row.classStatus === 'present';
      const existing = bucket.get(row.studentKey) || {
        studentKey: row.studentKey,
        studentName: row.studentName,
        totalClasses: 0,
        payableClasses: 0,
        nonPayableClasses: 0,
        totalEarning: 0,
        rows: [],
      };

      existing.totalClasses += 1;
      if (isPayable) {
        existing.payableClasses += 1;
      } else {
        existing.nonPayableClasses += 1;
      }
      existing.totalEarning += toNumber(row.amount, 0);
      existing.rows.push(row);
      bucket.set(row.studentKey, existing);
    });

    return Array.from(bucket.values())
      .map((row) => ({
        ...row,
        rows: [...row.rows].sort((a, b) => {
          const aMs = a.displayDate?.getTime() || Date.parse(`${a.date}T${a.startTime || '00:00'}:00`) || 0;
          const bMs = b.displayDate?.getTime() || Date.parse(`${b.date}T${b.startTime || '00:00'}:00`) || 0;
          return bMs - aMs;
        }),
      }))
      .sort((a, b) => b.totalEarning - a.totalEarning || a.studentName.localeCompare(b.studentName));
  }, [sessionDateWiseDetails]);

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
            <p className="text-sm text-muted-foreground">Range: {range.label}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={filterPreset === 'week' ? 'default' : 'outline'}
              onClick={() => setFilterPreset('week')}
            >
              Week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterPreset === 'month' ? 'default' : 'outline'}
              onClick={() => setFilterPreset('month')}
            >
              Month
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filterPreset === 'custom' ? 'default' : 'outline'}
              onClick={() => setFilterPreset('custom')}
            >
              Custom
            </Button>
          </div>
        </div>

        {filterPreset === 'month' && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
        )}

        {filterPreset === 'custom' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="earnings-custom-start" className="text-sm font-medium">Start Date</label>
              <Input
                id="earnings-custom-start"
                type="date"
                value={customStartDate}
                max={customEndDate || undefined}
                onChange={(event) => setCustomStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="earnings-custom-end" className="text-sm font-medium">End Date</label>
              <Input
                id="earnings-custom-end"
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(event) => setCustomEndDate(event.target.value)}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading earnings...</p>
        ) : errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Sessions Conducted</div>
              <div className="mt-1 text-2xl font-semibold">{metrics.sessionCount}</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(metrics.sessionEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demos Conducted</div>
              <div className="mt-1 text-2xl font-semibold">{metrics.demoConductedCount}</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(metrics.demoCompletedEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo Enrollments</div>
              <div className="mt-1 text-2xl font-semibold">{metrics.demoConvertedCount}</div>
              <div className="text-sm text-muted-foreground">{formatCurrency(metrics.demoConvertedEarnings)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Earnings</div>
              <div className="mt-1 text-2xl font-semibold">{formatCurrency(metrics.totalEarnings)}</div>
              <div className="text-sm text-muted-foreground">Pending: {formatCurrency(metrics.pendingEarnings)}</div>
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
              <TableCell>{metrics.sessionCount}</TableCell>
              <TableCell className="text-right">{formatCurrency(metrics.sessionEarnings)}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSessionDetails((prev) => !prev)}
                >
                  {showSessionDetails ? 'Hide' : 'View details'}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Demos Conducted</TableCell>
              <TableCell>{metrics.demoConductedCount}</TableCell>
              <TableCell className="text-right">{formatCurrency(metrics.demoCompletedEarnings)}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDemoDetails((prev) => !prev)}
                >
                  {showDemoDetails ? 'Hide' : 'View details'}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Demos Converted to Enrollment</TableCell>
              <TableCell>{metrics.demoConvertedCount}</TableCell>
              <TableCell className="text-right">{formatCurrency(metrics.demoConvertedEarnings)}</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-medium">
                {metrics.sessionCount + metrics.demoConductedCount + metrics.demoConvertedCount}
              </TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(metrics.totalEarnings)}</TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {showSessionDetails && (
          <div className="mt-4 rounded-md border p-3">
            <h4 className="text-sm font-semibold mb-2">Sessions Conducted: Student-wise</h4>
            {studentSessionSummary.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sessions found for this month.</p>
            ) : (
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
                      const colSpan = 6;

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
                                onClick={() => {
                                  setSelectedSessionStudentKey((prev) => (prev === row.studentKey ? null : row.studentKey));
                                }}
                              >
                                {isSelected ? 'Hide details' : 'View details'}
                              </Button>
                            </TableCell>
                        </TableRow>,
                        isSelected ? (
                          <TableRow key={`${row.studentKey}-details`}>
                            <TableCell colSpan={colSpan} className="p-0">
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
                                      const dateLabel = detailRow.displayDate
                                        ? detailRow.displayDate.toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                          })
                                        : detailRow.date || '—';
                                      const dayLabel = detailRow.displayDate
                                        ? detailRow.displayDate.toLocaleDateString('en-IN', { weekday: 'short' })
                                        : '—';
                                      const timeLabel = detailRow.startTime && detailRow.endTime
                                        ? `${detailRow.startTime} - ${detailRow.endTime}`
                                        : detailRow.startTime || '—';

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
            )}
          </div>
        )}

        {showDemoDetails && (
          <div className="mt-4 rounded-md border p-3">
            <h4 className="text-sm font-semibold mb-2">Demos Conducted: Student-wise</h4>
            {demoDetails.length === 0 ? (
              <p className="text-xs text-muted-foreground">No demo details in this range.</p>
            ) : (
              <div className="space-y-1">
                {demoDetails.map((row, index) => (
                  <div key={`demo-detail-${row.name}-${index}`} className="flex items-center justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="text-muted-foreground">
                      {row.count} demos · {formatCurrency(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
