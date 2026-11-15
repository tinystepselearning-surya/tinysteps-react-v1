/**
 * Synchronous write-through of the server-owned parent worksheet catalogue.
 * The admin UI is the canonical worksheet editor; it updates this compact
 * read model in the SAME Firestore transaction as the worksheet record.
 */
export const WORKSHEET_BUNDLE_COLLECTION = 'worksheetBundles';
export const WORKSHEET_BUNDLE_ID = 'parentLibraryV1';
const MAX_BUNDLE_JSON_BYTES = 800_000;

type WorksheetBundleEntry = {
  id: string;
  data: Record<string, unknown>;
};

const PARENT_FIELDS = [
  'title', 'url', 'worksheetUrl', 'description', 'resourceType', 'activityType',
  'category', 'lessonId', 'lessonTitle', 'lessonName', 'lessonFolderId',
  'lessonFolderTitle', 'courseId', 'courseTitle', 'courseName', 'sortOrder',
  'targetCourseIds', 'targetParentIds', 'targetKidIds', 'targetChildIds',
  'targetEnrollmentIds', 'active', 'isActive', 'archived', 'isArchived',
] as const;

function project(id: string, source: Record<string, unknown>): WorksheetBundleEntry {
  const data: Record<string, unknown> = {};
  for (const field of PARENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) data[field] = source[field];
  }
  return { id, data };
}

export function readWorksheetBundleEntries(raw: Record<string, unknown> | undefined): WorksheetBundleEntry[] | null {
  if (!raw || raw.schemaVersion !== 1 || raw.ready !== true || typeof raw.entriesJson !== 'string') {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw.entriesJson);
    if (!Array.isArray(value) || !value.every((row) =>
      row && typeof row.id === 'string' && row.data && typeof row.data === 'object')) return null;
    return value as WorksheetBundleEntry[];
  } catch {
    return null;
  }
}

export function worksheetBundlePatch(
  current: Record<string, unknown> | undefined,
  worksheetId: string,
  worksheet: Record<string, unknown> | null,
): Record<string, unknown> {
  const existing = readWorksheetBundleEntries(current);
  if (!existing) {
    // Keep a synchronisation fence, even before the first parent bootstrap.
    return { schemaVersion: 1, ready: false, oversized: current?.oversized === true, entriesJson: '' };
  }
  const next = existing.filter((row) => row.id !== worksheetId);
  if (worksheet) next.push(project(worksheetId, worksheet));
  next.sort((a, b) => a.id.localeCompare(b.id));
  const entriesJson = JSON.stringify(next);
  if (new TextEncoder().encode(entriesJson).byteLength > MAX_BUNDLE_JSON_BYTES) {
    return { schemaVersion: 1, ready: false, oversized: true, entriesJson: '' };
  }
  return { schemaVersion: 1, ready: true, oversized: false, entriesJson };
}
