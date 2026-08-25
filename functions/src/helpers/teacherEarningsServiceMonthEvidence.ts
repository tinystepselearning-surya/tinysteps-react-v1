import type { Firestore } from 'firebase-admin/firestore';
import { resolveCanonicalServiceDate } from './serviceDate';
import {
  analyzeTeacherEarningsLegacyMonthCoverage,
  type TeacherEarningAuditRow,
  type TeacherEarningsLegacyMonthCoverage,
} from './teacherEarningsCanonicalAudit';

const GET_ALL_BATCH_SIZE = 250;

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();

const isSessionLinked = (row: TeacherEarningAuditRow): boolean =>
  normalizeStatus(row.source) === 'session_present_completed' || Boolean(normalizeText(row.sessionId));

export type TeacherEarningsSessionServiceMonthEvidence = {
  sessionServiceMonthById: ReadonlyMap<string, string | null>;
  requestedSessionCount: number;
  foundSessionCount: number;
  missingSessionCount: number;
  unresolvedServiceMonthCount: number;
};

export type TeacherEarningsCanonicalServiceMonthCoverage = TeacherEarningsLegacyMonthCoverage & {
  sessionEvidence: Omit<TeacherEarningsSessionServiceMonthEvidence, 'sessionServiceMonthById'>;
};

/**
 * Replace only session-linked service-date evidence before running the existing target-month
 * coverage analysis. Standalone earnings preserve their historical fallback behavior.
 *
 * For session-linked earnings, ledger processing timestamps are explicitly cleared so
 * earnedAt/createdAt/updatedAt can never masquerade as the class service date.
 */
export function applyCanonicalSessionMonthEvidence(
  rows: TeacherEarningAuditRow[],
  sessionServiceMonthById: ReadonlyMap<string, string | null>,
): TeacherEarningAuditRow[] {
  return rows.map((row) => {
    if (row.archived === true || !isSessionLinked(row)) return row;

    const sessionId = normalizeText(row.sessionId);
    const serviceMonthKey = sessionId ? sessionServiceMonthById.get(sessionId) || '' : '';
    return {
      ...row,
      date: serviceMonthKey ? `${serviceMonthKey}-01` : '',
      earnedAt: null,
      createdAt: null,
      updatedAt: null,
    };
  });
}

/**
 * Read-only evidence loader for session-linked teacher earnings.
 *
 * Ledger processing timestamps (earnedAt/createdAt/updatedAt) are intentionally not used as
 * service dates. Session-linked earnings inherit their service month only from the linked
 * classSessions document via the canonical service-date resolver.
 */
export async function loadTeacherEarningsSessionServiceMonthEvidence(
  db: Firestore,
  rows: TeacherEarningAuditRow[],
): Promise<TeacherEarningsSessionServiceMonthEvidence> {
  const sessionIds = Array.from(
    new Set(
      rows
        .filter((row) => row.archived !== true && isSessionLinked(row))
        .map((row) => normalizeText(row.sessionId))
        .filter(Boolean),
    ),
  ).sort();

  const sessionServiceMonthById = new Map<string, string | null>();
  let foundSessionCount = 0;
  let missingSessionCount = 0;
  let unresolvedServiceMonthCount = 0;

  for (let offset = 0; offset < sessionIds.length; offset += GET_ALL_BATCH_SIZE) {
    const batchIds = sessionIds.slice(offset, offset + GET_ALL_BATCH_SIZE);
    const refs = batchIds.map((sessionId) => db.collection('classSessions').doc(sessionId));
    const snapshots = refs.length > 0 ? await db.getAll(...refs) : [];

    batchIds.forEach((sessionId, index) => {
      const snapshot = snapshots[index];
      if (!snapshot?.exists) {
        missingSessionCount += 1;
        sessionServiceMonthById.set(sessionId, null);
        return;
      }

      foundSessionCount += 1;
      const canonical = resolveCanonicalServiceDate(snapshot.data() || {}, null);
      if (!canonical.serviceMonthKey) unresolvedServiceMonthCount += 1;
      sessionServiceMonthById.set(sessionId, canonical.serviceMonthKey);
    });
  }

  return {
    sessionServiceMonthById,
    requestedSessionCount: sessionIds.length,
    foundSessionCount,
    missingSessionCount,
    unresolvedServiceMonthCount,
  };
}

/**
 * Shared read-only target-month evidence used by the audit, analytics preparation and 7D
 * certification gates. Missing linked sessions or unresolved canonical service dates fail closed.
 */
export async function analyzeTeacherEarningsCanonicalServiceMonthCoverage(
  db: Firestore,
  rows: TeacherEarningAuditRow[],
  targetMonthKey: string,
  sampleLimit = 20,
): Promise<TeacherEarningsCanonicalServiceMonthCoverage> {
  const evidence = await loadTeacherEarningsSessionServiceMonthEvidence(db, rows);
  const evidenceRows = applyCanonicalSessionMonthEvidence(rows, evidence.sessionServiceMonthById);
  const coverage = analyzeTeacherEarningsLegacyMonthCoverage(
    evidenceRows,
    targetMonthKey,
    sampleLimit,
  );

  const sessionEvidence = {
    requestedSessionCount: evidence.requestedSessionCount,
    foundSessionCount: evidence.foundSessionCount,
    missingSessionCount: evidence.missingSessionCount,
    unresolvedServiceMonthCount: evidence.unresolvedServiceMonthCount,
  };

  return {
    ...coverage,
    legacyMonthCoverageClean:
      coverage.legacyMonthCoverageClean &&
      sessionEvidence.missingSessionCount === 0 &&
      sessionEvidence.unresolvedServiceMonthCount === 0,
    sessionEvidence,
  };
}
