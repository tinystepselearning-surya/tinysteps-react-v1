import { describe, expect, it } from 'vitest';
import { analyzeTeacherEarningsCanonicalCoverage } from '../src/helpers/teacherEarningsCanonicalAudit';

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

  it('counts archived rows separately and respects the sample cap', () => {
    const result = analyzeTeacherEarningsCanonicalCoverage(
      [
        {
          id: 'legacy-1',
          teacherId: 'teacher-1',
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
    expect(result.nonCanonicalSessionRows).toBe(2);
    expect(result.samples.nonCanonicalSessionRows).toHaveLength(1);
  });
});
