import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
} from '../src/helpers/teacherEarningsCanonicalAudit';
import {
  evaluateTeacherEarningsSessionCreateCertification,
  evaluateTeacherEarningsSessionCreateFastPathReadiness,
  planTeacherEarningsSessionCreateCandidate,
  TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
} from '../src/helpers/teacherEarningsSessionCreateFastPath';
import { planTeacherEarningsRollupChange } from '../src/helpers/teacherEarningsRollupDelta';

const cleanRows = [
  {
    id: 'session-1',
    teacherId: 'teacher-1',
    monthKey: '2026-08',
    sessionId: 'session-1',
    source: 'session_present_completed',
    status: 'unpaid',
    earnedAt: '2026-08-10T10:00:00+05:30',
  },
  {
    id: 'demo-demo-1',
    teacherId: 'teacher-2',
    monthKey: '2026-08',
    source: 'demo_completed',
    status: 'unpaid',
    earnedAt: '2026-08-11T10:00:00+05:30',
  },
];

const cleanCertification = {
  monthKey: '2026-08',
  ready: true,
  certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  fullLedgerEvidenceComplete: true,
  sessionLinkedRows: 576,
  canonicalSessionRows: 576,
  duplicateSessionIdGroups: 0,
  nonCanonicalSessionRows: 0,
  sessionSourceMissingSessionIdRows: 0,
  missingTeacherIdRows: 0,
  legacyMonthCoverageClean: true,
  sessionEvidence: {
    requestedSessionCount: 2682,
    foundSessionCount: 2682,
    missingSessionCount: 0,
    unresolvedServiceMonthCount: 0,
  },
  blockers: [],
  sourceCodeContract: TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
};

describe('B6 Brick 7D session-create fast-path gates', () => {
  it('reports evidence ready only for complete, clean full-ledger evidence', () => {
    const coverage = analyzeTeacherEarningsCanonicalCoverage(cleanRows);
    const legacyMonthCoverage = analyzeTeacherEarningsLegacyMonthCoverage(cleanRows, '2026-08');

    expect(
      evaluateTeacherEarningsSessionCreateFastPathReadiness({
        fullLedgerEvidenceComplete: true,
        coverage,
        legacyMonthCoverage,
      }),
    ).toEqual({ ready: true, blockers: [] });
  });

  it('fails closed when the full-ledger scan is incomplete or legacy month coverage was not run', () => {
    const coverage = analyzeTeacherEarningsCanonicalCoverage(cleanRows);

    expect(
      evaluateTeacherEarningsSessionCreateFastPathReadiness({
        fullLedgerEvidenceComplete: false,
        coverage,
        legacyMonthCoverage: null,
      }),
    ).toEqual({
      ready: false,
      blockers: ['full_ledger_evidence_incomplete', 'legacy_month_coverage_not_run'],
    });
  });

  it('blocks duplicate or non-canonical historical session earnings', () => {
    const rows = [
      ...cleanRows,
      {
        id: 'legacy-session-1',
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
        earnedAt: '2026-08-10T10:00:00+05:30',
      },
    ];
    const coverage = analyzeTeacherEarningsCanonicalCoverage(rows);
    const legacyMonthCoverage = analyzeTeacherEarningsLegacyMonthCoverage(rows, '2026-08');
    const result = evaluateTeacherEarningsSessionCreateFastPathReadiness({
      fullLedgerEvidenceComplete: true,
      coverage,
      legacyMonthCoverage,
    });

    expect(result.ready).toBe(false);
    expect(result.blockers).toContain('duplicate_session_earning_groups');
    expect(result.blockers).toContain('noncanonical_session_earning_ids');
    expect(result.blockers).toContain('session_linked_rows_not_fully_canonical');
  });

  it('proves the active session accrual writer uses teacherEarnings/{sessionId}', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/revenue.ts'),
      'utf8',
    );

    expect(source).toContain("const earningRef = db.collection('teacherEarnings').doc(sessionId)");
    expect(source).toContain("!earningSnap.exists ? 'unpaid' : earningStatus");
    expect(source).toContain('const earningPayload: Record<string, any> = {\n          sessionId,');
    expect(source).not.toContain("collection('teacherEarnings').add(");
  });

  it('keeps the general planner conservative while the dedicated canonical-create gate can qualify the writer shape', () => {
    const after = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      sessionId: 'session-2',
      amount: 175,
      status: 'unpaid',
    };

    expect(
      planTeacherEarningsRollupChange({
        earningId: 'session-2',
        before: null,
        after,
      }),
    ).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_create_or_delete',
    });

    expect(
      planTeacherEarningsSessionCreateCandidate({
        earningId: 'session-2',
        before: null,
        after,
      }),
    ).toEqual({
      eligible: true,
      target: { teacherId: 'teacher-1', monthKey: '2026-08' },
      delta: {
        totalEarnings: 175,
        pendingEarnings: 175,
        totalSessions: 1,
        sessionsCompleted: 1,
        demoEarnings: 0,
        demoCompletedCount: 0,
        demoEnrollmentBonusCount: 0,
      },
    });
  });

  it('rejects noncanonical create ids, payout state, nonnumeric amounts, and deletes', () => {
    const base = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      sessionId: 'session-3',
      amount: 175,
      status: 'unpaid',
    };

    expect(
      planTeacherEarningsSessionCreateCandidate({
        earningId: 'legacy-id',
        before: null,
        after: base,
      }),
    ).toMatchObject({ eligible: false, reason: 'session_create_not_canonical_id' });
    expect(
      planTeacherEarningsSessionCreateCandidate({
        earningId: 'session-3',
        before: null,
        after: { ...base, paidAmount: 10 },
      }),
    ).toMatchObject({ eligible: false, reason: 'session_create_has_payout_state' });
    expect(
      planTeacherEarningsSessionCreateCandidate({
        earningId: 'session-3',
        before: null,
        after: { ...base, amount: '175' },
      }),
    ).toMatchObject({ eligible: false, reason: 'session_create_amount_not_canonical_number' });
    expect(
      planTeacherEarningsSessionCreateCandidate({
        earningId: 'session-3',
        before: base,
        after: null,
      }),
    ).toMatchObject({ eligible: false, reason: 'not_session_create' });
  });

  it('accepts only the exact v2 persisted certification contract', () => {
    const target = { teacherId: 'teacher-1', monthKey: '2026-08' };
    expect(
      evaluateTeacherEarningsSessionCreateCertification({ certification: cleanCertification, target }),
    ).toEqual({ ready: true });

    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        certification: { ...cleanCertification, certificationVersion: 1 },
        target,
      }),
    ).toMatchObject({ ready: false, reason: 'session_create_certification_version_mismatch' });
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        certification: { ...cleanCertification, ready: false },
        target,
      }),
    ).toMatchObject({ ready: false, reason: 'session_create_certification_not_ready' });
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        certification: { ...cleanCertification, blockers: ['unsafe'] },
        target,
      }),
    ).toMatchObject({ ready: false, reason: 'session_create_certification_has_blockers' });
    expect(
      evaluateTeacherEarningsSessionCreateCertification({
        certification: {
          ...cleanCertification,
          sessionEvidence: { ...cleanCertification.sessionEvidence, missingSessionCount: 1 },
        },
        target,
      }),
    ).toMatchObject({ ready: false, reason: 'session_create_certification_session_evidence_dirty' });
  });

  it('exposes production evidence from the existing read-only audit without writes', () => {
    const auditSource = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/auditTeacherEarningsCanonicalCoverage.ts'),
      'utf8',
    );

    expect(auditSource).toContain('evaluateTeacherEarningsSessionCreateFastPathReadiness');
    expect(auditSource).toContain('readyForSessionCreateFastPath');
    expect(auditSource).toContain('sessionCreateFastPath');
    expect(auditSource).not.toContain('.set(');
    expect(auditSource).not.toContain('.update(');
    expect(auditSource).not.toContain('.delete(');
  });
});
