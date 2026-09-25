import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import {
  reconcileAvsBusinessGroups,
  type AvsBusinessOutcome,
} from '../../../lib/attendanceValidationBusinessReconciliation';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';

export interface AttendanceValidationBusinessCase {
  id: string;
  serviceDateYmd: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName: string | null;
  teacherName: string | null;
  tinyStepsAttendance: 'present' | 'absent' | 'rescheduled' | null;
  validationDecision: 'present' | 'absent' | 'not_occurred' | 'review' | null;
  classification: string;
  recommendedAction:
    | 'none'
    | 'review'
    | 'correct_to_present'
    | 'correct_to_absent';
  resolutionStatus: 'verified' | 'needs_review' | 'resolved';
  reasons: string[];
  sourceClassificationReasons: string[];
  proofIssues: string[];
  identityIssues: string[];
  staffRegistryIssues: string[];
  sameDayCoverageSeconds: number | null;
  sameDayPresentSessionCount: number | null;
  sameDayOccurrenceCount: number | null;
  classSessionId: string | null;
  evidenceId: string | null;
  inputFingerprint: string | null;
}

interface Props {
  cases: AttendanceValidationBusinessCase[];
  actionsDisabled: boolean;
  reFetchingCaseId: string | null;
  onReviewCorrection: (item: AttendanceValidationBusinessCase) => void;
  onReFetchCase: (item: AttendanceValidationBusinessCase) => void;
}

const BUSINESS_TABS: Array<{
  value: Exclude<AvsBusinessOutcome, 'unresolved'>;
  label: string;
}> = [
  { value: 'verified', label: 'Verified' },
  { value: 'false_present', label: 'False Present' },
  { value: 'false_absent', label: 'False Absent' },
];

function humanize(value: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function formatServiceDate(value: string | null): string {
  if (!value) return 'Unknown date';
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function formatDurationSeconds(value: number | null): string {
  if (value === null) return '—';
  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function groupTone(outcome: AvsBusinessOutcome): string {
  if (outcome === 'verified') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (outcome === 'false_present') {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  if (outcome === 'false_absent') {
    return 'border-orange-200 bg-orange-50 text-orange-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function teacherFilterKey(
  teacherId: string | null,
  teacherName: string | null,
): string | null {
  if (teacherId) return `id:${teacherId}`;
  if (teacherName) return `name:${teacherName.toLowerCase()}`;
  return null;
}

function uniqueSignals(item: AttendanceValidationBusinessCase): string[] {
  return [
    ...item.reasons,
    ...item.sourceClassificationReasons,
    ...item.proofIssues,
    ...item.identityIssues,
    ...item.staffRegistryIssues,
  ].filter((value, index, all) => all.indexOf(value) === index);
}

export default function AttendanceValidationBusinessView({
  cases,
  actionsDisabled,
  reFetchingCaseId,
  onReviewCorrection,
  onReFetchCase,
}: Props) {
  const [activeTab, setActiveTab] =
    useState<Exclude<AvsBusinessOutcome, 'unresolved'>>('verified');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const groups = useMemo(() => reconcileAvsBusinessGroups(cases), [cases]);

  const teacherOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const group of groups) {
      const key = teacherFilterKey(group.teacherId, group.teacherName);
      if (!key) continue;
      const current = counts.get(key);
      counts.set(key, {
        label:
          group.teacherName
          || (group.teacherId
            ? `Teacher ${group.teacherId.slice(0, 8)}…`
            : 'Teacher unavailable'),
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...counts.entries()]
      .map(([value, meta]) => ({ value, ...meta }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groups]);

  const teacherScopedGroups = useMemo(() => {
    if (teacherFilter === 'all') return groups;
    return groups.filter((group) =>
      teacherFilterKey(group.teacherId, group.teacherName) === teacherFilter);
  }, [groups, teacherFilter]);

  const unresolvedGroups = useMemo(
    () => teacherScopedGroups.filter((group) => group.outcome === 'unresolved'),
    [teacherScopedGroups],
  );

  const tabCounts = useMemo(() => {
    const result = {
      verified: 0,
      false_present: 0,
      false_absent: 0,
    };
    for (const group of teacherScopedGroups) {
      if (group.outcome === 'verified') result.verified += 1;
      if (group.outcome === 'false_present') result.false_present += 1;
      if (group.outcome === 'false_absent') result.false_absent += 1;
    }
    return result;
  }, [teacherScopedGroups]);

  const discrepancyCounts = useMemo(() => ({
    falsePresent: teacherScopedGroups.reduce(
      (sum, group) => sum + group.falsePresentCount,
      0,
    ),
    falseAbsent: teacherScopedGroups.reduce(
      (sum, group) => sum + group.falseAbsentCount,
      0,
    ),
  }), [teacherScopedGroups]);

  const visibleGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return teacherScopedGroups.filter((group) => {
      if (group.outcome !== activeTab) return false;
      if (!normalizedSearch) return true;

      return [
        group.serviceDateYmd,
        group.studentName,
        group.teacherName,
        group.enrollmentId,
        group.kidId,
        group.teacherId,
        ...group.cases.flatMap((item) => [
          item.id,
          item.classSessionId,
          item.evidenceId,
        ]),
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [activeTab, search, teacherScopedGroups]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Verified
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {tabCounts.verified}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Student/day groups with no Present-count discrepancy.
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-red-700">
            False Present
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {discrepancyCounts.falsePresent}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Excess Tiny Steps Present marks beyond Teams-supported attendance.
          </div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-orange-700">
            False Absent
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {discrepancyCounts.falseAbsent}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Teams-supported attendance missing from Tiny Steps Present marks.
          </div>
        </div>
      </div>

      {unresolvedGroups.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-medium">
              {unresolvedGroups.length} evidence-unresolved group{unresolvedGroups.length === 1 ? '' : 's'}.
            </span>
            {' '}They are intentionally excluded from the three business tabs until AVS has enough safe Teams/identity evidence to compare Present counts.
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[280px_1fr]">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-600">Teacher</div>
          <Select
            value={teacherFilter}
            onValueChange={(value) => {
              setTeacherFilter(value);
              setSearch('');
              setExpandedKey(null);
            }}
          >
            <SelectTrigger aria-label="Filter AVS business reconciliation by teacher">
              <SelectValue placeholder="All teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teachers ({groups.length})</SelectItem>
              {teacherOptions.map((teacher) => (
                <SelectItem key={teacher.value} value={teacher.value}>
                  {teacher.label} ({teacher.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-600">Search</div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, teacher, date, enrollment, or session"
          />
        </div>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="AVS business outcomes"
      >
        {BUSINESS_TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTab(tab.value);
                setExpandedKey(null);
              }}
              className="shrink-0"
            >
              {tab.label} ({tabCounts[tab.value]})
            </Button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
          No loaded reconciliation groups match this tab, teacher, or search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-center">Teams supported</TableHead>
                <TableHead className="text-center">Tiny Steps Present</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleGroups.map((group) => {
                const expanded = expandedKey === group.key;
                const differenceText = group.outcome === 'false_present'
                  ? `${group.falsePresentCount} excess Present`
                  : group.outcome === 'false_absent'
                    ? `${group.falseAbsentCount} missing Present`
                    : 'Aligned';

                return (
                  <Fragment key={group.key}>
                    <TableRow className="align-top">
                      <TableCell className="min-w-[130px] font-medium text-slate-900">
                        {formatServiceDate(group.serviceDateYmd)}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="font-medium text-slate-900">
                          {group.studentName || 'Student name unavailable'}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {group.kidId || 'No kid ID'}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="font-medium text-slate-900">
                          {group.teacherName || 'Teacher name unavailable'}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {group.teacherId || 'No teacher ID'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-base font-semibold">
                        {group.teamsSupportedPresentCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-center text-base font-semibold">
                        {group.tinyStepsPresentCount}
                      </TableCell>
                      <TableCell>{differenceText}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={groupTone(group.outcome)}
                        >
                          {humanize(group.outcome)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedKey(expanded ? null : group.key)}
                        >
                          {expanded ? (
                            <ChevronUp className="mr-1 h-4 w-4" />
                          ) : (
                            <ChevronDown className="mr-1 h-4 w-4" />
                          )}
                          {expanded ? 'Hide' : 'Inspect'}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-slate-50">
                          <div className="space-y-3 p-2">
                            <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                              <div>
                                <span className="font-medium text-slate-700">Same-day Teams overlap:</span>
                                {' '}{formatDurationSeconds(group.sameDayCoverageSeconds)}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Teams occurrences:</span>
                                {' '}{group.sameDayOccurrenceCount ?? '—'}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Underlying Tiny Steps rows:</span>
                                {' '}{group.cases.length}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {group.cases.map((item) => {
                                const signals = uniqueSignals(item);
                                const canReviewCorrection =
                                  item.resolutionStatus === 'needs_review'
                                  && (item.recommendedAction === 'correct_to_present'
                                    || item.recommendedAction === 'correct_to_absent')
                                  && item.classSessionId
                                  && item.kidId
                                  && item.inputFingerprint;
                                const canReFetch =
                                  item.classSessionId === item.id
                                  && item.evidenceId
                                  && item.inputFingerprint
                                  && !item.reasons.includes('evidence_document_missing');

                                return (
                                  <div
                                    key={item.id}
                                    className="rounded-md border border-slate-200 bg-white p-3"
                                  >
                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="space-y-1 text-xs text-slate-600">
                                        <div className="font-mono text-slate-800">
                                          {item.classSessionId || item.id}
                                        </div>
                                        <div>
                                          Tiny Steps: <span className="font-medium">{humanize(item.tinyStepsAttendance)}</span>
                                          {' '}· AVS: <span className="font-medium">{humanize(item.validationDecision)}</span>
                                          {' '}· Internal: <span className="font-medium">{humanize(item.classification)}</span>
                                        </div>
                                        {signals.length > 0 && (
                                          <div>
                                            Signals: {signals.map(humanize).join(', ')}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        {canReviewCorrection && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => onReviewCorrection(item)}
                                            disabled={actionsDisabled}
                                          >
                                            Review correction
                                          </Button>
                                        )}
                                        {canReFetch && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onReFetchCase(item)}
                                            disabled={actionsDisabled}
                                          >
                                            <RefreshCw
                                              className={`mr-2 h-4 w-4 ${reFetchingCaseId === item.id ? 'animate-spin' : ''}`}
                                            />
                                            {reFetchingCaseId === item.id
                                              ? 'Re-fetching…'
                                              : 'Re-fetch this case'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
