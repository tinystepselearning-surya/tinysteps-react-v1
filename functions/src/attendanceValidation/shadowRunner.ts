import { createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import {
  bridgeEnrollmentIdentity,
  type Av3IdentityIssueKind,
  type StaffIdentityRegistryEntry,
} from './enrollmentIdentityBridge';
import {
  AV4_PRODUCTION_MEANINGFUL_OVERLAP_SECONDS,
  buildSessionProof,
  type Av4ProofIssueKind,
} from './sessionProofEngine';
import {
  classifySessionProof,
  type Av5ClassificationDecision,
  type Av5ClassificationReason,
} from './classificationEngine';
import {
  normalizeTinyStepsAttendance,
  reconcileAttendanceClassification,
  type Av5RecommendedAction,
  type Av5ReconciliationClassification,
  type Av5ReconciliationReason,
  type Av5ReconciliationStatus,
  type CanonicalTinyStepsAttendance,
} from './reconciliationEngine';
import type {
  AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';
import {
  aggregateSameDayCoverage,
  buildSameDayCoverageObservation,
  type SameDayCoverageAggregate,
} from './sameDayCoverageEngine';
import {
  loadProductionStaffIdentityRegistry,
  type Av3StaffRegistryIssueKind,
  type Av3StaffRegistrySnapshot,
} from './staffIdentityRegistry';

export const AV53_CASE_SCHEMA_VERSION = 2;
export const AV53_MAX_WORK_ITEMS_PER_RUN = 100;
export const AV53_VALIDATION_START_YMD = '2026-09-01' as const;
export const ATTENDANCE_VALIDATION_CASES_COLLECTION = 'attendanceValidationCases';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export const AV53_CASE_CLASSIFICATIONS = [
  'VERIFIED',
  'MISSING_ATTENDANCE',
  'ATTENDANCE_CONFLICT',
  'POSSIBLE_FALSE_PRESENT',
  'NO_CLASS_OCCURRED',
  'MISSING_TEAMS_EVIDENCE',
  'ORPHAN_TEAMS_CLASS',
  'AMBIGUOUS',
] as const;

export type Av53CaseClassification =
  (typeof AV53_CASE_CLASSIFICATIONS)[number];

export type Av53CaseReason =
  | Av5ReconciliationReason
  | 'operational_session_missing'
  | 'evidence_document_missing'
  | 'evidence_session_id_mismatch'
  | 'operational_session_reference_mismatch'
  | 'same_day_coverage_verified'
  | 'same_day_multi_session_coverage_verified'
  | 'same_day_coverage_insufficient'
  | 'same_day_identity_requires_review'
  | 'same_day_evidence_incomplete';

export interface Av53ShadowWorkItem {
  classSessionId: string;
  evidenceId: string;
}

export interface Av53ShadowRunInput {
  runId: string;
  workItems: Av53ShadowWorkItem[];
  /**
   * Optional diagnostic/calibration override.
   * Production callers should omit this field and use the contract-v2 default.
   * Explicit null remains a fail-closed test/diagnostic path.
   */
  meaningfulOverlapSeconds?: number | null;
}

export interface Av53LoadedWorkItem {
  item: Av53ShadowWorkItem;
  session: Record<string, unknown> | null;
  evidence: AttendanceValidationEvidenceDocument | null;
}

export interface Av53ValidationCaseDocument {
  schemaVersion: typeof AV53_CASE_SCHEMA_VERSION;
  brick: 'AV5.3';
  id: string;
  runId: string;
  evidenceId: string | null;
  observedAt: string;
  serviceDateYmd: string;
  classSessionId: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName?: string | null;
  teacherName?: string | null;
  tinyStepsAttendance: CanonicalTinyStepsAttendance | null;
  validationDecision: Av5ClassificationDecision | null;
  classification: Av53CaseClassification;
  recommendedAction: Av5RecommendedAction;
  resolutionStatus: Av5ReconciliationStatus;
  reasons: Av53CaseReason[];
  sourceClassificationReasons: Av5ClassificationReason[];
  proofIssues: Av4ProofIssueKind[];
  identityIssues: Av3IdentityIssueKind[];
  staffRegistryIssues: Av3StaffRegistryIssueKind[];
  sameDayCoverageSeconds: number | null;
  sameDayPresentSessionCount: number | null;
  sameDayRequiredOverlapSeconds: number | null;
  sameDayOccurrenceCount: number | null;
  inputFingerprint: string;
  operationalMutationAllowed: false;
}

export interface Av53ShadowRunResult {
  schemaVersion: typeof AV53_CASE_SCHEMA_VERSION;
  brick: 'AV5.3';
  runId: string;
  requestedCount: number;
  processedCount: number;
  persistedCaseCount: number;
  skippedCount: number;
  preScopeSkippedCount: number;
  validationStartYmd: typeof AV53_VALIDATION_START_YMD;
  pointReadDocumentBudget: number;
  sameDayContextReadDocumentBudget: number;
  staffRegistryLoadedOnce: true;
  casePreReads: 0;
  unboundedOperationalScans: false;
  caseIds: string[];
  skipped: Array<{
    classSessionId: string;
    evidenceId: string;
    reason:
      | 'both_session_and_evidence_missing'
      | 'before_validation_start'
      | 'validation_scope_date_unresolved'
      | 'validation_scope_date_conflict';
  }>;
  operationalMutationAllowed: false;
}

export interface Av53ShadowStore {
  loadWorkItems(items: readonly Av53ShadowWorkItem[]): Promise<Av53LoadedWorkItem[]>;
  saveCases(cases: readonly Av53ValidationCaseDocument[]): Promise<void>;
}

interface Av53SameDayCoverageContext {
  aggregate: SameDayCoverageAggregate;
  presentSessionCount: number;
  contextIncomplete: boolean;
}

interface Av53ShadowDependencies {
  store: Av53ShadowStore;
  staffRegistry: Av3StaffRegistrySnapshot;
  now?: () => Date;
  sameDayPresentCountByGroup?: ReadonlyMap<string, number>;
  sameDayContextIncompleteGroups?: ReadonlySet<string>;
}

function cleanId(value: unknown, name: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > 240 || normalized.includes('/')) {
    throw new TypeError(`${name} must be a non-empty Firestore document id.`);
  }
  return normalized;
}

function cleanRunId(value: unknown): string {
  const normalized = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(normalized)) {
    throw new TypeError(
      'runId must contain only letters, numbers, underscores, or hyphens.',
    );
  }
  return normalized;
}

function validateThreshold(value: number | null | undefined): number | null {
  if (value === undefined) return AV4_PRODUCTION_MEANINGFUL_OVERLAP_SECONDS;
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      'meaningfulOverlapSeconds must be null or a finite non-negative number.',
    );
  }
  return value;
}

function normalizeWorkItems(
  input: readonly Av53ShadowWorkItem[],
): Av53ShadowWorkItem[] {
  if (input.length > AV53_MAX_WORK_ITEMS_PER_RUN) {
    throw new RangeError(
      `AV5.3 accepts at most ${AV53_MAX_WORK_ITEMS_PER_RUN} explicit work items per run.`,
    );
  }

  const seenSessions = new Set<string>();
  return input.map((item, index) => {
    const classSessionId = cleanId(
      item.classSessionId,
      `workItems[${index}].classSessionId`,
    );
    const evidenceId = cleanId(
      item.evidenceId,
      `workItems[${index}].evidenceId`,
    );

    if (seenSessions.has(classSessionId)) {
      throw new TypeError(
        `Duplicate classSessionId in AV5.3 work list: ${classSessionId}`,
      );
    }
    seenSessions.add(classSessionId);

    return { classSessionId, evidenceId };
  });
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function firstText(values: unknown): string | null {
  if (!Array.isArray(values)) return null;
  for (const value of values) {
    const normalized = text(value);
    if (normalized) return normalized;
  }
  return null;
}

function validYmd(value: unknown): string | null {
  const normalized = text(value);
  if (!normalized || !YMD_RE.test(normalized)) return null;
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function dateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof candidate.toDate === 'function') {
    const date = candidate.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  const seconds = typeof candidate.seconds === 'number'
    ? candidate.seconds
    : candidate._seconds;
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function istYmdFromDate(value: unknown): string | null {
  const date = dateFromUnknown(value);
  if (!date) return null;
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function evidenceServiceYmd(
  evidence: AttendanceValidationEvidenceDocument | null,
): string | null {
  if (!evidence) return null;
  return istYmdFromDate(evidence.session.scheduledStartDateTime);
}

function sessionServiceYmd(
  session: Record<string, unknown> | null,
): string | null {
  if (!session) return null;
  return validYmd(session.date)
    || validYmd(session.serviceDateYmd)
    || istYmdFromDate(session.startAt);
}

function scopeDecision(
  session: Record<string, unknown> | null,
  evidence: AttendanceValidationEvidenceDocument | null,
):
  | { kind: 'in_scope'; serviceDateYmd: string }
  | {
    kind:
      | 'before_validation_start'
      | 'validation_scope_date_unresolved'
      | 'validation_scope_date_conflict';
    serviceDateYmd: string | null;
  } {
  const dates = [
    sessionServiceYmd(session),
    evidenceServiceYmd(evidence),
  ].filter((value): value is string => Boolean(value));

  if (dates.length === 0) {
    return {
      kind: 'validation_scope_date_unresolved',
      serviceDateYmd: null,
    };
  }

  const uniqueDates = [...new Set(dates)];
  if (uniqueDates.length > 1) {
    if (uniqueDates.some((value) => value < AV53_VALIDATION_START_YMD)) {
      return {
        kind: 'before_validation_start',
        serviceDateYmd: uniqueDates.sort()[0],
      };
    }
    return {
      kind: 'validation_scope_date_conflict',
      serviceDateYmd: null,
    };
  }

  const serviceDateYmd = uniqueDates[0];
  if (serviceDateYmd < AV53_VALIDATION_START_YMD) {
    return {
      kind: 'before_validation_start',
      serviceDateYmd,
    };
  }

  return { kind: 'in_scope', serviceDateYmd };
}

function sessionKidId(session: Record<string, unknown>): string | null {
  return text(session.kidId)
    || firstText(session.kidIds)
    || text(session.studentId)
    || text(session.childId);
}

function sessionStudentName(session: Record<string, unknown>): string | null {
  return text(session.studentName)
    || text(session.kidName)
    || text(session.childName);
}

function sessionTeacherName(session: Record<string, unknown>): string | null {
  return text(session.teacherName)
    || text(session.teacherDisplayName);
}

function sessionTeacherId(session: Record<string, unknown>): string | null {
  return text(session.teacherId)
    || firstText(session.teacherIds)
    || text(session.assignedTeacherId)
    || text(session.primaryTeacherId)
    || text(session.teacherUid)
    || text(session.teacher_id);
}

function sameDayGroupKey(
  serviceDateYmd: string,
  session: Record<string, unknown> | null,
  evidence: AttendanceValidationEvidenceDocument | null,
): string | null {
  const enrollmentId = evidence?.session.enrollmentId
    || text(session?.enrollmentId);
  const kidId = evidence?.session.kidId
    || (session ? sessionKidId(session) : null);
  const teacherId = evidence?.session.teacherId
    || (session ? sessionTeacherId(session) : null);

  if (!enrollmentId || !kidId || !teacherId) return null;
  return [serviceDateYmd, enrollmentId, kidId, teacherId].join('|');
}

function scheduledWindowEvidence(
  evidence: AttendanceValidationEvidenceDocument,
): AttendanceValidationEvidenceDocument {
  if (evidence.attendanceReports.length <= 1) return evidence;

  const startMs = Date.parse(evidence.session.scheduledStartDateTime);
  const endMs = Date.parse(evidence.session.scheduledEndDateTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return evidence;
  }

  const scored = evidence.attendanceReports.map((report) => {
    const reportStartMs = report.meetingStartDateTime
      ? Date.parse(report.meetingStartDateTime)
      : Number.NaN;
    const reportEndMs = report.meetingEndDateTime
      ? Date.parse(report.meetingEndDateTime)
      : Number.NaN;
    const overlapMs = Number.isFinite(reportStartMs)
      && Number.isFinite(reportEndMs)
      && reportEndMs > reportStartMs
      ? Math.max(
        0,
        Math.min(endMs, reportEndMs) - Math.max(startMs, reportStartMs),
      )
      : 0;
    return { report, overlapMs };
  });

  const overlapping = scored.filter((item) => item.overlapMs > 0);
  let selected = overlapping;
  if (overlapping.length > 1) {
    const maxOverlapMs = Math.max(...overlapping.map((item) => item.overlapMs));
    selected = overlapping.filter((item) => item.overlapMs === maxOverlapMs);
  }

  const attendanceReports = selected.map((item) => item.report);
  return {
    ...evidence,
    attendanceReports,
    artifactAvailability: {
      ...evidence.artifactAvailability,
      attendanceReportAvailable: attendanceReports.length > 0,
    },
  };
}

function attendanceEntryForKid(
  session: Record<string, unknown>,
  kidId: string | null,
): unknown {
  if (!kidId) return null;
  const attendance = session.attendance;
  if (!attendance || typeof attendance !== 'object' || Array.isArray(attendance)) {
    return null;
  }
  return (attendance as Record<string, unknown>)[kidId] ?? null;
}

function sessionReferencesMatchEvidence(
  sessionId: string,
  session: Record<string, unknown>,
  evidence: AttendanceValidationEvidenceDocument,
): boolean {
  if (evidence.session.classSessionId !== sessionId) return false;

  const comparisons: Array<[string | null, string | null]> = [
    [text(session.enrollmentId), evidence.session.enrollmentId],
    [text(session.teacherId), evidence.session.teacherId],
    [sessionKidId(session), evidence.session.kidId],
  ];

  return comparisons.every(([operational, captured]) =>
    operational === captured);
}

function stableCaseFingerprint(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex');
}

function baseCase(params: {
  id: string;
  runId: string;
  evidenceId: string | null;
  observedAt: string;
  serviceDateYmd: string;
  classSessionId: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName?: string | null;
  teacherName?: string | null;
  tinyStepsAttendance: CanonicalTinyStepsAttendance | null;
  validationDecision: Av5ClassificationDecision | null;
  classification: Av53CaseClassification;
  recommendedAction: Av5RecommendedAction;
  resolutionStatus: Av5ReconciliationStatus;
  reasons: Av53CaseReason[];
  sourceClassificationReasons?: Av5ClassificationReason[];
  proofIssues?: Av4ProofIssueKind[];
  identityIssues?: Av3IdentityIssueKind[];
  staffRegistryIssues: Av3StaffRegistryIssueKind[];
  sameDayCoverageSeconds?: number | null;
  sameDayPresentSessionCount?: number | null;
  sameDayRequiredOverlapSeconds?: number | null;
  sameDayOccurrenceCount?: number | null;
}): Av53ValidationCaseDocument {
  const fingerprintSource = {
    evidenceId: params.evidenceId,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.classSessionId,
    enrollmentId: params.enrollmentId,
    kidId: params.kidId,
    teacherId: params.teacherId,
    tinyStepsAttendance: params.tinyStepsAttendance,
    validationDecision: params.validationDecision,
    classification: params.classification,
    recommendedAction: params.recommendedAction,
    resolutionStatus: params.resolutionStatus,
    reasons: params.reasons,
    sourceClassificationReasons: params.sourceClassificationReasons ?? [],
    proofIssues: params.proofIssues ?? [],
    identityIssues: params.identityIssues ?? [],
    staffRegistryIssues: params.staffRegistryIssues,
    sameDayCoverageSeconds: params.sameDayCoverageSeconds ?? null,
    sameDayPresentSessionCount: params.sameDayPresentSessionCount ?? null,
    sameDayRequiredOverlapSeconds: params.sameDayRequiredOverlapSeconds ?? null,
    sameDayOccurrenceCount: params.sameDayOccurrenceCount ?? null,
  };

  return {
    schemaVersion: AV53_CASE_SCHEMA_VERSION,
    brick: 'AV5.3',
    id: params.id,
    runId: params.runId,
    evidenceId: params.evidenceId,
    observedAt: params.observedAt,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.classSessionId,
    enrollmentId: params.enrollmentId,
    kidId: params.kidId,
    teacherId: params.teacherId,
    studentName: params.studentName ?? null,
    teacherName: params.teacherName ?? null,
    tinyStepsAttendance: params.tinyStepsAttendance,
    validationDecision: params.validationDecision,
    classification: params.classification,
    recommendedAction: params.recommendedAction,
    resolutionStatus: params.resolutionStatus,
    reasons: [...new Set(params.reasons)],
    sourceClassificationReasons: [
      ...new Set(params.sourceClassificationReasons ?? []),
    ],
    proofIssues: [...new Set(params.proofIssues ?? [])],
    identityIssues: [...new Set(params.identityIssues ?? [])],
    staffRegistryIssues: [...new Set(params.staffRegistryIssues)],
    sameDayCoverageSeconds: params.sameDayCoverageSeconds ?? null,
    sameDayPresentSessionCount: params.sameDayPresentSessionCount ?? null,
    sameDayRequiredOverlapSeconds: params.sameDayRequiredOverlapSeconds ?? null,
    sameDayOccurrenceCount: params.sameDayOccurrenceCount ?? null,
    inputFingerprint: stableCaseFingerprint(fingerprintSource),
    operationalMutationAllowed: false,
  };
}

function registryIssueKinds(
  snapshot: Av3StaffRegistrySnapshot,
): Av3StaffRegistryIssueKind[] {
  return [...new Set(snapshot.issues.map((issue) => issue.kind))];
}

function caseFromMissingEvidence(params: {
  runId: string;
  observedAt: string;
  serviceDateYmd: string;
  item: Av53ShadowWorkItem;
  session: Record<string, unknown>;
  registryIssues: Av3StaffRegistryIssueKind[];
}): Av53ValidationCaseDocument {
  const kidId = sessionKidId(params.session);
  const attendance = normalizeTinyStepsAttendance(
    attendanceEntryForKid(params.session, kidId),
  );

  return baseCase({
    id: params.item.classSessionId,
    runId: params.runId,
    evidenceId: params.item.evidenceId,
    observedAt: params.observedAt,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.item.classSessionId,
    enrollmentId: text(params.session.enrollmentId),
    kidId,
    teacherId: text(params.session.teacherId),
    studentName: sessionStudentName(params.session),
    teacherName: sessionTeacherName(params.session),
    tinyStepsAttendance: attendance,
    validationDecision: null,
    classification: 'MISSING_TEAMS_EVIDENCE',
    recommendedAction: 'review',
    resolutionStatus: 'needs_review',
    reasons: ['evidence_document_missing'],
    staffRegistryIssues: params.registryIssues,
  });
}

function caseFromOrphanEvidence(params: {
  runId: string;
  observedAt: string;
  serviceDateYmd: string;
  item: Av53ShadowWorkItem;
  evidence: AttendanceValidationEvidenceDocument;
  registryIssues: Av3StaffRegistryIssueKind[];
}): Av53ValidationCaseDocument {
  return baseCase({
    id: `orphan_${params.item.evidenceId}`,
    runId: params.runId,
    evidenceId: params.item.evidenceId,
    observedAt: params.observedAt,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.item.classSessionId,
    enrollmentId: params.evidence.session.enrollmentId,
    kidId: params.evidence.session.kidId,
    teacherId: params.evidence.session.teacherId,
    studentName: null,
    teacherName: null,
    tinyStepsAttendance: null,
    validationDecision: null,
    classification: 'ORPHAN_TEAMS_CLASS',
    recommendedAction: 'review',
    resolutionStatus: 'needs_review',
    reasons: ['operational_session_missing'],
    staffRegistryIssues: params.registryIssues,
  });
}

function caseFromReferenceMismatch(params: {
  runId: string;
  observedAt: string;
  serviceDateYmd: string;
  item: Av53ShadowWorkItem;
  session: Record<string, unknown>;
  evidence: AttendanceValidationEvidenceDocument;
  registryIssues: Av3StaffRegistryIssueKind[];
  reason:
    | 'evidence_session_id_mismatch'
    | 'operational_session_reference_mismatch';
}): Av53ValidationCaseDocument {
  const kidId = sessionKidId(params.session);
  return baseCase({
    id: params.item.classSessionId,
    runId: params.runId,
    evidenceId: params.item.evidenceId,
    observedAt: params.observedAt,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.item.classSessionId,
    enrollmentId: text(params.session.enrollmentId),
    kidId,
    teacherId: text(params.session.teacherId),
    studentName: sessionStudentName(params.session),
    teacherName: sessionTeacherName(params.session),
    tinyStepsAttendance: normalizeTinyStepsAttendance(
      attendanceEntryForKid(params.session, kidId),
    ),
    validationDecision: null,
    classification: 'AMBIGUOUS',
    recommendedAction: 'review',
    resolutionStatus: 'needs_review',
    reasons: [params.reason],
    staffRegistryIssues: params.registryIssues,
  });
}

function caseFromEvidence(params: {
  runId: string;
  observedAt: string;
  serviceDateYmd: string;
  item: Av53ShadowWorkItem;
  session: Record<string, unknown>;
  evidence: AttendanceValidationEvidenceDocument;
  staffRegistry: readonly StaffIdentityRegistryEntry[];
  registryIssues: Av3StaffRegistryIssueKind[];
  meaningfulOverlapSeconds: number | null;
  sameDayCoverage: Av53SameDayCoverageContext | null;
}): Av53ValidationCaseDocument {
  const kidId = params.evidence.session.kidId || sessionKidId(params.session);
  const rawAttendance = attendanceEntryForKid(params.session, kidId);
  const tinyStepsAttendance = normalizeTinyStepsAttendance(rawAttendance);

  if (
    tinyStepsAttendance === 'present'
    && params.sameDayCoverage
    && params.meaningfulOverlapSeconds !== null
  ) {
    const sameDay = params.sameDayCoverage;
    const requiredSeconds =
      sameDay.presentSessionCount * params.meaningfulOverlapSeconds;

    if (sameDay.contextIncomplete) {
      return baseCase({
        id: params.item.classSessionId,
        runId: params.runId,
        evidenceId: params.item.evidenceId,
        observedAt: params.observedAt,
        serviceDateYmd: params.serviceDateYmd,
        classSessionId: params.item.classSessionId,
        enrollmentId: params.evidence.session.enrollmentId,
        kidId,
        teacherId: params.evidence.session.teacherId,
        studentName: sessionStudentName(params.session),
        teacherName: sessionTeacherName(params.session),
        tinyStepsAttendance,
        validationDecision: 'review',
        classification: 'MISSING_TEAMS_EVIDENCE',
        recommendedAction: 'review',
        resolutionStatus: 'needs_review',
        reasons: ['same_day_evidence_incomplete'],
        staffRegistryIssues: params.registryIssues,
        sameDayCoverageSeconds: sameDay.aggregate.totalOverlapSeconds,
        sameDayPresentSessionCount: sameDay.presentSessionCount,
        sameDayRequiredOverlapSeconds: requiredSeconds,
        sameDayOccurrenceCount: sameDay.aggregate.occurrenceCount,
      });
    }

    if (sameDay.aggregate.status === 'measured') {
      if (sameDay.aggregate.totalOverlapSeconds > requiredSeconds) {
        return baseCase({
          id: params.item.classSessionId,
          runId: params.runId,
          evidenceId: params.item.evidenceId,
          observedAt: params.observedAt,
          serviceDateYmd: params.serviceDateYmd,
          classSessionId: params.item.classSessionId,
          enrollmentId: params.evidence.session.enrollmentId,
          kidId,
          teacherId: params.evidence.session.teacherId,
          studentName: sessionStudentName(params.session),
          teacherName: sessionTeacherName(params.session),
          tinyStepsAttendance,
          validationDecision: 'present',
          classification: 'VERIFIED',
          recommendedAction: 'none',
          resolutionStatus: 'verified',
          reasons: [
            sameDay.presentSessionCount > 1
              ? 'same_day_multi_session_coverage_verified'
              : 'same_day_coverage_verified',
          ],
          staffRegistryIssues: params.registryIssues,
          sameDayCoverageSeconds: sameDay.aggregate.totalOverlapSeconds,
          sameDayPresentSessionCount: sameDay.presentSessionCount,
          sameDayRequiredOverlapSeconds: requiredSeconds,
          sameDayOccurrenceCount: sameDay.aggregate.occurrenceCount,
        });
      }

      return baseCase({
        id: params.item.classSessionId,
        runId: params.runId,
        evidenceId: params.item.evidenceId,
        observedAt: params.observedAt,
        serviceDateYmd: params.serviceDateYmd,
        classSessionId: params.item.classSessionId,
        enrollmentId: params.evidence.session.enrollmentId,
        kidId,
        teacherId: params.evidence.session.teacherId,
        studentName: sessionStudentName(params.session),
        teacherName: sessionTeacherName(params.session),
        tinyStepsAttendance,
        validationDecision: 'review',
        classification: 'POSSIBLE_FALSE_PRESENT',
        recommendedAction: 'review',
        resolutionStatus: 'needs_review',
        reasons: ['same_day_coverage_insufficient'],
        staffRegistryIssues: params.registryIssues,
        sameDayCoverageSeconds: sameDay.aggregate.totalOverlapSeconds,
        sameDayPresentSessionCount: sameDay.presentSessionCount,
        sameDayRequiredOverlapSeconds: requiredSeconds,
        sameDayOccurrenceCount: sameDay.aggregate.occurrenceCount,
      });
    }

    if (sameDay.aggregate.status === 'review') {
      const evidenceIncomplete = sameDay.aggregate.issues.includes(
        'same_day_attendance_evidence_incomplete',
      );
      return baseCase({
        id: params.item.classSessionId,
        runId: params.runId,
        evidenceId: params.item.evidenceId,
        observedAt: params.observedAt,
        serviceDateYmd: params.serviceDateYmd,
        classSessionId: params.item.classSessionId,
        enrollmentId: params.evidence.session.enrollmentId,
        kidId,
        teacherId: params.evidence.session.teacherId,
        studentName: sessionStudentName(params.session),
        teacherName: sessionTeacherName(params.session),
        tinyStepsAttendance,
        validationDecision: 'review',
        classification: evidenceIncomplete
          ? 'MISSING_TEAMS_EVIDENCE'
          : 'AMBIGUOUS',
        recommendedAction: 'review',
        resolutionStatus: 'needs_review',
        reasons: [
          evidenceIncomplete
            ? 'same_day_evidence_incomplete'
            : 'same_day_identity_requires_review',
        ],
        staffRegistryIssues: params.registryIssues,
        sameDayCoverageSeconds: 0,
        sameDayPresentSessionCount: sameDay.presentSessionCount,
        sameDayRequiredOverlapSeconds: requiredSeconds,
        sameDayOccurrenceCount: sameDay.aggregate.occurrenceCount,
      });
    }
  }

  const exactEvidence = scheduledWindowEvidence(params.evidence);
  const identity = bridgeEnrollmentIdentity(
    exactEvidence,
    params.staffRegistry,
  );
  const proof = buildSessionProof(
    exactEvidence,
    identity,
    { meaningfulOverlapSeconds: params.meaningfulOverlapSeconds },
  );
  const classification = classifySessionProof(proof);
  const reconciliation = reconcileAttendanceClassification(
    classification,
    rawAttendance,
  );

  return baseCase({
    id: params.item.classSessionId,
    runId: params.runId,
    evidenceId: params.item.evidenceId,
    observedAt: params.observedAt,
    serviceDateYmd: params.serviceDateYmd,
    classSessionId: params.item.classSessionId,
    enrollmentId: params.evidence.session.enrollmentId,
    kidId,
    teacherId: params.evidence.session.teacherId,
    studentName: sessionStudentName(params.session),
    teacherName: sessionTeacherName(params.session),
    tinyStepsAttendance: reconciliation.tinyStepsAttendance,
    validationDecision: classification.decision,
    classification:
      reconciliation.classification as Av5ReconciliationClassification,
    recommendedAction: reconciliation.recommendedAction,
    resolutionStatus: reconciliation.resolutionStatus,
    reasons: reconciliation.reasons,
    sourceClassificationReasons: classification.reasons,
    proofIssues: proof.issues,
    identityIssues: identity.issues,
    staffRegistryIssues: params.registryIssues,
  });
}

/**
 * Bounded AV5.3 shadow runner.
 *
 * It accepts an explicit work list only. It never discovers sessions by scanning
 * classSessions and never reads enrollments, kids, billing, earnings, credits or
 * reschedule collections. A hard 2026-09-01 Tiny Steps service-date lower bound
 * permanently excludes July/August history. Case persistence uses deterministic
 * document ids and performs no case pre-read.
 */
export async function runAv53Shadow(
  input: Av53ShadowRunInput,
  deps: Av53ShadowDependencies,
): Promise<Av53ShadowRunResult> {
  const runId = cleanRunId(input.runId);
  const workItems = normalizeWorkItems(input.workItems);
  const meaningfulOverlapSeconds = validateThreshold(
    input.meaningfulOverlapSeconds,
  );
  const loaded = await deps.store.loadWorkItems(workItems);
  const observedAt = (deps.now ?? (() => new Date()))().toISOString();
  const staffRegistryIssues = registryIssueKinds(deps.staffRegistry);
  const cases: Av53ValidationCaseDocument[] = [];
  const skipped: Av53ShadowRunResult['skipped'] = [];

  const inferredPresentCountByGroup = new Map<string, number>();
  const observationsByGroup = new Map<string, ReturnType<typeof buildSameDayCoverageObservation>[]>();

  for (const loadedItem of loaded) {
    const { session, evidence } = loadedItem;
    if (!session) continue;

    const scope = scopeDecision(session, evidence);
    if (scope.kind !== 'in_scope') continue;
    const groupKey = sameDayGroupKey(scope.serviceDateYmd, session, evidence);
    if (!groupKey) continue;

    const kidId = evidence?.session.kidId || sessionKidId(session);
    const attendance = normalizeTinyStepsAttendance(
      attendanceEntryForKid(session, kidId),
    );
    if (attendance === 'present') {
      inferredPresentCountByGroup.set(
        groupKey,
        (inferredPresentCountByGroup.get(groupKey) ?? 0) + 1,
      );
    }

    if (
      evidence
      && evidence.session.classSessionId === loadedItem.item.classSessionId
      && sessionReferencesMatchEvidence(
        loadedItem.item.classSessionId,
        session,
        evidence,
      )
    ) {
      const identity = bridgeEnrollmentIdentity(
        evidence,
        deps.staffRegistry.entries,
      );
      const observation = buildSameDayCoverageObservation(
        evidence,
        identity,
        scope.serviceDateYmd,
      );
      const existing = observationsByGroup.get(groupKey) ?? [];
      existing.push(observation);
      observationsByGroup.set(groupKey, existing);
    }
  }

  const sameDayCoverageByGroup = new Map<string, Av53SameDayCoverageContext>();
  for (const [groupKey, observations] of observationsByGroup) {
    const aggregate = aggregateSameDayCoverage(observations);
    const inferredCount = inferredPresentCountByGroup.get(groupKey) ?? 0;
    const externalCount = deps.sameDayPresentCountByGroup?.get(groupKey) ?? 0;
    sameDayCoverageByGroup.set(groupKey, {
      aggregate,
      presentSessionCount: Math.max(1, inferredCount, externalCount),
      contextIncomplete:
        deps.sameDayContextIncompleteGroups?.has(groupKey) ?? false,
    });
  }

  for (const loadedItem of loaded) {
    const { item, session, evidence } = loadedItem;

    if (!session && !evidence) {
      skipped.push({
        classSessionId: item.classSessionId,
        evidenceId: item.evidenceId,
        reason: 'both_session_and_evidence_missing',
      });
      continue;
    }

    const scope = scopeDecision(session, evidence);
    if (scope.kind !== 'in_scope') {
      skipped.push({
        classSessionId: item.classSessionId,
        evidenceId: item.evidenceId,
        reason: scope.kind,
      });
      continue;
    }

    if (!session && evidence) {
      cases.push(caseFromOrphanEvidence({
        runId,
        observedAt,
        serviceDateYmd: scope.serviceDateYmd,
        item,
        evidence,
        registryIssues: staffRegistryIssues,
      }));
      continue;
    }

    if (session && !evidence) {
      cases.push(caseFromMissingEvidence({
        runId,
        observedAt,
        serviceDateYmd: scope.serviceDateYmd,
        item,
        session,
        registryIssues: staffRegistryIssues,
      }));
      continue;
    }

    if (!session || !evidence) continue;

    if (evidence.session.classSessionId !== item.classSessionId) {
      cases.push(caseFromReferenceMismatch({
        runId,
        observedAt,
        serviceDateYmd: scope.serviceDateYmd,
        item,
        session,
        evidence,
        registryIssues: staffRegistryIssues,
        reason: 'evidence_session_id_mismatch',
      }));
      continue;
    }

    if (!sessionReferencesMatchEvidence(item.classSessionId, session, evidence)) {
      cases.push(caseFromReferenceMismatch({
        runId,
        observedAt,
        serviceDateYmd: scope.serviceDateYmd,
        item,
        session,
        evidence,
        registryIssues: staffRegistryIssues,
        reason: 'operational_session_reference_mismatch',
      }));
      continue;
    }

    cases.push(caseFromEvidence({
      runId,
      observedAt,
      serviceDateYmd: scope.serviceDateYmd,
      item,
      session,
      evidence,
      staffRegistry: deps.staffRegistry.entries,
      registryIssues: staffRegistryIssues,
      meaningfulOverlapSeconds,
      sameDayCoverage: sameDayCoverageByGroup.get(
        sameDayGroupKey(scope.serviceDateYmd, session, evidence) ?? '',
      ) ?? null,
    }));
  }

  await deps.store.saveCases(cases);

  return {
    schemaVersion: AV53_CASE_SCHEMA_VERSION,
    brick: 'AV5.3',
    runId,
    requestedCount: workItems.length,
    processedCount: loaded.length,
    persistedCaseCount: cases.length,
    skippedCount: skipped.length,
    preScopeSkippedCount: skipped.filter((item) =>
      item.reason === 'before_validation_start').length,
    validationStartYmd: AV53_VALIDATION_START_YMD,
    pointReadDocumentBudget: workItems.length * 2,
    sameDayContextReadDocumentBudget: 0,
    staffRegistryLoadedOnce: true,
    casePreReads: 0,
    unboundedOperationalScans: false,
    caseIds: cases.map((item) => item.id),
    skipped,
    operationalMutationAllowed: false,
  };
}

class PreloadedAv53ShadowStore implements Av53ShadowStore {
  private readonly loadedByKey = new Map<string, Av53LoadedWorkItem>();

  constructor(
    private readonly delegate: FirestoreAv53ShadowStore,
    loaded: readonly Av53LoadedWorkItem[],
  ) {
    for (const item of loaded) {
      this.loadedByKey.set(
        `${item.item.classSessionId}|${item.item.evidenceId}`,
        item,
      );
    }
  }

  async loadWorkItems(
    items: readonly Av53ShadowWorkItem[],
  ): Promise<Av53LoadedWorkItem[]> {
    return items.map((item) =>
      this.loadedByKey.get(`${item.classSessionId}|${item.evidenceId}`))
      .filter((item): item is Av53LoadedWorkItem => Boolean(item));
  }

  async saveCases(
    cases: readonly Av53ValidationCaseDocument[],
  ): Promise<void> {
    return this.delegate.saveCases(cases);
  }
}

export class FirestoreAv53ShadowStore implements Av53ShadowStore {
  constructor(private readonly db: Firestore) {}

  async loadWorkItems(
    items: readonly Av53ShadowWorkItem[],
  ): Promise<Av53LoadedWorkItem[]> {
    if (items.length === 0) return [];

    const refs = items.flatMap((item) => [
      this.db.collection('classSessions').doc(item.classSessionId),
      this.db.collection('attendanceValidationEvidence').doc(item.evidenceId),
    ]);

    const snapshots = await this.db.getAll(...refs);
    return items.map((item, index) => {
      const sessionSnapshot = snapshots[index * 2];
      const evidenceSnapshot = snapshots[index * 2 + 1];

      return {
        item,
        session: sessionSnapshot.exists
          ? (sessionSnapshot.data() as Record<string, unknown>)
          : null,
        evidence: evidenceSnapshot.exists
          ? (evidenceSnapshot.data() as AttendanceValidationEvidenceDocument)
          : null,
      };
    });
  }

  async saveCases(
    cases: readonly Av53ValidationCaseDocument[],
  ): Promise<void> {
    if (cases.length === 0) return;

    const batch = this.db.batch();
    for (const validationCase of cases) {
      batch.set(
        this.db
          .collection(ATTENDANCE_VALIDATION_CASES_COLLECTION)
          .doc(validationCase.id),
        validationCase,
        { merge: false },
      );
    }
    await batch.commit();
  }
}

/**
 * Production adapter for later activation. There is intentionally no exported
 * Cloud Function or scheduler in AV5.3.
 *
 * The staff registry is loaded once per run; work-item reads remain exact point
 * reads and case writes do not pre-read existing case documents.
 */
export async function runAv53ShadowWithFirestore(
  db: Firestore,
  input: Av53ShadowRunInput,
  now: () => Date = () => new Date(),
): Promise<Av53ShadowRunResult> {
  const staffRegistry = await loadProductionStaffIdentityRegistry(db, now);
  const baseStore = new FirestoreAv53ShadowStore(db);
  const normalizedItems = normalizeWorkItems(input.workItems);
  const preloaded = await baseStore.loadWorkItems(normalizedItems);

  const groupKeysByDate = new Map<string, Set<string>>();
  for (const loadedItem of preloaded) {
    if (!loadedItem.session) continue;
    const scope = scopeDecision(loadedItem.session, loadedItem.evidence);
    if (scope.kind !== 'in_scope') continue;
    const key = sameDayGroupKey(
      scope.serviceDateYmd,
      loadedItem.session,
      loadedItem.evidence,
    );
    if (!key) continue;
    if (!groupKeysByDate.has(scope.serviceDateYmd)) {
      groupKeysByDate.set(scope.serviceDateYmd, new Set());
    }
    groupKeysByDate.get(scope.serviceDateYmd)!.add(key);
  }

  const sameDayPresentCountByGroup = new Map<string, number>();
  const sameDayContextIncompleteGroups = new Set<string>();
  let sameDayContextReadDocumentBudget = 0;
  const DAILY_SESSION_CONTEXT_LIMIT = 500;

  for (const [serviceDateYmd, wantedGroups] of groupKeysByDate) {
    const snapshot = await db
      .collection('classSessions')
      .where('date', '==', serviceDateYmd)
      .limit(DAILY_SESSION_CONTEXT_LIMIT + 1)
      .get();
    sameDayContextReadDocumentBudget += snapshot.size;

    if (snapshot.size > DAILY_SESSION_CONTEXT_LIMIT) {
      for (const groupKey of wantedGroups) {
        sameDayContextIncompleteGroups.add(groupKey);
      }
      continue;
    }

    for (const docSnapshot of snapshot.docs) {
      const session = (docSnapshot.data() || {}) as Record<string, unknown>;
      const groupKey = sameDayGroupKey(serviceDateYmd, session, null);
      if (!groupKey || !wantedGroups.has(groupKey)) continue;
      const kidId = sessionKidId(session);
      const attendance = normalizeTinyStepsAttendance(
        attendanceEntryForKid(session, kidId),
      );
      if (attendance !== 'present') continue;
      sameDayPresentCountByGroup.set(
        groupKey,
        (sameDayPresentCountByGroup.get(groupKey) ?? 0) + 1,
      );
    }
  }

  const result = await runAv53Shadow(input, {
    store: new PreloadedAv53ShadowStore(baseStore, preloaded),
    staffRegistry,
    now,
    sameDayPresentCountByGroup,
    sameDayContextIncompleteGroups,
  });

  return {
    ...result,
    sameDayContextReadDocumentBudget,
  };
}
