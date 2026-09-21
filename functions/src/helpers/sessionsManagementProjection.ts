export type SessionsManagementProjectionRow = {
  id: string;
  data: Record<string, unknown>;
};

export type SessionsManagementProjectionKind =
  | 'sessions'
  | 'enrollments'
  | 'users'
  | 'kids'
  | 'students'
  | 'courses';

export type SessionsManagementProjectionRows = Record<
  SessionsManagementProjectionKind,
  SessionsManagementProjectionRow[]
>;

export type SessionsManagementProjectionDelta = {
  entityType: 'enrollment' | 'session';
  entityId: string;
  operation: 'upsert' | 'remove';
  revision: number;
  eventTimeMs: number;
  row?: SessionsManagementProjectionRow;
  related?: Partial<SessionsManagementProjectionRows>;
};

export type SessionsManagementProjectionSnapshot = SessionsManagementProjectionRows & {
  dateKeys: string[];
  counts: Record<string, number>;
  sourceStats?: Record<string, number | undefined>;
  projectionRevision?: number;
  deltaDocumentsApplied?: number;
};

export const normalizeSessionsManagementEnrollmentStatus = (value: unknown): string => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (
    raw === 'pending_payment' ||
    raw === 'pending_lp' ||
    raw === 'pending_lp_assignment' ||
    raw === 'enrolled' ||
    raw === 'current' ||
    raw === 'ongoing'
  ) {
    return 'active';
  }
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const isOperationalSessionsManagementEnrollment = (
  enrollmentLike: Record<string, unknown> | undefined,
): boolean => {
  if (!enrollmentLike) return false;
  if (
    enrollmentLike.archivedAt ||
    enrollmentLike.archived === true ||
    enrollmentLike.isArchived === true
  ) {
    return false;
  }
  const normalized = normalizeSessionsManagementEnrollmentStatus(enrollmentLike.status);
  return normalized === 'active' || normalized === 'trial';
};

const rowsToMap = (
  rows: SessionsManagementProjectionRow[],
): Map<string, SessionsManagementProjectionRow> =>
  new Map(rows.filter((row) => Boolean(row.id)).map((row) => [row.id, row]));

const sortedRows = (
  rows: Iterable<SessionsManagementProjectionRow>,
): SessionsManagementProjectionRow[] =>
  Array.from(rows).sort((a, b) => a.id.localeCompare(b.id));

const normalizeOverallCount = (
  snapshot: SessionsManagementProjectionSnapshot,
): number => {
  const value = Number(snapshot.counts.overallEnrollments || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(snapshot.enrollments.length, Math.floor(value));
};

export function applySessionsManagementProjectionDeltas<
  T extends SessionsManagementProjectionSnapshot,
>(
  snapshot: T,
  deltas: SessionsManagementProjectionDelta[],
  projectionRevision: number,
): T & { projectionRevision: number; deltaDocumentsApplied: number } {
  const maps: Record<
    SessionsManagementProjectionKind,
    Map<string, SessionsManagementProjectionRow>
  > = {
    sessions: rowsToMap(snapshot.sessions),
    enrollments: rowsToMap(snapshot.enrollments),
    users: rowsToMap(snapshot.users),
    kids: rowsToMap(snapshot.kids),
    students: rowsToMap(snapshot.students),
    courses: rowsToMap(snapshot.courses),
  };

  const overallEnrollmentIds = new Set(
    snapshot.enrollments
      .slice(0, normalizeOverallCount(snapshot))
      .map((row) => row.id)
      .filter(Boolean),
  );

  const reconcileOverallEnrollment = (row: SessionsManagementProjectionRow): void => {
    if (isOperationalSessionsManagementEnrollment(row.data)) {
      overallEnrollmentIds.add(row.id);
    } else {
      overallEnrollmentIds.delete(row.id);
    }
  };

  const mergeRelated = (
    related: Partial<SessionsManagementProjectionRows> | undefined,
  ): void => {
    if (!related) return;
    (Object.keys(maps) as SessionsManagementProjectionKind[]).forEach((kind) => {
      (related[kind] || []).forEach((row) => {
        if (!row?.id) return;
        maps[kind].set(row.id, row);
        if (kind === 'enrollments') reconcileOverallEnrollment(row);
      });
    });
  };

  const ordered = [...deltas].sort((a, b) => {
    const revisionDiff = Number(a.revision || 0) - Number(b.revision || 0);
    if (revisionDiff !== 0) return revisionDiff;
    const timeDiff = Number(a.eventTimeMs || 0) - Number(b.eventTimeMs || 0);
    if (timeDiff !== 0) return timeDiff;
    const typeDiff = a.entityType.localeCompare(b.entityType);
    if (typeDiff !== 0) return typeDiff;
    return a.entityId.localeCompare(b.entityId);
  });

  ordered.forEach((delta) => {
    mergeRelated(delta.related);

    if (delta.entityType === 'enrollment') {
      if (delta.operation === 'remove' || !delta.row) {
        overallEnrollmentIds.delete(delta.entityId);
        maps.enrollments.delete(delta.entityId);
        return;
      }
      maps.enrollments.set(delta.entityId, delta.row);
      reconcileOverallEnrollment(delta.row);
      return;
    }

    if (delta.operation === 'remove' || !delta.row) {
      maps.sessions.delete(delta.entityId);
      return;
    }
    maps.sessions.set(delta.entityId, delta.row);
  });

  const overallEnrollments = sortedRows(
    Array.from(overallEnrollmentIds)
      .map((id) => maps.enrollments.get(id))
      .filter((row): row is SessionsManagementProjectionRow => Boolean(row)),
  );
  const nonOverallEnrollments = sortedRows(
    Array.from(maps.enrollments.values()).filter(
      (row) => !overallEnrollmentIds.has(row.id),
    ),
  );
  const enrollments = [...overallEnrollments, ...nonOverallEnrollments];
  const sessions = sortedRows(maps.sessions.values());
  const users = sortedRows(maps.users.values());
  const kids = sortedRows(maps.kids.values());
  const students = sortedRows(maps.students.values());
  const courses = sortedRows(maps.courses.values());

  const todayDateKey = String(snapshot.dateKeys[0] || '');
  const tomorrowDateKey = String(snapshot.dateKeys[1] || '');
  const counts = {
    ...snapshot.counts,
    sessions: sessions.length,
    todaySessions: sessions.filter(
      (row) => String(row.data.date || '').trim() === todayDateKey,
    ).length,
    tomorrowSessions: sessions.filter(
      (row) => String(row.data.date || '').trim() === tomorrowDateKey,
    ).length,
    enrollments: enrollments.length,
    overallEnrollments: overallEnrollments.length,
    users: users.length,
    kids: kids.length,
    students: students.length,
    courses: courses.length,
  };

  return {
    ...snapshot,
    counts,
    sourceStats: snapshot.sourceStats
      ? {
          ...snapshot.sourceStats,
          deltaDocumentsApplied: ordered.length,
        }
      : snapshot.sourceStats,
    sessions,
    enrollments,
    users,
    kids,
    students,
    courses,
    projectionRevision: Math.max(0, Number(projectionRevision || 0)),
    deltaDocumentsApplied: ordered.length,
  };
}
