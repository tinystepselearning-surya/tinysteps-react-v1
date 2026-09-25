export type AvsBusinessOutcome =
  | 'verified'
  | 'false_present'
  | 'false_absent'
  | 'not_evaluable';

export interface AvsBusinessCaseInput {
  id: string;
  serviceDateYmd: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  studentName: string | null;
  teacherName: string | null;
  businessOutcome: AvsBusinessOutcome | null;
  teamsSupportedPresentCount: number | null;
  tinyStepsPresentCount: number | null;
  businessDifferenceCount: number | null;
  sameDayEvidenceEvaluable: boolean | null;
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
  tinyStepsPresentCount: number | null;
  differenceCount: number;
  outcome: AvsBusinessOutcome;
  cases: T[];
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

  return `not-evaluable|${item.id}`;
}

function sameNullableNumber(values: readonly (number | null)[]): number | null {
  if (values.length === 0 || values.some((value) => value === null)) return null;
  const numbers = values as number[];
  const first = numbers[0];
  return numbers.every((value) => value === first) ? first : null;
}

function resolvedOutcome(
  cases: readonly AvsBusinessCaseInput[],
): AvsBusinessOutcome {
  if (
    cases.some((item) =>
      item.sameDayEvidenceEvaluable !== true
      || item.businessOutcome === null
      || item.businessOutcome === 'not_evaluable')
  ) {
    return 'not_evaluable';
  }

  const outcomes = [...new Set(cases.map((item) => item.businessOutcome))];
  return outcomes.length === 1
    ? (outcomes[0] as AvsBusinessOutcome)
    : 'not_evaluable';
}

/**
 * UI grouping only.
 *
 * The backend is authoritative for the three business outcomes. This function
 * performs no attendance inference, no Absent/Not Occurred classification, and
 * no fallback to legacy AVS categories. Old/incomplete rows stay not_evaluable
 * until Run Validation rebuilds them with the simple business fields.
 */
export function groupPersistedAvsBusinessOutcomes<T extends AvsBusinessCaseInput>(
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
      const first = cases[0];
      const outcome = resolvedOutcome(cases);
      const teamsSupportedPresentCount = sameNullableNumber(
        cases.map((item) => item.teamsSupportedPresentCount),
      );
      const tinyStepsPresentCount = sameNullableNumber(
        cases.map((item) => item.tinyStepsPresentCount),
      );
      const differenceCount = outcome === 'not_evaluable'
        ? 0
        : Math.max(
          0,
          ...cases.map((item) => item.businessDifferenceCount ?? 0),
        );

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
        teamsSupportedPresentCount:
          outcome === 'not_evaluable' ? null : teamsSupportedPresentCount,
        tinyStepsPresentCount:
          outcome === 'not_evaluable' ? null : tinyStepsPresentCount,
        differenceCount,
        outcome,
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
