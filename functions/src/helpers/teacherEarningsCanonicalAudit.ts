export type TeacherEarningAuditRow = Record<string, unknown> & { id: string };

export type TeacherEarningsCanonicalCoverage = {
  totalRows: number;
  activeRows: number;
  archivedRows: number;
  voidRows: number;
  standaloneRows: number;
  sessionLinkedRows: number;
  canonicalSessionRows: number;
  nonCanonicalSessionRows: number;
  sessionSourceMissingSessionIdRows: number;
  missingTeacherIdRows: number;
  duplicateSessionIdGroups: number;
  duplicateSessionRows: number;
  duplicateGroupsWithCanonicalRow: number;
  duplicateGroupsWithoutCanonicalRow: number;
  uniqueTeacherCount: number;
  coverageCleanForFurtherDeltaDesign: boolean;
  samples: {
    nonCanonicalSessionRows: Array<{
      id: string;
      sessionId: string;
      teacherId: string;
      source: string;
      status: string;
    }>;
    sessionSourceMissingSessionIdRows: Array<{
      id: string;
      teacherId: string;
      source: string;
      status: string;
    }>;
    missingTeacherIdRows: Array<{
      id: string;
      sessionId: string;
      source: string;
      status: string;
    }>;
    duplicateSessionIdGroups: Array<{
      sessionId: string;
      documentIds: string[];
      canonicalDocumentPresent: boolean;
    }>;
  };
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const isSessionLinked = (row: TeacherEarningAuditRow): boolean =>
  normalizeStatus(row.source) === 'session_present_completed' || Boolean(normalizeText(row.sessionId));

const samplePush = <T>(target: T[], value: T, limit: number): void => {
  if (target.length < limit) target.push(value);
};

/**
 * Pure current-month integrity analysis for teacherEarnings rows.
 *
 * This helper never mutates data. It is intentionally focused on the evidence needed before
 * expanding B6 beyond no-op suppression: duplicate sessionId rows, canonical earning IDs,
 * missing session links, and missing canonical teacher ownership.
 */
export function analyzeTeacherEarningsCanonicalCoverage(
  rows: TeacherEarningAuditRow[],
  sampleLimit = 20,
): TeacherEarningsCanonicalCoverage {
  const safeSampleLimit = Math.max(0, Math.min(Math.floor(sampleLimit), 100));
  const sessionGroups = new Map<string, string[]>();
  const teacherIds = new Set<string>();

  let archivedRows = 0;
  let voidRows = 0;
  let standaloneRows = 0;
  let sessionLinkedRows = 0;
  let canonicalSessionRows = 0;
  let nonCanonicalSessionRows = 0;
  let sessionSourceMissingSessionIdRows = 0;
  let missingTeacherIdRows = 0;

  const samples: TeacherEarningsCanonicalCoverage['samples'] = {
    nonCanonicalSessionRows: [],
    sessionSourceMissingSessionIdRows: [],
    missingTeacherIdRows: [],
    duplicateSessionIdGroups: [],
  };

  for (const row of rows) {
    const id = normalizeText(row.id);
    const teacherId = normalizeText(row.teacherId);
    const sessionId = normalizeText(row.sessionId);
    const source = normalizeStatus(row.source);
    const status = normalizeStatus(row.status);

    if (row.archived === true) archivedRows += 1;
    if (status === 'void') voidRows += 1;

    if (teacherId) {
      teacherIds.add(teacherId);
    } else {
      missingTeacherIdRows += 1;
      samplePush(
        samples.missingTeacherIdRows,
        { id, sessionId, source, status },
        safeSampleLimit,
      );
    }

    const sessionLinked = isSessionLinked(row);
    if (!sessionLinked) {
      standaloneRows += 1;
      continue;
    }

    sessionLinkedRows += 1;

    if (!sessionId) {
      if (source === 'session_present_completed') {
        sessionSourceMissingSessionIdRows += 1;
        samplePush(
          samples.sessionSourceMissingSessionIdRows,
          { id, teacherId, source, status },
          safeSampleLimit,
        );
      }
      continue;
    }

    const group = sessionGroups.get(sessionId) || [];
    group.push(id);
    sessionGroups.set(sessionId, group);

    if (id === sessionId) {
      canonicalSessionRows += 1;
    } else {
      nonCanonicalSessionRows += 1;
      samplePush(
        samples.nonCanonicalSessionRows,
        { id, sessionId, teacherId, source, status },
        safeSampleLimit,
      );
    }
  }

  let duplicateSessionIdGroups = 0;
  let duplicateSessionRows = 0;
  let duplicateGroupsWithCanonicalRow = 0;
  let duplicateGroupsWithoutCanonicalRow = 0;

  for (const [sessionId, documentIds] of sessionGroups.entries()) {
    if (documentIds.length < 2) continue;

    duplicateSessionIdGroups += 1;
    duplicateSessionRows += documentIds.length;
    const canonicalDocumentPresent = documentIds.includes(sessionId);
    if (canonicalDocumentPresent) duplicateGroupsWithCanonicalRow += 1;
    else duplicateGroupsWithoutCanonicalRow += 1;

    samplePush(
      samples.duplicateSessionIdGroups,
      { sessionId, documentIds: [...documentIds].sort(), canonicalDocumentPresent },
      safeSampleLimit,
    );
  }

  const activeRows = rows.length - archivedRows;
  const coverageCleanForFurtherDeltaDesign =
    duplicateSessionIdGroups === 0 &&
    nonCanonicalSessionRows === 0 &&
    sessionSourceMissingSessionIdRows === 0 &&
    missingTeacherIdRows === 0;

  return {
    totalRows: rows.length,
    activeRows,
    archivedRows,
    voidRows,
    standaloneRows,
    sessionLinkedRows,
    canonicalSessionRows,
    nonCanonicalSessionRows,
    sessionSourceMissingSessionIdRows,
    missingTeacherIdRows,
    duplicateSessionIdGroups,
    duplicateSessionRows,
    duplicateGroupsWithCanonicalRow,
    duplicateGroupsWithoutCanonicalRow,
    uniqueTeacherCount: teacherIds.size,
    coverageCleanForFurtherDeltaDesign,
    samples,
  };
}
