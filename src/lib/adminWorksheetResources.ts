export type LessonWorksheetResource = {
  id: string;
  title: string;
  url: string;
  description?: string;
  resourceType?: string;
  sortOrder?: number;
  active?: boolean;
  archived?: boolean;
  targetCourseIds?: string[];
};

export const normalizeLessonWorksheetResources = (value: unknown): LessonWorksheetResource[] => {
  if (!Array.isArray(value)) return [];
  return value.map((resource: any) => ({
    id: String(resource?.id || '').trim(), title: String(resource?.title || '').trim(),
    url: String(resource?.url || resource?.worksheetUrl || '').trim(),
    description: String(resource?.description || '').trim(),
    resourceType: String(resource?.resourceType || resource?.category || '').trim(),
    sortOrder: Number.isFinite(Number(resource?.sortOrder)) ? Number(resource.sortOrder) : 0,
    active: resource?.active !== false, archived: resource?.archived === true,
    targetCourseIds: Array.isArray(resource?.targetCourseIds) ? resource.targetCourseIds.map(String).filter(Boolean) : [],
  })).filter((resource) => resource.id && resource.title && resource.url);
};

export const upsertLessonWorksheetResource = (resources: LessonWorksheetResource[], next: LessonWorksheetResource) =>
  [...resources.filter((resource) => resource.id !== next.id), next].sort((a, b) =>
    (Number(a.sortOrder || 0) - Number(b.sortOrder || 0)) || a.title.localeCompare(b.title));

export const removeLessonWorksheetResource = (resources: LessonWorksheetResource[], id: string) =>
  resources.filter((resource) => resource.id !== id);

export const worksheetResourceProjectionPatch = (resources: LessonWorksheetResource[], next: LessonWorksheetResource) => ({
  worksheetResources: upsertLessonWorksheetResource(resources, next),
});

export const existingArchivedState = (data: Record<string, unknown> | undefined) =>
  data?.isArchived === true || data?.archived === true;

export const explicitTeacherScriptPatch = (script: unknown) => ({
  teacherScript: String(script || '').trim(),
});
