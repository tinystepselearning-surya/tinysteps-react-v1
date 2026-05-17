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

type EnrollmentRateDoc = {
  id: string;
  teacherId: string;
  courseId: string;
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
  const [showDemoDetails, setShowDemoDetails] = useState(false);
  const [studentNameLookup, setStudentNameLookup] = useState<Map<string, string>>(new Map());
  const [enrollmentsById, setEnrollmentsById] = useState<Map<string, EnrollmentRateDoc>>(new Map());

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
  }, [baseStudentNameById, enrollmentsById, ledgerRows]);

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

  const sessionDetails = useMemo(() => {
    const bucket = new Map<
      string,
      {
        name: string;
        count: number;
        amount: number;
        minExplicitRate: number | null;
        maxExplicitRate: number | null;
        explicitRateCount: number;
      }
    >();
    categorizedRows.sessionRows.forEach((row) => {
      const studentName = row.studentDisplayName || 'Name not found';
      const key = row.studentGroupKey;
      const existing =
        bucket.get(key) || {
          name: studentName,
          count: 0,
          amount: 0,
          minExplicitRate: null,
          maxExplicitRate: null,
          explicitRateCount: 0,
        };
      existing.count += 1;
      existing.amount += toNumber(row.effectiveAmount, 0);
      if (Number.isFinite(row.effectiveRate) && row.effectiveRate && row.effectiveRate > 0) {
        existing.explicitRateCount += 1;
        existing.minExplicitRate =
          existing.minExplicitRate === null
            ? row.effectiveRate
            : Math.min(existing.minExplicitRate, row.effectiveRate);
        existing.maxExplicitRate =
          existing.maxExplicitRate === null
            ? row.effectiveRate
            : Math.max(existing.maxExplicitRate, row.effectiveRate);
      }
      bucket.set(key, existing);
    });
    return Array.from(bucket.values()).sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [categorizedRows.sessionRows]);

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
            {sessionDetails.length === 0 ? (
              <p className="text-xs text-muted-foreground">No session details in this range.</p>
            ) : (
              <div className="space-y-1">
                {sessionDetails.map((row, index) => (
                  <div key={`session-detail-${row.name}-${index}`} className="flex items-center justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="text-muted-foreground">
                      {row.count} {row.count === 1 ? 'class' : 'classes'}
                      {row.count > 0
                        ? (() => {
                            if (row.explicitRateCount === 0 && row.amount <= 0) {
                              return ' · Rate missing';
                            }
                            const fallbackRate = row.amount / row.count;
                            const hasExplicitRate = row.explicitRateCount > 0;
                            const hasMixedExplicitRate =
                              hasExplicitRate &&
                              row.minExplicitRate !== null &&
                              row.maxExplicitRate !== null &&
                              Math.abs(row.maxExplicitRate - row.minExplicitRate) > 0.01;
                            const rateLabel = hasMixedExplicitRate ? 'Avg ' : '';
                            return ` · ${rateLabel}${formatCurrency(fallbackRate)}/class`;
                          })()
                        : ''}
                      {' · '}
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                ))}
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
