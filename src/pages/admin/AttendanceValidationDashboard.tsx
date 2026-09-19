import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebaseConfig';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';

export const AV6_CASE_READ_LIMIT = 100;
export const AV6_VALIDATION_START_YMD = '2026-09-01';

type Av6Classification =
  | 'VERIFIED'
  | 'MISSING_ATTENDANCE'
  | 'ATTENDANCE_CONFLICT'
  | 'POSSIBLE_FALSE_PRESENT'
  | 'MISSING_TEAMS_EVIDENCE'
  | 'ORPHAN_TEAMS_CLASS'
  | 'AMBIGUOUS';

type Av6ValidationDecision = 'present' | 'absent' | 'review' | null;
type Av6ResolutionStatus = 'verified' | 'needs_review';

interface Av6ValidationCase {
  id: string;
  runId: string | null;
  evidenceId: string | null;
  observedAt: string | null;
  classSessionId: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  tinyStepsAttendance: 'present' | 'absent' | 'rescheduled' | null;
  validationDecision: Av6ValidationDecision;
  classification: Av6Classification;
  recommendedAction:
    | 'none'
    | 'review'
    | 'correct_to_present'
    | 'correct_to_absent';
  resolutionStatus: Av6ResolutionStatus;
  reasons: string[];
  sourceClassificationReasons: string[];
  proofIssues: string[];
  identityIssues: string[];
  staffRegistryIssues: string[];
  inputFingerprint: string | null;
}

const CLASSIFICATION_OPTIONS: Array<{ value: 'all' | Av6Classification; label: string }> = [
  { value: 'all', label: 'All classifications' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'MISSING_ATTENDANCE', label: 'Missing attendance' },
  { value: 'ATTENDANCE_CONFLICT', label: 'Attendance conflict' },
  { value: 'POSSIBLE_FALSE_PRESENT', label: 'Possible false present' },
  { value: 'MISSING_TEAMS_EVIDENCE', label: 'Missing Teams evidence' },
  { value: 'ORPHAN_TEAMS_CLASS', label: 'Orphan Teams class' },
  { value: 'AMBIGUOUS', label: 'Ambiguous' },
];

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeClassification(value: unknown): Av6Classification {
  const normalized = asText(value);
  const allowed: Av6Classification[] = [
    'VERIFIED',
    'MISSING_ATTENDANCE',
    'ATTENDANCE_CONFLICT',
    'POSSIBLE_FALSE_PRESENT',
    'MISSING_TEAMS_EVIDENCE',
    'ORPHAN_TEAMS_CLASS',
    'AMBIGUOUS',
  ];
  return allowed.includes(normalized as Av6Classification)
    ? (normalized as Av6Classification)
    : 'AMBIGUOUS';
}

function normalizeCase(id: string, raw: Record<string, unknown>): Av6ValidationCase {
  const tinyStepsAttendance = asText(raw.tinyStepsAttendance);
  const validationDecision = asText(raw.validationDecision);
  const recommendedAction = asText(raw.recommendedAction);
  const resolutionStatus = asText(raw.resolutionStatus);

  return {
    id,
    runId: asText(raw.runId),
    evidenceId: asText(raw.evidenceId),
    observedAt: asText(raw.observedAt),
    classSessionId: asText(raw.classSessionId),
    enrollmentId: asText(raw.enrollmentId),
    kidId: asText(raw.kidId),
    teacherId: asText(raw.teacherId),
    tinyStepsAttendance:
      tinyStepsAttendance === 'present'
      || tinyStepsAttendance === 'absent'
      || tinyStepsAttendance === 'rescheduled'
        ? tinyStepsAttendance
        : null,
    validationDecision:
      validationDecision === 'present'
      || validationDecision === 'absent'
      || validationDecision === 'review'
        ? validationDecision
        : null,
    classification: normalizeClassification(raw.classification),
    recommendedAction:
      recommendedAction === 'none'
      || recommendedAction === 'review'
      || recommendedAction === 'correct_to_present'
      || recommendedAction === 'correct_to_absent'
        ? recommendedAction
        : 'review',
    resolutionStatus: resolutionStatus === 'verified' ? 'verified' : 'needs_review',
    reasons: asTextArray(raw.reasons),
    sourceClassificationReasons: asTextArray(raw.sourceClassificationReasons),
    proofIssues: asTextArray(raw.proofIssues),
    identityIssues: asTextArray(raw.identityIssues),
    staffRegistryIssues: asTextArray(raw.staffRegistryIssues),
    inputFingerprint: asText(raw.inputFingerprint),
  };
}

function formatObservedAt(value: string | null): string {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function classificationTone(classification: Av6Classification): string {
  switch (classification) {
    case 'VERIFIED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'POSSIBLE_FALSE_PRESENT':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'ATTENDANCE_CONFLICT':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'MISSING_ATTENDANCE':
      return 'border-orange-200 bg-orange-50 text-orange-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function humanize(value: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function issueSummary(item: Av6ValidationCase): string[] {
  return [
    ...item.reasons,
    ...item.sourceClassificationReasons,
    ...item.proofIssues,
    ...item.identityIssues,
    ...item.staffRegistryIssues,
  ].filter((value, index, all) => all.indexOf(value) === index);
}

export default function AttendanceValidationDashboard() {
  const [cases, setCases] = useState<Av6ValidationCase[]>([]);
  const [classificationFilter, setClassificationFilter] = useState<'all' | Av6Classification>('all');
  const [search, setSearch] = useState('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const loadCases = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const casesQuery = query(
        collection(db, 'attendanceValidationCases'),
        orderBy('observedAt', 'desc'),
        limit(AV6_CASE_READ_LIMIT),
      );
      const snapshot = await getDocs(casesQuery);
      setCases(
        snapshot.docs.map((docSnapshot) =>
          normalizeCase(
            docSnapshot.id,
            docSnapshot.data() as Record<string, unknown>,
          )),
      );
      setLoadedAt(new Date());
    } catch (loadError) {
      console.error('[AV6] Failed to load attendance validation cases', loadError);
      setError('Unable to load attendance validation cases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCases(false);
  }, [loadCases]);

  const summary = useMemo(() => {
    const verified = cases.filter((item) => item.classification === 'VERIFIED').length;
    const needsReview = cases.length - verified;
    const possibleFalsePresent = cases.filter(
      (item) => item.classification === 'POSSIBLE_FALSE_PRESENT',
    ).length;
    const conflicts = cases.filter(
      (item) => item.classification === 'ATTENDANCE_CONFLICT',
    ).length;

    return { verified, needsReview, possibleFalsePresent, conflicts };
  }, [cases]);

  const visibleCases = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return cases.filter((item) => {
      if (
        classificationFilter !== 'all'
        && item.classification !== classificationFilter
      ) {
        return false;
      }

      if (!normalizedSearch) return true;
      return [
        item.id,
        item.classSessionId,
        item.enrollmentId,
        item.kidId,
        item.teacherId,
        item.evidenceId,
        item.runId,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [cases, classificationFilter, search]);

  return (
    <div className="space-y-4">
      <Card className="border-sky-200 bg-sky-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-sky-700" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Attendance Validation
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                Read-only AVS shadow cases from {AV6_VALIDATION_START_YMD} onward.
                No attendance or financial correction can be made from this screen.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                One-shot bounded read: latest {AV6_CASE_READ_LIMIT} cases maximum.
                No realtime listener and no user, student, enrollment, billing, or earnings lookups.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCases(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Loaded window
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{cases.length}</p>
          <p className="text-xs text-slate-500">Max {AV6_CASE_READ_LIMIT}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Verified
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.verified}</p>
          <p className="text-xs text-slate-500">Within loaded window</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Needs review
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{summary.needsReview}</p>
          <p className="text-xs text-slate-500">
            {summary.conflicts} attendance conflicts
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Possible false present
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-700">
            {summary.possibleFalsePresent}
          </p>
          <p className="text-xs text-slate-500">Review only</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by session, enrollment, kid, teacher, evidence, or run ID"
          />
          <select
            value={classificationFilter}
            onChange={(event) =>
              setClassificationFilter(event.target.value as 'all' | Av6Classification)
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by validation classification"
          >
            {CLASSIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loadedAt && (
          <p className="mt-2 text-xs text-slate-500">
            Last loaded {formatObservedAt(loadedAt.toISOString())}. Refresh is manual to control Firestore reads.
          </p>
        )}
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading attendance validation cases…
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 font-medium text-slate-700">No validation cases loaded</p>
            <p className="mt-1 text-sm text-slate-500">
              AV5.3 is available in the codebase, but a production shadow workload is not activated yet.
            </p>
          </div>
        ) : visibleCases.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No cases match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Observed</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Tiny Steps</TableHead>
                  <TableHead>AVS</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCases.map((item) => {
                  const issues = issueSummary(item);
                  const expanded = expandedCaseId === item.id;

                  return (
                    <TableRow key={item.id} className="align-top">
                      <TableCell className="min-w-[150px] text-xs text-slate-600">
                        {formatObservedAt(item.observedAt)}
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="font-mono text-xs text-slate-800">
                          {item.classSessionId || item.id}
                        </div>
                        {expanded && (
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <div>Enrollment: {item.enrollmentId || '—'}</div>
                            <div>Kid: {item.kidId || '—'}</div>
                            <div>Teacher: {item.teacherId || '—'}</div>
                            <div>Evidence: {item.evidenceId || '—'}</div>
                            <div>Run: {item.runId || '—'}</div>
                            <div>
                              Fingerprint: {item.inputFingerprint?.slice(0, 16) || '—'}
                            </div>
                            {issues.length > 0 && (
                              <div className="pt-1">
                                <div className="font-medium text-slate-700">Signals</div>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                  {issues.map((issue) => (
                                    <li key={issue}>{humanize(issue)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">
                        {humanize(item.tinyStepsAttendance)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {humanize(item.validationDecision)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={classificationTone(item.classification)}
                        >
                          {humanize(item.classification)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{humanize(item.recommendedAction)}</div>
                        <div className="text-xs text-slate-500">
                          {humanize(item.resolutionStatus)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedCaseId(expanded ? null : item.id)
                          }
                        >
                          {expanded ? 'Hide' : 'Inspect'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
