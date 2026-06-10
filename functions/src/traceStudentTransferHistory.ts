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

type FirestoreRow = Record<string, unknown>;

type TeacherProfile = {
  uid: string;
  displayName: string | null;
  name: string | null;
  email: string | null;
};

type TraceQuery = {
  enrollmentId: string | null;
  kidId: string | null;
  studentName: string | null;
  fromDate: string | null;
  toDate: string | null;
  includeSessions: boolean;
  includeAuditLogs: boolean;
  includeRepairCandidates: boolean;
};

type TraceSessionRow = {
  sessionId: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  source: string | null;
  sessionType: string | null;
  createdByFlow: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  studentId: string | null;
  childId: string | null;
  kidIds: string[];
  rawStudentName: string | null;
  rawKidName: string | null;
  rawChildName: string | null;
  enrollmentStudentName: string | null;
  enrollmentKidName: string | null;
  enrollmentChildName: string | null;
  resolvedStudentName: string;
  studentNameMissing: boolean;
  studentNameRejectedBecauseAssignedFallback: boolean;
  rawCourseId: string | null;
  rawCourseName: string | null;
  rawCourseTitle: string | null;
  rawCourseLabel: string | null;
  enrollmentCourseName: string | null;
  enrollmentCourseTitle: string | null;
  resolvedCourseName: string | null;
  courseSlugOnly: boolean;
  teacherId: string | null;
  teacherIds: string[];
  assignedTeacherId: string | null;
  primaryTeacherId: string | null;
  teacherUid: string | null;
  teacher_id: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  resolvedTeacherUid: string | null;
  resolvedTeacherName: string | null;
  resolvedTeacherEmail: string | null;
  teacherResolutionSource: 'uid_alias' | 'email_match' | 'name_match' | 'unknown';
  teacherFieldsConflicting: boolean;
  repairCandidate: boolean;
  repairReasons: string[];
};

type TraceAuditLogRow = {
  logId: string;
  sourceCollection: string;
  type: string | null;
  timestamp: string | null;
  enrollmentId: string | null;
  kidId: string | null;
  studentId: string | null;
  studentName: string | null;
  courseId: string | null;
  courseName: string | null;
  teacherId: string | null;
  teacherIds: string[];
  teacherName: string | null;
  teacherEmail: string | null;
  previousTeacherUid: string | null;
  previousTeacherName: string | null;
  previousTeacherEmail: string | null;
  newTeacherUid: string | null;
  newTeacherName: string | null;
  newTeacherEmail: string | null;
  changedBy: string | null;
  matchedBy: string[];
};

type TransferEvent = {
  transferDetectedAt: string | null;
  previousTeacherUid: string | null;
  previousTeacherName: string | null;
  newTeacherUid: string | null;
  newTeacherName: string | null;
  evidence: {
    source: 'audit_log' | 'session_timeline';
    logId?: string;
    beforeSessionId?: string;
    afterSessionId?: string;
  };
  confidence: 'high' | 'medium' | 'low';
};

type TeacherTimelineRow = {
  teacherUid: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  fromDate: string | null;
  toDate: string | null;
  sessionCount: number;
  sessionIds: string[];
  confidence: 'high' | 'medium' | 'low';
};

type TraceResult = {
  query: TraceQuery;
  resolvedStudent: {
    enrollmentId: string | null;
    kidId: string | null;
    studentName: string | null;
    courseName: string | null;
    parentId: string | null;
  };
  currentEnrollmentState: Record<string, unknown> | null;
  teacherTimeline: TeacherTimelineRow[];
  transferEvents: TransferEvent[];
  sessionTimeline: TraceSessionRow[];
  auditLogMatches: TraceAuditLogRow[];
  repairCandidates: TraceSessionRow[];
  summary: {
    transferredFrom: string | null;
    transferredTo: string | null;
    likelyTransferDate: string | null;
    confidence: 'high' | 'medium' | 'low' | 'none';
    totalSessionsChecked: number;
    totalRepairCandidates: number;
    recommendedAction: string;
  };
};

type BuildTraceResultInput = {
  query: TraceQuery;
  sessionDocs: Array<{ id: string; data: FirestoreRow }>;
  enrollmentById: Map<string, FirestoreRow>;
  kidById: Map<string, FirestoreRow>;
  childById: Map<string, FirestoreRow>;
  courseById: Map<string, FirestoreRow>;
  teacherProfilesByUid: Map<string, TeacherProfile>;
  teacherUidByEmail: Map<string, string>;
  teacherUidByName: Map<string, string>;
  auditLogRows: TraceAuditLogRow[];
  preferredEnrollmentId?: string | null;
  preferredKidId?: string | null;
};

type SessionQueryPlan = {
  key: string;
  field: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: string;
  source: string;
  legacy: boolean;
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

function maybeYmd(value: unknown): string | null {
  const text = toCleanText(value);
  return YMD_RE.test(text) ? text : null;
}

export function cleanStudentDisplayName(value: unknown): string {
  const text = toCleanText(value);
  if (!text) return '';
  if (/^\d+\s+assigned$/i.test(text)) return '';
  if (/^assigned$/i.test(text)) return '';
  if (/^\d+\s+students?$/i.test(text)) return '';
  if (/^(student|child|kid)$/i.test(text)) return '';
  return text;
}

function isRejectedStudentDisplayName(value: unknown): boolean {
  return !cleanStudentDisplayName(value) && Boolean(toCleanText(value));
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

function getIsoTimestamp(value: unknown): string | null {
  const millis = getTimestampMillis(value);
  return millis ? new Date(millis).toISOString() : null;
}

function getSessionDateKey(row: FirestoreRow): string | null {
  const date = maybeYmd(row.date);
  if (date) return date;
  const startAtMillis = getTimestampMillis(row.startAt);
  if (!startAtMillis) return null;
  return new Date(startAtMillis).toISOString().slice(0, 10);
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

function isWithinDateRange(row: FirestoreRow, fromDate: string | null, toDate: string | null): boolean {
  const dateKey = getSessionDateKey(row);
  if (!dateKey) return true;
  if (fromDate && dateKey < fromDate) return false;
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
  const resolvedStudentName =
    sessionCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    enrollmentCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    kidCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    childCandidates.map(cleanStudentDisplayName).find(Boolean) ||
    'Student';

  return {
    resolvedStudentName,
    studentNameRejectedBecauseAssignedFallback: sessionCandidates.some((candidate) => isRejectedStudentDisplayName(candidate)),
    studentNameMissing: resolvedStudentName === 'Student',
  };
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
  const preferred = candidates.find((candidate) => !isLikelyCourseIdLike(candidate, courseId)) || candidates[0] || courseId || null;
  return {
    courseId: courseId || null,
    resolvedCourseName: preferred,
    courseSlugOnly: Boolean(preferred) && isLikelyCourseIdLike(preferred, courseId),
  };
}

function resolveTeacherIdentity(
  row: FirestoreRow,
  teacherProfilesByUid: Map<string, TeacherProfile>,
  teacherUidByEmail: Map<string, string>,
  teacherUidByName: Map<string, string>,
) {
  const aliasIds = collectTeacherAliasIds(row);
  const canonicalAlias =
    toCleanText(row.teacherId) ||
    toCleanText(row.assignedTeacherId) ||
    toCleanText(row.primaryTeacherId) ||
    toCleanText(row.teacherUid) ||
    toCleanText(row.teacher_id) ||
    aliasIds[0] ||
    '';
  const teacherEmail = toCleanText(row.teacherEmail);
  const teacherName = toCleanText(row.teacherName);
  const emailMatchedUid = teacherEmail ? teacherUidByEmail.get(teacherEmail.toLowerCase()) || '' : '';
  const nameMatchedUid = teacherName ? teacherUidByName.get(teacherName.toLowerCase()) || '' : '';
  const resolvedTeacherUid = canonicalAlias || emailMatchedUid || nameMatchedUid || null;
  const profile = resolvedTeacherUid ? teacherProfilesByUid.get(resolvedTeacherUid) || null : null;
  const teacherFieldsConflicting =
    aliasIds.length > 1 ||
    Boolean(emailMatchedUid && canonicalAlias && emailMatchedUid !== canonicalAlias) ||
    Boolean(nameMatchedUid && canonicalAlias && nameMatchedUid !== canonicalAlias) ||
    Boolean(toCleanText(row.assignedTeacherId) && toCleanText(row.primaryTeacherId) && toCleanText(row.assignedTeacherId) !== toCleanText(row.primaryTeacherId));

  let teacherResolutionSource: TraceSessionRow['teacherResolutionSource'] = 'unknown';
  if (canonicalAlias) teacherResolutionSource = 'uid_alias';
  else if (emailMatchedUid) teacherResolutionSource = 'email_match';
  else if (nameMatchedUid) teacherResolutionSource = 'name_match';

  return {
    aliasIds,
    resolvedTeacherUid,
    resolvedTeacherName:
      profile?.displayName ||
      profile?.name ||
      teacherName ||
      teacherEmail ||
      resolvedTeacherUid,
    resolvedTeacherEmail: profile?.email || teacherEmail || null,
    teacherResolutionSource,
    teacherFieldsConflicting,
  };
}

function appendQueryPlan(
  plans: SessionQueryPlan[],
  seen: Set<string>,
  field: string,
  op: FirebaseFirestore.WhereFilterOp,
  value: string | null,
  source: string,
  legacy = false,
) {
  const cleanValue = toCleanText(value);
  if (!cleanValue) return;
  const key = `${field}:${op}:${cleanValue}:${legacy ? 'legacy' : 'primary'}`;
  if (seen.has(key)) return;
  seen.add(key);
  plans.push({ key, field, op, value: cleanValue, source, legacy });
}

function buildSessionQueryCoverage(enrollmentIds: string[], kidIds: string[], studentName: string | null): SessionQueryPlan[] {
  const plans: SessionQueryPlan[] = [];
  const seen = new Set<string>();

  enrollmentIds.forEach((enrollmentId) => {
    appendQueryPlan(plans, seen, 'enrollmentId', '==', enrollmentId, 'enrollmentId');
  });

  kidIds.forEach((kidId) => {
    appendQueryPlan(plans, seen, 'kidId', '==', kidId, 'kidId');
    appendQueryPlan(plans, seen, 'kidIds', 'array-contains', kidId, 'kidIds');
    appendQueryPlan(plans, seen, 'studentId', '==', kidId, 'studentId', true);
    appendQueryPlan(plans, seen, 'studentIds', 'array-contains', kidId, 'studentIds', true);
    appendQueryPlan(plans, seen, 'childId', '==', kidId, 'childId', true);
    appendQueryPlan(plans, seen, 'childIds', 'array-contains', kidId, 'childIds', true);
    appendQueryPlan(plans, seen, 'childrenIds', 'array-contains', kidId, 'childrenIds', true);
  });

  if (studentName) {
    appendQueryPlan(plans, seen, 'studentName', '==', studentName, 'studentName');
    appendQueryPlan(plans, seen, 'kidName', '==', studentName, 'kidName');
    appendQueryPlan(plans, seen, 'childName', '==', studentName, 'childName');
  }

  return plans;
}

function pickPrimaryEnrollmentId(args: {
  enrollmentById: Map<string, FirestoreRow>;
  sessionDocs: Array<{ id: string; data: FirestoreRow }>;
  preferredEnrollmentId?: string | null;
  preferredKidId?: string | null;
}): string | null {
  const { enrollmentById, sessionDocs, preferredEnrollmentId, preferredKidId } = args;
  if (preferredEnrollmentId && enrollmentById.has(preferredEnrollmentId)) return preferredEnrollmentId;

  const latestSessionEnrollmentId = [...sessionDocs]
    .sort((a, b) => getSessionSortKey(b.data) - getSessionSortKey(a.data))
    .map((entry) => toCleanText(entry.data.enrollmentId))
    .find((enrollmentId) => enrollmentId && enrollmentById.has(enrollmentId));
  if (latestSessionEnrollmentId) return latestSessionEnrollmentId;

  if (preferredKidId) {
    const byKid = Array.from(enrollmentById.entries())
      .filter(([, enrollment]) => collectKidIds(enrollment).includes(preferredKidId))
      .sort((a, b) => (getTimestampMillis(b[1].updatedAt) || 0) - (getTimestampMillis(a[1].updatedAt) || 0));
    if (byKid[0]) return byKid[0][0];
  }

  const latestUpdated = Array.from(enrollmentById.entries()).sort(
    (a, b) => (getTimestampMillis(b[1].updatedAt) || 0) - (getTimestampMillis(a[1].updatedAt) || 0),
  );
  return latestUpdated[0]?.[0] || null;
}

function pickPrimaryKidId(args: {
  primaryEnrollment: FirestoreRow | null;
  sessionRows: TraceSessionRow[];
  kidById: Map<string, FirestoreRow>;
  childById: Map<string, FirestoreRow>;
  preferredKidId?: string | null;
}): string | null {
  if (args.preferredKidId && (args.kidById.has(args.preferredKidId) || args.childById.has(args.preferredKidId))) {
    return args.preferredKidId;
  }
  const enrollmentKidId =
    toCleanText(args.primaryEnrollment?.kidId) ||
    toCleanText(args.primaryEnrollment?.studentId) ||
    toCleanText(args.primaryEnrollment?.childId);
  if (enrollmentKidId) return enrollmentKidId;
  const firstSessionKidId = args.sessionRows
    .flatMap((row) => [row.kidId, row.studentId, row.childId, ...row.kidIds])
    .find((entry) => Boolean(entry));
  return firstSessionKidId || null;
}

function buildTeacherTimeline(sessionRows: TraceSessionRow[]): TeacherTimelineRow[] {
  if (sessionRows.length === 0) return [];
  const timeline: TeacherTimelineRow[] = [];
  let current: TeacherTimelineRow | null = null;
  let currentKey = '';

  for (const row of sessionRows) {
    const key = row.resolvedTeacherUid || row.resolvedTeacherEmail || row.resolvedTeacherName || 'unknown';
    const confidence: TeacherTimelineRow['confidence'] =
      row.teacherResolutionSource === 'uid_alias' ? (row.teacherFieldsConflicting ? 'medium' : 'high') :
      row.teacherResolutionSource === 'unknown' ? 'low' :
      'low';

    if (!current || key !== currentKey) {
      current = {
        teacherUid: row.resolvedTeacherUid,
        teacherName: row.resolvedTeacherName,
        teacherEmail: row.resolvedTeacherEmail,
        fromDate: row.date,
        toDate: row.date,
        sessionCount: 1,
        sessionIds: [row.sessionId],
        confidence,
      };
      timeline.push(current);
      currentKey = key;
      continue;
    }

    current.toDate = row.date;
    current.sessionCount += 1;
    current.sessionIds.push(row.sessionId);
  }

  return timeline;
}

function buildTransferEvents(sessionRows: TraceSessionRow[], auditLogRows: TraceAuditLogRow[]): TransferEvent[] {
  const auditEvents: TransferEvent[] = auditLogRows
    .filter((row) => row.previousTeacherUid && row.newTeacherUid && row.previousTeacherUid !== row.newTeacherUid)
    .map((row) => ({
      transferDetectedAt: row.timestamp,
      previousTeacherUid: row.previousTeacherUid,
      previousTeacherName: row.previousTeacherName,
      newTeacherUid: row.newTeacherUid,
      newTeacherName: row.newTeacherName,
      evidence: {
        source: 'audit_log',
        logId: row.logId,
      },
      confidence: 'high',
    }));

  const inferredEvents: TransferEvent[] = [];
  for (let index = 1; index < sessionRows.length; index += 1) {
    const previous = sessionRows[index - 1];
    const current = sessionRows[index];
    if (!previous.resolvedTeacherUid || !current.resolvedTeacherUid) continue;
    if (previous.resolvedTeacherUid === current.resolvedTeacherUid) continue;
    inferredEvents.push({
      transferDetectedAt: current.date,
      previousTeacherUid: previous.resolvedTeacherUid,
      previousTeacherName: previous.resolvedTeacherName,
      newTeacherUid: current.resolvedTeacherUid,
      newTeacherName: current.resolvedTeacherName,
      evidence: {
        source: 'session_timeline',
        beforeSessionId: previous.sessionId,
        afterSessionId: current.sessionId,
      },
      confidence: previous.teacherFieldsConflicting || current.teacherFieldsConflicting ? 'low' : 'medium',
    });
  }

  return [...auditEvents, ...inferredEvents].sort((a, b) => {
    const aTime = a.transferDetectedAt ? Date.parse(a.transferDetectedAt) : 0;
    const bTime = b.transferDetectedAt ? Date.parse(b.transferDetectedAt) : 0;
    return aTime - bTime;
  });
}

function buildRecommendedAction(args: {
  repairCandidates: TraceSessionRow[];
  primaryEnrollmentId: string | null;
  primaryKidId: string | null;
  transferEvents: TransferEvent[];
}): string {
  if (args.repairCandidates.length === 0) {
    return 'No repair recommended from this trace. Review the transfer timeline only.';
  }
  const latestEvent = [...args.transferEvents].reverse().find((event) => event.newTeacherUid);
  const fromTeacherUid = latestEvent?.previousTeacherUid || '<fromTeacherUid>';
  const toTeacherUid = latestEvent?.newTeacherUid || '<toTeacherUid>';
  const fromDate = latestEvent?.transferDetectedAt?.slice(0, 10) || '<fromDate>';
  return `Review the trace evidence, then run repairTransferredTeacherSessionSnapshots with enrollmentId=${args.primaryEnrollmentId || '<enrollmentId>'}, kidId=${args.primaryKidId || '<kidId>'}, fromTeacherUid=${fromTeacherUid}, toTeacherUid=${toTeacherUid}, fromDate=${fromDate}.`;
}

function buildAuditLogMatch(args: {
  id: string;
  sourceCollection: string;
  row: FirestoreRow;
  matchedBy: string[];
}): TraceAuditLogRow {
  const row = args.row;
  return {
    logId: args.id,
    sourceCollection: args.sourceCollection,
    type: toCleanText(row.type) || null,
    timestamp:
      getIsoTimestamp(row.changedAt) ||
      getIsoTimestamp(row.transferredAt) ||
      getIsoTimestamp(row.reassignedAt) ||
      getIsoTimestamp(row.teacherReassignedAt) ||
      getIsoTimestamp(row.updatedAt) ||
      getIsoTimestamp(row.createdAt),
    enrollmentId: toCleanText(row.enrollmentId) || null,
    kidId: toCleanText(row.kidId) || null,
    studentId: toCleanText(row.studentId) || null,
    studentName:
      toCleanText(row.studentName) ||
      toCleanText(row.kidName) ||
      toCleanText(row.childName) ||
      null,
    courseId: toCleanText(row.courseId) || null,
    courseName: toCleanText(row.courseName) || toCleanText(row.courseTitle) || null,
    teacherId: toCleanText(row.teacherId) || null,
    teacherIds: collectTeacherAliasIds(row),
    teacherName: toCleanText(row.teacherName) || null,
    teacherEmail: toCleanText(row.teacherEmail) || null,
    previousTeacherUid:
      toCleanText(row.previousTeacherId) ||
      toCleanText(row.oldTeacherId) ||
      toCleanText(row.fromTeacherId) ||
      toCleanText(row.reassignedFromTeacherId) ||
      toCleanText(row.teacherReassignedFrom) ||
      null,
    previousTeacherName:
      toCleanText(row.previousTeacherName) ||
      toCleanText(row.oldTeacherName) ||
      null,
    previousTeacherEmail:
      toCleanText(row.previousTeacherEmail) ||
      toCleanText(row.oldTeacherEmail) ||
      null,
    newTeacherUid:
      toCleanText(row.newTeacherId) ||
      toCleanText(row.toTeacherId) ||
      toCleanText(row.teacherId) ||
      toCleanText(row.assignedTeacherId) ||
      null,
    newTeacherName:
      toCleanText(row.newTeacherName) ||
      toCleanText(row.teacherName) ||
      null,
    newTeacherEmail:
      toCleanText(row.newTeacherEmail) ||
      toCleanText(row.teacherEmail) ||
      null,
    changedBy: toCleanText(row.changedBy) || toCleanText(row.updatedBy) || toCleanText(row.createdBy) || null,
    matchedBy: args.matchedBy,
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
  const teacherEmail =
    toCleanText(row.teacherEmail) ||
    toCleanText(row.newTeacherEmail) ||
    toCleanText(row.oldTeacherEmail) ||
    toCleanText(row.previousTeacherEmail);
  const teacherName =
    toCleanText(row.teacherName) ||
    toCleanText(row.newTeacherName) ||
    toCleanText(row.oldTeacherName) ||
    toCleanText(row.previousTeacherName);
  if (teacherEmail) teacherEmails.add(teacherEmail);
  if (teacherName) teacherNames.add(teacherName);
}

export function buildTraceStudentTransferHistoryResult(input: BuildTraceResultInput): TraceResult {
  const primaryEnrollmentId = pickPrimaryEnrollmentId({
    enrollmentById: input.enrollmentById,
    sessionDocs: input.sessionDocs,
    preferredEnrollmentId: input.preferredEnrollmentId,
    preferredKidId: input.preferredKidId,
  });
  const primaryEnrollment = primaryEnrollmentId ? input.enrollmentById.get(primaryEnrollmentId) || null : null;

  const sessionRows = input.sessionDocs
    .sort((a, b) => getSessionSortKey(a.data) - getSessionSortKey(b.data))
    .map((entry) => {
      const session = entry.data;
      const enrollment = input.enrollmentById.get(toCleanText(session.enrollmentId)) || primaryEnrollment || null;
      const resolvedKidId =
        toCleanText(session.kidId) ||
        toCleanText(session.studentId) ||
        toCleanText(session.childId) ||
        collectKidIds(session)[0] ||
        toCleanText(enrollment?.kidId) ||
        '';
      const kid = input.kidById.get(resolvedKidId) || null;
      const child = input.childById.get(resolvedKidId) || null;
      const courseId =
        toCleanText(session.courseId) ||
        toCleanText((session as FirestoreRow).course_id) ||
        toCleanText(enrollment?.courseId) ||
        toCleanText((enrollment || {}).course_id) ||
        '';
      const course = courseId ? input.courseById.get(courseId) || null : null;
      const studentDisplay = resolveStudentDisplay(session, enrollment, kid, child);
      const courseDisplay = resolveCourseDisplay(session, enrollment, course);
      const rawCourseSnapshot =
        toCleanText(session.courseName) ||
        toCleanText((session as FirestoreRow).courseTitle) ||
        toCleanText((session as FirestoreRow).courseLabel) ||
        '';
      const rawCourseSnapshotSlugOnly = Boolean(rawCourseSnapshot) && isLikelyCourseIdLike(rawCourseSnapshot, courseDisplay.courseId);
      const teacherIdentity = resolveTeacherIdentity(
        session,
        input.teacherProfilesByUid,
        input.teacherUidByEmail,
        input.teacherUidByName,
      );

      const repairReasons: string[] = [];
      if (studentDisplay.studentNameRejectedBecauseAssignedFallback) repairReasons.push('student_name_rejected_assigned_count_label');
      if (studentDisplay.studentNameMissing) repairReasons.push('student_name_missing');
      if (!rawCourseSnapshot && courseDisplay.resolvedCourseName) repairReasons.push('course_snapshot_missing');
      if (!courseDisplay.resolvedCourseName) repairReasons.push('course_name_missing');
      if (rawCourseSnapshotSlugOnly || courseDisplay.courseSlugOnly) repairReasons.push('course_name_slug_only');
      if (teacherIdentity.teacherFieldsConflicting) repairReasons.push('teacher_alias_conflict');
      if (!toCleanText(session.teacherId) && teacherIdentity.resolvedTeacherUid) repairReasons.push('canonical_teacherId_missing');
      if (teacherIdentity.resolvedTeacherUid && !toTextList(session.teacherIds).includes(teacherIdentity.resolvedTeacherUid)) {
        repairReasons.push('teacherIds_missing_resolved_teacher');
      }
      if (!toCleanText(session.enrollmentId) && primaryEnrollmentId) repairReasons.push('enrollmentId_missing');
      if (!toCleanText(session.kidId) && (resolvedKidId || collectKidIds(enrollment).length > 0)) repairReasons.push('kidId_missing');

      return {
        sessionId: entry.id,
        date: getSessionDateKey(session),
        startTime: toCleanText(session.startTime) || null,
        endTime: toCleanText(session.endTime) || null,
        status: toCleanText(session.status) || null,
        source: toCleanText(session.source) || null,
        sessionType: toCleanText(session.sessionType) || null,
        createdByFlow: toCleanText(session.createdByFlow) || null,
        enrollmentId: toCleanText(session.enrollmentId) || primaryEnrollmentId || null,
        kidId: toCleanText(session.kidId) || (resolvedKidId || null),
        studentId: toCleanText(session.studentId) || null,
        childId: toCleanText(session.childId) || null,
        kidIds: collectKidIds(session),
        rawStudentName: toCleanText(session.studentName) || null,
        rawKidName: toCleanText(session.kidName) || null,
        rawChildName: toCleanText(session.childName) || null,
        enrollmentStudentName: toCleanText(enrollment?.studentName) || null,
        enrollmentKidName: toCleanText(enrollment?.kidName) || null,
        enrollmentChildName: toCleanText(enrollment?.childName) || null,
        resolvedStudentName: studentDisplay.resolvedStudentName,
        studentNameMissing: studentDisplay.studentNameMissing,
        studentNameRejectedBecauseAssignedFallback: studentDisplay.studentNameRejectedBecauseAssignedFallback,
        rawCourseId: courseDisplay.courseId,
        rawCourseName: toCleanText(session.courseName) || null,
        rawCourseTitle: toCleanText((session as FirestoreRow).courseTitle) || null,
        rawCourseLabel: toCleanText((session as FirestoreRow).courseLabel) || null,
        enrollmentCourseName: toCleanText(enrollment?.courseName) || null,
        enrollmentCourseTitle: toCleanText((enrollment || {}).courseTitle) || null,
        resolvedCourseName: courseDisplay.resolvedCourseName,
        courseSlugOnly: courseDisplay.courseSlugOnly,
        teacherId: toCleanText(session.teacherId) || null,
        teacherIds: toTextList(session.teacherIds),
        assignedTeacherId: toCleanText(session.assignedTeacherId) || null,
        primaryTeacherId: toCleanText(session.primaryTeacherId) || null,
        teacherUid: toCleanText(session.teacherUid) || null,
        teacher_id: toCleanText(session.teacher_id) || null,
        teacherName: toCleanText(session.teacherName) || null,
        teacherEmail: toCleanText(session.teacherEmail) || null,
        resolvedTeacherUid: teacherIdentity.resolvedTeacherUid,
        resolvedTeacherName: teacherIdentity.resolvedTeacherName,
        resolvedTeacherEmail: teacherIdentity.resolvedTeacherEmail,
        teacherResolutionSource: teacherIdentity.teacherResolutionSource,
        teacherFieldsConflicting: teacherIdentity.teacherFieldsConflicting,
        repairCandidate: repairReasons.length > 0,
        repairReasons,
      } satisfies TraceSessionRow;
    });

  const primaryKidId = pickPrimaryKidId({
    primaryEnrollment,
    sessionRows,
    kidById: input.kidById,
    childById: input.childById,
    preferredKidId: input.preferredKidId,
  });
  const primaryKid = primaryKidId ? input.kidById.get(primaryKidId) || null : null;
  const primaryChild = primaryKidId ? input.childById.get(primaryKidId) || null : null;

  const teacherTimeline = buildTeacherTimeline(sessionRows);
  const transferEvents = buildTransferEvents(sessionRows, input.auditLogRows);
  const repairCandidates = input.query.includeRepairCandidates ? sessionRows.filter((row) => row.repairCandidate) : [];
  const latestTransferEvent = transferEvents.length > 0 ? transferEvents[transferEvents.length - 1] : null;
  const currentEnrollmentState = primaryEnrollmentId ?
    {
      enrollmentId: primaryEnrollmentId,
      kidId: toCleanText(primaryEnrollment?.kidId) || primaryKidId || null,
      studentId: toCleanText(primaryEnrollment?.studentId) || null,
      childId: toCleanText(primaryEnrollment?.childId) || null,
      kidIds: collectKidIds(primaryEnrollment),
      studentName: toCleanText(primaryEnrollment?.studentName) || null,
      kidName: toCleanText(primaryEnrollment?.kidName) || null,
      childName: toCleanText(primaryEnrollment?.childName) || null,
      teacherId: toCleanText(primaryEnrollment?.teacherId) || null,
      teacherIds: toTextList(primaryEnrollment?.teacherIds),
      assignedTeacherId: toCleanText(primaryEnrollment?.assignedTeacherId) || null,
      primaryTeacherId: toCleanText(primaryEnrollment?.primaryTeacherId) || null,
      teacherUid: toCleanText(primaryEnrollment?.teacherUid) || null,
      teacher_id: toCleanText(primaryEnrollment?.teacher_id) || null,
      teacherName: toCleanText(primaryEnrollment?.teacherName) || null,
      teacherEmail: toCleanText(primaryEnrollment?.teacherEmail) || null,
      previousTeacherId: toCleanText(primaryEnrollment?.previousTeacherId) || null,
      previousTeacherName: toCleanText(primaryEnrollment?.previousTeacherName) || null,
      previousTeacherEmail: toCleanText(primaryEnrollment?.previousTeacherEmail) || null,
      teacherReassignedAt:
        getIsoTimestamp(primaryEnrollment?.teacherReassignedAt) ||
        getIsoTimestamp(primaryEnrollment?.reassignedAt) ||
        null,
      updatedAt: getIsoTimestamp(primaryEnrollment?.updatedAt),
      updatedBy: toCleanText(primaryEnrollment?.updatedBy) || null,
      courseId:
        toCleanText(primaryEnrollment?.courseId) ||
        toCleanText((primaryEnrollment || {}).course_id) ||
        null,
      courseName:
        toCleanText(primaryEnrollment?.courseName) ||
        toCleanText((primaryEnrollment || {}).courseTitle) ||
        null,
      parentId: toCleanText(primaryEnrollment?.parentId) || null,
      parentIds: toTextList(primaryEnrollment?.parentIds),
    } :
    null;

  return {
    query: input.query,
    resolvedStudent: {
      enrollmentId: primaryEnrollmentId,
      kidId: primaryKidId,
      studentName:
        cleanStudentDisplayName(primaryEnrollment?.studentName) ||
        cleanStudentDisplayName(primaryEnrollment?.kidName) ||
        cleanStudentDisplayName(primaryEnrollment?.childName) ||
        cleanStudentDisplayName(primaryKid?.studentName) ||
        cleanStudentDisplayName(primaryKid?.fullName) ||
        cleanStudentDisplayName(primaryKid?.displayName) ||
        cleanStudentDisplayName(primaryKid?.name) ||
        cleanStudentDisplayName(primaryChild?.studentName) ||
        cleanStudentDisplayName(primaryChild?.fullName) ||
        cleanStudentDisplayName(primaryChild?.displayName) ||
        cleanStudentDisplayName(primaryChild?.name) ||
        sessionRows[0]?.resolvedStudentName ||
        null,
      courseName:
        toCleanText(primaryEnrollment?.courseName) ||
        toCleanText((primaryEnrollment || {}).courseTitle) ||
        sessionRows.find((row) => row.resolvedCourseName)?.resolvedCourseName ||
        null,
      parentId: toCleanText(primaryEnrollment?.parentId) || null,
    },
    currentEnrollmentState,
    teacherTimeline,
    transferEvents,
    sessionTimeline: input.query.includeSessions ? sessionRows : [],
    auditLogMatches: input.auditLogRows,
    repairCandidates,
    summary: {
      transferredFrom: latestTransferEvent?.previousTeacherUid || null,
      transferredTo: latestTransferEvent?.newTeacherUid || null,
      likelyTransferDate: latestTransferEvent?.transferDetectedAt || null,
      confidence: latestTransferEvent?.confidence || 'none',
      totalSessionsChecked: sessionRows.length,
      totalRepairCandidates: repairCandidates.length,
      recommendedAction: buildRecommendedAction({
        repairCandidates,
        primaryEnrollmentId,
        primaryKidId,
        transferEvents,
      }),
    },
  };
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

async function queryExactFieldMatches(
  collection: FirebaseFirestore.CollectionReference,
  fields: string[],
  value: string,
  limit = 20,
): Promise<Array<{ id: string; data: FirestoreRow; matchedField: string }>> {
  const cleanValue = toCleanText(value);
  if (!cleanValue) return [];
  const snaps = await Promise.all(
    fields.map((field) => collection.where(field, '==', cleanValue).limit(limit).get()),
  );
  const results: Array<{ id: string; data: FirestoreRow; matchedField: string }> = [];
  snaps.forEach((snap, index) => {
    snap.docs.forEach((docSnap) => {
      results.push({ id: docSnap.id, data: (docSnap.data() || {}) as FirestoreRow, matchedField: fields[index] });
    });
  });
  return results;
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

  const [emailMatches, displayNameMatches, nameMatches] = await Promise.all([
    Promise.all(uniqueTeacherEmails.map((email) => queryExactFieldMatches(db.collection('users'), ['email'], email, 5))),
    Promise.all(uniqueTeacherNames.map((name) => queryExactFieldMatches(db.collection('users'), ['displayName'], name, 5))),
    Promise.all(uniqueTeacherNames.map((name) => queryExactFieldMatches(db.collection('users'), ['name'], name, 5))),
  ]);

  [...emailMatches.flat(), ...displayNameMatches.flat(), ...nameMatches.flat()].forEach((entry) => {
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

  return { teacherProfilesByUid, teacherUidByEmail, teacherUidByName };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export const traceStudentTransferHistory = onCall({ region: REGION }, async (request) => {
  await ensureAdmin(request.auth);

  const query: TraceQuery = {
    enrollmentId: toCleanText(request.data?.enrollmentId) || null,
    kidId: toCleanText(request.data?.kidId) || null,
    studentName: toCleanText(request.data?.studentName) || null,
    fromDate: toCleanText(request.data?.fromDate) || null,
    toDate: toCleanText(request.data?.toDate) || null,
    includeSessions: request.data?.includeSessions !== false,
    includeAuditLogs: request.data?.includeAuditLogs !== false,
    includeRepairCandidates: request.data?.includeRepairCandidates !== false,
  };

  if (!query.enrollmentId && !query.kidId && !query.studentName) {
    throw new HttpsError('invalid-argument', 'Provide enrollmentId, kidId, or studentName.');
  }
  if (query.fromDate && !YMD_RE.test(query.fromDate)) {
    throw new HttpsError('invalid-argument', 'fromDate must be YYYY-MM-DD');
  }
  if (query.toDate && !YMD_RE.test(query.toDate)) {
    throw new HttpsError('invalid-argument', 'toDate must be YYYY-MM-DD');
  }
  if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
    throw new HttpsError('invalid-argument', 'fromDate must be before or equal to toDate');
  }

  const db = admin.firestore();
  const enrollmentById = new Map<string, FirestoreRow>();
  const kidById = new Map<string, FirestoreRow>();
  const childById = new Map<string, FirestoreRow>();
  const courseById = new Map<string, FirestoreRow>();
  const sessionMap = new Map<string, FirestoreRow>();
  const auditLogRows: TraceAuditLogRow[] = [];
  const enrollmentIds = new Set<string>();
  const kidIds = new Set<string>();
  const teacherUids = new Set<string>();
  const teacherEmails = new Set<string>();
  const teacherNames = new Set<string>();

  if (query.enrollmentId) {
    const enrollmentDoc = await fetchDocById(db.collection('enrollments'), query.enrollmentId);
    if (enrollmentDoc) {
      enrollmentById.set(enrollmentDoc.id, enrollmentDoc.data);
      enrollmentIds.add(enrollmentDoc.id);
      collectKidIds(enrollmentDoc.data).forEach((kidId) => kidIds.add(kidId));
      collectTeacherSignalsFromRow(enrollmentDoc.data, teacherUids, teacherEmails, teacherNames);
    }
  }

  if (query.kidId) {
    kidIds.add(query.kidId);
    const [kidDoc, childDoc] = await Promise.all([
      fetchDocById(db.collection('kids'), query.kidId),
      fetchDocById(db.collection('children'), query.kidId),
    ]);
    if (kidDoc) kidById.set(kidDoc.id, kidDoc.data);
    if (childDoc) childById.set(childDoc.id, childDoc.data);

    const relatedEnrollments = await Promise.all([
      db.collection('enrollments').where('kidId', '==', query.kidId).get(),
      db.collection('enrollments').where('studentId', '==', query.kidId).get(),
      db.collection('enrollments').where('childId', '==', query.kidId).get(),
      db.collection('enrollments').where('kidIds', 'array-contains', query.kidId).get(),
    ]);
    relatedEnrollments.forEach((snap) => {
      snap.docs.forEach((docSnap) => {
        const data = (docSnap.data() || {}) as FirestoreRow;
        enrollmentById.set(docSnap.id, data);
        enrollmentIds.add(docSnap.id);
        collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
      });
    });
  }

  if (query.studentName) {
    const [enrollmentMatches, kidMatches, childMatches, sessionMatches] = await Promise.all([
      queryExactFieldMatches(db.collection('enrollments'), ['studentName', 'kidName', 'childName'], query.studentName, 20),
      queryExactFieldMatches(db.collection('kids'), ['studentName', 'fullName', 'displayName', 'name'], query.studentName, 20),
      queryExactFieldMatches(db.collection('children'), ['studentName', 'fullName', 'displayName', 'name'], query.studentName, 20),
      queryExactFieldMatches(db.collection('classSessions'), ['studentName', 'kidName', 'childName'], query.studentName, 40),
    ]);

    enrollmentMatches.forEach((entry) => {
      enrollmentById.set(entry.id, entry.data);
      enrollmentIds.add(entry.id);
      collectKidIds(entry.data).forEach((kidId) => kidIds.add(kidId));
      collectTeacherSignalsFromRow(entry.data, teacherUids, teacherEmails, teacherNames);
    });
    kidMatches.forEach((entry) => {
      kidById.set(entry.id, entry.data);
      kidIds.add(entry.id);
    });
    childMatches.forEach((entry) => {
      childById.set(entry.id, entry.data);
      kidIds.add(entry.id);
    });
    sessionMatches.forEach((entry) => {
      if (!isWithinDateRange(entry.data, query.fromDate, query.toDate)) return;
      sessionMap.set(entry.id, entry.data);
      const enrollmentId = toCleanText(entry.data.enrollmentId);
      if (enrollmentId) enrollmentIds.add(enrollmentId);
      collectKidIds(entry.data).forEach((kidId) => kidIds.add(kidId));
      collectTeacherSignalsFromRow(entry.data, teacherUids, teacherEmails, teacherNames);
    });
  }

  const sessionQueryPlans = buildSessionQueryCoverage(
    Array.from(enrollmentIds),
    Array.from(kidIds),
    query.studentName,
  );
  const sessionQuerySnaps = await Promise.all(
    sessionQueryPlans.map((plan) => db.collection('classSessions').where(plan.field, plan.op, plan.value).get()),
  );
  sessionQuerySnaps.forEach((snap) => {
    snap.docs.forEach((docSnap) => {
      const data = (docSnap.data() || {}) as FirestoreRow;
      if (!isWithinDateRange(data, query.fromDate, query.toDate)) return;
      sessionMap.set(docSnap.id, data);
      const enrollmentId = toCleanText(data.enrollmentId);
      if (enrollmentId) enrollmentIds.add(enrollmentId);
      collectKidIds(data).forEach((kidId) => kidIds.add(kidId));
      collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
    });
  });

  const missingEnrollmentIds = Array.from(enrollmentIds).filter((enrollmentId) => !enrollmentById.has(enrollmentId));
  const missingKidIds = Array.from(kidIds).filter((kidId) => !kidById.has(kidId) && !childById.has(kidId));
  const enrollmentDocs = await Promise.all(missingEnrollmentIds.map((enrollmentId) => fetchDocById(db.collection('enrollments'), enrollmentId)));
  const kidDocs = await Promise.all(missingKidIds.map((kidId) => fetchDocById(db.collection('kids'), kidId)));
  const childDocs = await Promise.all(missingKidIds.map((kidId) => fetchDocById(db.collection('children'), kidId)));

  enrollmentDocs.forEach((entry) => {
    if (!entry) return;
    enrollmentById.set(entry.id, entry.data);
    collectKidIds(entry.data).forEach((kidId) => kidIds.add(kidId));
    collectTeacherSignalsFromRow(entry.data, teacherUids, teacherEmails, teacherNames);
  });
  kidDocs.forEach((entry) => {
    if (entry) kidById.set(entry.id, entry.data);
  });
  childDocs.forEach((entry) => {
    if (entry) childById.set(entry.id, entry.data);
  });

  const courseIds = new Set<string>();
  Array.from(enrollmentById.values()).forEach((enrollment) => {
    const courseId = toCleanText(enrollment.courseId) || toCleanText((enrollment || {}).course_id);
    if (courseId) courseIds.add(courseId);
  });
  Array.from(sessionMap.values()).forEach((session) => {
    const courseId = toCleanText(session.courseId) || toCleanText((session || {}).course_id);
    if (courseId) courseIds.add(courseId);
  });
  const courseDocs = await Promise.all(Array.from(courseIds).map((courseId) => fetchDocById(db.collection('courses'), courseId)));
  courseDocs.forEach((entry) => {
    if (entry) courseById.set(entry.id, entry.data);
  });

  if (query.includeAuditLogs) {
    const enrollmentIdList = Array.from(enrollmentIds);
    const teacherReassignmentSnaps = await Promise.all(
      enrollmentIdList.map((enrollmentId) =>
        db.collection('enrollments').doc(enrollmentId).collection('teacherReassignments').get(),
      ),
    );
    teacherReassignmentSnaps.forEach((snap, index) => {
      const enrollmentId = enrollmentIdList[index];
      snap.docs.forEach((docSnap) => {
        const data = (docSnap.data() || {}) as FirestoreRow;
        auditLogRows.push(
          buildAuditLogMatch({
            id: docSnap.id,
            sourceCollection: `enrollments/${enrollmentId}/teacherReassignments`,
            row: data,
            matchedBy: ['enrollmentId'],
          }),
        );
        collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
        const previousTeacherUid =
          toCleanText(data.previousTeacherId) ||
          toCleanText(data.oldTeacherId) ||
          toCleanText(data.fromTeacherId);
        const newTeacherUid =
          toCleanText(data.newTeacherId) ||
          toCleanText(data.toTeacherId) ||
          toCleanText(data.teacherId);
        if (previousTeacherUid) teacherUids.add(previousTeacherUid);
        if (newTeacherUid) teacherUids.add(newTeacherUid);
      });
    });

    const sessionIds = Array.from(sessionMap.keys());
    const rootAuditSnaps = await Promise.all(
      chunk(sessionIds, QUERY_CHUNK_SIZE).map((ids) => db.collection('auditLogs').where('sessionId', 'in', ids).get()),
    );
    rootAuditSnaps.forEach((snap) => {
      snap.docs.forEach((docSnap) => {
        const data = (docSnap.data() || {}) as FirestoreRow;
        auditLogRows.push(
          buildAuditLogMatch({
            id: docSnap.id,
            sourceCollection: 'auditLogs',
            row: data,
            matchedBy: ['sessionId'],
          }),
        );
        collectTeacherSignalsFromRow(data, teacherUids, teacherEmails, teacherNames);
      });
    });
  }

  const { teacherProfilesByUid, teacherUidByEmail, teacherUidByName } = await fetchTeacherProfiles(
    db,
    Array.from(teacherUids),
    Array.from(teacherEmails),
    Array.from(teacherNames),
  );

  const result = buildTraceStudentTransferHistoryResult({
    query,
    sessionDocs: Array.from(sessionMap.entries()).map(([id, data]) => ({ id, data })),
    enrollmentById,
    kidById,
    childById,
    courseById,
    teacherProfilesByUid,
    teacherUidByEmail,
    teacherUidByName,
    auditLogRows,
    preferredEnrollmentId: query.enrollmentId,
    preferredKidId: query.kidId,
  });

  logger.info('traceStudentTransferHistory', {
    query,
    enrollmentCandidates: enrollmentById.size,
    kidCandidates: kidById.size + childById.size,
    sessionsReturned: result.sessionTimeline.length,
    auditLogMatches: result.auditLogMatches.length,
    repairCandidates: result.repairCandidates.length,
    transferEvents: result.transferEvents.length,
  });

  return result;
});
