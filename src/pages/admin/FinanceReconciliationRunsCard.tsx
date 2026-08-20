import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';

type ReconciliationRun = {
  id: string;
  triggerType?: string | null;
  runStatus?: string | null;
  warningCount?: number | null;
  scheduleLabel?: string | null;
  createdBy?: string | null;
  generatedAt?: string | null;
  generatedAtServer?: unknown;
  createdAt?: unknown;
  summaryCounts?: Record<string, unknown> | null;
  counts?: Record<string, unknown> | null;
  reportPath?: string | null;
};

type ParentPaymentsMonthRepairResult = {
  ok?: boolean;
  dryRun?: boolean;
  monthKey?: string;
  mismatchCount?: number;
  rebuiltParents?: number;
  summary?: {
    billedAmount?: number;
    settledAmount?: number;
    dueAmount?: number;
    collectionRate?: number;
    parentsBilled?: number;
    paidParents?: number;
    partialParents?: number;
    unpaidParents?: number;
    parentsWithDue?: number;
    existingReadModels?: number;
    missingReadModels?: number;
    mismatchedReadModels?: number;
    staleReadModels?: number;
  };
};

const IST_OFFSET_MINUTES = 330;

function monthKeyNowIST(): string {
  const now = new Date();
  const istMs = now.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTs = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTs.toDate === 'function') {
      const parsed = maybeTs.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    if (typeof maybeTs.seconds === 'number') {
      const parsed = new Date(maybeTs.seconds * 1000);
      return Number.isFinite(parsed.getTime()) ? parsed : null;
    }
  }
  return null;
}

function formatDateTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown): string {
  const parsed = Number(value);
  const amount = Number.isFinite(parsed) ? Math.round(parsed) : 0;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function FinanceReconciliationRunsCard() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningNow, setRunningNow] = useState(false);
  const [repairingMonth, setRepairingMonth] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKeyNowIST);

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      const runsQuery = query(
        collection(db, 'adminStats', 'financeReconciliationReports', 'runs'),
        orderBy('generatedAtServer', 'desc'),
        limit(12),
      );
      const snap = await getDocs(runsQuery);
      setRuns(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as ReconciliationRun[],
      );
    } catch (error: any) {
      console.error('[FinanceReconciliationRunsCard] failed to load runs', error);
      toast({
        title: 'Failed to load reconciliation runs',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const handleRunNow = useCallback(async () => {
    try {
      setRunningNow(true);
      const fn = httpsCallable(functions, 'runFinanceReconciliationAudit');
      const result = await fn({ monthKey: selectedMonth });
      const data = (result.data || {}) as Record<string, unknown>;
      const warningCount = Array.isArray(data.warnings) ? data.warnings.length : 0;
      toast({
        title: 'Reconciliation audit completed',
        description: `Month ${selectedMonth}, warnings: ${warningCount}.`,
      });
      await loadRuns();
    } catch (error: any) {
      console.error('[FinanceReconciliationRunsCard] manual run failed', error);
      toast({
        title: 'Manual reconciliation failed',
        description: error?.message || 'Check function logs and try again.',
        variant: 'destructive',
      });
    } finally {
      setRunningNow(false);
    }
  }, [loadRuns, selectedMonth, toast]);

  const handleRepairSelectedMonth = useCallback(async () => {
    try {
      setRepairingMonth(true);
      const repairFn = httpsCallable(functions, 'reconcileParentPaymentsMonthReadModels');
      const repairResult = await repairFn({
        monthKey: selectedMonth,
        dryRun: false,
        maxParents: 1500,
      });
      const repair = (repairResult.data || {}) as ParentPaymentsMonthRepairResult;
      const summary = repair.summary || {};

      const auditFn = httpsCallable(functions, 'runFinanceReconciliationAudit');
      await auditFn({ monthKey: selectedMonth });

      toast({
        title: 'Parent payment month rebuilt',
        description: `${selectedMonth}: billed ${formatMoney(summary.billedAmount)}, collected ${formatMoney(summary.settledAmount)}, due ${formatMoney(summary.dueAmount)}. Rebuilt ${toCount(repair.rebuiltParents)} parent records.`,
      });
      await loadRuns();
    } catch (error: any) {
      console.error('[FinanceReconciliationRunsCard] month rebuild failed', error);
      toast({
        title: 'Month rebuild failed',
        description: error?.message || 'No payment, charge, or wallet data was changed. Try again after checking the function logs.',
        variant: 'destructive',
      });
    } finally {
      setRepairingMonth(false);
    }
  }, [loadRuns, selectedMonth, toast]);

  const rows = useMemo(
    () =>
      runs.map((run) => {
        const counts = run.summaryCounts || run.counts || {};
        const missingCharges = toCount(counts.completedSessionsMissingBillingCharge);
        const missingEarnings = toCount(counts.completedSessionsMissingTeacherEarning);
        const rollupMismatches = toCount(counts.teacherMonthlyRollupMismatches);
        const linkageIssues = toCount(counts.financeLinkageIssues);
        return {
          ...run,
          missingCharges,
          missingEarnings,
          rollupMismatches,
          linkageIssues,
        };
      }),
    [runs],
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Finance Reconciliation Runs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Audit any service month and safely rebuild only its derived parent-payment totals.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Service month
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="mt-1 block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
            </label>
            <Button size="sm" variant="outline" onClick={handleRunNow} disabled={runningNow || repairingMonth || loading || !selectedMonth}>
              {runningNow ? 'Auditing…' : 'Audit month'}
            </Button>
            <Button size="sm" onClick={handleRepairSelectedMonth} disabled={repairingMonth || runningNow || loading || !selectedMonth}>
              {repairingMonth ? 'Rebuilding…' : 'Rebuild month totals'}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Rebuild month totals only refreshes <strong>parentMonthlyReadModels</strong>. It does not change payments, billing charges, wallet balances, attendance, or invoices.
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When (IST)</th>
                <th className="px-3 py-2 text-left font-medium">Trigger</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Warnings</th>
                <th className="px-3 py-2 text-left font-medium">Missing C/E</th>
                <th className="px-3 py-2 text-left font-medium">Rollup Mismatch</th>
                <th className="px-3 py-2 text-left font-medium">Linkage Issues</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={7}>
                    Loading recent runs…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={7}>
                    No reconciliation runs found yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDateTime(row.createdAt || row.generatedAtServer || row.generatedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.triggerType || 'manual'}
                      {row.scheduleLabel ? <span className="text-xs text-gray-500"> ({row.scheduleLabel})</span> : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.runStatus || 'success'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(row.warningCount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.missingCharges}/{row.missingEarnings}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.rollupMismatches}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.linkageIssues}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
