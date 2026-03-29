export type ParentWorksheetItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  targetParentIds: string[];
  targetKidIds: string[];
  targetCourseIds: string[];
  targetEnrollmentIds: string[];
  targetStageTags: string[];
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: unknown;
  updatedAt: unknown;
  createdBy?: string;
  updatedBy?: string;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const uniq = new Set<string>();
  value.forEach((entry) => {
    const text = String(entry || "").trim();
    if (text) uniq.add(text);
  });
  return Array.from(uniq);
};

export const normalizeWorksheetUrl = (value?: string | null): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
};

export const getSafeWorksheetUrl = (value?: string | null): string | null => {
  const normalized = normalizeWorksheetUrl(value);
  return normalized || null;
};

export const toParentWorksheetItem = (id: string, data: any): ParentWorksheetItem => {
  return {
    id,
    title: String(data?.title || "").trim(),
    url: String(data?.url || "").trim(),
    description: String(data?.description || "").trim(),
    category: String(data?.category || "").trim(),
    thumbnailUrl: String(data?.thumbnailUrl || "").trim(),
    targetParentIds: normalizeStringArray(data?.targetParentIds),
    targetKidIds: normalizeStringArray(data?.targetKidIds),
    targetCourseIds: normalizeStringArray(data?.targetCourseIds),
    targetEnrollmentIds: normalizeStringArray(data?.targetEnrollmentIds),
    targetStageTags: normalizeStringArray(data?.targetStageTags),
    isActive: data?.isActive !== false,
    isArchived: data?.isArchived === true,
    sortOrder: Number.isFinite(Number(data?.sortOrder)) ? Number(data.sortOrder) : 0,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
    createdBy: String(data?.createdBy || "").trim() || undefined,
    updatedBy: String(data?.updatedBy || "").trim() || undefined,
  };
};

export const worksheetMatchesContext = (
  worksheet: ParentWorksheetItem,
  context: {
    kidId?: string | null;
    courseId?: string | null;
    enrollmentIds?: string[];
  },
): boolean => {
  const kidId = String(context.kidId || "").trim();
  const courseId = String(context.courseId || "").trim();
  const enrollmentIds = new Set((context.enrollmentIds || []).map((id) => String(id || "").trim()).filter(Boolean));

  if (worksheet.targetKidIds.length > 0) {
    if (!kidId || !worksheet.targetKidIds.includes(kidId)) return false;
  }

  if (worksheet.targetCourseIds.length > 0) {
    if (!courseId || !worksheet.targetCourseIds.includes(courseId)) return false;
  }

  if (worksheet.targetEnrollmentIds.length > 0) {
    const hasEnrollmentMatch = worksheet.targetEnrollmentIds.some((id) => enrollmentIds.has(id));
    if (!hasEnrollmentMatch) return false;
  }

  return true;
};
