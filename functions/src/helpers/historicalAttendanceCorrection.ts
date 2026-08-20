export type HistoricalTeacherReassignmentEvent = {
  changedAtMs: number;
  oldTeacherId?: string | null;
  newTeacherId?: string | null;
};

const TERMINAL_HISTORICAL_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

export function toMillisMaybe(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; toDate?: () => Date; seconds?: number };
    if (typeof candidate.toMillis === 'function') {
      const ms = Number(candidate.toMillis());
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof candidate.toDate === 'function') {
      const dt = candidate.toDate();
      const ms = dt instanceof Date ? dt.getTime() : NaN;
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof candidate.seconds === 'number' && Number.isFinite(candidate.seconds)) {
      return candidate.seconds * 1000;
    }
  }
  return null;
}

export function isHistoricalTerminalEnrollmentStatus(status: string): boolean {
  return TERMINAL_HISTORICAL_STATUSES.has(String(status || '').trim().toLowerCase());
}

export function resolveHistoricalEnrollmentCutoffMs(enrollment: Record<string, unknown>): number | null {
  const candidates = [
    enrollment.completedAt,
    enrollment.endedAt,
    enrollment.discontinuedAt,
    enrollment.expiredAt,
    enrollment.cancelledAt,
    enrollment.canceledAt,
    enrollment.archivedAt,
  ]
    .map(toMillisMaybe)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return candidates.length ? Math.min(...candidates) : null;
}

function normalizeIdentitySet(values: string[]): Set<string> {
  return new Set(values.map((value) => String(value || '').trim()).filter(Boolean));
}

function matchesIdentity(value: unknown, identities: Set<string>): boolean {
  const id = String(value || '').trim();
  return Boolean(id && identities.has(id));
}

export function isTeacherValidForHistoricalSession(args: {
  sessionStartMs: number;
  requestedTeacherIds: string[];
  currentTeacherIds: string[];
  previousTeacherIds?: string[];
  fallbackReassignedAtMs?: number | null;
  reassignmentEvents?: HistoricalTeacherReassignmentEvent[];
}): boolean {
  const requested = normalizeIdentitySet(args.requestedTeacherIds);
  if (!requested.size || !Number.isFinite(args.sessionStartMs)) return false;

  const current = normalizeIdentitySet(args.currentTeacherIds);
  const previous = normalizeIdentitySet(args.previousTeacherIds || []);
  const currentMatches = Array.from(current).some((id) => requested.has(id));
  const previousMatches = Array.from(previous).some((id) => requested.has(id));

  const events = (args.reassignmentEvents || [])
    .filter((event) => Number.isFinite(event.changedAtMs) && event.changedAtMs > 0)
    .slice()
    .sort((a, b) => a.changedAtMs - b.changedAtMs);

  if (events.length) {
    const starts = events
      .filter((event) => matchesIdentity(event.newTeacherId, requested))
      .map((event) => event.changedAtMs);
    const ends = events
      .filter((event) => matchesIdentity(event.oldTeacherId, requested))
      .map((event) => event.changedAtMs);

    const intervals: Array<{ start: number; end: number }> = [];
    if (ends.length && (!starts.length || ends[0] <= starts[0])) {
      intervals.push({ start: Number.NEGATIVE_INFINITY, end: ends[0] });
    }

    starts.forEach((start) => {
      const end = ends.find((candidate) => candidate > start) ?? Number.POSITIVE_INFINITY;
      intervals.push({ start, end });
    });

    if (!intervals.length && currentMatches) {
      intervals.push({ start: Number.NEGATIVE_INFINITY, end: Number.POSITIVE_INFINITY });
    }

    return intervals.some(
      (interval) => args.sessionStartMs >= interval.start && args.sessionStartMs < interval.end,
    );
  }

  const reassignedAtMs = args.fallbackReassignedAtMs;
  if (reassignedAtMs && Number.isFinite(reassignedAtMs)) {
    if (previousMatches && args.sessionStartMs < reassignedAtMs) return true;
    if (currentMatches && args.sessionStartMs >= reassignedAtMs) return true;
    return false;
  }

  return currentMatches || previousMatches;
}
