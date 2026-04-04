import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  monthKey: string;
  earnedAt: Date | null;
}

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

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student: any) => {
      const name = student.fullName || student.studentName || student.displayName || student.name || '';
      if (!name) return;
      if (student.uid) map.set(String(student.uid), String(name));
      if (student.id) map.set(String(student.id), String(name));
      if (student.userId) map.set(String(student.userId), String(name));
    });
    return map;
  }, [students]);

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
            kidId: String(data.kidId || ''),
            courseId: String(data.courseId || ''),
            paidAmount: toNumber(data.paidAmount, 0),
            monthKey,
            earnedAt,
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
        if (row.status === 'void') return false;
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

  const categorizedRows = useMemo(() => {
    const demoCompletedRows = filteredRows.filter((row) => row.source === 'demo_completed');
    const demoConvertedRows = filteredRows.filter((row) => row.source === 'demo_enrolled_bonus');
    const sessionRows = filteredRows.filter((row) => {
      const hasDemoMarker = row.demoId.length > 0;
      const isDemoSource = row.source === 'demo_completed' || row.source === 'demo_enrolled_bonus';
      return !hasDemoMarker && !isDemoSource;
    });
    return { demoCompletedRows, demoConvertedRows, sessionRows };
  }, [filteredRows]);

  const metrics = useMemo(() => {
    const { demoCompletedRows, demoConvertedRows, sessionRows } = categorizedRows;

    const demoCompletedIds = new Set(
      demoCompletedRows.map((row) => row.demoId).filter((value) => value.length > 0),
    );
    const demoConvertedIds = new Set(
      demoConvertedRows.map((row) => row.demoId).filter((value) => value.length > 0),
    );

    const sumAmount = (rows: TeacherEarningLedgerRow[]) =>
      rows.reduce((acc, row) => acc + toNumber(row.amount, 0), 0);

    const totalEarnings = sumAmount(filteredRows);
    const sessionEarnings = sumAmount(sessionRows);
    const demoCompletedEarnings = sumAmount(demoCompletedRows);
    const demoConvertedEarnings = sumAmount(demoConvertedRows);

    const paymentsReceived = filteredRows.reduce((acc, row) => {
      const paidAmount = toNumber(row.paidAmount, 0);
      if (paidAmount > 0) return acc + paidAmount;
      if (row.status === 'paid') return acc + toNumber(row.amount, 0);
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
  }, [categorizedRows, filteredRows]);

  const sessionDetails = useMemo(() => {
    const bucket = new Map<string, { name: string; count: number; amount: number }>();
    categorizedRows.sessionRows.forEach((row) => {
      const kidId = String(row.kidId || '').trim();
      const fallbackName = kidId ? `Student (${kidId.slice(0, 6)})` : 'Unknown student';
      const studentName = kidId ? studentNameById.get(kidId) || fallbackName : fallbackName;
      const key = kidId || fallbackName;
      const existing = bucket.get(key) || { name: studentName, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += toNumber(row.amount, 0);
      bucket.set(key, existing);
    });
    return Array.from(bucket.values()).sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [categorizedRows.sessionRows, studentNameById]);

  const demoDetails = useMemo(() => {
    const bucket = new Map<string, { name: string; count: number; amount: number }>();
    categorizedRows.demoCompletedRows.forEach((row) => {
      const kidId = String(row.kidId || '').trim();
      const fallbackName = kidId ? `Student (${kidId.slice(0, 6)})` : 'Unknown demo student';
      const studentName = kidId ? studentNameById.get(kidId) || fallbackName : fallbackName;
      const key = kidId || `${row.demoId || 'demo'}_${studentName}`;
      const existing = bucket.get(key) || { name: studentName, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += toNumber(row.amount, 0);
      bucket.set(key, existing);
    });
    return Array.from(bucket.values()).sort((a, b) => b.count - a.count || b.amount - a.amount);
  }, [categorizedRows.demoCompletedRows, studentNameById]);

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
                      {row.count} classes · {formatCurrency(row.amount)}
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
