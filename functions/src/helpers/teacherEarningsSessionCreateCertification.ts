export const TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION = 2;
export const TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT =
  'canonical_session_earning_id_and_service_month_v2';

export type TeacherEarningsSessionCreateCertificationDecision =
  | { valid: true }
  | { valid: false; reason: string };

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

/**
 * Fail-closed Brick 7D2B validation for the month-level production evidence document.
 * This is intentionally pure so the executor can evaluate the exact document read inside its
 * existing rollup transaction without introducing another write path or rollup implementation.
 */
export const evaluateTeacherEarningsSessionCreateCertification = (input: {
  targetMonthKey: string;
  certification: Record<string, unknown> | null;
}): TeacherEarningsSessionCreateCertificationDecision => {
  if (!input.certification) {
    return { valid: false, reason: 'session_create_certification_missing' };
  }

  const certification = input.certification;
  const monthKey = normalizeText(certification.monthKey);
  if (!/^\d{4}-\d{2}$/.test(monthKey) || monthKey !== input.targetMonthKey) {
    return { valid: false, reason: 'session_create_certification_month_mismatch' };
  }
  if (certification.ready !== true) {
    return { valid: false, reason: 'session_create_certification_not_ready' };
  }

  const certificationVersion = certification.certificationVersion;
  if (
    typeof certificationVersion !== 'number' ||
    !Number.isFinite(certificationVersion) ||
    certificationVersion < TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION
  ) {
    return { valid: false, reason: 'session_create_certification_version_unsupported' };
  }
  if (certification.fullLedgerEvidenceComplete !== true) {
    return { valid: false, reason: 'session_create_certification_ledger_incomplete' };
  }
  if (certification.legacyMonthCoverageClean !== true) {
    return { valid: false, reason: 'session_create_certification_month_coverage_not_clean' };
  }
  if (!Array.isArray(certification.blockers)) {
    return { valid: false, reason: 'session_create_certification_malformed' };
  }
  if (certification.blockers.length > 0) {
    return { valid: false, reason: 'session_create_certification_blocked' };
  }
  if (certification.sourceCodeContract !== TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT) {
    return { valid: false, reason: 'session_create_certification_source_contract_mismatch' };
  }

  return { valid: true };
};
