import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  groupPersistedAvsBusinessOutcomes,
  type AvsBusinessGroup,
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
}

interface Props {
  cases: AttendanceValidationBusinessCase[];
}

const BUSINESS_TABS: Array<{
  value: Exclude<AvsBusinessOutcome, 'not_evaluable'>;
  label: string;
}> = [
  { value: 'verified', label: 'Verified' },
  { value: 'false_present', label: 'False Present' },
  { value: 'false_absent', label: 'False Absent' },
];

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

function technicalIssueLabel(value: string): string {
  switch (value) {
    case 'same_day_identity_not_verified':
      return 'Teacher/learner identity not verified';
    case 'same_day_attendance_evidence_incomplete':
      return 'Teams attendance evidence incomplete';
    case 'evidence_document_missing':
      return 'Teams evidence missing';
    case 'operational_session_reference_mismatch':
      return 'Session/evidence reference mismatch';
    case 'validation_scope_date_unresolved':
      return 'Service date could not be resolved';
    case 'validation_scope_date_conflict':
      return 'Service date sources disagree';
    default:
      return humanize(value);
  }
}

function technicalReasonsForGroup(
  group: AvsBusinessGroup<AttendanceValidationBusinessCase>,
): string[] {
  const raw = group.cases.flatMap((item) => [
    ...item.reasons,
    ...item.sourceClassificationReasons,
    ...item.proofIssues,
    ...item.identityIssues,
    ...item.staffRegistryIssues,
  ]).filter((value) =>
    value && value !== 'business_evidence_not_evaluable');

  const labels = [...new Set(raw.map(technicalIssueLabel))];
  if (labels.length > 0) return labels;

  if (group.cases.some((item) => item.businessOutcome === null)) {
    return ['Business result unavailable'];
  }
  if (new Set(group.cases.map((item) => item.businessOutcome)).size > 1) {
    return ['Session results disagree within this student/day group'];
  }
  return ['Source evidence could not be compared safely'];
}

export default function AttendanceValidationBusinessView({ cases }: Props) {
  const [activeTab, setActiveTab] =
    useState<Exclude<AvsBusinessOutcome, 'not_evaluable'>>('verified');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const groups = useMemo(
    () => groupPersistedAvsBusinessOutcomes(cases),
    [cases],
  );

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

  const notEvaluableGroups = useMemo(
    () => teacherScopedGroups.filter(
      (group) => group.outcome === 'not_evaluable',
    ),
    [teacherScopedGroups],
  );

  const notEvaluableCount = notEvaluableGroups.length;

  const technicalIssueSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of notEvaluableGroups) {
      for (const reason of technicalReasonsForGroup(group)) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) =>
        right.count - left.count || left.reason.localeCompare(right.reason));
  }, [notEvaluableGroups]);

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
        ...group.cases.map((item) => item.classSessionId || item.id),
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [activeTab, search, teacherScopedGroups]);

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

      {notEvaluableCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-medium">
              {notEvaluableCount} group{notEvaluableCount === 1 ? '' : 's'} not evaluated.
            </span>
            {' '}These groups could not be compared safely and are excluded from the three attendance outcomes.
            {technicalIssueSummary.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">
                  Show technical reasons
                </summary>
                <div className="mt-1 space-y-0.5 text-xs">
                  {technicalIssueSummary.map((item) => (
                    <div key={item.reason}>
                      {item.reason}: {item.count} group{item.count === 1 ? '' : 's'}
                    </div>
                  ))}
                </div>
              </details>
            )}
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
                    : 'Matched';

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
                          <div className="space-y-2 p-2 text-xs text-slate-600">
                            {group.cases.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-md border border-slate-200 bg-white p-3"
                              >
                                <span className="font-mono text-slate-800">
                                  {item.classSessionId || item.id}
                                </span>
                                {' '}· Tiny Steps: <span className="font-medium">
                                  {humanize(item.tinyStepsAttendance)}
                                </span>
                              </div>
                            ))}
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
