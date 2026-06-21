const JOIN_LINK_FIELD_KEYS = ["joinUrl", "classLink", "meetingLink"] as const;
const JOIN_LINK_NESTED_KEYS = [
  "class",
  "classroom",
  "assignedClass",
  "currentEnrollment",
  "defaultEnrollment",
  "membership",
  "teacher",
] as const;
const TEACHER_ALIAS_KEYS = [
  "teacherId",
  "assignedTeacherId",
  "primaryTeacherId",
  "teacherUid",
  "teacher_id",
] as const;

type LookupMap = Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>;

const toCleanText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const toCleanTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => toCleanText(entry)).filter(Boolean)));
};

const readLookupValue = (
  lookup: LookupMap | undefined,
  key: string,
): Record<string, unknown> | undefined => {
  if (!lookup || !key) return undefined;
  if (lookup instanceof Map) return lookup.get(key);
  return lookup[key];
};

const collectTeacherAliasIds = (source: unknown): string[] => {
  if (!source || typeof source !== "object") return [];
  const row = source as Record<string, unknown>;
  return Array.from(
    new Set([
      ...toCleanTextList(row.teacherIds),
      ...TEACHER_ALIAS_KEYS.map((key) => toCleanText(row[key])),
    ].filter(Boolean)),
  );
};

export const getJoinLinkCandidate = (source: unknown): string => {
  if (!source || typeof source !== "object") return "";
  const row = source as Record<string, unknown>;

  for (const key of JOIN_LINK_FIELD_KEYS) {
    const value = toCleanText(row[key]);
    if (value) return value;
  }

  for (const nestedKey of JOIN_LINK_NESTED_KEYS) {
    const nestedValue = row[nestedKey];
    if (!nestedValue || typeof nestedValue !== "object") continue;
    const nestedRow = nestedValue as Record<string, unknown>;
    for (const key of JOIN_LINK_FIELD_KEYS) {
      const value = toCleanText(nestedRow[key]);
      if (value) return value;
    }
  }

  return "";
};

export const getSessionEnrollmentId = (session: unknown): string => {
  if (!session || typeof session !== "object") return "";
  const row = session as Record<string, unknown>;
  const explicitEnrollmentId = toCleanText(row.enrollmentId);
  if (explicitEnrollmentId) return explicitEnrollmentId;

  const sessionId = toCleanText(row.id);
  if (!sessionId.includes("_")) return "";
  return sessionId.split("_")[0]?.trim() || "";
};

export const sessionJoinLinkMatchesEnrollmentTeacher = (
  session: unknown,
  enrollment: unknown,
): boolean => {
  const enrollmentTeacherIds = collectTeacherAliasIds(enrollment);
  if (!enrollmentTeacherIds.length) return true;

  const sessionTeacherIds = collectTeacherAliasIds(session);
  if (!sessionTeacherIds.length) return false;

  return sessionTeacherIds.some((teacherId) => enrollmentTeacherIds.includes(teacherId));
};

export const resolveSessionJoinLink = (
  session: unknown,
  enrollmentsById?: LookupMap,
): string => {
  const enrollmentId = getSessionEnrollmentId(session);
  const enrollment = enrollmentId ? readLookupValue(enrollmentsById, enrollmentId) : undefined;

  const enrollmentJoinUrl = getJoinLinkCandidate(enrollment);
  if (enrollmentJoinUrl) return enrollmentJoinUrl;

  const directJoinUrl = getJoinLinkCandidate(session);
  if (!directJoinUrl) return "";
  if (!enrollment) return directJoinUrl;

  return sessionJoinLinkMatchesEnrollmentTeacher(session, enrollment) ? directJoinUrl : "";
};
