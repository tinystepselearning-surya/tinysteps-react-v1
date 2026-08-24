import { normalizeTeacherIdentityValue } from './teacherIdentity';

export const collectSessionTeacherRefs = (sessionLike: Record<string, unknown> | undefined): string[] => {
  if (!sessionLike) return [];
  return Array.from(
    new Set(
      [
        ...(Array.isArray(sessionLike.teacherIds) ? sessionLike.teacherIds : []),
        sessionLike.teacherId,
        sessionLike.assignedTeacherId,
        sessionLike.primaryTeacherId,
        sessionLike.teacherUid,
        sessionLike.teacher_id,
      ]
        .map((value) => normalizeTeacherIdentityValue(value))
        .filter(Boolean),
    ),
  );
};

export const resolvePreferredSessionTeacherRef = (
  sessionLike: Record<string, unknown> | undefined,
  preferredRefs: string[] = [],
): string => {
  const sessionRefs = collectSessionTeacherRefs(sessionLike);
  if (!sessionRefs.length) return '';
  const preferred = new Set(
    preferredRefs.map((value) => normalizeTeacherIdentityValue(value)).filter(Boolean),
  );
  if (preferred.size === 0) return sessionRefs[0] || '';
  return sessionRefs.find((value) => preferred.has(value)) || sessionRefs[0] || '';
};
