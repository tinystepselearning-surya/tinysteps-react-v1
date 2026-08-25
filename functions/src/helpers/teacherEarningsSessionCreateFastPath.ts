import type {
  TeacherEarningsCanonicalCoverage,
  TeacherEarningsLegacyMonthCoverage,
} from './teacherEarningsCanonicalAudit';

export type TeacherEarningsSessionCreateFastPathReadiness = {
  ready: boolean;
  blockers: string[];
};

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
