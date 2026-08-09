export const SCHOOL_STATUSES = [
  'active',
  'paused',
  'archived',
] as const;

export type SchoolStatus =
  (typeof SCHOOL_STATUSES)[number];

export type SchoolUserAccessStatus =
  | 'active'
  | 'unassigned';

export interface SchoolAccessState {
  schoolIds: string[];
  primarySchoolId: string | null;
}

export function normalizeSchoolStatus(
  value: unknown,
): SchoolStatus | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized =
    value.trim().toLowerCase();

  return SCHOOL_STATUSES.includes(
    normalized as SchoolStatus,
  )
    ? normalized as SchoolStatus
    : null;
}

export function normalizeSchoolIds(
  values: unknown,
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === 'string',
        )
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function addSchoolAccess(
  currentSchoolIds: unknown,
  currentPrimarySchoolId: unknown,
  schoolId: string,
  makePrimary = false,
): SchoolAccessState {
  const normalizedSchoolId =
    schoolId.trim();

  const schoolIds =
    normalizeSchoolIds(
      currentSchoolIds,
    );

  if (
    normalizedSchoolId &&
    !schoolIds.includes(
      normalizedSchoolId,
    )
  ) {
    schoolIds.push(
      normalizedSchoolId,
    );
  }

  const currentPrimary =
    typeof currentPrimarySchoolId ===
      'string'
      ? currentPrimarySchoolId.trim()
      : '';

  const primaryStillValid =
    currentPrimary &&
    schoolIds.includes(
      currentPrimary,
    );

  const primarySchoolId =
    makePrimary ||
    !primaryStillValid
      ? normalizedSchoolId ||
        schoolIds[0] ||
        null
      : currentPrimary;

  return {
    schoolIds,
    primarySchoolId,
  };
}

export function removeSchoolAccess(
  currentSchoolIds: unknown,
  currentPrimarySchoolId: unknown,
  schoolId: string,
): SchoolAccessState {
  const normalizedSchoolId =
    schoolId.trim();

  const schoolIds =
    normalizeSchoolIds(
      currentSchoolIds,
    ).filter(
      (id) =>
        id !== normalizedSchoolId,
    );

  const currentPrimary =
    typeof currentPrimarySchoolId ===
      'string'
      ? currentPrimarySchoolId.trim()
      : '';

  const primarySchoolId =
    currentPrimary &&
    currentPrimary !==
      normalizedSchoolId &&
    schoolIds.includes(
      currentPrimary,
    )
      ? currentPrimary
      : schoolIds[0] || null;

  return {
    schoolIds,
    primarySchoolId,
  };
}
