import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  groupPersistedAvsBusinessOutcomes,
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
  classSessionId: string | null;
  businessOutcome: AvsBusinessOutcome | null;
  teamsSupportedPresentCount: number | null;
  tinyStepsPresentCount: number | null;
  businessDifferenceCount: number | null;
  sameDayEvidenceEvaluable: boolean | null;
  reasons: string[];
  sourceClassificationReasons: string[];
  proofIssues: string[];
  identityIssues: string[];
  staffRegistryIssues: string[];
  resolutionDecision?: string | null;
  manualVerificationReason?: string | null;
  sourceBusinessOutcome?: AvsBusinessOutcome | null;
  sameDayCoverageSeconds?: number | null;
  sameDayRequiredOverlapSeconds?: number | null;
}

interface Props {
  cases: AttendanceValidationBusinessCase[];
  returnTo?: string;
  onRecheck?: (item: AttendanceValidationBusinessCase) => Promise<void>;
  onRefetch?: (item: AttendanceValidationBusinessCase) => Promise<void>;
  onVerify?: (item: AttendanceValidationBusinessCase, reason: string) => Promise<void>;
}

type OperatorBusinessOutcome = Exclude<AvsBusinessOutcome, 'not_evaluable'>;
type VerifiedFilter = 'all' | 'present_match' | 'zero_match' | 'admin';

const BUSINESS_TABS: Array<{
  value: OperatorBusinessOutcome;
  label: string;
}> = [
  { value: 'verified', label: 'Verified' },
  { value: 'false_present', label: 'False Present' },
  { value: 'false_absent', label: 'False Absent' },
];

function isOperatorBusinessOutcome(
  outcome: AvsBusinessOutcome,
): outcome is OperatorBusinessOutcome {
  return outcome === 'verified'
    || outcome === 'false_present'
    || outcome === 'false_absent';
}

function humanize(value: string | null): string {
  if (!value) return 'Not marked';
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

function outcomeTone(outcome: AvsBusinessOutcome): string {
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

export default function AttendanceValidationBusinessView({ cases, returnTo, onRecheck, onRefetch, onVerify }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] =
    useState<OperatorBusinessOutcome>('verified');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const groups = useMemo(
    () => groupPersistedAvsBusinessOutcomes(cases),
    [cases],
  );

  const operatorGroups = useMemo(
    () => groups.filter((group) => isOperatorBusinessOutcome(group.outcome)),
    [groups],
  );
  const technicalGroups = useMemo(() => groups.filter((group) => group.outcome === 'not_evaluable'), [groups]);

  const teacherOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const group of operatorGroups) {
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
  }, [operatorGroups]);

  const teacherScopedGroups = useMemo(() => {
    if (teacherFilter === 'all') return operatorGroups;
    return operatorGroups.filter((group) =>
      teacherFilterKey(group.teacherId, group.teacherName) === teacherFilter);
  }, [operatorGroups, teacherFilter]);

  const tabCounts = useMemo(() => ({
    verified: teacherScopedGroups.filter(
      (group) => group.outcome === 'verified',
    ).length,
    false_present: teacherScopedGroups.filter(
      (group) => group.outcome === 'false_present',
    ).length,
    false_absent: teacherScopedGroups.filter(
      (group) => group.outcome === 'false_absent',
    ).length,
  }), [teacherScopedGroups]);

  const verifiedCounts = useMemo(() => ({
    present_match: teacherScopedGroups.filter(
      (group) => group.outcome === 'verified' && group.verifiedCategory === 'present_match',
    ).length,
    zero_match: teacherScopedGroups.filter(
      (group) => group.outcome === 'verified' && group.verifiedCategory === 'zero_match',
    ).length,
    admin: teacherScopedGroups.filter(
      (group) => group.outcome === 'verified' && group.verifiedCategory === 'admin',
    ).length,
  }), [teacherScopedGroups]);

  const visibleGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (showTechnical ? technicalGroups : teacherScopedGroups).filter((group) => {
      if (!showTechnical && group.outcome !== activeTab) return false;
      if (
        !showTechnical
        && activeTab === 'verified'
        && verifiedFilter !== 'all'
        && group.verifiedCategory !== verifiedFilter
      ) return false;
      if (!normalizedSearch) return true;

      return [
        group.serviceDateYmd,
        group.studentName,
        group.teacherName,
        group.enrollmentId,
        group.kidId,
        group.teacherId,
        ...group.cases.map((item) => item.classSessionId || item.id),
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [activeTab, search, teacherScopedGroups, technicalGroups, showTechnical, verifiedFilter]);

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try { await action(); } finally { setBusyId(null); }
  };

  const openAttendanceCorrection = (
    item: AttendanceValidationBusinessCase,
    newStatus: 'present' | 'absent',
  ) => {
    if (!item.classSessionId || !item.kidId) return;

    const params = new URLSearchParams();
    params.set('tab', 'attendance-corrections');
    params.set('avsAdmin', '1');
    params.set('sessionId', item.classSessionId);
    params.set('kidId', item.kidId);
    if (item.enrollmentId) params.set('enrollmentId', item.enrollmentId);
    params.set('newStatus', newStatus);
    if (returnTo) params.set('avsReturn', returnTo);
    navigate(`/surya?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
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
                setShowTechnical(false);
                setActiveTab(tab.value);
                setVerifiedFilter('all');
                setExpandedKey(null);
              }}
              className="shrink-0"
            >
              {tab.label} ({tabCounts[tab.value]})
            </Button>
          );
        })}
      </div>

      {activeTab === 'verified' && !showTechnical && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={verifiedFilter === 'all' ? 'secondary' : 'outline'}
            onClick={() => { setVerifiedFilter('all'); setExpandedKey(null); }}>
            All Verified ({tabCounts.verified})
          </Button>
          <Button type="button" size="sm" variant={verifiedFilter === 'present_match' ? 'secondary' : 'outline'}
            onClick={() => { setVerifiedFilter('present_match'); setExpandedKey(null); }}>
            Present Match ({verifiedCounts.present_match})
          </Button>
          <Button type="button" size="sm" variant={verifiedFilter === 'zero_match' ? 'secondary' : 'outline'}
            onClick={() => { setVerifiedFilter('zero_match'); setExpandedKey(null); }}>
            Zero Match ({verifiedCounts.zero_match})
          </Button>
          {verifiedCounts.admin > 0 && (
            <Button type="button" size="sm" variant={verifiedFilter === 'admin' ? 'secondary' : 'outline'}
              onClick={() => { setVerifiedFilter('admin'); setExpandedKey(null); }}>
              Admin Verified ({verifiedCounts.admin})
            </Button>
          )}
        </div>
      )}

      {technicalGroups.length > 0 && (
        <button type="button" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
          onClick={() => { setShowTechnical((value) => !value); setExpandedKey(null); }}>
          Unresolved technical cases: {technicalGroups.length} groups · {technicalGroups.reduce((count, group) => count + group.cases.length, 0)} cases
          {showTechnical ? ' · Hide' : ' · Inspect'}
        </button>
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
              <SelectItem value="all">All teachers ({teacherOptions.length})</SelectItem>
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
            placeholder="Search student, teacher, date, or session"
          />
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
          No results in this tab for the selected teacher/search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-center">Teams Present</TableHead>
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
                  ? `${group.differenceCount} extra Present`
                  : group.outcome === 'false_absent'
                    ? `${group.differenceCount} missing Present`
                  : group.outcome === 'not_evaluable' ? 'Needs technical review' : 'Matched';

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
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="font-medium text-slate-900">
                          {group.teacherName || 'Teacher name unavailable'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-base font-semibold">
                        {group.teamsSupportedPresentCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-center text-base font-semibold">
                        {group.tinyStepsPresentCount ?? '—'}
                      </TableCell>
                      <TableCell>{differenceText}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={outcomeTone(group.outcome)}
                        >
                          {group.manualVerified ? 'Verified · Admin' : humanize(group.outcome)}
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
                          <div className="space-y-2 p-2 text-xs text-slate-600">
                            {(() => {
                              const overlapSeconds = group.cases
                                .map((item) => item.sameDayCoverageSeconds)
                                .find((value): value is number => typeof value === 'number' && Number.isFinite(value));
                              if (group.outcome === 'not_evaluable') return null;
                              return (
                                <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                  <span className="font-medium text-slate-800">
                                    Teams summary: {group.teamsSupportedPresentCount ?? 0} Present
                                  </span>
                                  {overlapSeconds !== undefined && (
                                    <span> · {Math.round(overlapSeconds / 60)} min verified overlap</span>
                                  )}
                                  {group.outcome === 'false_absent' && (
                                    <div className="mt-1 font-medium text-orange-700">
                                      Tiny Steps has {group.tinyStepsPresentCount ?? 0} Present.
                                      {' '}Choose {group.differenceCount} row{group.differenceCount === 1 ? '' : 's'} below to mark Present.
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {group.cases.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <span className="font-mono text-slate-800">
                                    {item.classSessionId || item.id}
                                  </span>
                                  {' '}· Tiny Steps: <span className="font-medium">
                                    {humanize(item.tinyStepsAttendance)}
                                  </span>
                                  {group.outcome === 'not_evaluable' && (
                                    <div className="mt-1 text-amber-800">{[
                                      ...item.reasons, ...item.proofIssues, ...item.identityIssues,
                                      ...item.staffRegistryIssues,
                                    ].join(', ') || 'Sibling outcomes or saved counts disagree; recheck this group.'}</div>
                                  )}
                                  {group.manualVerified && (
                                    <div className="mt-1">Source: {humanize(item.sourceBusinessOutcome ?? null)} · Teams Present: {item.teamsSupportedPresentCount ?? '—'} · Tiny Steps Present: {item.tinyStepsPresentCount ?? '—'}
                                      {item.sameDayCoverageSeconds !== null && item.sameDayCoverageSeconds !== undefined
                                        ? ` · Teams overlap: ${Math.round(item.sameDayCoverageSeconds / 60)} minutes` : ''}
                                      {item.sameDayRequiredOverlapSeconds !== null && item.sameDayRequiredOverlapSeconds !== undefined
                                        ? ` · Threshold: ${Math.round(item.sameDayRequiredOverlapSeconds / 60)} minutes` : ''}
                                      <div>Admin override reason: {item.manualVerificationReason}</div>
                                    </div>
                                  )}
                                </div>

                                {group.outcome !== 'verified' && item.classSessionId && item.kidId && (
                                  <div className="flex shrink-0 gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={item.tinyStepsAttendance === 'present'}
                                      onClick={() => openAttendanceCorrection(item, 'present')}
                                    >
                                      Mark Present
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={item.tinyStepsAttendance === 'absent'}
                                      onClick={() => openAttendanceCorrection(item, 'absent')}
                                    >
                                      Mark Absent
                                    </Button>
                                  </div>
                                )}
                                {item.classSessionId && item.kidId && (
                                  <div className="flex flex-wrap gap-2">
                                    {onRecheck && <Button type="button" size="sm" variant="outline" disabled={busyId !== null}
                                      onClick={() => void runAction(item.id, () => onRecheck(item))}>Refresh Tiny Steps</Button>}
                                    {onRefetch && <Button type="button" size="sm" variant="outline" disabled={busyId !== null}
                                      onClick={() => void runAction(item.id, () => onRefetch(item))}>Advanced: Re-fetch Teams Evidence</Button>}
                                  </div>
                                )}
                              </div>
                            ))}
                            {onVerify && (group.outcome === 'false_present' || group.outcome === 'false_absent') && group.cases[0]?.classSessionId && (
                              <Button type="button" size="sm" disabled={busyId !== null} onClick={() => {
                                const reason = window.prompt('Reason for admin verification (5–500 characters):')?.trim();
                                if (reason) void runAction(group.key, () => onVerify(group.cases[0], reason));
                              }}>Mark Verified</Button>
                            )}
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
