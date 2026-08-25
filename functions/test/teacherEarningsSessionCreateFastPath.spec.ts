import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
} from '../src/helpers/teacherEarningsCanonicalAudit';
import { evaluateTeacherEarningsSessionCreateFastPathReadiness } from '../src/helpers/teacherEarningsSessionCreateFastPath';
import {
  isCanonicalSessionCreateFastPathCandidate,
  planTeacherEarningsRollupChange,
} from '../src/helpers/teacherEarningsRollupDelta';

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

describe('B6 Brick 7D1 session-create fast-path evidence gate', () => {
  it('reports ready only for complete, clean full-ledger evidence', () => {
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

  it('blocks duplicate or non-canonical session earnings', () => {
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

  it('blocks missing session/teacher identity and dirty legacy month coverage', () => {
    const rows = [
      {
        id: 'broken-session',
        teacherId: '',
        monthKey: '2026-08',
        source: 'session_present_completed',
        status: 'unpaid',
        earnedAt: '2026-08-12T10:00:00+05:30',
      },
      {
        id: 'legacy-month-row',
        teacherId: 'teacher-1',
        sessionId: 'legacy-month-row',
        source: 'session_present_completed',
        status: 'unpaid',
        earnedAt: '2026-08-13T10:00:00+05:30',
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
    expect(result.blockers).toContain('legacy_month_coverage_not_clean');
    expect(result.blockers).toContain('session_source_missing_session_id');
    expect(result.blockers).toContain('missing_teacher_id_rows');
  });

  it('proves the active session accrual writer uses teacherEarnings/{sessionId}', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/revenue.ts'),
      'utf8',
    );

    expect(source).toContain("const earningRef = db.collection('teacherEarnings').doc(sessionId)");
    const earningPayloadStart = source.indexOf(
      'const earningPayload: Record<string, any> = {\n          sessionId,',
    );
    expect(earningPayloadStart).toBeGreaterThan(-1);
    const earningPayloadEnd = source.indexOf('\n        };', earningPayloadStart);
    expect(earningPayloadEnd).toBeGreaterThan(earningPayloadStart);
    const earningPayloadSource = source.slice(earningPayloadStart, earningPayloadEnd);
    expect(earningPayloadSource).toContain("source: 'session_present_completed'");
    expect(source).not.toContain("collection('teacherEarnings').add(");
  });

  it('accepts the canonical revenue-writer shape as a certified session-create candidate', () => {
    expect(
      isCanonicalSessionCreateFastPathCandidate({
        earningId: 'session-writer-shape',
        before: null,
        after: {
          sessionId: 'session-writer-shape',
          enrollmentId: 'enrollment-1',
          kidId: 'kid-1',
          teacherId: 'teacher-1',
          parentId: 'parent-1',
          courseId: 'course-1',
          amount: 175,
          currency: 'INR',
          status: 'unpaid',
          source: 'session_present_completed',
          monthKey: '2026-08',
        },
      }),
    ).toBe(true);
  });

  it('keeps session creation on authoritative recompute until a separate 7D2 cutover', () => {
    expect(
      planTeacherEarningsRollupChange({
        earningId: 'session-2',
        before: null,
        after: {
          teacherId: 'teacher-1',
          monthKey: '2026-08',
          sessionId: 'session-2',
          source: 'session_present_completed',
          amount: 175,
          status: 'unpaid',
        },
      }),
    ).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_create_or_delete',
    });
  });

  it('exposes the production evidence result from the existing read-only audit without writes', () => {
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
