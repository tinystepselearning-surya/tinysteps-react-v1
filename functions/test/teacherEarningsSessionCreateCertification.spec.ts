import { describe, expect, it } from 'vitest';
import {
  evaluateTeacherEarningsSessionCreateCertification,
  TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
} from '../src/helpers/teacherEarningsSessionCreateCertification';

const validCertification = {
  monthKey: '2026-08',
  ready: true,
  certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  fullLedgerEvidenceComplete: true,
  legacyMonthCoverageClean: true,
  duplicateSessionIdGroups: 0,
  nonCanonicalSessionRows: 0,
  sessionSourceMissingSessionIdRows: 0,
  missingTeacherIdRows: 0,
  blockers: [],
  sourceCodeContract: TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
};

describe('B6 Brick 7D2B session-create certification gate', () => {
  it('accepts only the complete canonical service-month v2-or-newer contract', () => {
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        targetMonthKey: '2026-08',
        certification: validCertification,
      }),
    ).toEqual({ valid: true });
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        targetMonthKey: '2026-08',
        certification: { ...validCertification, certificationVersion: 3 },
      }),
    ).toEqual({ valid: true });
  });

  it.each([
    [null, 'session_create_certification_missing'],
    [{ ...validCertification, monthKey: '2026-07' }, 'session_create_certification_month_mismatch'],
    [{ ...validCertification, ready: false }, 'session_create_certification_not_ready'],
    [
      { ...validCertification, certificationVersion: 1 },
      'session_create_certification_version_unsupported',
    ],
    [
      { ...validCertification, certificationVersion: '2' },
      'session_create_certification_version_unsupported',
    ],
    [
      { ...validCertification, fullLedgerEvidenceComplete: false },
      'session_create_certification_ledger_incomplete',
    ],
    [
      { ...validCertification, legacyMonthCoverageClean: false },
      'session_create_certification_month_coverage_not_clean',
    ],
    [{ ...validCertification, blockers: ['unsafe'] }, 'session_create_certification_blocked'],
    [{ ...validCertification, blockers: null }, 'session_create_certification_malformed'],
    [
      { ...validCertification, sourceCodeContract: 'legacy_v1' },
      'session_create_certification_source_contract_mismatch',
    ],
    [
      { ...validCertification, sourceCodeContract: ` ${validCertification.sourceCodeContract} ` },
      'session_create_certification_source_contract_mismatch',
    ],
  ])('fails closed for invalid certification %#', (certification, reason) => {
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        targetMonthKey: '2026-08',
        certification: certification as Record<string, unknown> | null,
      }),
    ).toEqual({ valid: false, reason });
  });
});
