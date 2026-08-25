import type {
  TeacherEarningsCanonicalCoverage,
  TeacherEarningsLegacyMonthCoverage,
} from './teacherEarningsCanonicalAudit';
import {
  teacherEarningContributionFor,
  teacherMonthRollupTargetFor,
  type TeacherEarningsContribution,
  type TeacherMonthRollupTarget,
} from './teacherEarningsRollupDelta';

export const TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION = 2;
export const TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT =
  'canonical_session_earning_id_and_service_month_v2';

export type TeacherEarningsSessionCreateFastPathReadiness = {
  ready: boolean;
  blockers: string[];
};

export type TeacherEarningsSessionCreateCandidate = {
  eligible: true;
  target: TeacherMonthRollupTarget;
  delta: TeacherEarningsContribution;
};

export type TeacherEarningsSessionCreateCandidateDecision =
  | TeacherEarningsSessionCreateCandidate
  | { eligible: false; reason: string };

export type TeacherEarningsSessionCreateCertificationDecision =
  | { ready: true }
  | { ready: false; reason: string };

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const finiteNonNegativeNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

const zeroOrAbsentNumber = (value: unknown): boolean =>
  value == null || (typeof value === 'number' && Number.isFinite(value) && value === 0);

const emptyOrAbsentList = (value: unknown): boolean =>
  value == null || (Array.isArray(value) && value.length === 0);

const zeroInteger = (value: unknown): boolean => value === 0;

const nonNegativeInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;

/**
 * Brick 7D1 production-evidence gate for considering an incremental session-earning create path.
 *
 * This helper does not enable any runtime finance behavior. It only evaluates a complete bounded
 * full-ledger audit. The gate intentionally fails closed when evidence is truncated/incomplete or
 * when any active historical session earning is non-canonical, duplicated, missing identity, or
 * stored under inconsistent month coverage.
 */
export function evaluateTeacherEarningsSessionCreateFastPathReadiness(input: {
  fullLedgerEvidenceComplete: boolean;
  coverage: TeacherEarningsCanonicalCoverage;
  legacyMonthCoverage: TeacherEarningsLegacyMonthCoverage | null;
}): TeacherEarningsSessionCreateFastPathReadiness {
  const blockers: string[] = [];
  const { coverage, legacyMonthCoverage } = input;

  if (!input.fullLedgerEvidenceComplete) blockers.push('full_ledger_evidence_incomplete');
  if (!legacyMonthCoverage) blockers.push('legacy_month_coverage_not_run');
  else if (!legacyMonthCoverage.legacyMonthCoverageClean) blockers.push('legacy_month_coverage_not_clean');

  if (coverage.duplicateSessionIdGroups > 0) blockers.push('duplicate_session_earning_groups');
  if (coverage.nonCanonicalSessionRows > 0) blockers.push('noncanonical_session_earning_ids');
  if (coverage.sessionSourceMissingSessionIdRows > 0) blockers.push('session_source_missing_session_id');
  if (coverage.missingTeacherIdRows > 0) blockers.push('missing_teacher_id_rows');
  if (coverage.sessionLinkedRows !== coverage.canonicalSessionRows) {
    blockers.push('session_linked_rows_not_fully_canonical');
  }

  return {
    ready: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
  };
}

/**
 * Runtime 7D2B candidate gate for the exact new-session earning shape produced by revenue.ts.
 *
 * This deliberately does not make the general delta planner less conservative. A create can only
 * become a candidate when the document id equals sessionId, the canonical teacher/month target is
 * explicit, the writer's initial unpaid/no-payout state is intact, and amount is a finite stored
 * number. Session deletes and any legacy/ambiguous create remain authoritative recomputes.
 */
export function planTeacherEarningsSessionCreateCandidate(input: {
  earningId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): TeacherEarningsSessionCreateCandidateDecision {
  if (input.before || !input.after) {
    return { eligible: false, reason: 'not_session_create' };
  }

  const earningId = normalizeText(input.earningId);
  const after = input.after;
  const sessionId = normalizeText(after.sessionId);
  if (!earningId || !sessionId || earningId !== sessionId) {
    return { eligible: false, reason: 'session_create_not_canonical_id' };
  }

  const source = normalizeStatus(after.source);
  if (source && source !== 'session_present_completed') {
    return { eligible: false, reason: 'session_create_source_not_canonical' };
  }
  if (after.archived === true || normalizeStatus(after.status) !== 'unpaid') {
    return { eligible: false, reason: 'session_create_initial_state_not_canonical' };
  }
  if (finiteNonNegativeNumber(after.amount) == null) {
    return { eligible: false, reason: 'session_create_amount_not_canonical_number' };
  }
  if (
    !zeroOrAbsentNumber(after.paidAmount) ||
    !zeroOrAbsentNumber(after.reversedPaidAmount) ||
    !emptyOrAbsentList(after.payoutIds) ||
    !emptyOrAbsentList(after.reversedPayoutIds) ||
    after.paidAt != null
  ) {
    return { eligible: false, reason: 'session_create_has_payout_state' };
  }

  const target = teacherMonthRollupTargetFor(after);
  if (!target) return { eligible: false, reason: 'session_create_target_missing' };

  const delta = teacherEarningContributionFor(after);
  if (
    delta.totalSessions !== 1 ||
    delta.sessionsCompleted !== 1 ||
    delta.demoEarnings !== 0 ||
    delta.demoCompletedCount !== 0 ||
    delta.demoEnrollmentBonusCount !== 0
  ) {
    return { eligible: false, reason: 'session_create_contribution_not_canonical' };
  }

  return { eligible: true, target, delta };
}

/**
 * Validates the persisted month certification inside the same Firestore transaction that would
 * apply a session-create delta. Exact version/source checks intentionally fail closed so a stale,
 * invalidated, future-incompatible, or partially-populated certification cannot enable the path.
 */
export function evaluateTeacherEarningsSessionCreateCertification(input: {
  certification: Record<string, unknown> | null;
  target: TeacherMonthRollupTarget;
}): TeacherEarningsSessionCreateCertificationDecision {
  const certification = input.certification;
  if (!certification) return { ready: false, reason: 'session_create_certification_missing' };
  if (normalizeText(certification.monthKey) !== input.target.monthKey) {
    return { ready: false, reason: 'session_create_certification_month_mismatch' };
  }
  if (certification.ready !== true) {
    return { ready: false, reason: 'session_create_certification_not_ready' };
  }
  if (certification.certificationVersion !== TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION) {
    return { ready: false, reason: 'session_create_certification_version_mismatch' };
  }
  if (
    normalizeText(certification.sourceCodeContract) !==
    TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT
  ) {
    return { ready: false, reason: 'session_create_certification_contract_mismatch' };
  }
  if (
    certification.fullLedgerEvidenceComplete !== true ||
    certification.legacyMonthCoverageClean !== true
  ) {
    return { ready: false, reason: 'session_create_certification_evidence_incomplete' };
  }
  if (
    !zeroInteger(certification.duplicateSessionIdGroups) ||
    !zeroInteger(certification.nonCanonicalSessionRows) ||
    !zeroInteger(certification.sessionSourceMissingSessionIdRows) ||
    !zeroInteger(certification.missingTeacherIdRows)
  ) {
    return { ready: false, reason: 'session_create_certification_canonical_coverage_dirty' };
  }
  if (!Array.isArray(certification.blockers) || certification.blockers.length !== 0) {
    return { ready: false, reason: 'session_create_certification_has_blockers' };
  }

  const sessionLinkedRows = nonNegativeInteger(certification.sessionLinkedRows);
  const canonicalSessionRows = nonNegativeInteger(certification.canonicalSessionRows);
  if (
    sessionLinkedRows == null ||
    canonicalSessionRows == null ||
    sessionLinkedRows !== canonicalSessionRows
  ) {
    return { ready: false, reason: 'session_create_certification_session_counts_invalid' };
  }

  const sessionEvidence = certification.sessionEvidence;
  if (!sessionEvidence || typeof sessionEvidence !== 'object') {
    return { ready: false, reason: 'session_create_certification_session_evidence_missing' };
  }
  const evidence = sessionEvidence as Record<string, unknown>;
  const requested = nonNegativeInteger(evidence.requestedSessionCount);
  const found = nonNegativeInteger(evidence.foundSessionCount);
  if (
    requested == null ||
    found == null ||
    requested !== found ||
    !zeroInteger(evidence.missingSessionCount) ||
    !zeroInteger(evidence.unresolvedServiceMonthCount)
  ) {
    return { ready: false, reason: 'session_create_certification_session_evidence_dirty' };
  }

  return { ready: true };
}
