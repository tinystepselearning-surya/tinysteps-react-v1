import { describe, expect, it } from 'vitest';
import {
  analyzeTeacherEarningsCanonicalCoverage,
  analyzeTeacherEarningsLegacyMonthCoverage,
} from '../src/helpers/teacherEarningsCanonicalAudit';

describe('teacher earnings canonical coverage audit', () => {
  it('reports clean canonical current-month session coverage', () => {
    const result = analyzeTeacherEarningsCanonicalCoverage([
      {
        id: 'session-1',
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
      },
      {
        id: 'session-2',
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        sessionId: 'session-2',
        source: 'session_present_completed',
        status: 'paid',
      },
      {
        id: 'demo-demo-1',
        teacherId: 'teacher-2',
        monthKey: '2026-08',
        source: 'demo_completed',
        status: 'unpaid',
      },
    ]);

    expect(result).toMatchObject({
      totalRows: 3,
      activeRows: 3,
      archivedRows: 0,
      standaloneRows: 1,
      sessionLinkedRows: 2,
      canonicalSessionRows: 2,
      nonCanonicalSessionRows: 0,
      sessionSourceMissingSessionIdRows: 0,
      missingTeacherIdRows: 0,
      duplicateSessionIdGroups: 0,
      uniqueTeacherCount: 2,
      coverageCleanForFurtherDeltaDesign: true,
    });
  });

  it('detects duplicate session rows and whether the canonical document is present', () => {
    const result = analyzeTeacherEarningsCanonicalCoverage([
      {
        id: 'session-1',
        teacherId: 'teacher-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
      },
      {
        id: 'legacy-earning-1',
        teacherId: 'teacher-1',
        sessionId: 'session-1',
        source: 'session_present_completed',
        status: 'unpaid',
      },
      {
        id: 'legacy-a',
        teacherId: 'teacher-2',
        sessionId: 'session-2',
        source: 'session_present_completed',
        status: 'unpaid',
      },
      {
        id: 'legacy-b',
        teacherId: 'teacher-2',
        sessionId: 'session-2',
        source: 'session_present_completed',
        status: 'void',
      },
    ]);

    expect(result).toMatchObject({
      sessionLinkedRows: 4,
      canonicalSessionRows: 1,
      nonCanonicalSessionRows: 3,
      duplicateSessionIdGroups: 2,
      duplicateSessionRows: 4,
      duplicateGroupsWithCanonicalRow: 1,
      duplicateGroupsWithoutCanonicalRow: 1,
      voidRows: 1,
      coverageCleanForFurtherDeltaDesign: false,
    });
    expect(result.samples.duplicateSessionIdGroups).toEqual([
      {
        sessionId: 'session-1',
        documentIds: ['legacy-earning-1', 'session-1'],
        canonicalDocumentPresent: true,
      },
      {
        sessionId: 'session-2',
        documentIds: ['legacy-a', 'legacy-b'],
        canonicalDocumentPresent: false,
      },
    ]);
  });

  it('flags session earnings missing sessionId and rows missing canonical teacher ownership', () => {
    const result = analyzeTeacherEarningsCanonicalCoverage([
      {
        id: 'earning-1',
        teacherId: '',
        source: 'session_present_completed',
        status: 'unpaid',
      },
      {
        id: 'demo-1',
        teacherId: 'teacher-1',
        source: 'demo_completed',
        status: 'unpaid',
      },
    ]);

    expect(result).toMatchObject({
      sessionLinkedRows: 1,
      sessionSourceMissingSessionIdRows: 1,
      missingTeacherIdRows: 1,
      standaloneRows: 1,
      coverageCleanForFurtherDeltaDesign: false,
    });
    expect(result.samples.sessionSourceMissingSessionIdRows[0]?.id).toBe('earning-1');
    expect(result.samples.missingTeacherIdRows[0]?.id).toBe('earning-1');
  });

  it('counts archived rows but excludes them from canonical coverage and samples', () => {
    const result = analyzeTeacherEarningsCanonicalCoverage(
      [
        {
          id: 'legacy-1',
          teacherId: '',
          sessionId: 'session-1',
          source: 'session_present_completed',
          archived: true,
        },
        {
          id: 'legacy-2',
          teacherId: 'teacher-1',
          sessionId: 'session-2',
          source: 'session_present_completed',
        },
      ],
      1,
    );

    expect(result.archivedRows).toBe(1);
    expect(result.activeRows).toBe(1);
    expect(result.nonCanonicalSessionRows).toBe(1);
    expect(result.missingTeacherIdRows).toBe(0);
    expect(result.samples.nonCanonicalSessionRows).toHaveLength(1);
    expect(result.samples.nonCanonicalSessionRows[0]?.id).toBe('legacy-2');
  });
});

describe('teacher earnings legacy month coverage audit', () => {
  it('reports clean coverage when active rows have explicit consistent month keys', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [
        {
          id: 'session-1',
          teacherId: 'teacher-1',
          monthKey: '2026-08',
          earnedAt: '2026-08-10T10:00:00+05:30',
        },
        {
          id: 'session-2',
          teacherId: 'teacher-1',
          monthKey: '2026-07',
          earnedAt: '2026-07-31T10:00:00+05:30',
        },
      ],
      '2026-08',
    );

    expect(result).toMatchObject({
      targetMonthKey: '2026-08',
      totalRows: 2,
      activeRows: 2,
      archivedRows: 0,
      explicitTargetMonthRows: 1,
      activeRowsMissingOrInvalidMonthKey: 0,
      derivedTargetRowsMissingOrInvalidMonthKey: 0,
      derivedTargetRowsStoredInDifferentMonth: 0,
      storedTargetRowsDerivedIntoDifferentMonth: 0,
      undatedRowsMissingOrInvalidMonthKey: 0,
      legacyMonthCoverageClean: true,
    });
  });

  it('detects a target-month earning whose month exists only in timestamps', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [
        {
          id: 'legacy-current',
          teacherId: 'teacher-1',
          earnedAt: '2026-08-12T12:00:00+05:30',
        },
      ],
      '2026-08',
    );

    expect(result).toMatchObject({
      activeRowsMissingOrInvalidMonthKey: 1,
      derivedTargetRowsMissingOrInvalidMonthKey: 1,
      legacyMonthCoverageClean: false,
    });
    expect(result.samples.derivedTargetRowsMissingOrInvalidMonthKey[0]).toMatchObject({
      id: 'legacy-current',
      teacherId: 'teacher-1',
      derivedMonthKey: '2026-08',
    });
  });

  it('detects stored/derived month conflicts in both directions', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [
        {
          id: 'wrong-stored-month',
          teacherId: 'teacher-1',
          monthKey: '2026-07',
          earnedAt: '2026-08-02T10:00:00+05:30',
        },
        {
          id: 'wrong-target-month',
          teacherId: 'teacher-2',
          monthKey: '2026-08',
          earnedAt: '2026-07-31T10:00:00+05:30',
        },
      ],
      '2026-08',
    );

    expect(result).toMatchObject({
      derivedTargetRowsStoredInDifferentMonth: 1,
      storedTargetRowsDerivedIntoDifferentMonth: 1,
      legacyMonthCoverageClean: false,
    });
    expect(result.samples.derivedTargetRowsStoredInDifferentMonth[0]?.id).toBe('wrong-stored-month');
    expect(result.samples.storedTargetRowsDerivedIntoDifferentMonth[0]?.id).toBe('wrong-target-month');
  });

  it('detects undated rows with no usable month key', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [{ id: 'undated', teacherId: 'teacher-1', monthKey: 'legacy' }],
      '2026-08',
    );

    expect(result).toMatchObject({
      activeRowsMissingOrInvalidMonthKey: 1,
      undatedRowsMissingOrInvalidMonthKey: 1,
      legacyMonthCoverageClean: false,
    });
    expect(result.samples.undatedRowsMissingOrInvalidMonthKey[0]?.id).toBe('undated');
  });

  it('ignores archived legacy rows as blockers', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [
        {
          id: 'archived-current',
          teacherId: 'teacher-1',
          earnedAt: '2026-08-12T12:00:00+05:30',
          archived: true,
        },
      ],
      '2026-08',
    );

    expect(result).toMatchObject({
      totalRows: 1,
      activeRows: 0,
      archivedRows: 1,
      activeRowsMissingOrInvalidMonthKey: 0,
      derivedTargetRowsMissingOrInvalidMonthKey: 0,
      legacyMonthCoverageClean: true,
    });
  });

  it('derives IST month from Firestore timestamp-like values', () => {
    const result = analyzeTeacherEarningsLegacyMonthCoverage(
      [
        {
          id: 'timestamp-row',
          teacherId: 'teacher-1',
          earnedAt: { seconds: 1787598000, nanoseconds: 0 },
        },
      ],
      '2026-08',
    );

    expect(result.derivedTargetRowsMissingOrInvalidMonthKey).toBe(1);
    expect(result.legacyMonthCoverageClean).toBe(false);
  });
});
