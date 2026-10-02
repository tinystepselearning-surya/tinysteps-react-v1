import type { Firestore } from 'firebase-admin/firestore';

export type AvsJoinUrlSource = 'session' | 'enrollment' | 'missing';

export interface AvsSessionJoinUrlResolution {
  session: Record<string, unknown>;
  joinUrl: string | null;
  source: AvsJoinUrlSource;
  enrollmentId: string | null;
  enrollmentFallbackReadCount: number;
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

export function resolveJoinUrlFromRecord(
  record: Record<string, unknown>,
): string | null {
  return text(record.joinUrl)
    || text(record.meetingLink)
    || text(record.classLink);
}

/**
 * Resolve the Teams join URL for AVS without mutating operational data.
 *
 * Cost contract:
 * - 0 extra Firestore reads when the session already carries a Teams URL.
 * - 1 exact enrollment point-read only when the session URL is missing and
 *   the historical session has an enrollmentId.
 * - no collection scans, queries, or backfills.
 */
export async function resolveAvsSessionJoinUrl(
  db: Firestore,
  session: Record<string, unknown>,
): Promise<AvsSessionJoinUrlResolution> {
  const directJoinUrl = resolveJoinUrlFromRecord(session);
  const enrollmentId = text(session.enrollmentId);

  if (directJoinUrl) {
    return {
      session,
      joinUrl: directJoinUrl,
      source: 'session',
      enrollmentId,
      enrollmentFallbackReadCount: 0,
    };
  }

  if (!enrollmentId) {
    return {
      session,
      joinUrl: null,
      source: 'missing',
      enrollmentId: null,
      enrollmentFallbackReadCount: 0,
    };
  }

  const enrollmentSnapshot = await db
    .collection('enrollments')
    .doc(enrollmentId)
    .get();
  const enrollmentJoinUrl = enrollmentSnapshot.exists
    ? resolveJoinUrlFromRecord(
        (enrollmentSnapshot.data() || {}) as Record<string, unknown>,
      )
    : null;

  if (!enrollmentJoinUrl) {
    return {
      session,
      joinUrl: null,
      source: 'missing',
      enrollmentId,
      enrollmentFallbackReadCount: 1,
    };
  }

  return {
    session: {
      ...session,
      joinUrl: enrollmentJoinUrl,
    },
    joinUrl: enrollmentJoinUrl,
    source: 'enrollment',
    enrollmentId,
    enrollmentFallbackReadCount: 1,
  };
}
