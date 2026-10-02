import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Loader2, Search } from 'lucide-react';
import type { AvsParentOption } from '../../../lib/attendanceValidationParentScope';
import {
  completedMonthOptions,
  formatMonthKey,
  loadAvsMonthlyParentProgress,
  loadAvsMonthlyParentsWithSessions,
  previousCompletedMonthKey,
  type AvsMonthlyParentProgress,
  type AvsMonthlyParentProgressStatus,
  type AvsMonthlyParentSessionScope,
} from '../../../lib/attendanceValidationMonthlyParentProgress';
import {
  deriveParentMonthCloseNextAction,
  parentMonthCloseNextActionLabel,
  parentMonthClosePaymentLabel,
  type ParentMonthCloseNextAction,
} from '../../../lib/parentMonthClose';
import { callFunction } from '../../../lib/callFunctions';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';

interface Props {
  parents: AvsParentOption[];
  loadParents: () => Promise<AvsParentOption[]>;
  initialMonth?: string;
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

type TrackerFilter =
  | 'all'
  | 'attendance_pending'
  | 'billing_review'
  | 'ready_to_send'
  | 'awaiting_payment'
  | 'partial_payment'
  | 'closed';

type TrackerScope = 'with_sessions' | 'all_parents';

const emptyProgress = (
  parentId: string,
  monthKey: string,
  status: Exclude<AvsMonthlyParentProgressStatus, 'not_started'>,
): AvsMonthlyParentProgress => ({
  parentId,
  monthKey,
  status,
  updatedAt: null,
  completedAt: null,
  billingReviewedAt: null,
  billingReviewedBy: null,
  billingReviewedFingerprint: null,
  invoiceSentAt: null,
  invoiceSentBy: null,
  sentBillingFingerprint: null,
  invoiceSentClassCount: null,
  invoiceSentBilledAmount: null,
  invoiceSentDueAmount: null,
});

function attendanceLabel(status: AvsMonthlyParentProgressStatus): string {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In Progress';
  return 'Not Started';
}

function attendanceClass(status: AvsMonthlyParentProgressStatus): string {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'in_progress') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function bucketFor(action: ParentMonthCloseNextAction): Exclude<TrackerFilter, 'all'> {
  if (action === 'review_attendance' || action === 'continue_attendance') return 'attendance_pending';
  if (action === 'review_billing') return 'billing_review';
  if (action === 'send_invoice' || action === 'send_revised_invoice') return 'ready_to_send';
  if (action === 'partial_payment') return 'partial_payment';
  if (action === 'await_payment') return 'awaiting_payment';
  return 'closed';
}

export default function AttendanceValidationMonthlyTracker({
  parents,
  loadParents,
  initialMonth,
  disabled,
  onOpenParentMonth,
}: Props) {
  const monthOptions = useMemo(() => completedMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth && monthOptions.includes(initialMonth)
      ? initialMonth
      : monthOptions[0] ?? previousCompletedMonthKey(),
  );
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, AvsMonthlyParentProgress>>({});
  const [billingByParent, setBillingByParent] =
    useState<Record<string, AvsMonthlyParentSessionScope>>({});
  const [scope, setScope] = useState<TrackerScope>('with_sessions');
  const [filter, setFilter] = useState<TrackerFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingParentId, setSavingParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusFor = (parentId: string): AvsMonthlyParentProgressStatus =>
    progress[parentId]?.status ?? 'not_started';

  const nextActionFor = (parentId: string): ParentMonthCloseNextAction =>
    deriveParentMonthCloseNextAction({
      progress: progress[parentId] ?? { status: 'not_started' },
      billing: billingByParent[parentId] ?? null,
    });

  const scopedParents = useMemo(() => {
    if (scope === 'all_parents') return parents;
    const includedIds = new Set(Object.keys(billingByParent));
    Object.keys(progress).forEach((parentId) => includedIds.add(parentId));
    return parents.filter((parent) => includedIds.has(parent.id));
  }, [billingByParent, parents, progress, scope]);

  const summary = useMemo(() => {
    const counts = {
      attendance_pending: 0,
      billing_review: 0,
      ready_to_send: 0,
      awaiting_payment: 0,
      partial_payment: 0,
      closed: 0,
    };
    scopedParents.forEach((parent) => {
      counts[bucketFor(nextActionFor(parent.id))] += 1;
    });
    return counts;
  }, [billingByParent, progress, scopedParents]);

  const visibleParents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return scopedParents.filter((parent) => {
      const bucket = bucketFor(nextActionFor(parent.id));
      if (filter !== 'all' && bucket !== filter) return false;
      return !needle || parent.label.toLowerCase().includes(needle);
    });
  }, [billingByParent, filter, progress, scopedParents, search]);

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
      setBillingByParent(Object.fromEntries(
        parentsWithSessions.map((item) => [item.parentId, item]),
      ));
      setLoadedMonth(selectedMonth);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load monthly close tracker.');
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
            ...(current[parentId] ?? emptyProgress(parentId, selectedMonth, result.status)),
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
        : 'Unable to update monthly attendance review status.');
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
            <h3 className="text-base font-semibold text-slate-900">Monthly Close Tracker</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Attendance, billing, invoice communication, and payment are managed as one parent-month workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>Month</span>
            <select
              aria-label="Month close tracker month"
              className="h-10 min-w-[180px] rounded-md border bg-white px-3"
              value={selectedMonth}
              disabled={disabled || loading || savingParentId !== null}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setLoadedMonth(null);
                setProgress({});
                setBillingByParent({});
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
              aria-label="Month close tracker parent scope"
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
              ['attendance_pending', 'Attendance pending', summary.attendance_pending],
              ['billing_review', 'Billing review', summary.billing_review],
              ['ready_to_send', 'Ready to send', summary.ready_to_send],
              ['awaiting_payment', 'Awaiting payment', summary.awaiting_payment],
              ['partial_payment', 'Partial', summary.partial_payment],
              ['closed', 'Closed', summary.closed],
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
              Attendance and finance status reuse the existing canonical parent-month read model.
            </p>
          )}

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              aria-label="Search monthly close parents"
              className="pl-9"
              placeholder="Search parent..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mt-3 max-h-[470px] overflow-auto rounded-lg border">
            <table className="w-full min-w-[1060px] text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Parent</th>
                  <th className="px-3 py-2 font-medium">Classes</th>
                  <th className="px-3 py-2 font-medium">Attendance</th>
                  <th className="px-3 py-2 font-medium">Billing</th>
                  <th className="px-3 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Payment</th>
                  <th className="px-3 py-2 font-medium">Next action</th>
                  <th className="px-3 py-2 text-right font-medium">Open</th>
                </tr>
              </thead>
              <tbody>
                {visibleParents.map((parent) => {
                  const status = statusFor(parent.id);
                  const saved = progress[parent.id];
                  const billing = billingByParent[parent.id] ?? null;
                  const nextAction = nextActionFor(parent.id);
                  const billingCurrent = status === 'completed'
                    && !!billing
                    && !!saved?.billingReviewedAt
                    && saved.billingReviewedFingerprint === billing.fingerprint;
                  const invoiceCurrent = billingCurrent
                    && !!saved?.invoiceSentAt
                    && saved.sentBillingFingerprint === billing?.fingerprint;
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
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">
                        {billing?.billedClassCount || billing?.sessionCount || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${attendanceClass(status)}`}>
                          {attendanceLabel(status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {status !== 'completed' ? '—' : billingCurrent ? 'Reviewed' : 'Review'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {status !== 'completed' || !billingCurrent
                          ? '—'
                          : invoiceCurrent
                            ? 'Sent'
                            : saved?.invoiceSentAt
                              ? 'Revised needed'
                              : 'Ready'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {status === 'completed' ? parentMonthClosePaymentLabel(billing) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-slate-700">
                        {parentMonthCloseNextActionLabel(nextAction)}
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
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                      No parents match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Only essential human decisions are stored: attendance reviewed, billing reviewed, and invoice sent.
            Payment and close status are derived from existing finance data.
          </p>
        </>
      )}
    </Card>
  );
}
