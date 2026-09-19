import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebaseConfig';
import { callFunction } from '../../lib/callFunctions';
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
type Av6ResolutionStatus = 'verified' | 'needs_review' | 'resolved';

interface AvsLatestCheckResponse {
  ok: boolean;
  fromDate: string;
  toDate: string;
  runId?: string | null;
  dirtyFoundCount: number;
  revalidatedCount: number;
  baselineRequiredCount: number;
  baselineRequiredSessionIds: string[];
  skippedCount: number;
  dirtyMarkersClearedCount: number;
  concurrentMarkerChangeDetected?: boolean;
  dirtyBatchAtLimit: boolean;
  graphCalls: number;
  operationalMutationAllowed: false;
  readBudget: {
    dirtyMarkerReads: number;
    validationCaseReads: number;
    av53PointReads: number;
    sharedStaffRegistryLoaded: boolean;
    boundedReadsExcludingStaffRegistry: number;
  };
}

interface AvsFirstTimeBaselineResponse {
  ok: boolean;
  fromDate: string;
  toDate: string;
  rangeId: string;
  alreadyComplete: boolean;
  complete: boolean;
  hasMore?: boolean;
  batchSessionCount: number;
  existingCaseCount: number;
  freshEvidenceCount: number;
  persistedCaseCount?: number;
  skippedCount?: number;
  blockedCount: number;
  blocked: Array<{ sessionId: string; reason: string }>;
  graphLogicalCalls: number;
  operationalMutationAllowed: false;
  cumulative: {
    scannedSessionCount: number;
    existingCaseCount: number;
    freshEvidenceCount: number;
    blockedCount: number;
  };
  readBudget: {
    baselineStateReads: number;
    sessionQueryReads: number;
    validationCaseReads: number;
    teacherUserReads: number;
    organizerEvidenceLookupQueries: number;
    av53PointReads: number;
    sharedStaffRegistryLoaded: boolean;
    boundedReadsExcludingStaffRegistry: number;
  };
}

interface AvsForceFreshResponse {
  ok: boolean;
  caseId: string;
  classSessionId: string;
  evidenceId: string;
  collectionStatus: string;
  issueKinds: string[];
  selectedTranscriptCount: number;
  selectedAttendanceReportCount: number;
  selectedAttendanceRecordCount: number;
  graphLogicalCalls: number;
  operationalMutationAllowed: false;
  dirtyMarkerCleared: boolean;
  concurrentMarkerChangeDetected: boolean;
  readBudget: {
    validationCaseReads: number;
    sessionReads: number;
    previousEvidenceReads: number;
    dirtyMarkerReads: number;
    av53PointReads: number;
    sharedStaffRegistryLoaded: boolean;
    boundedReadsExcludingStaffRegistry: number;
  };
}

interface Av6ValidationCase {
  id: string;
  runId: string | null;
  evidenceId: string | null;
  observedAt: string | null;
  serviceDateYmd: string | null;
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
  resolutionId: string | null;
  attendanceCorrectionId: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
}

const CLASSIFICATION_TABS: Array<{ value: 'all' | Av6Classification; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'MISSING_ATTENDANCE', label: 'Missing attendance' },
  { value: 'ATTENDANCE_CONFLICT', label: 'Conflict' },
  { value: 'POSSIBLE_FALSE_PRESENT', label: 'False present' },
  { value: 'MISSING_TEAMS_EVIDENCE', label: 'Missing Teams' },
  { value: 'ORPHAN_TEAMS_CLASS', label: 'Orphan' },
  { value: 'AMBIGUOUS', label: 'Ambiguous' },
];

function currentIstYmd(): string {
  return new Date(Date.now() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 10);
}

function yesterdayIstYmd(): string {
  const today = currentIstYmd();
  return new Date(
    Date.parse(`${today}T00:00:00.000Z`) - 86_400_000,
  ).toISOString().slice(0, 10);
}

function validDateRange(fromYmd: string, toYmd: string): boolean {
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  return ymd.test(fromYmd)
    && ymd.test(toYmd)
    && fromYmd >= AV6_VALIDATION_START_YMD
    && toYmd >= fromYmd;
}

function inclusiveDateRangeDays(fromYmd: string, toYmd: string): number | null {
  if (!validDateRange(fromYmd, toYmd)) return null;
  const fromMs = Date.parse(`${fromYmd}T00:00:00.000Z`);
  const toMs = Date.parse(`${toYmd}T00:00:00.000Z`);
  return Math.round((toMs - fromMs) / 86_400_000) + 1;
}

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
    serviceDateYmd: asText(raw.serviceDateYmd),
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
    resolutionStatus:
      resolutionStatus === 'verified' || resolutionStatus === 'resolved'
        ? resolutionStatus
        : 'needs_review',
    reasons: asTextArray(raw.reasons),
    sourceClassificationReasons: asTextArray(raw.sourceClassificationReasons),
    proofIssues: asTextArray(raw.proofIssues),
    identityIssues: asTextArray(raw.identityIssues),
    staffRegistryIssues: asTextArray(raw.staffRegistryIssues),
    inputFingerprint: asText(raw.inputFingerprint),
    resolutionId: asText(raw.resolutionId),
    attendanceCorrectionId: asText(raw.attendanceCorrectionId),
    resolvedAt: asText(raw.resolvedAt),
    resolvedByName: asText(raw.resolvedByName),
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
  const navigate = useNavigate();
  const [cases, setCases] = useState<Av6ValidationCase[]>([]);
  const [classificationFilter, setClassificationFilter] = useState<'all' | Av6Classification>('all');
  const [search, setSearch] = useState('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(AV6_VALIDATION_START_YMD);
  const [toDate, setToDate] = useState(currentIstYmd);
  const [loadedRange, setLoadedRange] = useState<{ from: string; to: string } | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [latestCheckRunning, setLatestCheckRunning] = useState(false);
  const [latestCheckResult, setLatestCheckResult] = useState<AvsLatestCheckResponse | null>(null);
  const [latestCheckCompletedAt, setLatestCheckCompletedAt] = useState<Date | null>(null);
  const [baselineRunning, setBaselineRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<AvsFirstTimeBaselineResponse | null>(null);
  const [baselineCompletedAt, setBaselineCompletedAt] = useState<Date | null>(null);
  const [forceFreshCaseId, setForceFreshCaseId] = useState<string | null>(null);
  const [forceFreshResult, setForceFreshResult] = useState<AvsForceFreshResponse | null>(null);
  const [forceFreshCompletedAt, setForceFreshCompletedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const loadSavedCases = useCallback(async (
    append = false,
    preserveCurrentTab = false,
  ) => {
    if (!validDateRange(fromDate, toDate)) {
      setError(
        `Choose a valid date range from ${AV6_VALIDATION_START_YMD} onward.`,
      );
      return;
    }

    if (
      append
      && (
        !cursor
        || !loadedRange
        || loadedRange.from !== fromDate
        || loadedRange.to !== toDate
      )
    ) return;

    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const baseCollection = collection(db, 'attendanceValidationCases');
      const casesQuery = append && cursor
        ? query(
            baseCollection,
            where('serviceDateYmd', '>=', fromDate),
            where('serviceDateYmd', '<=', toDate),
            orderBy('serviceDateYmd', 'desc'),
            startAfter(cursor),
            limit(AV6_CASE_READ_LIMIT),
          )
        : query(
            baseCollection,
            where('serviceDateYmd', '>=', fromDate),
            where('serviceDateYmd', '<=', toDate),
            orderBy('serviceDateYmd', 'desc'),
            limit(AV6_CASE_READ_LIMIT),
          );

      const snapshot = await getDocs(casesQuery);
      const nextCases = snapshot.docs.map((docSnapshot) =>
        normalizeCase(
          docSnapshot.id,
          docSnapshot.data() as Record<string, unknown>,
        ));

      setCases((current) => append ? [...current, ...nextCases] : nextCases);
      setCursor(
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
      );
      setHasMore(snapshot.docs.length === AV6_CASE_READ_LIMIT);
      if (!append) {
        setLoadedRange({ from: fromDate, to: toDate });
        if (!preserveCurrentTab) setClassificationFilter('all');
        setExpandedCaseId(null);
      }
      setLoadedAt(new Date());
    } catch (loadError) {
      console.error('[AV6] Failed to load saved attendance validation cases', loadError);
      setError('Unable to load saved attendance validation results. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, fromDate, loadedRange, toDate]);

  const runLatestCheck = useCallback(async () => {
    if (!validDateRange(fromDate, toDate)) {
      setError(
        `Choose a valid date range from ${AV6_VALIDATION_START_YMD} onward.`,
      );
      return;
    }

    const rangeDays = inclusiveDateRangeDays(fromDate, toDate);
    if (rangeDays === null || rangeDays > 31) {
      setError('Run Latest Check supports a maximum of 31 calendar days at a time.');
      return;
    }

    setLatestCheckRunning(true);
    setError(null);

    try {
      const result = await callFunction<
        AvsLatestCheckResponse,
        { fromDate: string; toDate: string }
      >(
        'runAttendanceValidationLatestCheck',
        { fromDate, toDate },
      );

      setLatestCheckResult(result);
      setLatestCheckCompletedAt(new Date());

      // Reload exactly the same cached range after server-side reconciliation,
      // while preserving the admin's active classification tab.
      await loadSavedCases(false, true);
    } catch (latestCheckError) {
      console.error('[AVS] Latest attendance validation check failed', latestCheckError);
      setError('Latest attendance check failed. Saved results were not changed by the browser.');
    } finally {
      setLatestCheckRunning(false);
    }
  }, [fromDate, loadSavedCases, toDate]);

  const runFirstTimeBaseline = useCallback(async () => {
    if (!validDateRange(fromDate, toDate)) {
      setError(
        `Choose a valid date range from ${AV6_VALIDATION_START_YMD} onward.`,
      );
      return;
    }

    const rangeDays = inclusiveDateRangeDays(fromDate, toDate);
    if (rangeDays === null || rangeDays > 31) {
      setError('First-Time Baseline supports a maximum of 31 calendar days at a time.');
      return;
    }

    if (toDate > yesterdayIstYmd()) {
      setError('First-Time Baseline can include only completed service dates through yesterday IST.');
      return;
    }

    const confirmed = window.confirm(
      'First-Time Baseline may make fresh Microsoft Graph reads for up to 10 class sessions that do not already have saved AVS cases. Existing AVS cases are reused. Continue?',
    );
    if (!confirmed) return;

    setBaselineRunning(true);
    setError(null);

    try {
      const result = await callFunction<
        AvsFirstTimeBaselineResponse,
        { fromDate: string; toDate: string }
      >(
        'runAttendanceValidationFirstTimeBaseline',
        { fromDate, toDate },
      );

      setBaselineResult(result);
      setBaselineCompletedAt(new Date());
      await loadSavedCases(false, true);
    } catch (baselineError) {
      console.error('[AVS] First-Time Baseline failed', baselineError);
      setError('First-Time Baseline failed. No operational attendance or finance was changed.');
    } finally {
      setBaselineRunning(false);
    }
  }, [fromDate, loadSavedCases, toDate]);

  const forceFreshEvidence = useCallback(async (item: Av6ValidationCase) => {
    if (
      !item.inputFingerprint
      || !item.evidenceId
      || !item.classSessionId
      || item.classSessionId !== item.id
    ) {
      setError('Force Fresh Teams Evidence is available only for an existing session-backed AVS case with cached evidence.');
      return;
    }

    const confirmed = window.confirm(
      'Force Fresh Teams Evidence will make new Microsoft Graph reads for this one class and rebuild its AVS case. Continue?',
    );
    if (!confirmed) return;

    setForceFreshCaseId(item.id);
    setError(null);

    try {
      const result = await callFunction<
        AvsForceFreshResponse,
        { caseId: string; inputFingerprint: string }
      >(
        'forceRefreshAttendanceValidationEvidence',
        {
          caseId: item.id,
          inputFingerprint: item.inputFingerprint,
        },
      );

      setForceFreshResult(result);
      setForceFreshCompletedAt(new Date());
      await loadSavedCases(false, true);
    } catch (forceFreshError) {
      console.error('[AVS] Force Fresh Teams Evidence failed', forceFreshError);
      setError('Force Fresh Teams Evidence failed. No operational attendance or finance was changed.');
    } finally {
      setForceFreshCaseId(null);
    }
  }, [loadSavedCases]);

  const summary = useMemo(() => {
    const verified = cases.filter((item) => item.resolutionStatus === 'verified').length;
    const resolved = cases.filter((item) => item.resolutionStatus === 'resolved').length;
    const needsReview = cases.filter((item) => item.resolutionStatus === 'needs_review').length;
    const possibleFalsePresent = cases.filter(
      (item) => item.classification === 'POSSIBLE_FALSE_PRESENT',
    ).length;
    const conflicts = cases.filter(
      (item) => item.classification === 'ATTENDANCE_CONFLICT',
    ).length;

    return { verified, resolved, needsReview, possibleFalsePresent, conflicts };
  }, [cases]);

  const classificationCounts = useMemo(() => {
    const counts: Record<'all' | Av6Classification, number> = {
      all: cases.length,
      VERIFIED: 0,
      MISSING_ATTENDANCE: 0,
      ATTENDANCE_CONFLICT: 0,
      POSSIBLE_FALSE_PRESENT: 0,
      MISSING_TEAMS_EVIDENCE: 0,
      ORPHAN_TEAMS_CLASS: 0,
      AMBIGUOUS: 0,
    };
    for (const item of cases) counts[item.classification] += 1;
    return counts;
  }, [cases]);

  const openApprovedCorrection = useCallback((item: Av6ValidationCase) => {
    if (
      !item.classSessionId
      || !item.kidId
      || !item.inputFingerprint
      || item.resolutionStatus !== 'needs_review'
      || (item.recommendedAction !== 'correct_to_present'
        && item.recommendedAction !== 'correct_to_absent')
    ) {
      return;
    }

    const params = new URLSearchParams();
    params.set('tab', 'attendance-corrections');
    params.set('avsCaseId', item.id);
    params.set('avsFingerprint', item.inputFingerprint);
    params.set('sessionId', item.classSessionId);
    params.set('kidId', item.kidId);
    params.set(
      'newStatus',
      item.recommendedAction === 'correct_to_present' ? 'present' : 'absent',
    );
    navigate(`/surya?${params.toString()}`);
  }, [navigate]);

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
                Saved results load only when requested, in pages of up to {AV6_CASE_READ_LIMIT}.
                No realtime listener and no user, student, enrollment, billing, or earnings lookups.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Nothing refreshes automatically. Choose a range below.
          </div>
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
          <p className="text-xs text-slate-500">
            Within loaded window • {summary.resolved} admin-resolved
          </p>
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
        <div className="grid gap-3 lg:grid-cols-[180px_180px_auto] lg:items-end">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>From</span>
            <Input
              type="date"
              min={AV6_VALIDATION_START_YMD}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>To</span>
            <Input
              type="date"
              min={AV6_VALIDATION_START_YMD}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void loadSavedCases(false, false)}
              disabled={loading || loadingMore || latestCheckRunning || baselineRunning || forceFreshCaseId !== null}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading saved results…' : 'Load Saved Results'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runLatestCheck()}
              disabled={loading || loadingMore || latestCheckRunning || baselineRunning || forceFreshCaseId !== null}
              title="Revalidate only changed sessions using cached Teams evidence."
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${latestCheckRunning ? 'animate-spin' : ''}`}
              />
              {latestCheckRunning ? 'Running latest check…' : 'Run Latest Check'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runFirstTimeBaseline()}
              disabled={
                loading
                || loadingMore
                || latestCheckRunning
                || baselineRunning
                || forceFreshCaseId !== null
                || (
                  baselineResult?.fromDate === fromDate
                  && baselineResult?.toDate === toDate
                  && baselineResult.complete
                )
              }
              title="First-time only: collect fresh Teams evidence for up to 10 sessions without saved AVS cases."
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${baselineRunning ? 'animate-spin' : ''}`}
              />
              {baselineRunning
                ? 'Running baseline…'
                : baselineResult?.fromDate === fromDate
                  && baselineResult?.toDate === toDate
                  && !baselineResult.complete
                  ? 'Continue Baseline'
                  : baselineResult?.fromDate === fromDate
                    && baselineResult?.toDate === toDate
                    && baselineResult.complete
                    ? 'Baseline Complete'
                    : 'Run First-Time Baseline'}
            </Button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Loading saved results reads only cached AVS cases for the selected service-date range.
          Run Latest Check revalidates only changed sessions with cached evidence and makes zero Microsoft Graph calls.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Latest Check is intentionally capped at 31 calendar days per run.
          First-Time Baseline is also capped at 31 days and processes at most 10 session documents per click with fresh Teams evidence only where no saved AVS case exists.
        </p>

        {loadedRange && loadedAt && (
          <p className="mt-1 text-xs text-slate-500">
            Loaded {loadedRange.from} to {loadedRange.to} at {formatObservedAt(loadedAt.toISOString())}.
            Each page reads at most {AV6_CASE_READ_LIMIT} saved cases.
          </p>
        )}
      </Card>

      {baselineResult && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">
                {baselineResult.complete ? 'First-Time Baseline complete' : 'First-Time Baseline batch complete'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                This batch scanned {baselineResult.batchSessionCount} session{baselineResult.batchSessionCount === 1 ? '' : 's'};
                {' '}{baselineResult.existingCaseCount} already had saved AVS cases;
                {' '}{baselineResult.freshEvidenceCount} received fresh Teams evidence;
                {' '}{baselineResult.blockedCount} were routed safely to Missing Teams Evidence.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Microsoft Graph logical calls: {baselineResult.graphLogicalCalls}.
                {' '}Firestore bounded reads: {baselineResult.readBudget.boundedReadsExcludingStaffRegistry}
                {' '}({baselineResult.readBudget.organizerEvidenceLookupQueries} organizer-evidence lookup queries included)
                {baselineResult.readBudget.sharedStaffRegistryLoaded
                  ? ' + one shared staff-registry load'
                  : ''}.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Range progress: {baselineResult.cumulative.scannedSessionCount} session documents scanned,
                {' '}{baselineResult.cumulative.freshEvidenceCount} fresh evidence collections,
                {' '}{baselineResult.cumulative.existingCaseCount} existing cases reused.
              </p>
              {!baselineResult.complete && (
                <p className="mt-2 text-xs font-medium text-blue-800">
                  More sessions remain in this range. Click Continue Baseline to process the next bounded batch.
                </p>
              )}
              {baselineResult.complete && (
                <p className="mt-2 text-xs font-medium text-emerald-800">
                  This date range is baselined. Future attendance corrections should use Run Latest Check; repeating the same baseline will not re-fetch existing cases.
                </p>
              )}
              {baselineResult.blocked.length > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Blocked session IDs: {baselineResult.blocked.map((item) => item.sessionId).join(', ')}.
                </p>
              )}
            </div>
            {baselineCompletedAt && (
              <div className="shrink-0 text-xs text-slate-500">
                {formatObservedAt(baselineCompletedAt.toISOString())}
              </div>
            )}
          </div>
        </Card>
      )}

      {latestCheckResult && (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">Latest Check completed</p>
              <p className="mt-1 text-sm text-slate-700">
                {latestCheckResult.dirtyFoundCount} changed session{latestCheckResult.dirtyFoundCount === 1 ? '' : 's'} found;
                {' '}{latestCheckResult.revalidatedCount} revalidated from cached Teams evidence;
                {' '}{latestCheckResult.baselineRequiredCount} need first-time or fresh Teams evidence.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Firestore bounded reads: {latestCheckResult.readBudget.boundedReadsExcludingStaffRegistry}
                {latestCheckResult.readBudget.sharedStaffRegistryLoaded
                  ? ' + one shared staff-registry load'
                  : ''}.
                {' '}Microsoft Graph calls: {latestCheckResult.graphCalls}.
                {' '}Dirty markers cleared: {latestCheckResult.dirtyMarkersClearedCount}.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Saved results for {latestCheckResult.fromDate} to {latestCheckResult.toDate} were automatically reloaded.
              </p>
              {latestCheckResult.skippedCount > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  {latestCheckResult.skippedCount} changed session{latestCheckResult.skippedCount === 1 ? '' : 's'} were skipped safely and remain available for a later check.
                </p>
              )}
              {latestCheckResult.dirtyBatchAtLimit && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  The 100-session changed-work cap was reached. Run Latest Check again for the same range to process any remaining dirty sessions.
                </p>
              )}
              {latestCheckResult.concurrentMarkerChangeDetected && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Attendance changed again while this check was running. The newer dirty marker was retained; run Latest Check again.
                </p>
              )}
            </div>
            {latestCheckCompletedAt && (
              <div className="shrink-0 text-xs text-slate-500">
                {formatObservedAt(latestCheckCompletedAt.toISOString())}
              </div>
            )}
          </div>
        </Card>
      )}

      {forceFreshResult && (
        <Card className="border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">Force Fresh Teams Evidence completed</p>
              <p className="mt-1 text-sm text-slate-700">
                Session {forceFreshResult.classSessionId} received new Teams evidence and its AVS case was rebuilt.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Evidence status: {humanize(forceFreshResult.collectionStatus)}.
                {' '}Microsoft Graph logical calls: {forceFreshResult.graphLogicalCalls}.
                {' '}Firestore bounded reads: {forceFreshResult.readBudget.boundedReadsExcludingStaffRegistry}
                {' '}+ one shared staff-registry load.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Selected artifacts: {forceFreshResult.selectedAttendanceReportCount} attendance report,
                {' '}{forceFreshResult.selectedAttendanceRecordCount} attendance records,
                {' '}{forceFreshResult.selectedTranscriptCount} transcript metadata record.
              </p>
              {forceFreshResult.issueKinds.length > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Teams evidence reported: {forceFreshResult.issueKinds.map(humanize).join(', ')}.
                </p>
              )}
              {forceFreshResult.concurrentMarkerChangeDetected && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Attendance changed again during the fresh check. The newer dirty marker was retained.
                </p>
              )}
            </div>
            {forceFreshCompletedAt && (
              <div className="shrink-0 text-xs text-slate-500">
                {formatObservedAt(forceFreshCompletedAt.toISOString())}
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search loaded results by session, enrollment, kid, teacher, evidence, or run ID"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Validation classifications">
          {CLASSIFICATION_TABS.map((tab) => {
            const active = classificationFilter === tab.value;
            return (
              <Button
                key={tab.value}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                role="tab"
                aria-selected={active}
                onClick={() => setClassificationFilter(tab.value)}
                className="shrink-0"
              >
                {tab.label} ({classificationCounts[tab.value]})
              </Button>
            );
          })}
        </div>
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
            Loading saved attendance validation results…
          </div>
        ) : !loadedRange ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 font-medium text-slate-700">Choose a date range</p>
            <p className="mt-1 text-sm text-slate-500">
              Click Load Saved Results to read cached AVS cases. Opening this page does not read them automatically.
            </p>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 font-medium text-slate-700">No saved results in this range</p>
            <p className="mt-1 text-sm text-slate-500">
              No cached AVS cases were found for {loadedRange.from} to {loadedRange.to}.
            </p>
          </div>
        ) : visibleCases.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No loaded cases match the current tab or search.
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
                            <div>Service date: {item.serviceDateYmd || '—'}</div>
                            <div>Enrollment: {item.enrollmentId || '—'}</div>
                            <div>Kid: {item.kidId || '—'}</div>
                            <div>Teacher: {item.teacherId || '—'}</div>
                            <div>Evidence: {item.evidenceId || '—'}</div>
                            <div>Run: {item.runId || '—'}</div>
                            <div>
                              Fingerprint: {item.inputFingerprint?.slice(0, 16) || '—'}
                            </div>
                            {item.resolutionId && <div>Resolution: {item.resolutionId}</div>}
                            {item.attendanceCorrectionId && (
                              <div>Correction: {item.attendanceCorrectionId}</div>
                            )}
                            {item.resolvedAt && (
                              <div>
                                Resolved: {formatObservedAt(item.resolvedAt)}
                                {item.resolvedByName ? ` by ${item.resolvedByName}` : ''}
                              </div>
                            )}
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
                        {item.resolutionStatus === 'needs_review'
                          && (item.recommendedAction === 'correct_to_present'
                            || item.recommendedAction === 'correct_to_absent')
                          && item.classSessionId
                          && item.kidId
                          && item.inputFingerprint && (
                            <Button
                              type="button"
                              size="sm"
                              className="mt-2"
                              onClick={() => openApprovedCorrection(item)}
                            >
                              Review correction
                            </Button>
                          )}
                        {item.classSessionId === item.id
                          && item.evidenceId
                          && item.inputFingerprint
                          && !item.reasons.includes('evidence_document_missing') && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full"
                              onClick={() => void forceFreshEvidence(item)}
                              disabled={
                                latestCheckRunning
                                || baselineRunning
                                || loading
                                || loadingMore
                                || forceFreshCaseId !== null
                              }
                              title="Exceptional action: make fresh Microsoft Graph reads for this one class."
                            >
                              <RefreshCw
                                className={`mr-2 h-4 w-4 ${forceFreshCaseId === item.id ? 'animate-spin' : ''}`}
                              />
                              {forceFreshCaseId === item.id
                                ? 'Refreshing Teams…'
                                : 'Force Fresh Teams Evidence'}
                            </Button>
                          )}
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

      {loadedRange
        && loadedRange.from === fromDate
        && loadedRange.to === toDate
        && hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadSavedCases(true, true)}
            disabled={loading || loadingMore || latestCheckRunning || baselineRunning || forceFreshCaseId !== null}
          >
            {loadingMore ? 'Loading more…' : `Load next ${AV6_CASE_READ_LIMIT} saved results`}
          </Button>
        </div>
      )}
    </div>
  );
}
