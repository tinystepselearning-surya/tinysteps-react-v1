import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeTeacherEarningsLegacyMonthCoverage } from '../src/helpers/teacherEarningsCanonicalAudit';
import {
  applyCanonicalSessionMonthEvidence,
  finalizeCanonicalServiceMonthCoverage,
  type TeacherEarningsSessionServiceMonthEvidence,
} from '../src/helpers/teacherEarningsServiceMonthEvidence';

const julySessionEarningWrittenInAugust = {
  id: 'session-july',
  teacherId: 'teacher-1',
  sessionId: 'session-july',
  source: 'session_present_completed',
  status: 'unpaid',
  monthKey: '2026-07',
  earnedAt: '2026-08-02T10:00:00+05:30',
  createdAt: '2026-08-02T10:00:00+05:30',
  updatedAt: '2026-08-02T10:00:00+05:30',
};

const completeEvidence = (
  sessionServiceMonthById: ReadonlyMap<string, string | null>,
): TeacherEarningsSessionServiceMonthEvidence => ({
  sessionServiceMonthById,
  requestedSessionCount: 1,
  foundSessionCount: 1,
  missingSessionCount: 0,
  unresolvedServiceMonthCount: 0,
});

describe('B6 7D canonical session service-month evidence', () => {
  it('does not treat August processing timestamps as the service month for a July session', () => {
    const map = new Map([['session-july', '2026-07']]);
    const evidenceRows = applyCanonicalSessionMonthEvidence(
      [julySessionEarningWrittenInAugust],
      map,
    );
    const coverage = analyzeTeacherEarningsLegacyMonthCoverage(evidenceRows, '2026-08');
    const result = finalizeCanonicalServiceMonthCoverage(coverage, completeEvidence(map));

    expect(result.derivedTargetRowsStoredInDifferentMonth).toBe(0);
    expect(result.storedTargetRowsDerivedIntoDifferentMonth).toBe(0);
    expect(result.legacyMonthCoverageClean).toBe(true);
  });

  it('still blocks a real stored-July versus canonical-August session mismatch', () => {
    const map = new Map([['session-july', '2026-08']]);
    const evidenceRows = applyCanonicalSessionMonthEvidence(
      [julySessionEarningWrittenInAugust],
      map,
    );
    const coverage = analyzeTeacherEarningsLegacyMonthCoverage(evidenceRows, '2026-08');
    const result = finalizeCanonicalServiceMonthCoverage(coverage, completeEvidence(map));

    expect(result.derivedTargetRowsStoredInDifferentMonth).toBe(1);
    expect(result.legacyMonthCoverageClean).toBe(false);
  });

  it('fails closed when a linked session is missing or its service month is unresolved', () => {
    const coverage = analyzeTeacherEarningsLegacyMonthCoverage(
      applyCanonicalSessionMonthEvidence(
        [julySessionEarningWrittenInAugust],
        new Map([['session-july', null]]),
      ),
      '2026-08',
    );

    const missing = finalizeCanonicalServiceMonthCoverage(coverage, {
      sessionServiceMonthById: new Map([['session-july', null]]),
      requestedSessionCount: 1,
      foundSessionCount: 0,
      missingSessionCount: 1,
      unresolvedServiceMonthCount: 0,
    });
    expect(missing.legacyMonthCoverageClean).toBe(false);

    const unresolved = finalizeCanonicalServiceMonthCoverage(coverage, {
      sessionServiceMonthById: new Map([['session-july', null]]),
      requestedSessionCount: 1,
      foundSessionCount: 1,
      missingSessionCount: 0,
      unresolvedServiceMonthCount: 1,
    });
    expect(unresolved.legacyMonthCoverageClean).toBe(false);
  });

  it('wires all runtime evidence gates to canonical session service-month evidence', () => {
    const files = [
      'functions/src/auditTeacherEarningsCanonicalCoverage.ts',
      'functions/src/certifyTeacherEarningsSessionCreateFastPath.ts',
      'functions/src/prepareTeacherFinanceAnalyticsRollups.ts',
    ];

    for (const file of files) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(source).toContain('analyzeTeacherEarningsCanonicalServiceMonthCoverage');
      expect(source).not.toContain('analyzeTeacherEarningsLegacyMonthCoverage(');
    }
  });

  it('keeps the base planner fail-closed unless the executor supplies certified opt-in', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/helpers/teacherEarningsRollupDelta.ts'),
      'utf8',
    );
    expect(source).toContain("reason: 'session_create_or_delete'");
  });
});
