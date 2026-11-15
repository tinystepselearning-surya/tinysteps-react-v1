import type * as admin from 'firebase-admin';

export const PARENT_WORKSHEET_BUNDLE_COLLECTION = 'worksheetBundles';
export const PARENT_WORKSHEET_BUNDLE_ID = 'parentLibraryV1';
export const PARENT_WORKSHEET_BUNDLE_VERSION = 1;
// Leave headroom below Firestore's 1 MiB document size cap, including metadata.
const MAX_BUNDLE_JSON_BYTES = 800_000;

export type ParentWorksheetBundleEntry = {
  id: string;
  data: Record<string, unknown>;
};

// Only fields used by eligibility checks and parent presentation are materialized.
// Do not copy teacherScript, internal notes, audit identities, or other admin data.
const PARENT_FIELDS = [
  'title', 'url', 'worksheetUrl', 'description', 'resourceType', 'activityType',
  'category', 'lessonId', 'lessonTitle', 'lessonName', 'lessonFolderId',
  'lessonFolderTitle', 'courseId', 'courseTitle', 'courseName', 'sortOrder',
  'targetCourseIds', 'targetParentIds', 'targetKidIds', 'targetChildIds',
  'targetEnrollmentIds', 'targetStageTags', 'stageTags',
  'active', 'isActive', 'archived', 'isArchived',
] as const;

export function parentWorksheetBundleEntry(
  id: string,
  source: Record<string, unknown>,
): ParentWorksheetBundleEntry {
  const data: Record<string, unknown> = {};
  for (const field of PARENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) data[field] = source[field];
  }
  return { id, data };
}

export function decodeParentWorksheetBundle(
  raw: Record<string, unknown> | null | undefined,
): ParentWorksheetBundleEntry[] | null {
  if (raw?.schemaVersion !== PARENT_WORKSHEET_BUNDLE_VERSION || raw.ready !== true ||
    typeof raw.entriesJson !== 'string') return null;
  try {
    const decoded: unknown = JSON.parse(raw.entriesJson);
    if (!Array.isArray(decoded)) return null;
    if (!decoded.every((row) =>
      row && typeof row === 'object' && !Array.isArray(row) &&
      typeof row.id === 'string' && row.id.length > 0 &&
      row.data && typeof row.data === 'object' && !Array.isArray(row.data))) return null;
    return decoded as ParentWorksheetBundleEntry[];
  } catch {
    return null;
  }
}

export function buildParentWorksheetBundle(
  entries: ParentWorksheetBundleEntry[],
): Record<string, unknown> {
  const entriesJson = JSON.stringify(entries);
  if (Buffer.byteLength(entriesJson, 'utf8') > MAX_BUNDLE_JSON_BYTES) {
    return {
      schemaVersion: PARENT_WORKSHEET_BUNDLE_VERSION,
      ready: false,
      oversized: true,
      entriesJson: '',
    };
  }
  return {
    schemaVersion: PARENT_WORKSHEET_BUNDLE_VERSION,
    ready: true,
    oversized: false,
    entriesJson,
  };
}

export function updateParentWorksheetBundle(
  entries: ParentWorksheetBundleEntry[],
  id: string,
  source: Record<string, unknown> | null,
): ParentWorksheetBundleEntry[] {
  const result = entries.filter((entry) => entry.id !== id);
  if (source) result.push(parentWorksheetBundleEntry(id, source));
  return result.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadParentWorksheetBundle(
  db: admin.firestore.Firestore,
): Promise<ParentWorksheetBundleEntry[]> {
  const bundleRef = db.collection(PARENT_WORKSHEET_BUNDLE_COLLECTION).doc(PARENT_WORKSHEET_BUNDLE_ID);
  const existing = await bundleRef.get();
  const cached = decodeParentWorksheetBundle(existing.data() as Record<string, unknown> | undefined);
  if (cached) return cached;

  // A catalogue too large for one document must remain complete. Fail over to
  // the source collection, rather than truncate a parent's worksheet list.
  if (existing.data()?.oversized === true) {
    const source = await db.collection('parentWorksheetLibrary').get();
    return source.docs.map((docSnap) => parentWorksheetBundleEntry(docSnap.id, docSnap.data()));
  }

  // First parent request bootstraps exactly once. This is intentionally a
  // transaction: worksheet admin writes also read/write the bundle document.
  // Any concurrent publication invalidates this transaction and forces a retry.
  return db.runTransaction(async (tx) => {
    const latest = await tx.get(bundleRef);
    const ready = decodeParentWorksheetBundle(latest.data() as Record<string, unknown> | undefined);
    if (ready) return ready;
    if (latest.data()?.oversized === true) {
      const source = await tx.get(db.collection('parentWorksheetLibrary'));
      return source.docs.map((docSnap) => parentWorksheetBundleEntry(docSnap.id, docSnap.data()));
    }

    const source = await tx.get(db.collection('parentWorksheetLibrary'));
    const entries = source.docs
      .map((docSnap) => parentWorksheetBundleEntry(docSnap.id, docSnap.data()))
      .sort((a, b) => a.id.localeCompare(b.id));

    tx.set(bundleRef, buildParentWorksheetBundle(entries));
    return entries;
  });
}
