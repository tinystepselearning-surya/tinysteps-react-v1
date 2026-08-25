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

export type TeacherEarningsLegacyMonthCoverage = {
  targetMonthKey: string;
  totalRows: number;
  activeRows: number;
  archivedRows: number;
  explicitTargetMonthRows: number;
  activeRowsMissingOrInvalidMonthKey: number;
  derivedTargetRowsMissingOrInvalidMonthKey: number;
  derivedTargetRowsStoredInDifferentMonth: number;
  storedTargetRowsDerivedIntoDifferentMonth: number;
  undatedRowsMissingOrInvalidMonthKey: number;
  legacyMonthCoverageClean: boolean;
  samples: {
    derivedTargetRowsMissingOrInvalidMonthKey: Array<{
      id: string;
      teacherId: string;
      derivedMonthKey: string;
    }>;
    derivedTargetRowsStoredInDifferentMonth: Array<{
      id: string;
      teacherId: string;
      storedMonthKey: string;
      derivedMonthKey: string;
    }>;
    storedTargetRowsDerivedIntoDifferentMonth: Array<{
      id: string;
      teacherId: string;
      storedMonthKey: string;
      derivedMonthKey: string;
    }>;
    undatedRowsMissingOrInvalidMonthKey: Array<{
      id: string;
      teacherId: string;
    }>;
  };
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const normalizeMonthKey = (value: unknown): string => {
  const raw = normalizeText(value);
  return /^\d{4}-\d{2}$/.test(raw) ? raw : '';
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T00:00:00+05:30`)
      : new Date(raw);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === 'object') {
    const row = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toDate === 'function') {
      const date = row.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
    }
    const seconds = Number(row.seconds ?? row._seconds);
    const nanoseconds = Number(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      const millis = seconds * 1000 + (Number.isFinite(nanoseconds) ? nanoseconds / 1_000_000 : 0);
      const date = new Date(millis);
      return Number.isFinite(date.getTime()) ? date : null;
    }
  }
  return null;
};

const monthKeyFromDateIST = (date: Date): string => {
  const istDate = new Date(date.getTime() + 330 * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const deriveTeacherEarningMonthKey = (row: TeacherEarningAuditRow): string => {
  const directDate = normalizeText(row.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(directDate)) return directDate.slice(0, 7);

  const candidates = [row.earnedAt, row.createdAt, row.updatedAt];
  for (const candidate of candidates) {
    const date = toDate(candidate);
    if (date) return monthKeyFromDateIST(date);
  }
  return '';
};

const isSessionLinked = (row: TeacherEarningAuditRow): boolean =>
  normalizeStatus(row.source) === 'session_present_completed' || Boolean(normalizeText(row.sessionId));

const samplePush = <T>(target: T[], value: T, limit: number): void => {
  if (target.length < limit) target.push(value);
};

/**
 * Pure current-month integrity analysis for teacherEarnings rows.
 *
 * Archived rows are counted for visibility but excluded from coverage calculations because the
 * authoritative monthly rollup also excludes archived teacherEarnings documents before dedupe.
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

    if (row.archived === true) {
      archivedRows += 1;
      continue;
    }

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

/**
 * Optional broader evidence pass used before month-bounding UI reads or enabling delta writes.
 * It is meant to run against a bounded full-ledger snapshot, not as a scheduled reader.
 */
export function analyzeTeacherEarningsLegacyMonthCoverage(
  rows: TeacherEarningAuditRow[],
  targetMonthKey: string,
  sampleLimit = 20,
): TeacherEarningsLegacyMonthCoverage {
  const safeSampleLimit = Math.max(0, Math.min(Math.floor(sampleLimit), 100));
  const normalizedTargetMonth = normalizeMonthKey(targetMonthKey);
  if (!normalizedTargetMonth) {
    throw new Error('targetMonthKey must be YYYY-MM');
  }

  let archivedRows = 0;
  let activeRows = 0;
  let explicitTargetMonthRows = 0;
  let activeRowsMissingOrInvalidMonthKey = 0;
  let derivedTargetRowsMissingOrInvalidMonthKey = 0;
  let derivedTargetRowsStoredInDifferentMonth = 0;
  let storedTargetRowsDerivedIntoDifferentMonth = 0;
  let undatedRowsMissingOrInvalidMonthKey = 0;

  const samples: TeacherEarningsLegacyMonthCoverage['samples'] = {
    derivedTargetRowsMissingOrInvalidMonthKey: [],
    derivedTargetRowsStoredInDifferentMonth: [],
    storedTargetRowsDerivedIntoDifferentMonth: [],
    undatedRowsMissingOrInvalidMonthKey: [],
  };

  for (const row of rows) {
    if (row.archived === true) {
      archivedRows += 1;
      continue;
    }
    activeRows += 1;

    const id = normalizeText(row.id);
    const teacherId = normalizeText(row.teacherId);
    const storedMonthKey = normalizeMonthKey(row.monthKey);
    const derivedMonthKey = deriveTeacherEarningMonthKey(row);

    if (storedMonthKey === normalizedTargetMonth) explicitTargetMonthRows += 1;

    if (!storedMonthKey) {
      activeRowsMissingOrInvalidMonthKey += 1;
      if (!derivedMonthKey) {
        undatedRowsMissingOrInvalidMonthKey += 1;
        samplePush(
          samples.undatedRowsMissingOrInvalidMonthKey,
          { id, teacherId },
          safeSampleLimit,
        );
      } else if (derivedMonthKey === normalizedTargetMonth) {
        derivedTargetRowsMissingOrInvalidMonthKey += 1;
        samplePush(
          samples.derivedTargetRowsMissingOrInvalidMonthKey,
          { id, teacherId, derivedMonthKey },
          safeSampleLimit,
        );
      }
      continue;
    }

    if (derivedMonthKey === normalizedTargetMonth && storedMonthKey !== normalizedTargetMonth) {
      derivedTargetRowsStoredInDifferentMonth += 1;
      samplePush(
        samples.derivedTargetRowsStoredInDifferentMonth,
        { id, teacherId, storedMonthKey, derivedMonthKey },
        safeSampleLimit,
      );
    }

    if (
      storedMonthKey === normalizedTargetMonth &&
      derivedMonthKey &&
      derivedMonthKey !== normalizedTargetMonth
    ) {
      storedTargetRowsDerivedIntoDifferentMonth += 1;
      samplePush(
        samples.storedTargetRowsDerivedIntoDifferentMonth,
        { id, teacherId, storedMonthKey, derivedMonthKey },
        safeSampleLimit,
      );
    }
  }

  const legacyMonthCoverageClean =
    derivedTargetRowsMissingOrInvalidMonthKey === 0 &&
    derivedTargetRowsStoredInDifferentMonth === 0 &&
    storedTargetRowsDerivedIntoDifferentMonth === 0 &&
    undatedRowsMissingOrInvalidMonthKey === 0;

  return {
    targetMonthKey: normalizedTargetMonth,
    totalRows: rows.length,
    activeRows,
    archivedRows,
    explicitTargetMonthRows,
    activeRowsMissingOrInvalidMonthKey,
    derivedTargetRowsMissingOrInvalidMonthKey,
    derivedTargetRowsStoredInDifferentMonth,
    storedTargetRowsDerivedIntoDifferentMonth,
    undatedRowsMissingOrInvalidMonthKey,
    legacyMonthCoverageClean,
    samples,
  };
}
