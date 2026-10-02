import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Loader2, Search } from 'lucide-react';
import type { AvsParentOption } from '../../../lib/attendanceValidationParentScope';
import {
  completedMonthOptions,
  formatMonthKey,
  loadAvsMonthlyParentProgress,
  loadAvsMonthlyParentsWithSessions,
  previousCompletedMonthKey,
  type AvsMonthlyParentProgress,
  type AvsMonthlyParentProgressStatus,
} from '../../../lib/attendanceValidationMonthlyParentProgress';
import { callFunction } from '../../../lib/callFunctions';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';

interface Props {
  parents: AvsParentOption[];
  loadParents: () => Promise<AvsParentOption[]>;
  disabled: boolean;
  onOpenParentMonth: (input: {
    parentId: string;
    monthKey: string;
  }) => void;
}

interface ProgressMutationResponse {
  ok: boolean;
  parentId: string;
  monthKey: string;
  status: AvsMonthlyParentProgressStatus;
  updatedAt: string | null;
  completedAt: string | null;
}

type TrackerFilter = 'all' | AvsMonthlyParentProgressStatus;
type TrackerScope = 'with_sessions' | 'all_parents';

function formatUpdatedAt(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function statusLabel(status: AvsMonthlyParentProgressStatus): string {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In Progress';
  return 'Not Started';
}

function statusClass(status: AvsMonthlyParentProgressStatus): string {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'in_progress') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export default function AttendanceValidationMonthlyTracker({
  parents,
  loadParents,
  disabled,
  onOpenParentMonth,
}: Props) {
  const monthOptions = useMemo(() => completedMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions[0] ?? previousCompletedMonthKey(),
  );
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, AvsMonthlyParentProgress>>({});
  const [sessionCountByParent, setSessionCountByParent] = useState<Record<string, number>>({});
  const [scope, setScope] = useState<TrackerScope>('with_sessions');
  const [filter, setFilter] = useState<TrackerFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingParentId, setSavingParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusFor = (parentId: string): AvsMonthlyParentProgressStatus =>
    progress[parentId]?.status ?? 'not_started';

  const scopedParents = useMemo(() => {
    if (scope === 'all_parents') return parents;
    const includedIds = new Set(Object.keys(sessionCountByParent));
    Object.keys(progress).forEach((parentId) => includedIds.add(parentId));
    return parents.filter((parent) => includedIds.has(parent.id));
  }, [parents, progress, scope, sessionCountByParent]);

  const summary = useMemo(() => {
    const counts = { not_started: 0, in_progress: 0, completed: 0 };
    scopedParents.forEach((parent) => {
      counts[progress[parent.id]?.status ?? 'not_started'] += 1;
    });
    return counts;
  }, [progress, scopedParents]);

  const visibleParents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return scopedParents.filter((parent) => {
      const status = progress[parent.id]?.status ?? 'not_started';
      if (filter !== 'all' && status !== filter) return false;
      return !needle || parent.label.toLowerCase().includes(needle);
    });
  }, [filter, progress, scopedParents, search]);

  const loadTracker = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [, saved, parentsWithSessions] = await Promise.all([
        loadParents(),
        loadAvsMonthlyParentProgress(selectedMonth),
        loadAvsMonthlyParentsWithSessions(selectedMonth),
      ]);
      setProgress(Object.fromEntries(saved.map((item) => [item.parentId, item])));
      setSessionCountByParent(Object.fromEntries(
        parentsWithSessions.map((item) => [item.parentId, item.sessionCount]),
      ));
      setLoadedMonth(selectedMonth);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load monthly tracker.');
    } finally {
      setLoading(false);
    }
  }, [loadParents, selectedMonth]);

  useEffect(() => {
    void loadTracker();
  }, [loadTracker]);

  const updateStatus = async (
    parentId: string,
    status: AvsMonthlyParentProgressStatus,
  ) => {
    if (loadedMonth !== selectedMonth) return false;
    setSavingParentId(parentId);
    setError(null);
    try {
      const result = await callFunction<
        ProgressMutationResponse,
        { parentId: string; monthKey: string; status: AvsMonthlyParentProgressStatus }
      >('updateAttendanceValidationMonthlyParentProgress', {
        parentId,
        monthKey: selectedMonth,
        status,
      });
      setProgress((current) => {
        const next = { ...current };
        if (result.status === 'not_started') {
          delete next[parentId];
        } else {
          next[parentId] = {
            parentId,
            monthKey: selectedMonth,
            status: result.status,
            updatedAt: result.updatedAt,
            completedAt: result.completedAt,
          };
        }
        return next;
      });
      return true;
    } catch (mutationError) {
      setError(mutationError instanceof Error
        ? mutationError.message
        : 'Unable to update monthly validation status.');
      return false;
    } finally {
      setSavingParentId(null);
    }
  };

  const openParent = async (parentId: string) => {
    const currentStatus = statusFor(parentId);
    if (currentStatus === 'not_started') {
      const updated = await updateStatus(parentId, 'in_progress');
      if (!updated) return;
    }
    onOpenParentMonth({ parentId, monthKey: selectedMonth });
  };

  const trackerReady = loadedMonth === selectedMonth;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <h3 className="text-base font-semibold text-slate-900">
              Monthly Parent Validation Tracker
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Track review progress by parent and month. Not Started is implicit and creates no Firestore record.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>Month</span>
            <select
              aria-label="Validation tracker month"
              className="h-10 min-w-[180px] rounded-md border bg-white px-3"
              value={selectedMonth}
              disabled={disabled || loading || savingParentId !== null}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setLoadedMonth(null);
                setProgress({});
                setSessionCountByParent({});
                setScope('with_sessions');
                setFilter('all');
                setError(null);
              }}
            >
              {monthOptions.map((value) => (
                <option key={value} value={value}>{formatMonthKey(value)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>Parents</span>
            <select
              aria-label="Validation tracker parent scope"
              className="h-10 min-w-[190px] rounded-md border bg-white px-3"
              value={scope}
              disabled={disabled || loading || savingParentId !== null}
              onChange={(event) => {
                setScope(event.target.value as TrackerScope);
                setFilter('all');
              }}
            >
              <option value="with_sessions">With sessions this month</option>
              <option value="all_parents">All parents</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading || savingParentId !== null}
            onClick={() => void loadTracker()}
          >
            {loading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <ClipboardCheck className="mr-2 h-4 w-4" />}
            {trackerReady ? 'Refresh tracker' : 'Loading tracker…'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {trackerReady && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {([
              ['all', 'All', scopedParents.length],
              ['not_started', 'Not Started', summary.not_started],
              ['in_progress', 'In Progress', summary.in_progress],
              ['completed', 'Completed', summary.completed],
            ] as Array<[TrackerFilter, string, number]>).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  filter === value
                    ? 'border-sky-300 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {scope === 'with_sessions' && (
            <p className="mt-3 text-xs text-slate-500">
              Showing {scopedParents.length} parents with sessions in {formatMonthKey(selectedMonth)}.
              This scope uses the canonical parent-month attendance read model and does not scan raw class sessions.
            </p>
          )}

          <div className="mt-3 relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              aria-label="Search monthly tracker parents"
              className="pl-9"
              placeholder="Search parent..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mt-3 max-h-[430px] overflow-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Parent</th>
                  <th className="px-3 py-2 font-medium">Sessions</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleParents.map((parent) => {
                  const status = statusFor(parent.id);
                  const saved = progress[parent.id];
                  const saving = savingParentId === parent.id;
                  return (
                    <tr key={parent.id} className="border-t">
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        <button
                          type="button"
                          className="text-left hover:text-sky-700 hover:underline"
                          disabled={disabled || saving}
                          onClick={() => void openParent(parent.id)}
                        >
                          {parent.label}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-slate-600">
                        {sessionCountByParent[parent.id] ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {saved?.completedAt
                          ? `Completed ${formatUpdatedAt(saved.completedAt)}`
                          : formatUpdatedAt(saved?.updatedAt ?? null) || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={status === 'completed' ? 'outline' : 'default'}
                          disabled={disabled || saving}
                          onClick={() => void openParent(parent.id)}
                        >
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {status === 'not_started'
                            ? 'Start'
                            : status === 'in_progress'
                              ? 'Continue'
                              : 'Open'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {visibleParents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">
                      No parents match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Starting a parent moves the review to In Progress. Complete or reopen the review from the parent review page.
          </p>
        </>
      )}
    </Card>
  );
}
