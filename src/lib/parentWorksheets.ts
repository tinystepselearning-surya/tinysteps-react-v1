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
  const targetKidIds = normalizeStringArray(data?.targetKidIds);
  const targetChildIds = normalizeStringArray(data?.targetChildIds);
  const targetStageTags = normalizeStringArray(data?.targetStageTags);
  const stageTags = normalizeStringArray(data?.stageTags);
  const worksheetUrl = String(data?.worksheetUrl || "").trim();
  const legacyUrl = String(data?.url || "").trim();

  const hasActive = typeof data?.active === "boolean";
  const hasIsActive = typeof data?.isActive === "boolean";
  const hasArchived = typeof data?.archived === "boolean";
  const hasIsArchived = typeof data?.isArchived === "boolean";

  return {
    id,
    title: String(data?.title || "").trim(),
    url: worksheetUrl || legacyUrl,
    description: String(data?.description || "").trim(),
    category: String(data?.category || "").trim(),
    thumbnailUrl: String(data?.thumbnailUrl || "").trim(),
    targetParentIds: normalizeStringArray(data?.targetParentIds),
    targetKidIds: Array.from(new Set([...targetKidIds, ...targetChildIds])),
    targetCourseIds: normalizeStringArray(data?.targetCourseIds),
    targetEnrollmentIds: normalizeStringArray(data?.targetEnrollmentIds),
    targetStageTags: Array.from(new Set([...targetStageTags, ...stageTags])),
    isActive: hasActive ? data.active === true : hasIsActive ? data.isActive !== false : true,
    isArchived: hasArchived ? data.archived === true : hasIsArchived ? data.isArchived === true : false,
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
    parentUid?: string | null;
    courseIds?: string[];
    enrollmentIds?: string[];
  },
): boolean => {
  const kidId = String(context.kidId || "").trim();
  const parentUid = String(context.parentUid || "").trim();
  const courseIds = new Set((context.courseIds || []).map((id) => String(id || "").trim()).filter(Boolean));
  const enrollmentIds = new Set((context.enrollmentIds || []).map((id) => String(id || "").trim()).filter(Boolean));

  if (worksheet.targetKidIds.length > 0) {
    if (!kidId || !worksheet.targetKidIds.includes(kidId)) return false;
  }

  if (worksheet.targetCourseIds.length > 0) {
    const hasCourseMatch = worksheet.targetCourseIds.some((id) => courseIds.has(id));
    if (!hasCourseMatch) return false;
  } else if (worksheet.targetParentIds.length > 0) {
    const hasLegacyParentMatch =
      worksheet.targetParentIds.includes("all_parents")
      || (!!parentUid && worksheet.targetParentIds.includes(parentUid));
    if (!hasLegacyParentMatch) return false;
  }

  if (worksheet.targetEnrollmentIds.length > 0) {
    const hasEnrollmentMatch = worksheet.targetEnrollmentIds.some((id) => enrollmentIds.has(id));
    if (!hasEnrollmentMatch) return false;
  }

  return true;
};
