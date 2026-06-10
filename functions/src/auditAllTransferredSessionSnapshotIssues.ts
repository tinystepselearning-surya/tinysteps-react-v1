import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const QUERY_CHUNK_SIZE = 10;
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;
const COMPLETED_LIKE_STATUSES = new Set(['completed', 'consumed', 'settled', 'paid']);

type FirestoreRow = Record<string, unknown>;

type TeacherProfile = {
  uid: string;
  displayName: string | null;
  name: string | null;
  email: string | null;
};

type AuditQuery = {
  fromDate: string;
  toDate: string | null;
  teacherUid: string | null;
  limit: number;
  includeCompleted: boolean;
  includePast: boolean;
};

type RepairPayload = {
  enrollmentId: string | null;
  kidId: string | null;
  fromTeacherUid: string | null;
  toTeacherUid: string | null;
  fromDate: string | null;
};

type AuditIssueRow = {
  sessionId: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  studentId: string | null;
  childId: string | null;
  kidIds: string[];
  childName: string | null;
  studentName: string | null;
  kidName: string | null;
  resolvedChildName: string;
  courseId: string | null;
  courseName: string | null;
  courseTitle: string | null;
  courseLabel: string | null;
  resolvedCourseName: string | null;
  teacherId: string | null;
  teacherIds: string[];
  assignedTeacherId: string | null;
  primaryTeacherId: string | null;
  teacherUid: string | null;
  teacher_id: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  resolvedCurrentTeacherUid: string | null;
  resolvedCurrentTeacherName: string | null;
  resolvedCurrentTeacherEmail: string | null;
  currentEnrollmentTeacherUid: string | null;
  currentEnrollmentTeacherName: string | null;
  currentEnrollmentTeacherEmail: string | null;
  looksLikeTransferredStudent: boolean;
  repairReasons: string[];
  recommendedRepairPayload: RepairPayload;
};

type GroupedEnrollmentRow = {
  enrollmentId: string | null;
  kidId: string | null;
  issueCount: number;
  sessionIds: string[];
  reasons: string[];
  looksLikeTransferredStudent: boolean;
  repairPayloads: RepairPayload[];
};

type AuditResult = {
  summary: {
    scannedCount: number;
    issueCount: number;
    uniqueEnrollmentsAffected: number;
    uniqueStudentsAffected: number;
    byReason: Record<string, number>;
  };
  issues: AuditIssueRow[];
  groupedByEnrollment: GroupedEnrollmentRow[];
};

type BuildAuditResultInput = {
  query: AuditQuery;
  sessionDocs: Array<{ id: string; data: FirestoreRow }>;
  enrollmentById: Map<string, FirestoreRow>;
  kidById: Map<string, FirestoreRow>;
  childById: Map<string, FirestoreRow>;
  courseById: Map<string, FirestoreRow>;
  teacherProfilesByUid: Map<string, TeacherProfile>;
  teacherUidByEmail: Map<string, string>;
  teacherUidByName: Map<string, string>;
};

function toCleanText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => toCleanText(entry)).filter(Boolean)));
}

function normalizeLower(value: unknown): string {
  return toCleanText(value).toLowerCase();
}

function maybeYmd(value: unknown): string | null {
  const text = toCleanText(value);
  return YMD_RE.test(text) ? text : null;
}

function normalizeStatus(value: unknown): string {
  return toCleanText(value).toLowerCase();
}

function cleanStudentDisplayName(value: unknown): string {
  const text = toCleanText(value);
  if (!text) return '';
  if (/^\d+\s+assigned$/i.test(text)) return '';
  if (/^assigned$/i.test(text)) return '';
  if (/^\d+\s+students?$/i.test(text)) return '';
  if (/^(student|child|kid)$/i.test(text)) return '';
  return text;
}

function isAssignedCountLabel(value: unknown): boolean {
  const text = toCleanText(value);
  if (!text) return false;
  return /^\d+\s+assigned$/i.test(text) || /^assigned$/i.test(text);
}

function isGenericStudentLabel(value: unknown): boolean {
  return /^student$/i.test(toCleanText(value));
}

function isLikelyCourseIdLike(value: unknown, courseId?: string | null): boolean {
  const text = toCleanText(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  const normalizedCourseId = toCleanText(courseId).toLowerCase();
  if (normalizedCourseId && lower === normalizedCourseId) return true;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(text);
}

function getTimestampMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function getSessionDateKey(row: FirestoreRow): string | null {
  const date = maybeYmd(row.date);
  if (date) return date;
  const startAtMillis = getTimestampMillis(row.startAt);
  return startAtMillis ? new Date(startAtMillis).toISOString().slice(0, 10) : null;
}

function getSessionSortKey(row: FirestoreRow): number {
  const startAtMillis = getTimestampMillis(row.startAt);
  if (startAtMillis) return startAtMillis;
  const date = getSessionDateKey(row);
  const startTime = toCleanText(row.startTime);
  if (date && /^\d{2}:\d{2}$/.test(startTime)) {
    const parsed = Date.parse(`${date}T${startTime}:00+05:30`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (date) {
    const parsed = Date.parse(`${date}T00:00:00+05:30`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function isWithinDateRange(row: FirestoreRow, fromDate: string, toDate: string | null): boolean {
  const dateKey = getSessionDateKey(row);
  if (!dateKey) return true;
  if (dateKey < fromDate) return false;
  if (toDate && dateKey > toDate) return false;
  return true;
}

function collectTeacherAliasIds(row: FirestoreRow | null | undefined): string[] {
  if (!row) return [];
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

function collectKidIds(row: FirestoreRow | null | undefined): string[] {
  if (!row) return [];
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

function resolveStudentDisplay(session: FirestoreRow, enrollment: FirestoreRow | null, kid: FirestoreRow | null, child: FirestoreRow | null) {
  const sessionCandidates = [session.childName, session.studentName, session.kidName];
  const enrollmentCandidates = [enrollment?.childName, enrollment?.studentName, enrollment?.kidName];
  const kidCandidates = [kid?.studentName, kid?.fullName, kid?.displayName, kid?.name];
  const childCandidates = [child?.studentName, child?.fullName, child?.displayName, child?.name];
  const resolvedChildName =
    sessionCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    enrollmentCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    kidCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    childCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    'Student';

  return { resolvedChildName };
}

function resolveCourseDisplay(session: FirestoreRow, enrollment: FirestoreRow | null, course: FirestoreRow | null) {
  const courseId =
    toCleanText(session.courseId) ||
    toCleanText((session as FirestoreRow).course_id) ||
    toCleanText(enrollment?.courseId) ||
    toCleanText((enrollment || {}).course_id);
  const candidates = [
    toCleanText(session.courseName),
    toCleanText((session as FirestoreRow).courseTitle),
    toCleanText((session as FirestoreRow).courseLabel),
    toCleanText(enrollment?.courseName),
    toCleanText((enrollment || {}).courseTitle),
    toCleanText((enrollment || {}).courseLabel),
    toCleanText(course?.title),
    toCleanText(course?.name),
  ].filter(Boolean);
  const resolvedCourseName =
    candidates.find((candidate) => !isLikelyCourseIdLike(candidate, courseId)) ||
    candidates[0] ||
    courseId ||
    null;
  return { courseId: courseId || null, resolvedCourseName };
}

function resolveTeacherIdentity(
  row: FirestoreRow,
  teacherProfilesByUid: Map<string, TeacherProfile>,
  teacherUidByEmail: Map<string, string>,
  teacherUidByName: Map<string, string>,
) {
  const aliasIds = collectTeacherAliasIds(row);
  const teacherEmail = toCleanText(row.teacherEmail);
  const teacherName = toCleanText(row.teacherName);
  const canonicalAlias =
    toCleanText(row.teacherId) ||
    toCleanText(row.assignedTeacherId) ||
    toCleanText(row.primaryTeacherId) ||
    toCleanText(row.teacherUid) ||
    toCleanText(row.teacher_id) ||
    aliasIds[0] ||
    '';
  const emailMatchedUid = teacherEmail ? teacherUidByEmail.get(teacherEmail.toLowerCase()) || '' : '';
  const nameMatchedUid = teacherName ? teacherUidByName.get(teacherName.toLowerCase()) || '' : '';
  const resolvedTeacherUid = canonicalAlias || emailMatchedUid || nameMatchedUid || null;
  const profile = resolvedTeacherUid ? teacherProfilesByUid.get(resolvedTeacherUid) || null : null;
  const teacherFieldsConflicting =
    aliasIds.length > 1 ||
    Boolean(emailMatchedUid && canonicalAlias && emailMatchedUid !== canonicalAlias) ||
    Boolean(nameMatchedUid && canonicalAlias && nameMatchedUid !== canonicalAlias) ||
    Boolean(toCleanText(row.assignedTeacherId) && toCleanText(row.primaryTeacherId) && toCleanText(row.assignedTeacherId) !== toCleanText(row.primaryTeacherId));

  return {
    resolvedTeacherUid,
    resolvedTeacherName: profile?.displayName || profile?.name || teacherName || teacherEmail || resolvedTeacherUid,
    resolvedTeacherEmail: profile?.email || teacherEmail || null,
    teacherFieldsConflicting,
    aliasIds,
  };
}

function collectTeacherSignalsFromRow(
  row: FirestoreRow | null | undefined,
  teacherUids: Set<string>,
  teacherEmails: Set<string>,
  teacherNames: Set<string>,
) {
  if (!row) return;
  collectTeacherAliasIds(row).forEach((teacherUid) => teacherUids.add(teacherUid));
  const email =
    toCleanText(row.teacherEmail) ||
    toCleanText(row.newTeacherEmail) ||
    toCleanText(row.oldTeacherEmail) ||
    toCleanText(row.previousTeacherEmail);
  const name =
    toCleanText(row.teacherName) ||
    toCleanText(row.newTeacherName) ||
    toCleanText(row.oldTeacherName) ||
    toCleanText(row.previousTeacherName);
  if (email) teacherEmails.add(email);
  if (name) teacherNames.add(name);
}

function timestampFromYmdStart(ymd: string): admin.firestore.Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  return admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)));
}

function timestampFromYmdEndExclusive(ymd: string): admin.firestore.Timestamp {
  const [year, month, day] = ymd.split('-').map(Number);
  return admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)));
}

function currentYmdIst(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchDocById(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
): Promise<{ id: string; data: FirestoreRow } | null> {
  const cleanId = toCleanText(id);
  if (!cleanId) return null;
  const snap = await collection.doc(cleanId).get();
  return snap.exists ? { id: snap.id, data: (snap.data() || {}) as FirestoreRow } : null;
}

async function fetchTeacherProfiles(
  db: FirebaseFirestore.Firestore,
  teacherUids: string[],
  teacherEmails: string[],
  teacherNames: string[],
) {
  const teacherProfilesByUid = new Map<string, TeacherProfile>();
  const teacherUidByEmail = new Map<string, string>();
  const teacherUidByName = new Map<string, string>();

  const uniqueTeacherUids = Array.from(new Set(teacherUids.filter(Boolean)));
  const uniqueTeacherEmails = Array.from(new Set(teacherEmails.filter(Boolean)));
  const uniqueTeacherNames = Array.from(new Set(teacherNames.filter(Boolean)));

  const directTeacherDocs = await Promise.all(
    uniqueTeacherUids.map((teacherUid) => fetchDocById(db.collection('users'), teacherUid)),
  );
  directTeacherDocs.forEach((entry) => {
    if (!entry) return;
    const profile: TeacherProfile = {
      uid: entry.id,
      displayName: toCleanText(entry.data.displayName) || null,
      name: toCleanText(entry.data.name) || null,
      email: toCleanText(entry.data.email) || null,
    };
    teacherProfilesByUid.set(entry.id, profile);
    if (profile.email) teacherUidByEmail.set(profile.email.toLowerCase(), entry.id);
    if (profile.displayName) teacherUidByName.set(profile.displayName.toLowerCase(), entry.id);
    if (profile.name) teacherUidByName.set(profile.name.toLowerCase(), entry.id);
  });

  const fieldMatchQueries = await Promise.all([
    Promise.all(uniqueTeacherEmails.map((email) => db.collection('users').where('email', '==', email).limit(5).get())),
    Promise.all(uniqueTeacherNames.map((name) => db.collection('users').where('displayName', '==', name).limit(5).get())),
    Promise.all(uniqueTeacherNames.map((name) => db.collection('users').where('name', '==', name).limit(5).get())),
  ]);

  fieldMatchQueries.forEach((snapGroup) => {
    snapGroup.forEach((querySnap) => {
      querySnap.docs.forEach((docSnap) => {
        const data = (docSnap.data() || {}) as FirestoreRow;
        const profile: TeacherProfile = {
          uid: docSnap.id,
          displayName: toCleanText(data.displayName) || null,
          name: toCleanText(data.name) || null,
          email: toCleanText(data.email) || null,
        };
        teacherProfilesByUid.set(docSnap.id, profile);
        if (profile.email) teacherUidByEmail.set(profile.email.toLowerCase(), docSnap.id);
        if (profile.displayName) teacherUidByName.set(profile.displayName.toLowerCase(), docSnap.id);
        if (profile.name) teacherUidByName.set(profile.name.toLowerCase(), docSnap.id);
      });
    });
  });

  return { teacherProfilesByUid, teacherUidByEmail, teacherUidByName };
}

function dedupeRepairPayloads(payloads: RepairPayload[]): RepairPayload[] {
  const map = new Map<string, RepairPayload>();
  payloads.forEach((payload) => {
    const key = [
      payload.enrollmentId || '',
      payload.kidId || '',
      payload.fromTeacherUid || '',
      payload.toTeacherUid || '',
      payload.fromDate || '',
    ].join('|');
    if (!map.has(key)) map.set(key, payload);
  });
  return Array.from(map.values());
}

export function buildAuditAllTransferredSessionSnapshotIssuesResult(input: BuildAuditResultInput): AuditResult {
  const today = currentYmdIst();
  const sessions = input.sessionDocs
    .filter(({ data }) => {
      const status = normalizeStatus(data.status);
      const date = getSessionDateKey(data);
      if (!input.query.includeCompleted && COMPLETED_LIKE_STATUSES.has(status)) return false;
      if (!input.query.includePast && date && date < today) return false;
      return true;
    })
    .sort((a, b) => getSessionSortKey(a.data) - getSessionSortKey(b.data));

  const issues: AuditIssueRow[] = [];
  const byReason: Record<string, number> = {};

  sessions.forEach(({ id, data }) => {
    const enrollmentId = toCleanText(data.enrollmentId);
    const enrollment = input.enrollmentById.get(enrollmentId) || null;
    const resolvedKidId =
      toCleanText(data.kidId) ||
      toCleanText(data.studentId) ||
      toCleanText(data.childId) ||
      collectKidIds(data)[0] ||
      toCleanText(enrollment?.kidId) ||
      toCleanText(enrollment?.studentId) ||
      toCleanText(enrollment?.childId) ||
      '';
    const kid = input.kidById.get(resolvedKidId) || null;
    const child = input.childById.get(resolvedKidId) || null;
    const courseId =
      toCleanText(data.courseId) ||
      toCleanText((data as FirestoreRow).course_id) ||
      toCleanText(enrollment?.courseId) ||
      toCleanText((enrollment || {}).course_id) ||
      '';
    const course = courseId ? input.courseById.get(courseId) || null : null;

    const sessionTeacher = resolveTeacherIdentity(data, input.teacherProfilesByUid, input.teacherUidByEmail, input.teacherUidByName);
    const enrollmentTeacher = resolveTeacherIdentity(enrollment || {}, input.teacherProfilesByUid, input.teacherUidByEmail, input.teacherUidByName);
    if (input.query.teacherUid) {
      const teacherMatches = [
        sessionTeacher.resolvedTeacherUid,
        enrollmentTeacher.resolvedTeacherUid,
        ...sessionTeacher.aliasIds,
        ...enrollmentTeacher.aliasIds,
      ].includes(input.query.teacherUid);
      if (!teacherMatches) return;
    }

    const studentDisplay = resolveStudentDisplay(data, enrollment, kid, child);
    const courseDisplay = resolveCourseDisplay(data, enrollment, course);
    const rawCourseSnapshot =
      toCleanText(data.courseName) ||
      toCleanText((data as FirestoreRow).courseTitle) ||
      toCleanText((data as FirestoreRow).courseLabel) ||
      '';
    const rawStudentValues = [data.childName, data.studentName, data.kidName];
    const teacherIdsRaw = data.teacherIds;
    const teacherIds = toTextList(teacherIdsRaw);
    const issueReasons: string[] = [];

    if (!toCleanText(data.childName) && !toCleanText(data.studentName) && !toCleanText(data.kidName)) {
      issueReasons.push('student_snapshot_missing');
    }
    if (rawStudentValues.some((value) => isGenericStudentLabel(value))) {
      issueReasons.push('student_snapshot_generic_student');
    }
    if (rawStudentValues.some((value) => isAssignedCountLabel(value))) {
      issueReasons.push('student_snapshot_assigned_count_label');
    }
    if (!toCleanText(data.courseName) && !toCleanText((data as FirestoreRow).courseTitle) && !toCleanText((data as FirestoreRow).courseLabel)) {
      issueReasons.push('course_snapshot_missing');
    }
    if (
      rawCourseSnapshot &&
      isLikelyCourseIdLike(rawCourseSnapshot, courseDisplay.courseId) &&
      courseDisplay.resolvedCourseName &&
      normalizeLower(courseDisplay.resolvedCourseName) !== normalizeLower(rawCourseSnapshot)
    ) {
      issueReasons.push('course_snapshot_slug_only');
    }
    if (!toCleanText(data.teacherId)) {
      issueReasons.push('teacherId_missing');
    }
    if (!Array.isArray(teacherIdsRaw) || teacherIds.length === 0) {
      issueReasons.push('teacherIds_missing_or_invalid');
    }
    if (sessionTeacher.resolvedTeacherUid && !teacherIds.includes(sessionTeacher.resolvedTeacherUid)) {
      issueReasons.push('teacherIds_missing_resolved_teacher');
    }
    if (sessionTeacher.teacherFieldsConflicting) {
      issueReasons.push('teacher_alias_conflict');
    }

    const isFutureSession = Boolean((getSessionDateKey(data) || today) >= today);
    const enrollmentTeacherMismatch =
      isFutureSession &&
      Boolean(sessionTeacher.resolvedTeacherUid) &&
      Boolean(enrollmentTeacher.resolvedTeacherUid) &&
      sessionTeacher.resolvedTeacherUid !== enrollmentTeacher.resolvedTeacherUid;
    if (enrollmentTeacherMismatch) {
      issueReasons.push('future_session_enrollment_teacher_mismatch');
    }

    if (!enrollmentId && (toCleanText(enrollment?.id) || resolvedKidId)) {
      issueReasons.push('enrollmentId_missing_recoverable');
    }
    if (!toCleanText(data.kidId) && resolvedKidId) {
      issueReasons.push('kidId_missing_recoverable');
    }

    if (issueReasons.length === 0) return;

    issueReasons.forEach((reason) => {
      byReason[reason] = (byReason[reason] || 0) + 1;
    });

    const previousTeacherUid = toCleanText(enrollment?.previousTeacherId) || null;
    const looksLikeTransferredStudent =
      enrollmentTeacherMismatch ||
      Boolean(previousTeacherUid && sessionTeacher.resolvedTeacherUid && previousTeacherUid === sessionTeacher.resolvedTeacherUid) ||
      Boolean(
        toCleanText(enrollment?.teacherReassignedAt) ||
        toCleanText(enrollment?.reassignedAt) ||
        toCleanText(enrollment?.previousTeacherId)
      );
    const recommendedRepairPayload: RepairPayload = {
      enrollmentId: enrollmentId || toCleanText(enrollment?.id) || null,
      kidId: resolvedKidId || null,
      fromTeacherUid:
        enrollmentTeacherMismatch ? sessionTeacher.resolvedTeacherUid :
        previousTeacherUid && previousTeacherUid !== enrollmentTeacher.resolvedTeacherUid ? previousTeacherUid :
        sessionTeacher.resolvedTeacherUid && sessionTeacher.resolvedTeacherUid !== enrollmentTeacher.resolvedTeacherUid ? sessionTeacher.resolvedTeacherUid :
        null,
      toTeacherUid: enrollmentTeacher.resolvedTeacherUid || sessionTeacher.resolvedTeacherUid || null,
      fromDate: getSessionDateKey(data) || input.query.fromDate,
    };

    issues.push({
      sessionId: id,
      date: getSessionDateKey(data),
      startTime: toCleanText(data.startTime) || null,
      endTime: toCleanText(data.endTime) || null,
      status: toCleanText(data.status) || null,
      enrollmentId: enrollmentId || toCleanText(enrollment?.id) || null,
      kidId: toCleanText(data.kidId) || (resolvedKidId || null),
      studentId: toCleanText(data.studentId) || null,
      childId: toCleanText(data.childId) || null,
      kidIds: collectKidIds(data),
      childName: toCleanText(data.childName) || null,
      studentName: toCleanText(data.studentName) || null,
      kidName: toCleanText(data.kidName) || null,
      resolvedChildName: studentDisplay.resolvedChildName,
      courseId: courseDisplay.courseId,
      courseName: toCleanText(data.courseName) || null,
      courseTitle: toCleanText((data as FirestoreRow).courseTitle) || null,
      courseLabel: toCleanText((data as FirestoreRow).courseLabel) || null,
      resolvedCourseName: courseDisplay.resolvedCourseName,
      teacherId: toCleanText(data.teacherId) || null,
      teacherIds,
      assignedTeacherId: toCleanText(data.assignedTeacherId) || null,
      primaryTeacherId: toCleanText(data.primaryTeacherId) || null,
      teacherUid: toCleanText(data.teacherUid) || null,
      teacher_id: toCleanText(data.teacher_id) || null,
      teacherName: toCleanText(data.teacherName) || null,
      teacherEmail: toCleanText(data.teacherEmail) || null,
      resolvedCurrentTeacherUid: sessionTeacher.resolvedTeacherUid,
      resolvedCurrentTeacherName: sessionTeacher.resolvedTeacherName,
      resolvedCurrentTeacherEmail: sessionTeacher.resolvedTeacherEmail,
      currentEnrollmentTeacherUid: enrollmentTeacher.resolvedTeacherUid,
      currentEnrollmentTeacherName: enrollmentTeacher.resolvedTeacherName,
      currentEnrollmentTeacherEmail: enrollmentTeacher.resolvedTeacherEmail,
      looksLikeTransferredStudent,
      repairReasons: issueReasons,
      recommendedRepairPayload,
    });
  });

  const limitedIssues = issues.slice(0, input.query.limit);
  const groupedByEnrollmentMap = new Map<string, GroupedEnrollmentRow>();

  limitedIssues.forEach((issue) => {
    const groupKey = issue.enrollmentId || `missing:${issue.sessionId}`;
    const existing = groupedByEnrollmentMap.get(groupKey);
    if (!existing) {
      groupedByEnrollmentMap.set(groupKey, {
        enrollmentId: issue.enrollmentId,
        kidId: issue.kidId,
        issueCount: 1,
        sessionIds: [issue.sessionId],
        reasons: Array.from(new Set(issue.repairReasons)),
        looksLikeTransferredStudent: issue.looksLikeTransferredStudent,
        repairPayloads: [issue.recommendedRepairPayload],
      });
      return;
    }
    existing.issueCount += 1;
    if (!existing.sessionIds.includes(issue.sessionId)) existing.sessionIds.push(issue.sessionId);
    existing.reasons = Array.from(new Set([...existing.reasons, ...issue.repairReasons]));
    existing.looksLikeTransferredStudent = existing.looksLikeTransferredStudent || issue.looksLikeTransferredStudent;
    existing.repairPayloads.push(issue.recommendedRepairPayload);
  });

  const groupedByEnrollment = Array.from(groupedByEnrollmentMap.values()).map((group) => ({
    ...group,
    repairPayloads: dedupeRepairPayloads(group.repairPayloads),
  }));

  const uniqueEnrollmentIds = new Set(issues.map((issue) => issue.enrollmentId).filter(Boolean));
  const uniqueStudentIds = new Set(
    issues
      .map((issue) => issue.kidId || issue.studentId || issue.childId)
      .filter(Boolean),
  );

  return {
    summary: {
      scannedCount: sessions.length,
      issueCount: issues.length,
      uniqueEnrollmentsAffected: uniqueEnrollmentIds.size,
      uniqueStudentsAffected: uniqueStudentIds.size,
      byReason,
    },
    issues: limitedIssues,
    groupedByEnrollment,
  };
}

export const auditAllTransferredSessionSnapshotIssues = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const today = currentYmdIst();
  const inputFromDate = toCleanText(request.data?.fromDate) || today;
  const inputToDate = toCleanText(request.data?.toDate) || null;
  const includePast = request.data?.includePast === true;
  const normalizedFromDate = includePast ? inputFromDate : (inputFromDate < today ? today : inputFromDate);

  const query: AuditQuery = {
    fromDate: normalizedFromDate,
    toDate: inputToDate,
    teacherUid: toCleanText(request.data?.teacherUid) || null,
    limit: Math.min(Math.max(Number(request.data?.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT),
    includeCompleted: request.data?.includeCompleted === true,
    includePast,
  };

  if (!YMD_RE.test(query.fromDate)) {
    throw new HttpsError('invalid-argument', 'fromDate must be YYYY-MM-DD');
  }
  if (query.toDate && !YMD_RE.test(query.toDate)) {
    throw new HttpsError('invalid-argument', 'toDate must be YYYY-MM-DD');
  }
  if (query.toDate && query.fromDate > query.toDate) {
    throw new HttpsError('invalid-argument', 'fromDate must be before or equal to toDate');
  }

  const db = admin.firestore();
  const scanLimit = Math.max(query.limit * 5, 1000);
  const byDateQuery = db.collection('classSessions').where('date', '>=', query.fromDate).orderBy('date').limit(scanLimit);
  const byDateSnap = query.toDate
    ? await byDateQuery.where('date', '<=', query.toDate).get()
    : await byDateQuery.get();
  const byStartAtQuery = db.collection('classSessions').where('startAt', '>=', timestampFromYmdStart(query.fromDate)).orderBy('startAt').limit(scanLimit);
  const byStartAtSnap = query.toDate
    ? await byStartAtQuery.where('startAt', '<', timestampFromYmdEndExclusive(query.toDate)).get()
    : await byStartAtQuery.get();

  const sessionMap = new Map<string, FirestoreRow>();
  [...byDateSnap.docs, ...byStartAtSnap.docs].forEach((docSnap) => {
    const data = (docSnap.data() || {}) as FirestoreRow;
    if (!isWithinDateRange(data, query.fromDate, query.toDate)) return;
    sessionMap.set(docSnap.id, data);
  });

  const teacherUids = new Set<string>();
  const teacherEmails = new Set<string>();
  const teacherNames = new Set<string>();
  const enrollmentIds = new Set<string>();
  const kidIds = new Set<string>();
  const courseIds = new Set<string>();

  sessionMap.forEach((session) => {
    collectTeacherSignalsFromRow(session, teacherUids, teacherEmails, teacherNames);
    const enrollmentId = toCleanText(session.enrollmentId);
    if (enrollmentId) enrollmentIds.add(enrollmentId);
    collectKidIds(session).forEach((kidId) => kidIds.add(kidId));
    const courseId = toCleanText(session.courseId) || toCleanText((session as FirestoreRow).course_id);
    if (courseId) courseIds.add(courseId);
  });

  const enrollmentById = new Map<string, FirestoreRow>();
  const relatedEnrollmentSnaps = await Promise.all([
    ...Array.from(enrollmentIds).map((enrollmentId) => fetchDocById(db.collection('enrollments'), enrollmentId)),
    ...chunk(Array.from(kidIds), QUERY_CHUNK_SIZE).map((group) => db.collection('enrollments').where('kidId', 'in', group).get()),
    ...chunk(Array.from(kidIds), QUERY_CHUNK_SIZE).map((group) => db.collection('enrollments').where('studentId', 'in', group).get()),
    ...chunk(Array.from(kidIds), QUERY_CHUNK_SIZE).map((group) => db.collection('enrollments').where('childId', 'in', group).get()),
    ...chunk(Array.from(kidIds), QUERY_CHUNK_SIZE).map((group) => db.collection('enrollments').where('kidIds', 'array-contains-any', group).get()),
  ]);

  relatedEnrollmentSnaps.forEach((entry) => {
    if (!entry) return;
    if ('docs' in entry) {
      entry.docs.forEach((docSnap) => {
        const data = { id: docSnap.id, ...(docSnap.data() || {}) } as FirestoreRow;
        enrollmentById.set(docSnap.id, data);
        collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
        collectKidIds(data).forEach((kidId) => kidIds.add(kidId));
        const courseId = toCleanText(data.courseId) || toCleanText((data as FirestoreRow).course_id);
        if (courseId) courseIds.add(courseId);
      });
      return;
    }
    const data = { id: entry.id, ...(entry.data || {}) } as FirestoreRow;
    enrollmentById.set(entry.id, data);
    collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
    collectKidIds(data).forEach((kidId) => kidIds.add(kidId));
    const courseId = toCleanText(data.courseId) || toCleanText((data as FirestoreRow).course_id);
    if (courseId) courseIds.add(courseId);
  });

  const kidById = new Map<string, FirestoreRow>();
  const childById = new Map<string, FirestoreRow>();
  const [kidDocs, childDocs, courseDocs] = await Promise.all([
    Promise.all(Array.from(kidIds).map((kidId) => fetchDocById(db.collection('kids'), kidId))),
    Promise.all(Array.from(kidIds).map((kidId) => fetchDocById(db.collection('children'), kidId))),
    Promise.all(Array.from(courseIds).map((courseId) => fetchDocById(db.collection('courses'), courseId))),
  ]);

  kidDocs.forEach((entry) => {
    if (entry) kidById.set(entry.id, entry.data);
  });
  childDocs.forEach((entry) => {
    if (entry) childById.set(entry.id, entry.data);
  });
  const courseById = new Map<string, FirestoreRow>();
  courseDocs.forEach((entry) => {
    if (entry) courseById.set(entry.id, entry.data);
  });

  const { teacherProfilesByUid, teacherUidByEmail, teacherUidByName } = await fetchTeacherProfiles(
    db,
    Array.from(teacherUids),
    Array.from(teacherEmails),
    Array.from(teacherNames),
  );

  const result = buildAuditAllTransferredSessionSnapshotIssuesResult({
    query,
    sessionDocs: Array.from(sessionMap.entries()).map(([id, data]) => ({ id, data })),
    enrollmentById,
    kidById,
    childById,
    courseById,
    teacherProfilesByUid,
    teacherUidByEmail,
    teacherUidByName,
  });

  logger.info('auditAllTransferredSessionSnapshotIssues', {
    query,
    scannedCount: result.summary.scannedCount,
    issueCount: result.summary.issueCount,
    uniqueEnrollmentsAffected: result.summary.uniqueEnrollmentsAffected,
    uniqueStudentsAffected: result.summary.uniqueStudentsAffected,
  });

  return result;
});
