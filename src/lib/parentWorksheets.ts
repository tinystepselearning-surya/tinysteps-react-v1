export type ParentWorksheetItem = {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  resourceType: string;
  thumbnailUrl: string;
  lessonId: string;
  lessonTitle: string;
  lessonFolderId: string;
  lessonFolderTitle: string;
  courseId: string;
  courseTitle: string;
  targetLessonIds: string[];
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
    if (parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
};

const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export const getGoogleDriveFileId = (value?: string | null): string | null => {
  const normalized = normalizeWorksheetUrl(value);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (!DRIVE_HOSTS.has(parsed.hostname.toLowerCase())) return null;
    const pathMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    const queryId = parsed.searchParams.get("id");
    const id = String(pathMatch?.[1] || queryId || "").trim();
    return /^[a-zA-Z0-9_-]{10,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

export const getWorksheetDownloadUrl = (value?: string | null): string | null => {
  const fileId = getGoogleDriveFileId(value);
  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : null;
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
  const explicitLessonIds = normalizeStringArray(data?.targetLessonIds);
  const lessonId = String(data?.lessonId || explicitLessonIds[0] || "").trim();
  const targetLessonIds = Array.from(new Set([lessonId, ...explicitLessonIds].filter(Boolean)));
  const lessonTitle = String(data?.lessonTitle || data?.lessonName || "").trim();
  const resourceType = String(data?.resourceType || data?.activityType || data?.category || "").trim();
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
    category: lessonTitle || String(data?.category || "").trim() || resourceType,
    resourceType,
    thumbnailUrl: String(data?.thumbnailUrl || "").trim(),
    lessonId,
    lessonTitle,
    lessonFolderId: String(data?.lessonFolderId || "").trim(),
    lessonFolderTitle: String(data?.lessonFolderTitle || "").trim(),
    courseId: String(data?.courseId || data?.targetCourseIds?.[0] || "").trim(),
    courseTitle: String(data?.courseTitle || data?.courseName || "").trim(),
    targetLessonIds,
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

export type ParentWorksheetGroup = {
  key: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonFolderTitle: string;
  legacy: boolean;
  items: ParentWorksheetItem[];
};

const naturalWorksheetCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const lessonSortLabel = (group: ParentWorksheetGroup): string =>
  [group.lessonFolderTitle, group.lessonTitle, group.lessonId].filter(Boolean).join(" ");

export const groupParentWorksheets = (items: ParentWorksheetItem[]): ParentWorksheetGroup[] => {
  const groups = new Map<string, ParentWorksheetGroup>();
  items.forEach((item) => {
    const courseId = item.courseId || item.targetCourseIds[0] || "legacy";
    const lessonId = item.lessonId;
    const legacy = !lessonId;
    const key = legacy ? `${courseId}::legacy` : `${courseId}::${lessonId}`;
    const current = groups.get(key);
    if (current) {
      current.items.push(item);
      return;
    }
    groups.set(key, {
      key,
      courseId,
      courseTitle: item.courseTitle || (courseId === "legacy" ? "General Resources" : "Course resources"),
      lessonId,
      lessonTitle: legacy ? "Legacy / General Resources" : item.lessonTitle || "Lesson",
      lessonFolderTitle: item.lessonFolderTitle,
      legacy,
      items: [item],
    });
  });

  const grouped = Array.from(groups.values());
  grouped.forEach((group) => {
    group.items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return naturalWorksheetCollator.compare(a.title, b.title);
    });
  });

  return grouped.sort((a, b) => {
    const courseDiff = naturalWorksheetCollator.compare(a.courseTitle, b.courseTitle);
    if (courseDiff !== 0) return courseDiff;
    if (a.legacy !== b.legacy) return a.legacy ? 1 : -1;
    return naturalWorksheetCollator.compare(lessonSortLabel(a), lessonSortLabel(b));
  });
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
