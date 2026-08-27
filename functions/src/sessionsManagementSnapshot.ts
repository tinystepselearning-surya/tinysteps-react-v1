import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const TIME_ZONE = 'Asia/Kolkata';
const ROOT_COLLECTION = 'adminSessionsManagement';
const SNAPSHOT_COLLECTION = 'adminSessionsManagementSnapshots';
const CURRENT_DOC = 'current';
const LEASE_DOC = 'refreshLease';
const SCHEMA_VERSION = 1;
const SESSION_LIMIT_PER_DATE = 200;
const OVERALL_ENROLLMENT_LIMIT = 250;
const SHARD_SIZE = 75;
const LOOKUP_CHUNK_SIZE = 100;
const UID_QUERY_CHUNK_SIZE = 10;
const LEASE_MS = 5 * 60 * 1000;

export type SnapshotRow = {
  id: string;
  data: Record<string, unknown>;
};

type SnapshotKind =
  | 'sessions'
  | 'enrollments'
  | 'users'
  | 'kids'
  | 'students'
  | 'courses';

type SnapshotRowsByKind = Record<SnapshotKind, SnapshotRow[]>;

type SnapshotBuildReason = 'scheduled' | 'manual' | 'bootstrap';

type SnapshotMeta = {
  schemaVersion: number;
  snapshotId: string;
  generatedAt: string;
  generatedBy: SnapshotBuildReason;
  generatedByUid: string | null;
  dateKeys: string[];
  counts: Record<string, number>;
  shardIds: Record<SnapshotKind, string[]>;
  sourceStats: {
    sessionDocumentsReturned: number;
    overallEnrollmentDocumentsReturned: number;
    directLookupRequests: number;
    uidFallbackDocumentsReturned: number;
    sourceDocumentsReturned: number;
  };
};

type SnapshotPayload = SnapshotMeta & SnapshotRowsByKind;

type DatePayload = {
  snapshotId: string;
  dateKey: string;
  sessions: SnapshotRow[];
  enrollments: SnapshotRow[];
  users: SnapshotRow[];
  kids: SnapshotRow[];
  students: SnapshotRow[];
  courses: SnapshotRow[];
  sourceStats: SnapshotMeta['sourceStats'];
};

const db = () => admin.firestore();

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.includes('/')) return raw;
  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
};

const uniqueIds = (values: unknown[]): string[] =>
  Array.from(new Set(values.map(normalizeLookupId).filter(Boolean)));

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const getKolkataDateKey = (date: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
};

const shiftDateKey = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return [
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

const toJsonSafe = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (value instanceof admin.firestore.DocumentReference) return value.path;
  if (value instanceof admin.firestore.GeoPoint) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      if (nested === undefined) return;
      output[key] = toJsonSafe(nested);
    });
    return output;
  }
  return String(value);
};

const rowFromSnapshot = (
  snapshot: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot,
): SnapshotRow => ({
  id: snapshot.id,
  data: (toJsonSafe(snapshot.data() || {}) || {}) as Record<string, unknown>,
});

const pickFields = (
  source: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> => {
  const output: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (source[field] !== undefined) output[field] = toJsonSafe(source[field]);
  });
  return output;
};

const compactUser = (row: SnapshotRow): SnapshotRow => ({
  id: row.id,
  data: pickFields(row.data, [
    'uid', 'role', 'roles', 'status', 'archived', 'isArchived', 'disabled', 'deleted',
    'name', 'displayName', 'fullName', 'studentName',
    'phoneCountryCode', 'phone', 'mobile', 'contactNumber', 'whatsappPhone', 'whatsappE164',
    'timezone', 'timeZone', 'timezoneId',
  ]),
});

const compactKid = (row: SnapshotRow): SnapshotRow => ({
  id: row.id,
  data: pickFields(row.data, [
    'uid', 'status', 'archived', 'isArchived', 'disabled', 'deleted',
    'name', 'displayName', 'fullName', 'studentName', 'parentId', 'parentIds',
  ]),
});

const compactCourse = (row: SnapshotRow): SnapshotRow => ({
  id: row.id,
  data: pickFields(row.data, [
    'status', 'archived', 'isArchived', 'name', 'title', 'displayName', 'courseName', 'subject',
  ]),
});

const collectSessionEnrollmentIds = (rows: SnapshotRow[]): string[] =>
  uniqueIds(rows.map((row) => row.data.enrollmentId));

const collectKidIds = (rows: SnapshotRow[]): string[] =>
  uniqueIds(rows.flatMap((row) => {
    const data = row.data;
    return [
      data.kidId,
      data.studentId,
      data.childId,
      ...(Array.isArray(data.kidIds) ? data.kidIds : []),
    ];
  }));

const collectCourseIds = (rows: SnapshotRow[]): string[] =>
  uniqueIds(rows.map((row) => row.data.courseId));

const collectParentRefs = (rows: SnapshotRow[]): string[] =>
  uniqueIds(rows.flatMap((row) => {
    const data = row.data;
    return [
      data.parentId,
      data.userId,
      ...(Array.isArray(data.parentIds) ? data.parentIds : []),
    ];
  }));

const collectTeacherRefs = (rows: SnapshotRow[]): string[] =>
  uniqueIds(rows.flatMap((row) => {
    const data = row.data;
    return [
      data.teacherId,
      data.assignedTeacherId,
      data.primaryTeacherId,
      data.teacherUid,
      data.teacher_id,
      ...(Array.isArray(data.teacherIds) ? data.teacherIds : []),
    ];
  }));

async function readDocsByIds(
  collectionName: string,
  ids: string[],
): Promise<{ rows: SnapshotRow[]; lookupRequests: number }> {
  const normalized = uniqueIds(ids);
  if (!normalized.length) return { rows: [], lookupRequests: 0 };

  const rows: SnapshotRow[] = [];
  for (const idChunk of chunk(normalized, LOOKUP_CHUNK_SIZE)) {
    const refs = idChunk.map((id) => db().collection(collectionName).doc(id));
    const snapshots = await db().getAll(...refs);
    snapshots.forEach((snapshot) => {
      if (snapshot.exists) rows.push(rowFromSnapshot(snapshot));
    });
  }
  return { rows, lookupRequests: normalized.length };
}

async function readUsersByRefs(
  refs: string[],
): Promise<{ rows: SnapshotRow[]; lookupRequests: number; uidFallbackDocumentsReturned: number }> {
  const normalized = uniqueIds(refs);
  if (!normalized.length) {
    return { rows: [], lookupRequests: 0, uidFallbackDocumentsReturned: 0 };
  }

  const direct = await readDocsByIds('users', normalized);
  const resolved = new Set<string>();
  direct.rows.forEach((row) => {
    resolved.add(row.id);
    const uid = normalizeLookupId(row.data.uid);
    if (uid) resolved.add(uid);
  });

  const unresolved = normalized.filter((ref) => !resolved.has(ref));
  const byId = new Map(direct.rows.map((row) => [row.id, row]));
  let uidFallbackDocumentsReturned = 0;

  for (const refChunk of chunk(unresolved, UID_QUERY_CHUNK_SIZE)) {
    const snap = await db()
      .collection('users')
      .where('uid', 'in', refChunk)
      .get();
    uidFallbackDocumentsReturned += snap.size;
    snap.docs.forEach((docSnap) => byId.set(docSnap.id, rowFromSnapshot(docSnap)));
  }

  return {
    rows: Array.from(byId.values()).map(compactUser),
    lookupRequests: direct.lookupRequests,
    uidFallbackDocumentsReturned,
  };
}

async function collectRelatedRows(
  sessions: SnapshotRow[],
  baseEnrollments: SnapshotRow[],
): Promise<{
  enrollments: SnapshotRow[];
  users: SnapshotRow[];
  kids: SnapshotRow[];
  students: SnapshotRow[];
  courses: SnapshotRow[];
  directLookupRequests: number;
  uidFallbackDocumentsReturned: number;
}> {
  let directLookupRequests = 0;
  const enrollmentById = new Map(baseEnrollments.map((row) => [row.id, row]));
  const missingEnrollmentIds = collectSessionEnrollmentIds(sessions)
    .filter((id) => !enrollmentById.has(id));
  const missingEnrollments = await readDocsByIds('enrollments', missingEnrollmentIds);
  directLookupRequests += missingEnrollments.lookupRequests;
  missingEnrollments.rows.forEach((row) => enrollmentById.set(row.id, row));

  const enrollments = Array.from(enrollmentById.values());
  const identitySource = [...sessions, ...enrollments];
  const kidIds = collectKidIds(identitySource);
  const courseIds = collectCourseIds(identitySource);
  const userRefs = uniqueIds([
    ...collectParentRefs(identitySource),
    ...collectTeacherRefs(identitySource),
  ]);

  const [kidsResult, coursesResult, usersResult] = await Promise.all([
    readDocsByIds('kids', kidIds),
    readDocsByIds('courses', courseIds),
    readUsersByRefs(userRefs),
  ]);
  directLookupRequests += kidsResult.lookupRequests + coursesResult.lookupRequests + usersResult.lookupRequests;

  const foundKidIds = new Set(kidsResult.rows.map((row) => row.id));
  const missingKidIds = kidIds.filter((id) => !foundKidIds.has(id));
  const studentsResult = await readDocsByIds('students', missingKidIds);
  directLookupRequests += studentsResult.lookupRequests;

  return {
    enrollments,
    users: usersResult.rows,
    kids: kidsResult.rows.map(compactKid),
    students: studentsResult.rows.map(compactKid),
    courses: coursesResult.rows.map(compactCourse),
    directLookupRequests,
    uidFallbackDocumentsReturned: usersResult.uidFallbackDocumentsReturned,
  };
}

async function acquireLease(actor: string): Promise<string | null> {
  const leaseRef = db().collection(ROOT_COLLECTION).doc(LEASE_DOC);
  const now = Date.now();
  const token = `${now}-${Math.random().toString(36).slice(2, 10)}`;

  return db().runTransaction(async (tx) => {
    const snap = await tx.get(leaseRef);
    const lease = (snap.data() || {}) as Record<string, unknown>;
    const expiresAtMs = Number(lease.expiresAtMs || 0);
    if (expiresAtMs > now) return null;
    tx.set(leaseRef, {
      token,
      actor,
      acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAtMs: now + LEASE_MS,
    });
    return token;
  });
}

async function releaseLease(token: string): Promise<void> {
  const leaseRef = db().collection(ROOT_COLLECTION).doc(LEASE_DOC);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(leaseRef);
    if (String(snap.data()?.token || '') !== token) return;
    tx.set(leaseRef, {
      token: null,
      actor: null,
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAtMs: 0,
    }, { merge: true });
  });
}

async function writeSnapshotShards(
  snapshotId: string,
  rowsByKind: SnapshotRowsByKind,
): Promise<Record<SnapshotKind, string[]>> {
  const snapshotRef = db().collection(SNAPSHOT_COLLECTION).doc(snapshotId);
  const shardIds = {} as Record<SnapshotKind, string[]>;

  for (const kind of Object.keys(rowsByKind) as SnapshotKind[]) {
    const rowChunks = chunk(rowsByKind[kind], SHARD_SIZE);
    shardIds[kind] = [];
    if (!rowChunks.length) continue;

    let batch = db().batch();
    let writesInBatch = 0;
    for (let index = 0; index < rowChunks.length; index += 1) {
      const shardId = `${kind}-${String(index).padStart(3, '0')}`;
      shardIds[kind].push(shardId);
      batch.set(snapshotRef.collection('payload').doc(shardId), {
        schemaVersion: SCHEMA_VERSION,
        kind,
        index,
        rows: rowChunks[index],
      });
      writesInBatch += 1;
      if (writesInBatch >= 400) {
        await batch.commit();
        batch = db().batch();
        writesInBatch = 0;
      }
    }
    if (writesInBatch > 0) await batch.commit();
  }

  return shardIds;
}

async function buildSnapshotPayload(
  reason: SnapshotBuildReason,
  generatedByUid: string | null,
): Promise<SnapshotPayload> {
  const baseDateKey = getKolkataDateKey();
  // A hidden third bucket keeps Today/Tomorrow correct between midnight and the next 04:00 refresh.
  const dateKeys = [baseDateKey, shiftDateKey(baseDateKey, 1), shiftDateKey(baseDateKey, 2)];
  const sessionQueries = dateKeys.map((dateKey) =>
    db().collection('classSessions').where('date', '==', dateKey).limit(SESSION_LIMIT_PER_DATE).get(),
  );
  const [sessionSnapshots, overallEnrollmentSnap] = await Promise.all([
    Promise.all(sessionQueries),
    db().collection('enrollments').limit(OVERALL_ENROLLMENT_LIMIT).get(),
  ]);

  const sessions = sessionSnapshots.flatMap((snap) => snap.docs.map(rowFromSnapshot));
  const baseEnrollments = overallEnrollmentSnap.docs.map(rowFromSnapshot);
  const related = await collectRelatedRows(sessions, baseEnrollments);
  const sourceDocumentsReturned =
    sessions.length +
    overallEnrollmentSnap.size +
    related.enrollments.length - baseEnrollments.length +
    related.users.length +
    related.kids.length +
    related.students.length +
    related.courses.length;

  const generatedAt = new Date().toISOString();
  const snapshotId = `${generatedAt.replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8)}`;
  const counts = {
    sessions: sessions.length,
    todaySessions: sessions.filter((row) => String(row.data.date || '') === dateKeys[0]).length,
    tomorrowSessions: sessions.filter((row) => String(row.data.date || '') === dateKeys[1]).length,
    rolloverSessions: sessions.filter((row) => String(row.data.date || '') === dateKeys[2]).length,
    enrollments: related.enrollments.length,
    overallEnrollments: baseEnrollments.length,
    users: related.users.length,
    kids: related.kids.length,
    students: related.students.length,
    courses: related.courses.length,
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    snapshotId,
    generatedAt,
    generatedBy: reason,
    generatedByUid,
    dateKeys,
    counts,
    shardIds: {
      sessions: [],
      enrollments: [],
      users: [],
      kids: [],
      students: [],
      courses: [],
    },
    sourceStats: {
      sessionDocumentsReturned: sessions.length,
      overallEnrollmentDocumentsReturned: overallEnrollmentSnap.size,
      directLookupRequests: related.directLookupRequests,
      uidFallbackDocumentsReturned: related.uidFallbackDocumentsReturned,
      sourceDocumentsReturned,
    },
    sessions,
    enrollments: related.enrollments,
    users: related.users,
    kids: related.kids,
    students: related.students,
    courses: related.courses,
  };
}

async function rebuildSnapshot(
  reason: SnapshotBuildReason,
  generatedByUid: string | null,
): Promise<SnapshotPayload> {
  const actor = generatedByUid ? `${reason}:${generatedByUid}` : reason;
  const leaseToken = await acquireLease(actor);
  if (!leaseToken) {
    throw new HttpsError('aborted', 'Sessions Management snapshot refresh is already running.');
  }

  try {
    const payload = await buildSnapshotPayload(reason, generatedByUid);
    const rowsByKind: SnapshotRowsByKind = {
      sessions: payload.sessions,
      enrollments: payload.enrollments,
      users: payload.users,
      kids: payload.kids,
      students: payload.students,
      courses: payload.courses,
    };
    const shardIds = await writeSnapshotShards(payload.snapshotId, rowsByKind);
    payload.shardIds = shardIds;

    const snapshotRef = db().collection(SNAPSHOT_COLLECTION).doc(payload.snapshotId);
    const meta: SnapshotMeta = {
      schemaVersion: payload.schemaVersion,
      snapshotId: payload.snapshotId,
      generatedAt: payload.generatedAt,
      generatedBy: payload.generatedBy,
      generatedByUid: payload.generatedByUid,
      dateKeys: payload.dateKeys,
      counts: payload.counts,
      shardIds,
      sourceStats: payload.sourceStats,
    };
    await snapshotRef.set(meta);

    const currentRef = db().collection(ROOT_COLLECTION).doc(CURRENT_DOC);
    await currentRef.set({
      ...meta,
      snapshotPath: `${SNAPSHOT_COLLECTION}/${payload.snapshotId}`,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('sessionsManagementSnapshot:published', {
      reason,
      generatedByUid,
      snapshotId: payload.snapshotId,
      dateKeys: payload.dateKeys,
      counts: payload.counts,
      sourceStats: payload.sourceStats,
    });
    return payload;
  } finally {
    await releaseLease(leaseToken).catch((error) => {
      logger.warn('sessionsManagementSnapshot:lease_release_failed', {
        leaseToken,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}

async function readSnapshotPayload(meta: SnapshotMeta): Promise<SnapshotPayload> {
  const snapshotRef = db().collection(SNAPSHOT_COLLECTION).doc(meta.snapshotId);
  const rowsByKind = {
    sessions: [],
    enrollments: [],
    users: [],
    kids: [],
    students: [],
    courses: [],
  } as SnapshotRowsByKind;

  const shardRefs: admin.firestore.DocumentReference[] = [];
  const shardKindByPath = new Map<string, SnapshotKind>();
  (Object.keys(meta.shardIds) as SnapshotKind[]).forEach((kind) => {
    meta.shardIds[kind].forEach((shardId) => {
      const ref = snapshotRef.collection('payload').doc(shardId);
      shardRefs.push(ref);
      shardKindByPath.set(ref.path, kind);
    });
  });

  for (const refChunk of chunk(shardRefs, LOOKUP_CHUNK_SIZE)) {
    const snaps = await db().getAll(...refChunk);
    snaps.forEach((snap) => {
      if (!snap.exists) return;
      const kind = shardKindByPath.get(snap.ref.path);
      if (!kind) return;
      const rows = Array.isArray(snap.data()?.rows) ? snap.data()!.rows as SnapshotRow[] : [];
      rowsByKind[kind].push(...rows);
    });
  }

  return { ...meta, ...rowsByKind };
}

async function readCurrentMeta(): Promise<SnapshotMeta | null> {
  const current = await db().collection(ROOT_COLLECTION).doc(CURRENT_DOC).get();
  if (!current.exists) return null;
  const data = current.data() || {};
  if (!data.snapshotId || !data.shardIds) return null;
  return {
    schemaVersion: Number(data.schemaVersion || SCHEMA_VERSION),
    snapshotId: String(data.snapshotId),
    generatedAt: String(data.generatedAt || ''),
    generatedBy: String(data.generatedBy || 'scheduled') as SnapshotBuildReason,
    generatedByUid: data.generatedByUid ? String(data.generatedByUid) : null,
    dateKeys: Array.isArray(data.dateKeys) ? data.dateKeys.map(String) : [],
    counts: (data.counts || {}) as Record<string, number>,
    shardIds: data.shardIds as Record<SnapshotKind, string[]>,
    sourceStats: (data.sourceStats || {}) as SnapshotMeta['sourceStats'],
  };
}

async function buildDatePayload(dateKey: string, snapshotId: string): Promise<DatePayload> {
  const sessionSnap = await db()
    .collection('classSessions')
    .where('date', '==', dateKey)
    .limit(SESSION_LIMIT_PER_DATE)
    .get();
  const sessions = sessionSnap.docs.map(rowFromSnapshot);
  const related = await collectRelatedRows(sessions, []);
  return {
    snapshotId,
    dateKey,
    sessions,
    enrollments: related.enrollments,
    users: related.users,
    kids: related.kids,
    students: related.students,
    courses: related.courses,
    sourceStats: {
      sessionDocumentsReturned: sessions.length,
      overallEnrollmentDocumentsReturned: 0,
      directLookupRequests: related.directLookupRequests,
      uidFallbackDocumentsReturned: related.uidFallbackDocumentsReturned,
      sourceDocumentsReturned:
        sessions.length + related.enrollments.length + related.users.length +
        related.kids.length + related.students.length + related.courses.length,
    },
  };
}

export const getSessionsManagementSnapshot = onCall(
  { region: REGION, timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    await ensureAdmin(request.auth);
    const knownSnapshotId = String((request.data as { knownSnapshotId?: unknown } | undefined)?.knownSnapshotId || '').trim();

    const meta = await readCurrentMeta();
    if (!meta) {
      const rebuilt = await rebuildSnapshot('bootstrap', request.auth?.uid || null);
      return { unchanged: false, snapshot: rebuilt };
    }

    if (knownSnapshotId && knownSnapshotId === meta.snapshotId) {
      return {
        unchanged: true,
        snapshotId: meta.snapshotId,
        generatedAt: meta.generatedAt,
        generatedBy: meta.generatedBy,
        dateKeys: meta.dateKeys,
        counts: meta.counts,
      };
    }

    const snapshot = await readSnapshotPayload(meta);
    return { unchanged: false, snapshot };
  },
);

export const adminRefreshSessionsManagementSnapshot = onCall(
  { region: REGION, timeoutSeconds: 300, memory: '512MiB' },
  async (request) => {
    await ensureAdmin(request.auth);
    const snapshot = await rebuildSnapshot('manual', request.auth?.uid || null);
    return { ok: true, snapshot };
  },
);

export const getSessionsManagementDateSnapshot = onCall(
  { region: REGION, timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    await ensureAdmin(request.auth);
    const dateKey = String((request.data as { dateKey?: unknown } | undefined)?.dateKey || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new HttpsError('invalid-argument', 'dateKey must use YYYY-MM-DD.');
    }
    const meta = await readCurrentMeta();
    if (!meta) {
      throw new HttpsError('failed-precondition', 'Sessions Management snapshot is not initialized yet.');
    }
    const payload = await buildDatePayload(dateKey, meta.snapshotId);
    return { ok: true, payload };
  },
);

export const refreshSessionsManagementSnapshot4am = onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: TIME_ZONE,
    region: REGION,
    timeoutSeconds: 300,
    memory: '512MiB',
  },
  async () => {
    try {
      await rebuildSnapshot('scheduled', null);
    } catch (error) {
      if (error instanceof HttpsError && error.code === 'aborted') {
        logger.warn('sessionsManagementSnapshot:scheduled_refresh_skipped_due_to_active_refresh');
        return;
      }
      logger.error('sessionsManagementSnapshot:scheduled_refresh_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);
