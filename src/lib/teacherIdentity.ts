export const CANONICAL_TEACHER_ID_FIELD = 'teacherId' as const;

export const LEGACY_TEACHER_ID_ALIAS_FIELDS = [
  'teacherIds',
  'assignedTeacherId',
  'primaryTeacherId',
  'teacherUid',
  'teacher_id',
] as const;

export type LegacyTeacherIdAliasField = typeof LEGACY_TEACHER_ID_ALIAS_FIELDS[number];
export type OperationalTeacherIdentityField = typeof CANONICAL_TEACHER_ID_FIELD | LegacyTeacherIdAliasField;

export type OperationalTeacherIdentityAudit = {
  canonicalTeacherId: string;
  resolvedTeacherId: string;
  missingCanonicalTeacherId: boolean;
  legacyOnly: boolean;
  legacyRefs: string[];
  mismatchedAliasFields: LegacyTeacherIdAliasField[];
  hasLegacyAliases: boolean;
};

export type CanonicalOperationalTeacherWriteFields = {
  teacherId: string;
};

export type CanonicalEnrollmentTeacherWriteFields = {
  teacherId: string;
};

export const normalizeTeacherIdentityValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeTeacherIdentityList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => normalizeTeacherIdentityValue(entry))
        .filter(Boolean),
    ),
  );
};

// Historical/direct-document compatibility only. Active collection readers are canonical-only.
export const collectLegacyTeacherIdentityRefs = (
  record: Record<string, unknown> | undefined,
): string[] => {
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
};

// Canonical-first so stale aliases can never override an operational owner.
// The fallback is retained only for legacy direct-document/history compatibility.
export const resolveOperationalTeacherId = (
  record: Record<string, unknown> | undefined,
): string => {
  if (!record) return '';

  const canonicalTeacherId = normalizeTeacherIdentityValue(record.teacherId);
  if (canonicalTeacherId) return canonicalTeacherId;

  return (
    normalizeTeacherIdentityValue(record.assignedTeacherId)
    || normalizeTeacherIdentityValue(record.primaryTeacherId)
    || normalizeTeacherIdentityValue(record.teacherUid)
    || normalizeTeacherIdentityValue(record.teacher_id)
    || normalizeTeacherIdentityList(record.teacherIds)[0]
    || ''
  );
};

export const operationalTeacherRecordBelongsTo = (
  record: Record<string, unknown> | undefined,
  teacherId: unknown,
): boolean => {
  const expectedTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!record || !expectedTeacherId) return false;

  const canonicalTeacherId = normalizeTeacherIdentityValue(record.teacherId);
  if (canonicalTeacherId) return canonicalTeacherId === expectedTeacherId;

  return collectLegacyTeacherIdentityRefs(record).includes(expectedTeacherId);
};

// B5 write contract: new/updated operational ownership is written only to teacherId.
// Existing alias fields are intentionally not deleted here; physical cleanup is a separate reviewed migration.
export const buildCanonicalOperationalTeacherWriteFields = (
  teacherId: unknown,
): CanonicalOperationalTeacherWriteFields => {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!canonicalTeacherId) {
    throw new Error('Canonical teacherId is required before writing teacher ownership');
  }

  return { teacherId: canonicalTeacherId };
};

export const buildCanonicalEnrollmentTeacherWriteFields = (
  teacherId: unknown,
): CanonicalEnrollmentTeacherWriteFields => {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!canonicalTeacherId) {
    throw new Error('Canonical teacherId is required before writing enrollment ownership');
  }
  return { teacherId: canonicalTeacherId };
};

export const auditOperationalTeacherIdentity = (
  record: Record<string, unknown> | undefined,
): OperationalTeacherIdentityAudit => {
  const canonicalTeacherId = normalizeTeacherIdentityValue(record?.teacherId);
  const legacyRefs = collectLegacyTeacherIdentityRefs(record);
  const resolvedTeacherId = resolveOperationalTeacherId(record);
  const mismatchedAliasFields: LegacyTeacherIdAliasField[] = [];

  if (canonicalTeacherId && record) {
    const scalarAliasFields: Exclude<LegacyTeacherIdAliasField, 'teacherIds'>[] = [
      'assignedTeacherId',
      'primaryTeacherId',
      'teacherUid',
      'teacher_id',
    ];

    const teacherIds = normalizeTeacherIdentityList(record.teacherIds);
    if (teacherIds.length > 0 && (teacherIds.length !== 1 || teacherIds[0] !== canonicalTeacherId)) {
      mismatchedAliasFields.push('teacherIds');
    }

    scalarAliasFields.forEach((field) => {
      const value = normalizeTeacherIdentityValue(record[field]);
      if (value && value !== canonicalTeacherId) mismatchedAliasFields.push(field);
    });
  }

  return {
    canonicalTeacherId,
    resolvedTeacherId,
    missingCanonicalTeacherId: !canonicalTeacherId,
    legacyOnly: !canonicalTeacherId && legacyRefs.length > 0,
    legacyRefs,
    mismatchedAliasFields,
    hasLegacyAliases: legacyRefs.length > 0,
  };
};
