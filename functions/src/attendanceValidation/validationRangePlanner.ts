export const AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN = 100;

export function remainingUnifiedValidationCapacity(
  dirtySessionCount: number,
): number {
  if (!Number.isInteger(dirtySessionCount) || dirtySessionCount < 0) {
    throw new RangeError('dirtySessionCount must be a non-negative integer.');
  }
  return Math.max(
    0,
    AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN - dirtySessionCount,
  );
}

export function uniqueFreshValidationTargets(params: {
  staleCaseSessionIds: readonly string[];
  missingCaseSessionIds: readonly string[];
}): Array<{ sessionId: string; kind: 'stale' | 'missing' }> {
  const targets: Array<{ sessionId: string; kind: 'stale' | 'missing' }> = [];
  const seen = new Set<string>();

  for (const [kind, values] of [
    ['stale', params.staleCaseSessionIds],
    ['missing', params.missingCaseSessionIds],
  ] as const) {
    for (const raw of values) {
      const sessionId = String(raw || '').trim();
      if (!sessionId || sessionId.includes('/') || seen.has(sessionId)) continue;
      seen.add(sessionId);
      targets.push({ sessionId, kind });
    }
  }

  return targets;
}
