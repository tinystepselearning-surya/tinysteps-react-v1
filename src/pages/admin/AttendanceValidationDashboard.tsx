import { useCallback, useState } from 'react';
import {
  collection,
  documentId,
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
import AttendanceValidationBusinessView from './components/AttendanceValidationBusinessView';
import type { AvsBusinessOutcome } from '../../lib/attendanceValidationBusinessReconciliation';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';

export const AV6_CASE_READ_LIMIT = 100;
export const AV6_VALIDATION_START_YMD = '2026-09-01';

type Av6Classification =
  | 'VERIFIED'
  | 'MISSING_ATTENDANCE'
  | 'ATTENDANCE_CONFLICT'
  | 'POSSIBLE_FALSE_PRESENT'
  | 'NO_CLASS_OCCURRED'
  | 'MISSING_TEAMS_EVIDENCE'
  | 'ORPHAN_TEAMS_CLASS'
  | 'AMBIGUOUS';

type Av6ValidationDecision = 'present' | 'absent' | 'not_occurred' | 'review' | null;
type Av6ResolutionStatus = 'verified' | 'needs_review' | 'resolved';

interface AvsFailureSummary {
  totalCount: number;
  businessReviewCount: number;
  retryableInfrastructureCount: number;
  configurationCount: number;
  authorizationCount: number;
  requestCount: number;
  unknownInfrastructureCount: number;
  retryableCount: number;
  adminActionRequiredCount: number;
  infrastructureFailureCount: number;
  blockingInfrastructureCount: number;
  supplementalIssueCount: number;
  codeCounts: Record<string, number>;
}

interface AvsFailureDescriptor {
  code: string;
  category: string;
  retryDisposition: string;
  retryable: boolean;
  operatorAction: string;
  source: string;
  stage: string | null;
  httpStatus: number | null;
  graphCode: string | null;
  innerCode: string | null;
}

interface AvsUnifiedValidationResponse {
  ok: boolean;
  fromDate: string;
  toDate: string;
  maxSessionsPerInvocation: number;
  processedSessionCount: number;
  dirtyFoundCount: number;
  cachedRevalidatedCount: number;
  staleEvidenceCount: number;
  missingEvidenceCaseCount: number;
  freshnessUnsafeCount: number;
  freshWorkCount: number;
  freshRefreshedCount: number;
  firstEvidenceCollectedCount: number;
  freshFailedCount: number;
  freshOutcomes?: Array<{
    sessionId: string;
    kind: 'stale' | 'missing';
    status: 'refreshed' | 'collected' | 'existing_case' | 'failed' | 'blocked';
    failure: AvsFailureDescriptor | null;
  }>;
  retryableInfrastructureCount: number;
  adminActionRequiredCount: number;
  failureSummary: AvsFailureSummary;
  evidenceIssueSummary: AvsFailureSummary;
  baselineAttempted: boolean;
  baselineComplete: boolean;
  baselineBatchSessionCount: number;
  baselineExistingCaseCount?: number;
  baselineFreshEvidenceCount: number;
  baselinePersistedCaseCount?: number;
  baselineBlockedCount: number;
  graphLogicalCalls: number;
  identityMappingsWritten: number;
  identityClaimsWritten: number;
  concurrentMarkerChangeDetected: boolean;
  hasMore: boolean;
  continueValidation: boolean;
  operationalMutationAllowed: false;
}

interface AvsForceFreshResponse {
  ok: boolean;
  caseId: string;
  classSessionId: string;
  evidenceId: string;
  collectionStatus: string;
  issueKinds: string[];
  issueDetails?: Array<{
    stage: string;
    kind: string;
    httpStatus: number | null;
    graphCode: string | null;
    innerCode: string | null;
    reportId: string | null;
  }>;
  selectedTranscriptCount: number;
  selectedAttendanceReportCount: number;
  selectedAttendanceRecordCount: number;
  graphLogicalCalls: number;
  evidenceIssueSummary: AvsFailureSummary;
  operationalMutationAllowed: false;
  dirtyMarkerCleared: boolean;
  concurrentMarkerChangeDetected: boolean;
  readBudget: {
    validationCaseReads: number;
    sessionReads: number;
    previousEvidenceReads: number;
    dirtyMarkerReads: number;
    av53PointReads: number;
    sameDayContextReads: number;
    sharedStaffRegistryLoaded: boolean;
    boundedReadsExcludingStaffRegistry: number;
  };
}

interface AvsForceFreshRangeResponse {
  ok: boolean;
  fromDate: string;
  toDate: string;
  runId: string;
  generationId: string;
  rangeId: string;
  status: 'in_progress' | 'complete' | 'complete_with_failures';
  mode: 'scan' | 'retry_failed' | 'summary';
  alreadyComplete: boolean;
  complete: boolean;
  completeWithFailures: boolean;
  hasMore: boolean;
  retryableFailures: boolean;
  actionRequiredFailures: boolean;
  retryableFailureCount: number;
  actionRequiredFailureCount: number;
  failureSummary: AvsFailureSummary;
  casesProcessed: number;
  attempted: number;
  refreshed: number;
  skipped: number;
  failed: number;
  currentFailedCases: number;
  checkpointedCasesSkipped: number;
  graphLogicalCalls: number;
  remainingCases: number;
  concurrency: number;
  cumulative: {
    casesProcessed: number;
    attempted: number;
    refreshed: number;
    skipped: number;
    failed: number;
    retryableFailures: number;
    actionRequiredFailures: number;
    graphLogicalCalls: number;
    identityMappingsWritten: number;
    identityClaimsWritten: number;
  };
  operationalMutationAllowed: false;
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
  studentName: string | null;
  teacherName: string | null;
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
  sameDayCoverageSeconds: number | null;
  sameDayPresentSessionCount: number | null;
  sameDayRequiredOverlapSeconds: number | null;
  sameDayOccurrenceCount: number | null;
  sameDayEvidenceEvaluable: boolean | null;
  businessOutcome: AvsBusinessOutcome | null;
  teamsSupportedPresentCount: number | null;
  tinyStepsPresentCount: number | null;
  businessDifferenceCount: number | null;
  inputFingerprint: string | null;
  resolutionId: string | null;
  attendanceCorrectionId: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
}

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

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
}

function finiteCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function formatFailureCodeCounts(codeCounts: Record<string, number>): string {
  return Object.entries(codeCounts)
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([code, count]) => `${code}: ${count}`)
    .join(', ');
}

function formatFreshFailureDiagnostics(
  outcomes: AvsUnifiedValidationResponse['freshOutcomes'],
): string[] {
  return (outcomes ?? [])
    .filter((item) => item.failure)
    .map((item) => {
      const failure = item.failure!;
      const details = [
        failure.stage ? `stage ${failure.stage}` : null,
        failure.httpStatus !== null ? `HTTP ${failure.httpStatus}` : null,
        failure.graphCode ? `Graph ${failure.graphCode}` : null,
        failure.innerCode ? `Inner ${failure.innerCode}` : null,
      ].filter(Boolean);
      return `${item.sessionId}: ${failure.code}${details.length > 0 ? ` · ${details.join(' · ')}` : ''}`;
    });
}

function formatDurationSeconds(value: number | null): string {
  if (value === null) return '—';
  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function safeForceFreshFailureMessage(error: unknown): string {
  const candidate = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : {};
  const details =
    candidate.details && typeof candidate.details === 'object'
      ? candidate.details as Record<string, unknown>
      : {};
  const failure =
    details.failure && typeof details.failure === 'object'
      ? details.failure as Record<string, unknown>
      : {};
  const failureCategory = String(failure.category ?? '');

  if (failure.retryable === true || failureCategory === 'retryable_infrastructure') {
    return 'Temporary Microsoft/AVS infrastructure problem. Retry this action.';
  }
  if (failureCategory === 'configuration') {
    return 'AVS configuration needs attention before this action can succeed.';
  }
  if (failureCategory === 'authorization') {
    return 'Microsoft Graph permissions or access policy need attention before retrying.';
  }
  if (failureCategory === 'request') {
    return 'The AVS case or request state changed. Reload Results and try again.';
  }

  const diagnosticText = [
    candidate.code,
    candidate.message,
    JSON.stringify(candidate.details ?? ''),
  ]
    .map((value) => String(value ?? ''))
    .join(' ');

  if (diagnosticText.includes('organizer_config_invalid')) {
    return 'Re-fetch stopped before Microsoft Graph: the canonical Teams organizer configuration is invalid.';
  }
  if (diagnosticText.includes('organizer_identity_ambiguous')) {
    return 'Re-fetch stopped before Microsoft Graph: multiple Teams organizer identities were found. Configure one canonical organizer and retry.';
  }
  if (diagnosticText.includes('organizer_identity_unresolved')) {
    return 'Re-fetch stopped before Microsoft Graph: the canonical Teams organizer is not configured yet.';
  }

  return 'Teams re-fetch failed safely. No operational attendance or finance was changed.';
}

function normalizeClassification(value: unknown): Av6Classification {
  const normalized = asText(value);
  const allowed: Av6Classification[] = [
    'VERIFIED',
    'MISSING_ATTENDANCE',
    'ATTENDANCE_CONFLICT',
    'POSSIBLE_FALSE_PRESENT',
    'NO_CLASS_OCCURRED',
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
    studentName: asText(raw.studentName),
    teacherName: asText(raw.teacherName),
    tinyStepsAttendance:
      tinyStepsAttendance === 'present'
      || tinyStepsAttendance === 'absent'
      || tinyStepsAttendance === 'rescheduled'
        ? tinyStepsAttendance
        : null,
    validationDecision:
      validationDecision === 'present'
      || validationDecision === 'absent'
      || validationDecision === 'not_occurred'
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
    sameDayCoverageSeconds: asFiniteNumber(raw.sameDayCoverageSeconds),
    sameDayPresentSessionCount: asFiniteNumber(raw.sameDayPresentSessionCount),
    sameDayRequiredOverlapSeconds: asFiniteNumber(raw.sameDayRequiredOverlapSeconds),
    sameDayOccurrenceCount: asFiniteNumber(raw.sameDayOccurrenceCount),
    sameDayEvidenceEvaluable:
      raw.sameDayEvidenceEvaluable === true
        ? true
        : raw.sameDayEvidenceEvaluable === false
          ? false
          : null,
    businessOutcome: (() => {
      const value = asText(raw.businessOutcome);
      return value === 'verified'
        || value === 'false_present'
        || value === 'false_absent'
        || value === 'not_evaluable'
        ? value
        : null;
    })(),
    teamsSupportedPresentCount: asFiniteNumber(raw.teamsSupportedPresentCount),
    tinyStepsPresentCount: asFiniteNumber(raw.tinyStepsPresentCount),
    businessDifferenceCount: asFiniteNumber(raw.businessDifferenceCount),
    inputFingerprint: asText(raw.inputFingerprint),
    resolutionId: asText(raw.resolutionId),
    attendanceCorrectionId: asText(raw.attendanceCorrectionId),
    resolvedAt: asText(raw.resolvedAt),
    resolvedByName: asText(raw.resolvedByName),
  };
}

function readableDisplayName(value: unknown): string | null {
  const normalized = asText(value);
  if (!normalized) return null;
  const lower = normalized.toLowerCase();
  if (lower === 'unknown' || lower === 'name not found' || lower === 'n/a' || lower === 'na') {
    return null;
  }

  const hasWhitespace = /\s/.test(normalized);
  const looksLikeLongId = !hasWhitespace
    && (
      /^[a-f0-9]{16,}$/i.test(normalized)
      || /^[A-Za-z0-9_-]{20,}$/.test(normalized)
    );
  return looksLikeLongId ? null : normalized;
}

async function enrichCaseDisplayNames(
  items: Av6ValidationCase[],
): Promise<Av6ValidationCase[]> {
  const enrollmentIds = [...new Set(
    items
      .filter((item) =>
        item.enrollmentId
        && (!item.studentName || !item.teacherName))
      .map((item) => item.enrollmentId as string),
  )];
  const teacherIds = [...new Set(
    items
      .map((item) => item.teacherId)
      .filter((teacherId): teacherId is string => Boolean(teacherId)),
  )];

  if (enrollmentIds.length === 0 && teacherIds.length === 0) return items;

  const namesByEnrollment = new Map<
    string,
    { studentName: string | null; teacherName: string | null }
  >();
  const canonicalTeacherNames = new Map<string, string>();

  try {
    for (let index = 0; index < enrollmentIds.length; index += 30) {
      const chunk = enrollmentIds.slice(index, index + 30);
      const snapshot = await getDocs(
        query(
          collection(db, 'enrollments'),
          where(documentId(), 'in', chunk),
        ),
      );

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        namesByEnrollment.set(docSnapshot.id, {
          studentName:
            asText(data.studentName)
            || asText(data.kidName)
            || asText(data.childName),
          teacherName:
            readableDisplayName(data.teacherName)
            || readableDisplayName(data.teacherDisplayName),
        });
      });
    }
  } catch (error) {
    console.warn('[AV6] Enrollment display-name fallback failed', error);
  }

  try {
    for (let index = 0; index < teacherIds.length; index += 30) {
      const chunk = teacherIds.slice(index, index + 30);
      const snapshot = await getDocs(
        query(
          collection(db, 'users'),
          where(documentId(), 'in', chunk),
        ),
      );

      snapshot.docs.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const canonicalName =
          readableDisplayName(data.displayName)
          || readableDisplayName(data.name)
          || readableDisplayName(data.email);
        if (canonicalName) canonicalTeacherNames.set(docSnapshot.id, canonicalName);
      });
    }
  } catch (error) {
    console.warn('[AV6] Canonical teacher-name lookup failed', error);
  }

  return items.map((item) => {
    const enrollmentFallback = item.enrollmentId
      ? namesByEnrollment.get(item.enrollmentId)
      : null;
    const canonicalTeacherName = item.teacherId
      ? canonicalTeacherNames.get(item.teacherId)
      : null;
    return {
      ...item,
      studentName: item.studentName || enrollmentFallback?.studentName || null,
      teacherName:
        canonicalTeacherName
        || readableDisplayName(item.teacherName)
        || enrollmentFallback?.teacherName
        || null,
    };
  });
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
    case 'NO_CLASS_OCCURRED':
      return 'border-sky-200 bg-sky-50 text-sky-700';
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

function teacherFilterKey(item: Av6ValidationCase): string | null {
  if (item.teacherId) return `id:${item.teacherId}`;
  if (item.teacherName) return `name:${item.teacherName.toLowerCase()}`;
  return null;
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
  const [fromDate, setFromDate] = useState(AV6_VALIDATION_START_YMD);
  const [toDate, setToDate] = useState(yesterdayIstYmd);
  const [loadedRange, setLoadedRange] = useState<{ from: string; to: string } | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [validationRunning, setValidationRunning] = useState(false);
  const [validationResult, setValidationResult] =
    useState<AvsUnifiedValidationResponse | null>(null);
  const [validationCompletedAt, setValidationCompletedAt] =
    useState<Date | null>(null);
  const [forceFreshCaseId, setForceFreshCaseId] = useState<string | null>(null);
  const [forceFreshResult, setForceFreshResult] = useState<AvsForceFreshResponse | null>(null);
  const [forceFreshCompletedAt, setForceFreshCompletedAt] = useState<Date | null>(null);
  const [forceFreshRangeRunning, setForceFreshRangeRunning] = useState(false);
  const [forceFreshRangeResult, setForceFreshRangeResult] =
    useState<AvsForceFreshRangeResponse | null>(null);
  const [forceFreshRangeCompletedAt, setForceFreshRangeCompletedAt] =
    useState<Date | null>(null);
  const [forceFreshRangeGeneration, setForceFreshRangeGeneration] =
    useState<{ runId: string; fromDate: string; toDate: string } | null>(null);
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
      const enrichedCases = await enrichCaseDisplayNames(nextCases);
      setCases((current) =>
        append ? [...current, ...enrichedCases] : enrichedCases);
      setCursor(
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
      );
      setHasMore(snapshot.docs.length === AV6_CASE_READ_LIMIT);
      if (!append) {
        setLoadedRange({ from: fromDate, to: toDate });
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

  const runValidation = useCallback(async () => {
    if (!validDateRange(fromDate, toDate)) {
      setError(
        `Choose a valid date range from ${AV6_VALIDATION_START_YMD} onward.`,
      );
      return;
    }

    const rangeDays = inclusiveDateRangeDays(fromDate, toDate);
    if (rangeDays === null || rangeDays > 31) {
      setError('Run Validation supports a maximum of 31 calendar days at a time.');
      return;
    }

    if (toDate > yesterdayIstYmd()) {
      setError('Run Validation can include only completed service dates through yesterday IST.');
      return;
    }

    setValidationRunning(true);
    setError(null);

    try {
      const result = await callFunction<
        AvsUnifiedValidationResponse,
        { fromDate: string; toDate: string }
      >(
        'runAttendanceValidationRange',
        { fromDate, toDate },
      );

      setValidationResult(result);
      setValidationCompletedAt(new Date());
      await loadSavedCases(false, true);
    } catch (validationError) {
      console.error('[AVS] Run Validation failed', validationError);
      setError(
        'Run Validation failed safely. No operational attendance or finance was changed.',
      );
    } finally {
      setValidationRunning(false);
    }
  }, [fromDate, loadSavedCases, toDate]);

  const forceFreshEvidence = useCallback(async (item: Av6ValidationCase) => {
    if (
      !item.inputFingerprint
      || !item.evidenceId
      || !item.classSessionId
      || item.classSessionId !== item.id
    ) {
      setError('Re-fetch this case is available only for an existing session-backed AVS case with cached evidence.');
      return;
    }

    const confirmed = window.confirm(
      'Re-fetch this case will make new Microsoft Graph reads for this class and rebuild its AVS result. Continue?',
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
      console.error('[AVS] Re-fetch this case failed', forceFreshError);
      setError(safeForceFreshFailureMessage(forceFreshError));
    } finally {
      setForceFreshCaseId(null);
    }
  }, [loadSavedCases]);

  const forceFreshSelectedRange = useCallback(async () => {
    if (!validDateRange(fromDate, toDate)) {
      setError(
        `Choose a valid date range from ${AV6_VALIDATION_START_YMD} onward.`,
      );
      return;
    }

    const rangeDays = inclusiveDateRangeDays(fromDate, toDate);
    if (rangeDays === null || rangeDays > 31) {
      setError('Re-fetch Teams Data supports a maximum of 31 calendar days at a time.');
      return;
    }

    const sameGeneration =
      forceFreshRangeGeneration?.fromDate === fromDate
      && forceFreshRangeGeneration?.toDate === toDate
        ? forceFreshRangeGeneration
        : null;
    const retryFailures =
      Boolean(sameGeneration)
      && forceFreshRangeResult?.runId === sameGeneration?.runId
      && forceFreshRangeResult?.status === 'complete_with_failures'
      && forceFreshRangeResult.retryableFailures;
    const runId = sameGeneration?.runId
      ?? `ffr_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '')}`;

    const confirmed = window.confirm(
      retryFailures
        ? 'Retry only the failed Teams re-fetch cases in this generation? Completed cases will not be repeated.'
        : sameGeneration
          ? 'Continue this Teams re-fetch generation? Completed cases are checkpointed and will not be repeated.'
          : 'Start a new Teams re-fetch generation for this range? Cached Teams evidence will be ignored and up to 100 existing AVS cases will be re-fetched in this invocation.',
    );
    if (!confirmed) return;

    if (!sameGeneration) {
      setForceFreshRangeGeneration({ runId, fromDate, toDate });
    }
    setForceFreshRangeRunning(true);
    setError(null);

    try {
      const result = await callFunction<
        AvsForceFreshRangeResponse,
        {
          fromDate: string;
          toDate: string;
          runId: string;
          retryFailures: boolean;
        }
      >(
        'forceRefreshAttendanceValidationRange',
        { fromDate, toDate, runId, retryFailures },
      );

      setForceFreshRangeResult(result);
      setForceFreshRangeCompletedAt(new Date());
      if (
        result.complete
        || (result.completeWithFailures && !result.retryableFailures)
      ) {
        setForceFreshRangeGeneration(null);
      } else {
        setForceFreshRangeGeneration({
          runId: result.runId,
          fromDate,
          toDate,
        });
      }
      await loadSavedCases(false, true);
    } catch (forceFreshRangeError) {
      console.error('[AVS] Re-fetch Teams Data failed', forceFreshRangeError);
      // Keep the explicit generation id after a timeout/error so a retry resumes
      // the same server-side checkpoints instead of starting duplicate work.
      setForceFreshRangeGeneration({ runId, fromDate, toDate });
      setError(safeForceFreshFailureMessage(forceFreshRangeError));
    } finally {
      setForceFreshRangeRunning(false);
    }
  }, [
    forceFreshRangeGeneration,
    forceFreshRangeResult,
    fromDate,
    loadSavedCases,
    toDate,
  ]);


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
                Review saved AVS results and validate completed sessions from {AV6_VALIDATION_START_YMD} onward.
                No attendance or financial correction can be made from this screen.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Results load only when requested, in pages of up to {AV6_CASE_READ_LIMIT}.
                No realtime listener. Display names may use bounded enrollment and teacher-user reads only; no student, billing, earnings, or class-session fallback lookups.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Nothing refreshes automatically. Choose a range below.
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Loaded AVS source cases
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {cases.length} saved case{cases.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="max-w-2xl text-xs text-slate-500">
            The business view below reconciles only three operator outcomes:
            Verified, False Present, and False Absent. Evidence that is not safe
            enough to compare is kept outside those three tabs until resolved.
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[180px_180px_auto] lg:items-end">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>From</span>
            <Input
              type="date"
              min={AV6_VALIDATION_START_YMD}
              max={yesterdayIstYmd()}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            <span>To</span>
            <Input
              type="date"
              min={AV6_VALIDATION_START_YMD}
              max={yesterdayIstYmd()}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void loadSavedCases(false, false)}
              disabled={
                loading
                || loadingMore
                || validationRunning
                || forceFreshRangeRunning
                || forceFreshCaseId !== null
              }
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading results…' : 'Load Results'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runValidation()}
              disabled={
                loading
                || loadingMore
                || validationRunning
                || forceFreshRangeRunning
                || forceFreshCaseId !== null
              }
              title="Validate the selected completed range using cached Teams evidence when safe and fresh Teams reads only when required."
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${validationRunning ? 'animate-spin' : ''}`}
              />
              {validationRunning
                ? 'Running validation…'
                : validationResult?.fromDate === fromDate
                  && validationResult?.toDate === toDate
                  && validationResult.continueValidation
                  ? 'Continue Validation'
                  : 'Run Validation'}
            </Button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Load Results reads cached AVS cases only. Run Validation automatically decides whether each session needs cached revalidation, first-time Teams evidence, or a fresh Teams re-fetch. Nothing runs automatically.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Run Validation is capped at 31 completed service days and 100 sessions per invocation. Fresh Microsoft Graph reads occur only when the unified backend determines they are required.
        </p>

        <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Advanced
          </summary>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Re-fetch Teams Data intentionally ignores cached Teams evidence for existing AVS cases. Use it only when you explicitly want new Microsoft Graph evidence for this range.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void forceFreshSelectedRange()}
              disabled={
                loading
                || loadingMore
                || validationRunning
                || forceFreshRangeRunning
                || forceFreshCaseId !== null
              }
              title="Advanced: start or continue a fresh Teams evidence generation for the selected range."
              className="shrink-0"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${forceFreshRangeRunning ? 'animate-spin' : ''}`}
              />
              {forceFreshRangeRunning
                ? 'Re-fetching Teams data…'
                : forceFreshRangeResult?.fromDate === fromDate
                  && forceFreshRangeResult?.toDate === toDate
                  && forceFreshRangeResult.status === 'complete_with_failures'
                  && forceFreshRangeResult.retryableFailures
                  ? 'Retry Failed Re-fetches'
                  : forceFreshRangeGeneration?.fromDate === fromDate
                    && forceFreshRangeGeneration?.toDate === toDate
                    ? 'Continue Re-fetch'
                    : 'Re-fetch Teams Data'}
            </Button>
          </div>
        </details>

        {loadedRange && loadedAt && (
          <p className="mt-2 text-xs text-slate-500">
            Loaded {loadedRange.from} to {loadedRange.to} at {formatObservedAt(loadedAt.toISOString())}.
            Each page reads at most {AV6_CASE_READ_LIMIT} saved cases.
          </p>
        )}
      </Card>

      {validationResult && (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">
                {validationResult.continueValidation
                  ? 'Validation batch complete'
                  : 'Validation complete'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {validationResult.processedSessionCount} session{validationResult.processedSessionCount === 1 ? '' : 's'} checked.
                {' '}{validationResult.cachedRevalidatedCount} reused compatible cached evidence.
                {' '}{validationResult.freshRefreshedCount
                  + validationResult.firstEvidenceCollectedCount
                  + validationResult.baselineFreshEvidenceCount} received fresh Teams evidence.
                {finiteCount(validationResult.baselineExistingCaseCount) > 0 && (
                  <> {' '}{finiteCount(validationResult.baselineExistingCaseCount)} already had a saved AVS case and did not need first-time evidence collection.</>
                )}
                {' '}{validationResult.freshFailedCount
                  + validationResult.baselineBlockedCount} need another validation attempt or review.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Saved/rebuilt AVS cases this call: {finiteCount(validationResult.baselinePersistedCaseCount)
                  + finiteCount(validationResult.cachedRevalidatedCount)
                  + finiteCount(validationResult.freshRefreshedCount)
                  + finiteCount(validationResult.firstEvidenceCollectedCount)}.
                {' '}Microsoft Graph logical calls: {validationResult.graphLogicalCalls}.
                {' '}Automatic teacher identity mappings: {validationResult.identityMappingsWritten}.
                {' '}Unsafe evidence references left for review: {validationResult.freshnessUnsafeCount}.
              </p>
              {validationResult.continueValidation && (
                <p className="mt-2 text-xs font-medium text-blue-800">
                  More work remains in this range. Click Continue Validation to process the next bounded batch or retry unresolved fresh work.
                </p>
              )}
              {validationResult.failureSummary.retryableInfrastructureCount > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Temporary infrastructure failures: {validationResult.failureSummary.retryableInfrastructureCount}. Retry Run Validation after the temporary issue clears.
                </p>
              )}
              {(validationResult.failureSummary.configurationCount > 0
                || validationResult.failureSummary.authorizationCount > 0
                || validationResult.failureSummary.unknownInfrastructureCount > 0) && (
                <p className="mt-2 text-xs font-medium text-red-800">
                  Admin action required: {validationResult.failureSummary.adminActionRequiredCount} infrastructure failure{validationResult.failureSummary.adminActionRequiredCount === 1 ? '' : 's'} need configuration, permission, or diagnostic attention before retrying.
                </p>
              )}
              {validationResult.failureSummary.totalCount > 0
                && formatFailureCodeCounts(validationResult.failureSummary.codeCounts) && (
                  <p className="mt-1 text-xs text-slate-700">
                    Failure codes: {formatFailureCodeCounts(validationResult.failureSummary.codeCounts)}.
                  </p>
                )}
              {formatFreshFailureDiagnostics(validationResult.freshOutcomes).length > 0 && (
                <div className="mt-1 space-y-0.5 text-xs text-slate-700">
                  {formatFreshFailureDiagnostics(validationResult.freshOutcomes).map((diagnostic) => (
                    <div key={diagnostic}>Failure detail: {diagnostic}</div>
                  ))}
                </div>
              )}
              {validationResult.evidenceIssueSummary.businessReviewCount > 0 && (
                <p className="mt-2 text-xs text-slate-700">
                  Business-review evidence issues: {validationResult.evidenceIssueSummary.businessReviewCount}. These are review outcomes, not infrastructure failures.
                </p>
              )}
              {validationResult.concurrentMarkerChangeDetected && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Attendance changed again while validation was running. The newer dirty marker was retained safely.
                </p>
              )}
            </div>
            {validationCompletedAt && (
              <div className="shrink-0 text-xs text-slate-500">
                Checked {formatObservedAt(validationCompletedAt.toISOString())}
              </div>
            )}
          </div>
        </Card>
      )}

      {forceFreshResult && (
        <Card className="border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">Case re-fetch completed</p>
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
              {forceFreshResult.evidenceIssueSummary.businessReviewCount > 0 && (
                <p className="mt-2 text-xs text-slate-700">
                  Business-review evidence issues: {forceFreshResult.evidenceIssueSummary.businessReviewCount}. These are evidence outcomes, not infrastructure failures.
                </p>
              )}
              {forceFreshResult.evidenceIssueSummary.supplementalIssueCount > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  Supplemental transcript issues: {forceFreshResult.evidenceIssueSummary.supplementalIssueCount}. Attendance-report evidence remains primary.
                </p>
              )}
              {forceFreshResult.issueKinds.length > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  Teams evidence reported: {forceFreshResult.issueKinds.map(humanize).join(', ')}.
                </p>
              )}
              {(forceFreshResult.issueDetails?.length ?? 0) > 0 && (
                <div className="mt-1 space-y-0.5 text-xs text-amber-800">
                  {forceFreshResult.issueDetails?.map((issue, index) => (
                    <div key={`${issue.stage}-${issue.reportId ?? index}`}>
                      Stage: {humanize(issue.stage)}
                      {issue.httpStatus !== null ? ` · HTTP ${issue.httpStatus}` : ''}
                      {issue.graphCode ? ` · Graph ${issue.graphCode}` : ''}
                      {issue.innerCode ? ` · Inner ${issue.innerCode}` : ''}
                    </div>
                  ))}
                </div>
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

      {forceFreshRangeResult && (
        <Card className="border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-slate-900">
                {forceFreshRangeResult.status === 'complete_with_failures'
                  ? 'Teams re-fetch generation complete with failures'
                  : forceFreshRangeResult.complete
                    ? 'Teams re-fetch generation complete'
                    : 'Teams re-fetch generation batch complete'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Generation: {forceFreshRangeResult.runId.slice(0, 18)}….
                {' '}Cases attempted this call: {forceFreshRangeResult.attempted}.
                {' '}Refreshed: {forceFreshRangeResult.refreshed}.
                {' '}Skipped: {forceFreshRangeResult.skipped}.
                {' '}Failed this call: {forceFreshRangeResult.failed}.
                {' '}Current failed: {forceFreshRangeResult.currentFailedCases}.
                {' '}Remaining unscanned: {forceFreshRangeResult.remainingCases}.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Microsoft Graph logical calls: {forceFreshRangeResult.graphLogicalCalls}.
                {' '}Internal concurrency: {forceFreshRangeResult.concurrency}.
                {' '}Saved results for {forceFreshRangeResult.fromDate} to {forceFreshRangeResult.toDate} were automatically reloaded.
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Cumulative: {forceFreshRangeResult.cumulative.casesProcessed} unique cases processed,
                {' '}{forceFreshRangeResult.cumulative.attempted} attempts,
                {' '}{forceFreshRangeResult.cumulative.refreshed} refreshed,
                {' '}{forceFreshRangeResult.cumulative.skipped} skipped,
                {' '}{forceFreshRangeResult.cumulative.failed} currently failed,
                {' '}{forceFreshRangeResult.cumulative.graphLogicalCalls} Graph logical calls.
              </p>
              {forceFreshRangeResult.retryableFailures && (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  This generation finished scanning the range but still has failed cases. Retry Failed Refreshes will retry only those failures.
                </p>
              )}
            </div>
            {forceFreshRangeCompletedAt && (
              <div className="shrink-0 text-xs text-slate-500">
                {formatObservedAt(forceFreshRangeCompletedAt.toISOString())}
              </div>
            )}
          </div>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Loading saved attendance validation results…
        </Card>
      ) : !loadedRange ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-2 font-medium text-slate-700">Choose a date range</p>
          <p className="mt-1 text-sm text-slate-500">
            Click Load Results to read cached AVS cases. Opening this page does not read them automatically.
          </p>
        </Card>
      ) : cases.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-2 font-medium text-slate-700">No saved results in this range</p>
          <p className="mt-1 text-sm text-slate-500">
            No cached AVS cases were found for {loadedRange.from} to {loadedRange.to}.
          </p>
        </Card>
      ) : (
        <Card className="p-4">
          <AttendanceValidationBusinessView cases={cases} />
        </Card>
      )}

      {loadedRange
        && loadedRange.from === fromDate
        && loadedRange.to === toDate
        && hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadSavedCases(true, true)}
            disabled={loading || loadingMore || validationRunning || forceFreshRangeRunning || forceFreshCaseId !== null}
          >
            {loadingMore ? 'Loading more…' : `Load next ${AV6_CASE_READ_LIMIT} saved results`}
          </Button>
        </div>
      )}
    </div>
  );
}
