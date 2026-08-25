export const LEGACY_TEACHER_ID_ALIAS_FIELDS = [
  'teacherIds',
  'assignedTeacherId',
  'primaryTeacherId',
  'teacherUid',
  'teacher_id',
] as const;

type LegacyTeacherIdAliasField = typeof LEGACY_TEACHER_ID_ALIAS_FIELDS[number];

export type CanonicalTeacherIdentityResolution = {
  teacherId: string | null;
  source: 'canonical' | 'legacy' | 'missing' | 'ambiguous_legacy';
  legacyRefs: string[];
};

export type CanonicalTeacherWriteFields = {
  teacherId: string;
};

export function normalizeTeacherIdentityValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function normalizeTeacherIdentityList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((entry) => normalizeTeacherIdentityValue(entry)).filter(Boolean)),
  );
}

// Retained for historical/backfill resolution only. Active B5 writes are canonical-only.
export function collectLegacyTeacherIdentityRefs(
  record: Record<string, unknown> | undefined,
): string[] {
  if (!record) return [];
  return Array.from(
    new Set([
      ...normalizeTeacherIdentityList(record.teacherIds),
      normalizeTeacherIdentityValue(record.assignedTeacherId),
      normalizeTeacherIdentityValue(record.primaryTeacherId),
      normalizeTeacherIdentityValue(record.teacherUid),
      normalizeTeacherIdentityValue(record.teacher_id),
    ].filter(Boolean)),
  );
}

export function resolveCanonicalTeacherIdForWrite(
  record: Record<string, unknown> | undefined,
): CanonicalTeacherIdentityResolution {
  if (!record) return {teacherId: null, source: 'missing', legacyRefs: []};

  const canonicalTeacherId = normalizeTeacherIdentityValue(record.teacherId);
  const legacyRefs = collectLegacyTeacherIdentityRefs(record);
  if (canonicalTeacherId) {
    return {teacherId: canonicalTeacherId, source: 'canonical', legacyRefs};
  }
  if (legacyRefs.length === 1) {
    return {teacherId: legacyRefs[0], source: 'legacy', legacyRefs};
  }
  if (legacyRefs.length > 1) {
    return {teacherId: null, source: 'ambiguous_legacy', legacyRefs};
  }
  return {teacherId: null, source: 'missing', legacyRefs};
}

// B5 write contract: operational session ownership is persisted only in teacherId.
// Existing alias fields are not deleted here; physical cleanup remains a separately reviewed migration.
export function buildCanonicalTeacherWriteFields(teacherId: unknown): CanonicalTeacherWriteFields {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!canonicalTeacherId) {
    throw new Error('Canonical teacherId is required before writing teacher ownership');
  }

  return {teacherId: canonicalTeacherId};
}

export function buildEnrollmentTeacherWriteFields(teacherId: unknown): {
  teacherId: string | null;
} {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  return {teacherId: canonicalTeacherId || null};
}

// Historical audit/repair helper. New operational writes no longer emit these aliases.
export function aliasFieldMatchesCanonicalTeacher(
  field: LegacyTeacherIdAliasField,
  value: unknown,
  teacherId: string,
): boolean {
  if (field === 'teacherIds') {
    const ids = normalizeTeacherIdentityList(value);
    return ids.length === 1 && ids[0] === teacherId;
  }
  const normalized = normalizeTeacherIdentityValue(value);
  return !normalized || normalized === teacherId;
}
