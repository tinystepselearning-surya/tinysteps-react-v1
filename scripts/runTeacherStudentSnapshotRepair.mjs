import fs from 'node:fs';

const PROJECT_ID = 'tinysteps-react-v1';
const DATABASE_PATH = `projects/${PROJECT_ID}/databases/(default)`;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/${DATABASE_PATH}`;

function readConfig() {
  const cfgPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function getAccessToken() {
  const cfg = readConfig();
  const token = cfg?.tokens?.access_token;
  if (!token) throw new Error('Missing Firebase CLI access token');
  return token;
}

function toCleanText(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toTextList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => toCleanText(entry)).filter(Boolean)));
}

function normalizeSnapshotStudentName(value) {
  const text = toCleanText(value);
  if (!text) return '';
  if (/^unnamed student$/i.test(text)) return '';
  if (/^student name pending$/i.test(text)) return '';
  if (/^\d+\s+assigned$/i.test(text)) return '';
  if (/^assigned$/i.test(text)) return '';
  if (/^\d+\s+students?$/i.test(text)) return '';
  if (/^(student|child|kid)$/i.test(text)) return '';
  return text;
}

function readSnapshotName(value) {
  return normalizeSnapshotStudentName(value?.name);
}

function collectTeacherAliasIds(row) {
  return Array.from(
    new Set([
      toCleanText(row.teacherId),
      ...toTextList(row.teacherIds),
      toCleanText(row.assignedTeacherId),
      toCleanText(row.primaryTeacherId),
      toCleanText(row.teacherUid),
      toCleanText(row.teacher_id),
    ].filter(Boolean)),
  );
}

function extractEntityIds(row) {
  return Array.from(
    new Set([
      toCleanText(row.kidId),
      toCleanText(row.studentId),
      toCleanText(row.childId),
      ...toTextList(row.kidIds),
      ...toTextList(row.studentIds),
      ...toTextList(row.childIds),
      ...toTextList(row.childrenIds),
    ].filter(Boolean)),
  );
}

function resolveCanonicalStudentName(kid, row) {
  return (
    normalizeSnapshotStudentName(kid?.studentName) ||
    normalizeSnapshotStudentName(kid?.fullName) ||
    normalizeSnapshotStudentName(kid?.displayName) ||
    normalizeSnapshotStudentName(kid?.name) ||
    normalizeSnapshotStudentName(row.studentName) ||
    normalizeSnapshotStudentName(row.childName) ||
    normalizeSnapshotStudentName(row.kidName) ||
    readSnapshotName(row.studentSnapshot) ||
    readSnapshotName(row.childSnapshot) ||
    readSnapshotName(row.kidSnapshot)
  );
}

function isMissingSnapshotName(value) {
  return !normalizeSnapshotStudentName(value);
}

function mergeSnapshot(existing, canonicalName, entityId) {
  const base = typeof existing === 'object' && existing !== null ? { ...existing } : {};
  return {
    ...base,
    id: toCleanText(base.id) || entityId,
    kidId: toCleanText(base.kidId) || entityId,
    name: canonicalName,
  };
}

function buildPatch(row, canonicalName, entityId) {
  if (!canonicalName || !entityId) return {};
  const patch = {};
  if (isMissingSnapshotName(row.studentName)) patch.studentName = canonicalName;
  if (isMissingSnapshotName(row.childName)) patch.childName = canonicalName;
  if (isMissingSnapshotName(row.kidName)) patch.kidName = canonicalName;
  if (isMissingSnapshotName(row.studentSnapshot?.name)) patch.studentSnapshot = mergeSnapshot(row.studentSnapshot, canonicalName, entityId);
  if (isMissingSnapshotName(row.childSnapshot?.name)) patch.childSnapshot = mergeSnapshot(row.childSnapshot, canonicalName, entityId);
  if (isMissingSnapshotName(row.kidSnapshot?.name)) patch.kidSnapshot = mergeSnapshot(row.kidSnapshot, canonicalName, entityId);
  return patch;
}

function toDateMaybe(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value?.toDate === 'function') {
    const next = value.toDate();
    if (next instanceof Date && !Number.isNaN(next.getTime())) return next;
  }
  if (typeof value?.seconds === 'number') {
    const next = new Date(value.seconds * 1000);
    if (!Number.isNaN(next.getTime())) return next;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const next = new Date(value);
    if (!Number.isNaN(next.getTime())) return next;
  }
  return null;
}

function isFutureSessionLike(session, nowMs) {
  const startAt = toDateMaybe(session.startAt);
  if (startAt) return startAt.getTime() >= nowMs;
  const ymd = toCleanText(session.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  return ymd >= new Date(nowMs).toISOString().slice(0, 10);
}

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) {
    const out = {};
    for (const [key, child] of Object.entries(value.mapValue.fields || {})) {
      out[key] = decodeValue(child);
    }
    return out;
  }
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map((entry) => decodeValue(entry));
  }
  return null;
}

function decodeDocument(doc) {
  const out = { id: doc.name.split('/').pop(), __name: doc.name };
  for (const [key, value] of Object.entries(doc.fields || {})) {
    out[key] = decodeValue(value);
  }
  return out;
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map((entry) => encodeValue(entry)) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [key, child] of Object.entries(value)) {
      fields[key] = encodeValue(child);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Unsupported Firestore value: ${String(value)}`);
}

async function firestoreFetch(path, options = {}) {
  const token = getAccessToken();
  const response = await fetch(`${FIRESTORE_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let json = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 400)}`);
    }
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${json?.error?.message || text}`);
  }
  return json;
}

async function listEnrollments({ limit = 200, enrollmentId = '' } = {}) {
  if (enrollmentId) {
    try {
      const doc = await firestoreFetch(`/documents/enrollments/${encodeURIComponent(enrollmentId)}`);
      return [decodeDocument(doc)];
    } catch (error) {
      if (String(error.message || '').includes('404')) return [];
      throw error;
    }
  }

  const rows = [];
  let pageToken = '';
  while (rows.length < limit) {
    const remaining = limit - rows.length;
    const params = new URLSearchParams({
      pageSize: String(Math.min(remaining, 100)),
      orderBy: '__name__',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const json = await firestoreFetch(`/documents/enrollments?${params.toString()}`);
    (json.documents || []).forEach((doc) => rows.push(decodeDocument(doc)));
    if (!json.nextPageToken) break;
    pageToken = json.nextPageToken;
  }
  return rows;
}

async function getKid(entityId) {
  if (!entityId) return null;
  try {
    const doc = await firestoreFetch(`/documents/kids/${encodeURIComponent(entityId)}`);
    return decodeDocument(doc);
  } catch (error) {
    if (String(error.message || '').includes('404')) return null;
    throw error;
  }
}

async function querySessionsByEnrollment(enrollmentId) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'classSessions' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'enrollmentId' },
          op: 'EQUAL',
          value: { stringValue: enrollmentId },
        },
      },
    },
  };
  const rows = await firestoreFetch('/documents:runQuery', { method: 'POST', body: JSON.stringify(body) });
  return rows
    .filter((entry) => entry.document)
    .map((entry) => decodeDocument(entry.document));
}

async function patchDocument(path, patch) {
  const params = new URLSearchParams();
  Object.keys(patch).forEach((key) => params.append('updateMask.fieldPaths', key));
  const fields = {};
  for (const [key, value] of Object.entries(patch)) {
    fields[key] = encodeValue(value);
  }
  await firestoreFetch(`/documents/${path}?${params.toString()}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

async function writeAudit(result) {
  const fields = {};
  for (const [key, value] of Object.entries({
    ...result,
    createdAt: new Date(),
    updatedCount: result.mode === 'apply' ? result.repairedEnrollmentIds.length + result.repairedSessionIds.length : 0,
    wouldUpdateCount: result.wouldRepairEnrollments + result.wouldRepairSessions,
  })) {
    fields[key] = encodeValue(value);
  }

  await firestoreFetch('/documents/adminStats/teacherStudentSnapshotRepairRuns/runs', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

function parseArgs(argv) {
  const args = { apply: false, limit: 200, enrollmentId: '', summaryOnly: false };
  argv.forEach((arg) => {
    if (arg === '--apply') args.apply = true;
    if (arg === '--summary-only') args.summaryOnly = true;
    if (arg.startsWith('--limit=')) args.limit = Math.max(1, Number(arg.split('=')[1] || '200'));
    if (arg.startsWith('--enrollment-id=')) args.enrollmentId = arg.split('=').slice(1).join('=').trim();
  });
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const enrollments = await listEnrollments({ limit: args.limit, enrollmentId: args.enrollmentId });
  const nowMs = Date.now();

  const kidCache = new Map();
  const enrollmentRepairs = [];
  const sessionRepairs = [];
  const repairedEnrollmentIds = [];
  const repairedSessionIds = [];
  const unresolvedEnrollmentIds = [];
  const skippedEnrollmentIds = [];

  for (const enrollment of enrollments) {
    if (collectTeacherAliasIds(enrollment).length === 0) {
      skippedEnrollmentIds.push(enrollment.id);
      continue;
    }

    const entityIds = extractEntityIds(enrollment);
    const resolvedEntityId = entityIds[0] || '';
    let kid = null;
    if (resolvedEntityId) {
      if (!kidCache.has(resolvedEntityId)) {
        kidCache.set(resolvedEntityId, await getKid(resolvedEntityId));
      }
      kid = kidCache.get(resolvedEntityId);
    }

    const canonicalName = resolveCanonicalStudentName(kid, enrollment);
    if (!resolvedEntityId || !canonicalName) {
      unresolvedEnrollmentIds.push(enrollment.id);
      continue;
    }

    const enrollmentPatch = buildPatch(enrollment, canonicalName, resolvedEntityId);
    if (Object.keys(enrollmentPatch).length > 0) {
      enrollmentRepairs.push({
        path: `enrollments/${enrollment.id}`,
        patch: {
          ...enrollmentPatch,
          updatedAt: new Date(),
          updatedBy: 'runTeacherStudentSnapshotRepair',
        },
      });
      repairedEnrollmentIds.push(enrollment.id);
    }

    const sessions = await querySessionsByEnrollment(enrollment.id);
    sessions.forEach((session) => {
      if (!isFutureSessionLike(session, nowMs)) return;
      const sessionPatch = buildPatch(session, canonicalName, resolvedEntityId);
      if (Object.keys(sessionPatch).length === 0) return;
      sessionRepairs.push({
        path: `classSessions/${session.id}`,
        patch: {
          ...sessionPatch,
          updatedAt: new Date(),
          updatedBy: 'runTeacherStudentSnapshotRepair',
        },
      });
      repairedSessionIds.push(session.id);
    });
  }

  if (args.apply) {
    for (const repair of [...enrollmentRepairs, ...sessionRepairs]) {
      await patchDocument(repair.path, repair.patch);
    }
  }

  const result = {
    ok: true,
    mode: args.apply ? 'apply' : 'dry_run',
    scannedEnrollments: enrollments.length,
    wouldRepairEnrollments: enrollmentRepairs.length,
    wouldRepairSessions: sessionRepairs.length,
    repairedEnrollmentIds,
    repairedSessionIds,
    unresolvedEnrollmentIds,
    skippedEnrollmentIds,
  };

  await writeAudit(result);
  if (args.summaryOnly) {
    console.log(JSON.stringify({
      ...result,
      repairedEnrollmentIds: repairedEnrollmentIds.slice(0, 25),
      repairedSessionIds: repairedSessionIds.slice(0, 25),
      repairedEnrollmentCount: repairedEnrollmentIds.length,
      repairedSessionCount: repairedSessionIds.length,
    }, null, 2));
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
