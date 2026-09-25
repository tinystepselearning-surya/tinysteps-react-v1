export const AVS_BUSINESS_PRESENT_OVERLAP_SECONDS = 25 * 60;

export type AvsBusinessOutcome =
  | 'verified'
  | 'false_present'
  | 'false_absent'
  | 'unresolved';

export interface AvsBusinessCaseInput {
  id: string;
  serviceDateYmd: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName: string | null;
  teacherName: string | null;
  tinyStepsAttendance: 'present' | 'absent' | 'rescheduled' | null;
  validationDecision: 'present' | 'absent' | 'not_occurred' | 'review' | null;
  sameDayCoverageSeconds: number | null;
  sameDayPresentSessionCount: number | null;
  sameDayOccurrenceCount: number | null;
  reasons: string[];
  sourceClassificationReasons: string[];
  proofIssues: string[];
  identityIssues: string[];
  staffRegistryIssues: string[];
}

export interface AvsBusinessGroup<T extends AvsBusinessCaseInput = AvsBusinessCaseInput> {
  key: string;
  serviceDateYmd: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName: string | null;
  teacherName: string | null;
  teamsSupportedPresentCount: number | null;
  tinyStepsPresentCount: number;
  falsePresentCount: number;
  falseAbsentCount: number;
  outcome: AvsBusinessOutcome;
  sameDayCoverageSeconds: number | null;
  sameDayOccurrenceCount: number | null;
  unresolvedSignals: string[];
  cases: T[];
}

function finiteNonNegative(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/**
 * Returns the maximum count of Present rows supported by the configured
 * strictly-greater-than overlap rule.
 *
 * Examples with the production 1,500 second threshold:
 * - 1,500s -> 0 supported Present rows
 * - 1,501s -> 1
 * - 3,000s -> 1
 * - 3,001s -> 2
 */
export function supportedPresentCountFromOverlap(
  overlapSeconds: number,
  thresholdSeconds = AVS_BUSINESS_PRESENT_OVERLAP_SECONDS,
): number {
  if (!Number.isFinite(overlapSeconds) || overlapSeconds < 0) {
    throw new RangeError('overlapSeconds must be a finite non-negative number.');
  }
  if (!Number.isFinite(thresholdSeconds) || thresholdSeconds <= 0) {
    throw new RangeError('thresholdSeconds must be a finite positive number.');
  }
  if (overlapSeconds <= thresholdSeconds) return 0;
  return Math.max(0, Math.ceil(overlapSeconds / thresholdSeconds) - 1);
}

function groupKey(item: AvsBusinessCaseInput): string {
  if (
    item.serviceDateYmd
    && item.enrollmentId
    && item.kidId
    && item.teacherId
  ) {
    return [
      item.serviceDateYmd,
      item.enrollmentId,
      item.kidId,
      item.teacherId,
    ].join('|');
  }

  // Never merge incomplete identities. A missing grouping key is itself an
  // unresolved evidence condition and remains isolated to this one AVS case.
  return `unresolved|${item.id}`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function inferSupportedPresentCount(
  cases: readonly AvsBusinessCaseInput[],
): {
  count: number | null;
  coverageSeconds: number | null;
  occurrenceCount: number | null;
} {
  const coverageValues = cases
    .map((item) => finiteNonNegative(item.sameDayCoverageSeconds))
    .filter((value): value is number => value !== null);
  const occurrenceValues = cases
    .map((item) => finiteNonNegative(item.sameDayOccurrenceCount))
    .filter((value): value is number => value !== null);

  if (coverageValues.length > 0) {
    const coverageSeconds = Math.max(...coverageValues);

    // Positive same-day teacher+learner overlap is the authoritative business
    // signal, even when the exact scheduled slot differs because the class was
    // moved later on the same IST service date.
    if (coverageSeconds > 0) {
      return {
        count: supportedPresentCountFromOverlap(coverageSeconds),
        coverageSeconds,
        occurrenceCount:
          occurrenceValues.length > 0 ? Math.max(...occurrenceValues) : null,
      };
    }

    const determinateZero = cases.every((item) =>
      item.validationDecision === 'absent'
      || item.validationDecision === 'not_occurred');

    if (determinateZero) {
      return {
        count: 0,
        coverageSeconds: 0,
        occurrenceCount:
          occurrenceValues.length > 0 ? Math.max(...occurrenceValues) : 0,
      };
    }

    const hasUnsafeZero = cases.some((item) =>
      item.validationDecision === 'review'
      || item.validationDecision === null);

    if (hasUnsafeZero) {
      return {
        count: null,
        coverageSeconds: 0,
        occurrenceCount:
          occurrenceValues.length > 0 ? Math.max(...occurrenceValues) : null,
      };
    }
  }

  // Compatibility fallback for older saved AVS cases that predate same-day
  // coverage diagnostics. Determinate Present/Absent/Not Occurred decisions can
  // still be reconciled; REVIEW/null remains fail-closed.
  if (cases.some((item) =>
    item.validationDecision === 'review'
    || item.validationDecision === null)) {
    return {
      count: null,
      coverageSeconds:
        coverageValues.length > 0 ? Math.max(...coverageValues) : null,
      occurrenceCount:
        occurrenceValues.length > 0 ? Math.max(...occurrenceValues) : null,
    };
  }

  return {
    count: cases.filter((item) => item.validationDecision === 'present').length,
    coverageSeconds:
      coverageValues.length > 0 ? Math.max(...coverageValues) : null,
    occurrenceCount:
      occurrenceValues.length > 0 ? Math.max(...occurrenceValues) : null,
  };
}

export function reconcileAvsBusinessGroups<T extends AvsBusinessCaseInput>(
  items: readonly T[],
): AvsBusinessGroup<T>[] {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = groupKey(item);
    const existing = grouped.get(key) ?? [];
    existing.push(item);
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .map(([key, cases]) => {
      const support = inferSupportedPresentCount(cases);
      const authoritativePresentCounts = cases
        .map((item) => finiteNonNegative(item.sameDayPresentSessionCount))
        .filter((value): value is number => value !== null);
      const tinyStepsPresentCount = authoritativePresentCounts.length > 0
        ? Math.max(...authoritativePresentCounts)
        : cases.filter((item) => item.tinyStepsAttendance === 'present').length;

      const falsePresentCount = support.count === null
        ? 0
        : Math.max(0, tinyStepsPresentCount - support.count);
      const falseAbsentCount = support.count === null
        ? 0
        : Math.max(0, support.count - tinyStepsPresentCount);

      let outcome: AvsBusinessOutcome = 'verified';
      if (support.count === null) outcome = 'unresolved';
      else if (falsePresentCount > 0) outcome = 'false_present';
      else if (falseAbsentCount > 0) outcome = 'false_absent';

      const first = cases[0];
      const unresolvedSignals = unique(cases.flatMap((item) => [
        ...item.reasons,
        ...item.sourceClassificationReasons,
        ...item.proofIssues,
        ...item.identityIssues,
        ...item.staffRegistryIssues,
      ]));

      return {
        key,
        serviceDateYmd: first.serviceDateYmd,
        enrollmentId: first.enrollmentId,
        kidId: first.kidId,
        teacherId: first.teacherId,
        studentName:
          cases.map((item) => item.studentName).find(Boolean) ?? null,
        teacherName:
          cases.map((item) => item.teacherName).find(Boolean) ?? null,
        teamsSupportedPresentCount: support.count,
        tinyStepsPresentCount,
        falsePresentCount,
        falseAbsentCount,
        outcome,
        sameDayCoverageSeconds: support.coverageSeconds,
        sameDayOccurrenceCount: support.occurrenceCount,
        unresolvedSignals,
        cases,
      };
    })
    .sort((left, right) => {
      const dateCompare = String(right.serviceDateYmd ?? '')
        .localeCompare(String(left.serviceDateYmd ?? ''));
      if (dateCompare !== 0) return dateCompare;
      return String(left.studentName ?? left.kidId ?? left.key)
        .localeCompare(String(right.studentName ?? right.kidId ?? right.key));
    });
}
