import { TeacherSession } from '../../../types/Teacher';

type LooseRecord = Record<string, unknown>;

export interface TeacherSessionStudentNameLookups {
  enrollment?: LooseRecord | null;
  entityDocById?: ReadonlyMap<string, LooseRecord> | Record<string, LooseRecord> | null;
}

export interface TeacherSessionStudentNameResolution {
  name: string;
  source: string;
}

const GENERIC_COUNT_RE = /^\d+\s+students?$/i;

const toCleanText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const isUsableName = (value: unknown): value is string => {
  const text = toCleanText(value);
  if (!text) return false;

  const lower = text.toLowerCase();
  if (lower === 'undefined' || lower === 'null') return false;
  if (lower === 'student' || lower === 'child' || lower === 'kid') return false;
  if (GENERIC_COUNT_RE.test(lower)) return false;

  return true;
};

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const pickName = (
  source: string,
  value: unknown,
): TeacherSessionStudentNameResolution | null => {
  if (!isUsableName(value)) return null;
  return {
    name: toCleanText(value),
    source,
  };
};

const maybeRecord = (value: unknown): LooseRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as LooseRecord;
};

const pickFirstName = (
  sourcePrefix: string,
  values: Array<[string, unknown]>,
): TeacherSessionStudentNameResolution | null => {
  for (const [field, value] of values) {
    const candidate = pickName(`${sourcePrefix}.${field}`, value);
    if (candidate) return candidate;
  }

  return null;
};

const getLookupDoc = (
  lookups: TeacherSessionStudentNameLookups,
  id: string,
): LooseRecord | null => {
  if (!id) return null;
  const source = lookups.entityDocById;
  if (!source) return null;
  if (source instanceof Map) return source.get(id) ?? null;
  return (source as Record<string, LooseRecord>)[id] ?? null;
};

const collectNamesFromValue = (value: unknown, preferredIds: string[]): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return unique(
      value.flatMap((item) => {
        const direct = pickName('array', item);
        if (direct) return [direct.name];

        const record = maybeRecord(item);
        if (!record) return [];

        return unique([
          toCleanText(record.name),
          toCleanText(record.fullName),
          toCleanText(record.displayName),
          toCleanText(record.studentName),
          toCleanText(record.childName),
          toCleanText(record.kidName),
        ].filter(isUsableName));
      }),
    );
  }

  const record = maybeRecord(value);
  if (record) {
    const names: string[] = [];

    preferredIds.forEach((id) => {
      const nestedValue = record[id];
      if (nestedValue === undefined) return;
      names.push(...collectNamesFromValue(nestedValue, []));
    });

    Object.values(record).forEach((nestedValue) => {
      names.push(...collectNamesFromValue(nestedValue, []));
    });

    return unique(names);
  }

  const single = pickName('single', value);
  return single ? [single.name] : [];
};

const extractSessionEntityIdGroups = (session: Partial<TeacherSession> | LooseRecord) => {
  const row = session as LooseRecord;
  const readArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? unique(
          value
            .map((item) => toCleanText(item))
            .filter(Boolean),
        )
      : [];

  return {
    kidId: toCleanText(row.kidId),
    studentId: toCleanText(row.studentId),
    childId: toCleanText(row.childId),
    kidIds: readArray(row.kidIds),
    studentIds: readArray(row.studentIds),
    childIds: readArray(row.childIds),
    childrenIds: readArray(row.childrenIds),
  };
};

export const getTeacherSessionEntityIds = (
  session: Partial<TeacherSession> | LooseRecord,
): string[] => {
  const groups = extractSessionEntityIdGroups(session);
  return unique([
    groups.kidId,
    groups.studentId,
    groups.childId,
    ...groups.kidIds,
    ...groups.studentIds,
    ...groups.childIds,
    ...groups.childrenIds,
  ].filter(Boolean));
};

export const getTeacherSessionEntityIdsByField = (
  session: Partial<TeacherSession> | LooseRecord,
) => extractSessionEntityIdGroups(session);

export const getTeacherSessionInlineStudentNames = (
  session: Partial<TeacherSession> | LooseRecord,
): string[] => {
  const row = session as LooseRecord;
  const preferredIds = getTeacherSessionEntityIds(session);
  return unique([
    ...collectNamesFromValue(row.studentNames, preferredIds),
    ...collectNamesFromValue(row.childNames, preferredIds),
    ...collectNamesFromValue(row.kidNames, preferredIds),
    toCleanText(row.studentName),
    toCleanText(row.childName),
    toCleanText(row.kidName),
  ].filter(isUsableName));
};

export const getTeacherSessionCountLabel = (
  session: Partial<TeacherSession> | LooseRecord,
): string => {
  const count = getTeacherSessionEntityIds(session).length;
  if (count === 1) return '1 student';
  return `${count} students`;
};

export const resolveTeacherSessionStudentName = (
  session: Partial<TeacherSession> | LooseRecord | undefined | null,
  lookups: TeacherSessionStudentNameLookups = {},
): TeacherSessionStudentNameResolution => {
  const row = (session || {}) as LooseRecord;
  const enrollment = (lookups.enrollment || {}) as LooseRecord;
  const idsByField = extractSessionEntityIdGroups(row);
  const allIds = getTeacherSessionEntityIds(row);
  const enrollmentStudent = maybeRecord(enrollment.student);
  const enrollmentChild = maybeRecord(enrollment.child);
  const enrollmentKid = maybeRecord(enrollment.kid);
  const enrollmentStudentDetails = maybeRecord(enrollment.studentDetails);
  const enrollmentChildDetails = maybeRecord(enrollment.childDetails);
  const enrollmentKidDetails = maybeRecord(enrollment.kidDetails);

  const directCandidates: Array<TeacherSessionStudentNameResolution | null> = [
    pickFirstName('session', [
      ['studentName', row.studentName],
      ['childName', row.childName],
      ['kidName', row.kidName],
    ]),
    pickFirstName('session.student', [
      ['name', maybeRecord(row.student)?.name],
      ['fullName', maybeRecord(row.student)?.fullName],
      ['displayName', maybeRecord(row.student)?.displayName],
    ]),
    pickFirstName('session.child', [
      ['name', maybeRecord(row.child)?.name],
      ['fullName', maybeRecord(row.child)?.fullName],
      ['displayName', maybeRecord(row.child)?.displayName],
    ]),
    pickFirstName('session.kid', [
      ['name', maybeRecord(row.kid)?.name],
      ['fullName', maybeRecord(row.kid)?.fullName],
      ['displayName', maybeRecord(row.kid)?.displayName],
    ]),
    pickFirstName('enrollment', [
      ['studentName', enrollment.studentName],
      ['childName', enrollment.childName],
      ['kidName', enrollment.kidName],
    ]),
    pickFirstName('enrollment.student', [
      ['name', enrollmentStudent?.name],
      ['fullName', enrollmentStudent?.fullName],
      ['displayName', enrollmentStudent?.displayName],
    ]),
    pickFirstName('enrollment.child', [
      ['name', enrollmentChild?.name],
      ['fullName', enrollmentChild?.fullName],
      ['displayName', enrollmentChild?.displayName],
    ]),
    pickFirstName('enrollment.kid', [
      ['name', enrollmentKid?.name],
      ['fullName', enrollmentKid?.fullName],
      ['displayName', enrollmentKid?.displayName],
    ]),
    pickFirstName('enrollment.studentDetails', [
      ['name', enrollmentStudentDetails?.name],
      ['fullName', enrollmentStudentDetails?.fullName],
      ['displayName', enrollmentStudentDetails?.displayName],
    ]),
    pickFirstName('enrollment.childDetails', [
      ['name', enrollmentChildDetails?.name],
      ['fullName', enrollmentChildDetails?.fullName],
      ['displayName', enrollmentChildDetails?.displayName],
    ]),
    pickFirstName('enrollment.kidDetails', [
      ['name', enrollmentKidDetails?.name],
      ['fullName', enrollmentKidDetails?.fullName],
      ['displayName', enrollmentKidDetails?.displayName],
    ]),
    pickFirstName('enrollment', [
      ['studentFullName', enrollment.studentFullName],
      ['childFullName', enrollment.childFullName],
      ['kidFullName', enrollment.kidFullName],
      ['fullName', enrollment.fullName],
      ['name', enrollment.name],
      ['displayName', enrollment.displayName],
    ]),
  ];

  for (const candidate of directCandidates) {
    if (candidate) return candidate;
  }

  const primaryLookupEntries = [
    ['kidId', idsByField.kidId],
    ['studentId', idsByField.studentId],
    ['childId', idsByField.childId],
  ] as const;

  for (const [field, id] of primaryLookupEntries) {
    if (!id) continue;
    const doc = getLookupDoc(lookups, id);
    if (!doc) continue;

    const docCandidates = [
      pickName(`${field}.lookup.name`, doc.name),
      pickName(`${field}.lookup.fullName`, doc.fullName),
      pickName(`${field}.lookup.displayName`, doc.displayName),
      pickName(`${field}.lookup.studentName`, doc.studentName),
      pickName(`${field}.lookup.childName`, doc.childName),
      pickName(`${field}.lookup.kidName`, doc.kidName),
    ];

    for (const candidate of docCandidates) {
      if (candidate) return candidate;
    }
  }

  const listNameCandidates: Array<[string, unknown]> = [
    ['session.studentNames', row.studentNames],
    ['session.childNames', row.childNames],
    ['session.kidNames', row.kidNames],
  ];

  for (const [source, value] of listNameCandidates) {
    const names = collectNamesFromValue(value, allIds);
    const first = names.find((name) => isUsableName(name));
    if (first) {
      return {
        name: first,
        source,
      };
    }
  }

  const idFieldEntries = [
    ['session.kidId', idsByField.kidId ? [idsByField.kidId] : []],
    ['session.studentId', idsByField.studentId ? [idsByField.studentId] : []],
    ['session.childId', idsByField.childId ? [idsByField.childId] : []],
    ['session.kidIds', idsByField.kidIds],
    ['session.studentIds', idsByField.studentIds],
    ['session.childIds', idsByField.childIds],
    ['session.childrenIds', idsByField.childrenIds],
  ] as const;

  for (const [source, ids] of idFieldEntries) {
    for (const id of ids) {
      const doc = getLookupDoc(lookups, id);
      if (!doc) continue;

      const docCandidates = [
        pickName(`${source}.lookup.name`, doc.name),
        pickName(`${source}.lookup.fullName`, doc.fullName),
        pickName(`${source}.lookup.displayName`, doc.displayName),
        pickName(`${source}.lookup.studentName`, doc.studentName),
        pickName(`${source}.lookup.childName`, doc.childName),
        pickName(`${source}.lookup.kidName`, doc.kidName),
      ];

      for (const candidate of docCandidates) {
        if (candidate) return candidate;
      }
    }
  }

  return {
    name: getTeacherSessionCountLabel(row),
    source: 'fallback.count',
  };
};
