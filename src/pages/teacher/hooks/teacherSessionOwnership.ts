import { getDocs, type Query } from 'firebase/firestore';

export type TeacherSessionAliasField =
  | 'teacherId'
  | 'teacherIds'
  | 'assignedTeacherId'
  | 'primaryTeacherId'
  | 'teacherUid'
  | 'teacher_id';

export type TeacherSessionFallbackAliasField = Exclude<TeacherSessionAliasField, 'teacherId'>;

type TeacherSessionAliasConfig = {
  field: TeacherSessionFallbackAliasField;
  operator: '==' | 'array-contains';
};

export const TEACHER_SESSION_FALLBACK_ALIASES: TeacherSessionAliasConfig[] = [
  { field: 'teacherIds', operator: 'array-contains' },
  { field: 'assignedTeacherId', operator: '==' },
  { field: 'primaryTeacherId', operator: '==' },
  { field: 'teacherUid', operator: '==' },
  { field: 'teacher_id', operator: '==' },
];

export const buildCanonicalTeacherSessionQuery = (
  buildScopedQuery: (field: 'teacherId', operator: '==') => Query,
): Query => buildScopedQuery('teacherId', '==');

export const makeTeacherFallbackCacheKey = (
  teacherId: string,
  scopeKey: string,
): string => `${teacherId}::${scopeKey}`;

export const mergeAndDedupeSessionDocs = <T extends { id: string }>(
  ...rowGroups: Array<Iterable<T>>
): Map<string, T> => {
  const merged = new Map<string, T>();
  rowGroups.forEach((rows) => {
    for (const row of rows) {
      merged.set(row.id, row);
    }
  });
  return merged;
};

const isPermissionDeniedError = (error: unknown): boolean => {
  const code = typeof (error as { code?: unknown } | undefined)?.code === 'string'
    ? String((error as { code?: string }).code).toLowerCase()
    : '';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
  return code.includes('permission-denied') || message.includes('missing or insufficient permissions');
};

export interface TeacherSessionFallbackResult<T extends { id: string }> {
  rows: T[];
  deniedAliases: TeacherSessionFallbackAliasField[];
  succeededAliases: TeacherSessionFallbackAliasField[];
  firstError: unknown;
}

export const fetchTeacherSessionAliasFallbacks = async <T extends { id: string }>(params: {
  buildScopedQuery: (
    field: TeacherSessionFallbackAliasField,
    operator: '==' | 'array-contains',
  ) => Query;
  includeAliases?: TeacherSessionFallbackAliasField[];
  mapDoc: (doc: { id: string; data: () => Record<string, unknown> }) => T;
  rowMatchesTeacher?: (row: T) => boolean;
  onQuery?: (details: { field: TeacherSessionFallbackAliasField; operator: '==' | 'array-contains' }) => void;
  onQueryError?: (details: {
    field: TeacherSessionFallbackAliasField;
    operator: '==' | 'array-contains';
    error: unknown;
  }) => void;
}): Promise<TeacherSessionFallbackResult<T>> => {
  const {
    buildScopedQuery,
    includeAliases,
    mapDoc,
    rowMatchesTeacher,
    onQuery,
    onQueryError,
  } = params;

  const allowedAliases = includeAliases ? new Set(includeAliases) : null;
  const aliases = TEACHER_SESSION_FALLBACK_ALIASES.filter(
    ({ field }) => !allowedAliases || allowedAliases.has(field),
  );

  const settled = await Promise.allSettled(
    aliases.map(async ({ field, operator }) => {
      onQuery?.({ field, operator });
      const snap = await getDocs(buildScopedQuery(field, operator));
      return { field, snap };
    }),
  );

  const merged = new Map<string, T>();
  const deniedAliases: TeacherSessionFallbackAliasField[] = [];
  const succeededAliases: TeacherSessionFallbackAliasField[] = [];
  let firstError: unknown = null;

  settled.forEach((result, index) => {
    const alias = aliases[index];

    if (result.status === 'fulfilled') {
      succeededAliases.push(alias.field);
      result.value.snap.docs.forEach((docSnap) => {
        const row = mapDoc(docSnap as { id: string; data: () => Record<string, unknown> });
        if (rowMatchesTeacher && !rowMatchesTeacher(row)) return;
        merged.set(row.id, row);
      });
      return;
    }

    firstError ??= result.reason;
    if (isPermissionDeniedError(result.reason)) {
      deniedAliases.push(alias.field);
    }
    onQueryError?.({
      field: alias.field,
      operator: alias.operator,
      error: result.reason,
    });
  });

  return {
    rows: Array.from(merged.values()),
    deniedAliases,
    succeededAliases,
    firstError,
  };
};
