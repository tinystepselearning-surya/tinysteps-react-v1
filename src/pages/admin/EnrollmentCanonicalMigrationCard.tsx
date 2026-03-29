import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';

type CoverageSnapshot = {
  triggerType?: string | null;
  generatedAt?: string | null;
  createdAt?: unknown;
  runStatus?: string | null;
  warningState?: string | null;
  warningCount?: number | null;
  durationMs?: number | null;
  totals?: Record<string, unknown> | null;
  coverage?: Record<string, unknown> | null;
  readiness?: Record<string, unknown> | null;
};

type BackfillRun = {
  id: string;
  mode?: string | null;
  triggerType?: string | null;
  runStatus?: string | null;
  warningCount?: number | null;
  scanned?: number | null;
  updated?: number | null;
  wouldUpdate?: number | null;
  skippedCount?: number | null;
  ambiguousCount?: number | null;
  unresolvedCount?: number | null;
  errorCount?: number | null;
  durationMs?: number | null;
  createdAt?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  ambiguousSample?: Array<{ enrollmentId?: string; reasons?: string[] }> | null;
  unresolvedSample?: Array<{ enrollmentId?: string; reasons?: string[] }> | null;
  errorSample?: Array<{ enrollmentId?: string; reason?: string }> | null;
};

type LegacyFallbackDay = {
  id: string;
  dayKey?: string;
  totalEvents?: number;
  totalHits?: number;
  totalInputs?: number;
  byReader?: Record<string, { events?: number; hits?: number }>;
  updatedAt?: unknown;
};

type ReconciliationRun = {
  id: string;
  runStatus?: string | null;
  warningState?: string | null;
  warningCount?: number | null;
  triggerType?: string | null;
  createdAt?: unknown;
  summaryCounts?: Record<string, unknown> | null;
  counts?: Record<string, unknown> | null;
};

type ReadinessState = 'NOT READY' | 'PARTIALLY READY' | 'READY FOR PHASE A';

const FALLBACK_HIT_THRESHOLD_14D = 0;
const REQUIRED_FALLBACK_OBSERVATION_DAYS = 14;
const REQUIRED_RECONCILIATION_SUCCESS_RUNS = 7;

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

function formatDurationMs(value: unknown): string {
  const ms = toCount(value);
  if (ms <= 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.round(ms / 100) / 10;
  return `${seconds}s`;
}

function normalizeReason(value: unknown): string {
  return String(value || '').trim();
}

function summarizeReasonBuckets(
  items: Array<{ enrollmentId?: string; reasons?: string[] }> | null | undefined,
): Array<{ category: string; count: number; sampleEnrollmentIds: string[] }> {
  if (!Array.isArray(items) || items.length === 0) return [];
  const buckets = new Map<string, { count: number; sampleEnrollmentIds: Set<string> }>();
  const classifyReason = (reason: string): string => {
    if (!reason) return 'unresolved_identity_source';
    if (reason.includes('kidId')) return 'missing_or_conflicting_kid_linkage';
    if (reason.includes('parentId')) return 'missing_or_conflicting_parent_linkage';
    if (reason.includes('teacherId')) return 'missing_or_conflicting_teacher_linkage';
    return 'unresolved_identity_source';
  };

  items.forEach((entry) => {
    const enrollmentId = String(entry?.enrollmentId || '').trim();
    const reasons = Array.isArray(entry?.reasons) ? entry!.reasons!.map(normalizeReason).filter(Boolean) : [];
    if (reasons.length === 0) {
      const key = 'unresolved_identity_source';
      const existing = buckets.get(key) || { count: 0, sampleEnrollmentIds: new Set<string>() };
      existing.count += 1;
      if (enrollmentId && existing.sampleEnrollmentIds.size < 5) existing.sampleEnrollmentIds.add(enrollmentId);
      buckets.set(key, existing);
      return;
    }

    const uniqueCategories = Array.from(new Set(reasons.map(classifyReason)));
    uniqueCategories.forEach((key) => {
      const existing = buckets.get(key) || { count: 0, sampleEnrollmentIds: new Set<string>() };
      existing.count += 1;
      if (enrollmentId && existing.sampleEnrollmentIds.size < 5) existing.sampleEnrollmentIds.add(enrollmentId);
      buckets.set(key, existing);
    });
  });

  return Array.from(buckets.entries())
    .map(([category, value]) => ({
      category,
      count: value.count,
      sampleEnrollmentIds: Array.from(value.sampleEnrollmentIds),
    }))
    .sort((a, b) => b.count - a.count);
}

function getSummaryCount(
  run: ReconciliationRun | null,
  key: 'completedSessionsWithUnresolvedEnrollment' | 'teacherMonthlyRollupMismatches' | 'completedSessionsMissingFinancialWithoutValidSuppression' | 'staleTeacherMonthlyRollups',
): number {
  if (!run) return 0;
  const fromSummary = toCount(run.summaryCounts?.[key]);
  if (fromSummary > 0) return fromSummary;
  return toCount(run.counts?.[key]);
}

export default function EnrollmentCanonicalMigrationCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [backfillRunning, setBackfillRunning] = useState<'dry' | 'apply' | null>(null);
  const [coverageRunning, setCoverageRunning] = useState(false);
  const [latestCoverage, setLatestCoverage] = useState<CoverageSnapshot | null>(null);
  const [runs, setRuns] = useState<BackfillRun[]>([]);
  const [fallbackDays, setFallbackDays] = useState<LegacyFallbackDay[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<ReconciliationRun[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coverageSnap, runsSnap, fallbackSnap, reconciliationSnap] = await Promise.all([
        getDoc(doc(db, 'adminStats', 'enrollmentCanonicalCoverage')),
        getDocs(
          query(
            collection(db, 'adminStats', 'enrollmentCanonicalBackfillRuns', 'runs'),
            orderBy('createdAt', 'desc'),
            limit(10),
          ),
        ),
        getDocs(
          query(
            collection(db, 'adminStats', 'legacyFallbackUsage', 'days'),
            orderBy('dayKey', 'desc'),
            limit(14),
          ),
        ),
        getDocs(
          query(
            collection(db, 'adminStats', 'financeReconciliationReports', 'runs'),
            orderBy('createdAt', 'desc'),
            limit(14),
          ),
        ),
      ]);
      setLatestCoverage(coverageSnap.exists() ? (coverageSnap.data() as CoverageSnapshot) : null);
      setRuns(
        runsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as BackfillRun[],
      );
      setFallbackDays(
        fallbackSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as LegacyFallbackDay[],
      );
      setReconciliationRuns(
        reconciliationSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as ReconciliationRun[],
      );
    } catch (error: any) {
      console.error('[EnrollmentCanonicalMigrationCard] failed to load', error);
      toast({
        title: 'Failed to load migration telemetry',
        description: error?.message || 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runCoverageNow = useCallback(async () => {
    setCoverageRunning(true);
    try {
      const fn = httpsCallable(functions, 'runEnrollmentCanonicalCoverage');
      await fn({});
      toast({
        title: 'Coverage snapshot refreshed',
        description: 'Latest canonical-field coverage is now updated.',
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Coverage run failed',
        description: error?.message || 'Check function logs.',
        variant: 'destructive',
      });
    } finally {
      setCoverageRunning(false);
    }
  }, [loadData, toast]);

  const runBackfill = useCallback(
    async (apply: boolean) => {
      if (apply) {
        const confirmed = window.prompt(
          'Type APPLY to run canonical enrollment backfill writes (idempotent, admin-only).',
        );
        if (confirmed !== 'APPLY') return;
      }

      setBackfillRunning(apply ? 'apply' : 'dry');
      try {
        const fn = httpsCallable(functions, 'adminBackfillEnrollmentCanonicalFields');
        const result = await fn({
          apply,
          limit: 300,
        });
        const data = (result.data || {}) as Record<string, unknown>;
        toast({
          title: apply ? 'Backfill apply completed' : 'Backfill dry-run completed',
          description: `Scanned ${toCount(data.scanned)}, updated ${toCount(
            data.updated,
          )}, ambiguous ${toCount(data.ambiguousCount)}.`,
        });
        await loadData();
      } catch (error: any) {
        toast({
          title: apply ? 'Backfill apply failed' : 'Backfill dry-run failed',
          description: error?.message || 'Check function logs.',
          variant: 'destructive',
        });
      } finally {
        setBackfillRunning(null);
      }
    },
    [loadData, toast],
  );

  const readinessRows = useMemo(() => {
    const readiness = latestCoverage?.readiness || {};
    return [
      { label: 'kidIdReady', value: Boolean(readiness.kidIdReady) },
      { label: 'kidIdsReady', value: Boolean(readiness.kidIdsReady) },
      { label: 'parentIdReady', value: Boolean(readiness.parentIdReady) },
      { label: 'activeLikeTeacherReady', value: Boolean(readiness.activeLikeTeacherReady) },
      { label: 'ambiguityReady', value: Boolean(readiness.ambiguityReady) },
      { label: 'legacyRemovalReady', value: Boolean(readiness.legacyRemovalReady) },
    ];
  }, [latestCoverage]);

  const fallbackTotals = useMemo(() => {
    return fallbackDays.reduce(
      (acc, row) => {
        acc.events += toCount(row.totalEvents);
        acc.hits += toCount(row.totalHits);
        const parentReader = row.byReader?.parent_dashboard || {};
        const useDataReader = row.byReader?.useenrollmentsforstudents || {};
        acc.parentDashboardEvents += toCount(parentReader.events);
        acc.useDataEvents += toCount(useDataReader.events);
        return acc;
      },
      { events: 0, hits: 0, parentDashboardEvents: 0, useDataEvents: 0 },
    );
  }, [fallbackDays]);

  const latestBackfillRun = runs[0] || null;
  const latestApplyBackfillRun = useMemo(
    () => runs.find((run) => String(run.mode || '').toLowerCase() === 'apply') || null,
    [runs],
  );
  const latestReconciliationRun = reconciliationRuns[0] || null;

  const ambiguityBuckets = useMemo(
    () => summarizeReasonBuckets(latestBackfillRun?.ambiguousSample),
    [latestBackfillRun],
  );
  const unresolvedBuckets = useMemo(
    () => summarizeReasonBuckets(latestBackfillRun?.unresolvedSample),
    [latestBackfillRun],
  );

  const readinessGateRows = useMemo(() => {
    const coverageReady = Boolean(latestCoverage?.readiness?.legacyRemovalReady);
    const backfillReady =
      Boolean(latestApplyBackfillRun) &&
      toCount(latestApplyBackfillRun?.ambiguousCount) === 0 &&
      toCount(latestApplyBackfillRun?.unresolvedCount) === 0 &&
      toCount(latestApplyBackfillRun?.errorCount) === 0;
    const fallbackObservedDays = fallbackDays.filter((row) => String(row.dayKey || '').trim()).length;
    const fallbackReady =
      fallbackTotals.hits <= FALLBACK_HIT_THRESHOLD_14D &&
      fallbackObservedDays >= REQUIRED_FALLBACK_OBSERVATION_DAYS;

    const reconciledRecentRuns = reconciliationRuns.filter(
      (run) => String(run.runStatus || '').toLowerCase() === 'success',
    );
    const reconciliationCriticalCount = (run: ReconciliationRun | null) =>
      getSummaryCount(run, 'completedSessionsWithUnresolvedEnrollment') +
      getSummaryCount(run, 'teacherMonthlyRollupMismatches') +
      getSummaryCount(run, 'completedSessionsMissingFinancialWithoutValidSuppression') +
      getSummaryCount(run, 'staleTeacherMonthlyRollups');
    const reconciliationReady =
      reconciledRecentRuns.length >= REQUIRED_RECONCILIATION_SUCCESS_RUNS &&
      reconciliationCriticalCount(reconciledRecentRuns[0] || null) === 0 &&
      reconciledRecentRuns
        .slice(0, REQUIRED_RECONCILIATION_SUCCESS_RUNS)
        .every((run) => reconciliationCriticalCount(run) === 0);

    return [
      {
        key: 'coverage',
        label: 'Canonical coverage thresholds',
        ready: coverageReady,
        detail: coverageReady ? 'coverage readiness=true' : 'coverage readiness=false',
      },
      {
        key: 'backfill',
        label: 'Backfill ambiguity/unresolved gate',
        ready: backfillReady,
        detail: latestApplyBackfillRun
          ? `latest apply: ambiguous ${toCount(latestApplyBackfillRun.ambiguousCount)}, unresolved ${toCount(
              latestApplyBackfillRun.unresolvedCount,
            )}, errors ${toCount(latestApplyBackfillRun.errorCount)}`
          : 'no apply run found',
      },
      {
        key: 'fallback',
        label: '14-day legacy fallback near-zero',
        ready: fallbackReady,
        detail: `14-day hits ${fallbackTotals.hits} (threshold <= ${FALLBACK_HIT_THRESHOLD_14D}), observed days ${fallbackObservedDays}/${REQUIRED_FALLBACK_OBSERVATION_DAYS}`,
      },
      {
        key: 'reconciliation',
        label: 'Recent finance reconciliation drift',
        ready: reconciliationReady,
        detail: latestReconciliationRun
          ? `latest critical mismatches ${reconciliationCriticalCount(
              latestReconciliationRun,
            )}, successful runs ${reconciledRecentRuns.length}/${REQUIRED_RECONCILIATION_SUCCESS_RUNS}`
          : 'no reconciliation run found',
      },
    ];
  }, [
    fallbackDays,
    fallbackTotals.hits,
    latestApplyBackfillRun,
    latestCoverage?.readiness,
    latestReconciliationRun,
    reconciliationRuns,
  ]);

  const readinessState: ReadinessState = useMemo(() => {
    const readyCount = readinessGateRows.filter((row) => row.ready).length;
    if (readyCount === readinessGateRows.length && readinessGateRows.length > 0) return 'READY FOR PHASE A';
    if (readyCount > 0) return 'PARTIALLY READY';
    return 'NOT READY';
  }, [readinessGateRows]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Enrollment Canonical Migration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Backfill execution and coverage readiness for safe legacy-reader removal.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={runCoverageNow}
              disabled={loading || coverageRunning}
            >
              {coverageRunning ? 'Refreshing…' : 'Refresh Coverage'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBackfill(false)}
              disabled={loading || backfillRunning !== null}
            >
              {backfillRunning === 'dry' ? 'Running…' : 'Backfill Dry-run'}
            </Button>
            <Button
              size="sm"
              onClick={() => runBackfill(true)}
              disabled={loading || backfillRunning !== null}
            >
              {backfillRunning === 'apply' ? 'Applying…' : 'Backfill Apply'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500">Coverage Snapshot (IST)</div>
            <div className="text-sm font-medium">
              {formatDateTime(latestCoverage?.createdAt || latestCoverage?.generatedAt)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Status: {latestCoverage?.runStatus || '—'} · Warnings: {toCount(latestCoverage?.warningCount)}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500">Unresolved / Ambiguous</div>
            <div className="text-sm font-medium">
              Kid {toCount(latestCoverage?.totals?.unresolvedKidIdCount)} · Parent{' '}
              {toCount(latestCoverage?.totals?.unresolvedParentIdCount)} · Teacher{' '}
              {toCount(latestCoverage?.totals?.unresolvedTeacherIdCount)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Ambiguous: {toCount(latestCoverage?.totals?.ambiguousCount)}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500">Latest Runtime</div>
            <div className="text-sm font-medium">{formatDurationMs(latestCoverage?.durationMs)}</div>
            <div className="mt-1 text-xs text-gray-500">
              trigger: {latestCoverage?.triggerType || '—'}
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">Phase A Readiness Decision</div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                readinessState === 'READY FOR PHASE A'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : readinessState === 'PARTIALLY READY'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
              }`}
            >
              {readinessState}
            </span>
          </div>
          <div className="space-y-2">
            {readinessGateRows.map((row) => (
              <div
                key={row.key}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
              >
                <div className="font-medium text-slate-700 dark:text-slate-200">{row.label}</div>
                <div className={row.ready ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>
                  {row.ready ? 'PASS' : 'BLOCKED'}
                </div>
                <div className="w-full text-[11px] text-slate-500">{row.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Decision is read-only. Legacy reader removal stays manual and gated.
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Coverage Flags (raw)</div>
          <div className="flex flex-wrap gap-2">
            {readinessRows.map((entry) => (
              <span
                key={entry.label}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  entry.value
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                }`}
              >
                {entry.label}: {entry.value ? 'yes' : 'no'}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When (IST)</th>
                <th className="px-3 py-2 text-left font-medium">Mode</th>
                <th className="px-3 py-2 text-left font-medium">Scanned</th>
                <th className="px-3 py-2 text-left font-medium">Updated</th>
                <th className="px-3 py-2 text-left font-medium">Skipped</th>
                <th className="px-3 py-2 text-left font-medium">Ambiguous</th>
                <th className="px-3 py-2 text-left font-medium">Unresolved</th>
                <th className="px-3 py-2 text-left font-medium">Errors</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={8}>
                    Loading backfill runs…
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-gray-500" colSpan={8}>
                    No backfill runs found yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDateTime(run.createdAt || run.completedAt || run.startedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {run.mode || '—'} ({run.runStatus || 'success'})
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.scanned)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.updated)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.skippedCount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.ambiguousCount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.unresolvedCount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{toCount(run.errorCount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Ambiguous Buckets (latest run)</div>
            {ambiguityBuckets.length === 0 ? (
              <div className="text-xs text-slate-500">No ambiguous buckets in latest backfill run.</div>
            ) : (
              <div className="space-y-2">
                {ambiguityBuckets.slice(0, 6).map((bucket) => (
                  <div key={`amb_${bucket.category}`} className="rounded border px-2 py-1.5 text-xs">
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {bucket.category}
                    </div>
                    <div className="text-slate-500">Count: {bucket.count}</div>
                    <div className="text-slate-500">
                      Sample: {bucket.sampleEnrollmentIds.length > 0 ? bucket.sampleEnrollmentIds.join(', ') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-medium">Unresolved Buckets (latest run)</div>
            {unresolvedBuckets.length === 0 ? (
              <div className="text-xs text-slate-500">No unresolved buckets in latest backfill run.</div>
            ) : (
              <div className="space-y-2">
                {unresolvedBuckets.slice(0, 6).map((bucket) => (
                  <div key={`unres_${bucket.category}`} className="rounded border px-2 py-1.5 text-xs">
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {bucket.category}
                    </div>
                    <div className="text-slate-500">Count: {bucket.count}</div>
                    <div className="text-slate-500">
                      Sample: {bucket.sampleEnrollmentIds.length > 0 ? bucket.sampleEnrollmentIds.join(', ') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Reconciliation (latest)</div>
          {latestReconciliationRun ? (
            <div className="grid gap-2 text-xs md:grid-cols-2">
              <div>
                <div className="text-slate-500">
                  Run: {formatDateTime(latestReconciliationRun.createdAt)} · {latestReconciliationRun.triggerType || '—'} ·{' '}
                  {latestReconciliationRun.runStatus || '—'}
                </div>
                <div className="text-slate-500">
                  warningState: {latestReconciliationRun.warningState || '—'} · warnings:{' '}
                  {toCount(latestReconciliationRun.warningCount)}
                </div>
              </div>
              <div className="space-y-1">
                <div>Unresolved enrollment refs: {getSummaryCount(latestReconciliationRun, 'completedSessionsWithUnresolvedEnrollment')}</div>
                <div>Teacher rollup mismatches: {getSummaryCount(latestReconciliationRun, 'teacherMonthlyRollupMismatches')}</div>
                <div>Missing finance (bad suppression): {getSummaryCount(latestReconciliationRun, 'completedSessionsMissingFinancialWithoutValidSuppression')}</div>
                <div>Stale teacher rollups: {getSummaryCount(latestReconciliationRun, 'staleTeacherMonthlyRollups')}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No reconciliation reports found yet.</div>
          )}
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Legacy Fallback Usage (last 14 days)</div>
            <div className="text-xs text-gray-500">
              Events {fallbackTotals.events} · Hits {fallbackTotals.hits}
            </div>
          </div>
          <div className="mb-2 text-xs text-gray-500">
            ParentDashboard events: {fallbackTotals.parentDashboardEvents} · useData events:{' '}
            {fallbackTotals.useDataEvents}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">Day</th>
                  <th className="px-2 py-1 text-left font-medium">Events</th>
                  <th className="px-2 py-1 text-left font-medium">Hits</th>
                  <th className="px-2 py-1 text-left font-medium">ParentDashboard</th>
                  <th className="px-2 py-1 text-left font-medium">useData</th>
                </tr>
              </thead>
              <tbody>
                {fallbackDays.length === 0 ? (
                  <tr>
                    <td className="px-2 py-2 text-gray-500" colSpan={5}>
                      No fallback usage docs yet.
                    </td>
                  </tr>
                ) : (
                  fallbackDays.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-2 py-1 whitespace-nowrap">{row.dayKey || row.id}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{toCount(row.totalEvents)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{toCount(row.totalHits)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {toCount(row.byReader?.parent_dashboard?.events)}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {toCount(row.byReader?.useenrollmentsforstudents?.events)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
