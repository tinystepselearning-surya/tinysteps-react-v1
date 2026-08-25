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
  teacherIds: string[];
  assignedTeacherId: string;
  primaryTeacherId: string;
  teacherUid: string;
  teacher_id: string;
};

export type CanonicalEnrollmentTeacherWriteFields = {
  teacherId: string;
  teacherIds: string[];
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

export const buildCanonicalOperationalTeacherWriteFields = (
  teacherId: unknown,
): CanonicalOperationalTeacherWriteFields => {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!canonicalTeacherId) {
    throw new Error('Canonical teacherId is required before writing teacher ownership aliases');
  }

  return {
    teacherId: canonicalTeacherId,
    teacherIds: [canonicalTeacherId],
    assignedTeacherId: canonicalTeacherId,
    primaryTeacherId: canonicalTeacherId,
    teacherUid: canonicalTeacherId,
    teacher_id: canonicalTeacherId,
  };
};

export const buildCanonicalEnrollmentTeacherWriteFields = (
  teacherId: unknown,
): CanonicalEnrollmentTeacherWriteFields => {
  const canonicalTeacherId = normalizeTeacherIdentityValue(teacherId);
  if (!canonicalTeacherId) {
    throw new Error('Canonical teacherId is required before writing enrollment ownership');
  }
  return {
    teacherId: canonicalTeacherId,
    teacherIds: [canonicalTeacherId],
  };
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
