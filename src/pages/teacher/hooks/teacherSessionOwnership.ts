import { type Query } from 'firebase/firestore';
import { CANONICAL_TEACHER_ID_FIELD } from '../../../lib/teacherIdentity';

export const buildCanonicalTeacherSessionQuery = (
  buildScopedQuery: (field: 'teacherId', operator: '==') => Query,
): Query => buildScopedQuery(CANONICAL_TEACHER_ID_FIELD, '==');

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
