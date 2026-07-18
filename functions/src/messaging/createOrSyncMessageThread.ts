import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const MAX_ID_LENGTH = 200;
const ACTIVE_ENROLLMENT_STATUSES = new Set([
  'active',
  'trial',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
]);

type AuthLike = {
  uid: string;
  token?: Record<string, unknown>;
};

interface CreateOrSyncMessageThreadInput {
  kidId?: unknown;
}

interface KidLikeDoc {
  fullName?: unknown;
  name?: unknown;
  displayName?: unknown;
  studentName?: unknown;
  childName?: unknown;
  firstName?: unknown;
  parentIds?: unknown;
  parentId?: unknown;
  primaryParentId?: unknown;
  teacherId?: unknown;
  teacherIds?: unknown;
  assignedLPs?: unknown;
  lpId?: unknown;
}

interface EnrollmentLikeDoc {
  status?: unknown;
  kidId?: unknown;
  studentId?: unknown;
  kidIds?: unknown;
  parentIds?: unknown;
  parentId?: unknown;
  primaryParentId?: unknown;
  teacherId?: unknown;
  teacherIds?: unknown;
  assignedLPs?: unknown;
  lpId?: unknown;
}

interface UserLikeDoc {
  displayName?: unknown;
  fullName?: unknown;
  name?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  role?: unknown;
}

export interface ParticipantMetadata {
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  parentNames: string[];
  teacherNames: string[];
  learningPartnerNames: string[];
}

export interface MessageThreadSyncPayload {
  threadId: string;
  kidId: string;
  kidName: string;
  parentIds: string[];
  teacherId: string | null;
  teacherIds: string[];
  learningPartnerIds: string[];
  participantIds: string[];
  participantMetadata: ParticipantMetadata;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  value.forEach((item) => {
    const normalized = asOptionalString(item);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });
  return out;
}

function mergeUnique(...lists: string[][]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  lists.forEach((list) => {
    list.forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      out.push(value);
    });
  });
  return out;
}

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, string> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
    const normalizedKey = asOptionalString(key);
    const normalizedValue = asOptionalString(raw);
    if (!normalizedKey || !normalizedValue) return;
    out[normalizedKey] = normalizedValue;
  });
  return out;
}

function toEmailPrefix(value: unknown): string | null {
  const email = asOptionalString(value);
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return null;
  return email.slice(0, atIndex).trim() || null;
}

function normalizeUserRole(value: unknown): string {
  const role = String(value || '').trim().toLowerCase();
  if (!role) return 'unknown';
  if (role === 'learning-partner' || role === 'learningpartner') return 'learningPartner';
  if (role === 'parent' || role === 'teacher' || role === 'admin' || role === 'kid') return role;
  return role;
}

function resolveUserDisplayName(data: UserLikeDoc): string {
  const fromDisplayName = asOptionalString(data.displayName);
  if (fromDisplayName) return fromDisplayName;

  const fromFullName = asOptionalString(data.fullName);
  if (fromFullName) return fromFullName;

  const fromName = asOptionalString(data.name);
  if (fromName) return fromName;

  const firstName = asOptionalString(data.firstName);
  const lastName = asOptionalString(data.lastName);
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;

  const fromEmailPrefix = toEmailPrefix(data.email);
  if (fromEmailPrefix) return fromEmailPrefix;

  return 'Team Member';
}

function isTokenAdmin(token: Record<string, unknown> | undefined): boolean {
  if (!token) return false;
  if (token.admin === true) return true;
  return String(token.role || '').trim().toLowerCase() === 'admin';
}

async function isAdminUser(
  db: admin.firestore.Firestore,
  auth: AuthLike,
): Promise<boolean> {
  if (isTokenAdmin(auth.token)) return true;

  const userSnap = await db.collection('users').doc(auth.uid).get();
  if (!userSnap.exists) return false;
  const user = userSnap.data() || {};
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (user.superUser === true) return true;
  return false;
}

function resolveKidName(kidData: KidLikeDoc): string {
  return (
    asOptionalString(kidData.fullName) ||
    asOptionalString(kidData.name) ||
    asOptionalString(kidData.displayName) ||
    asOptionalString(kidData.childName) ||
    asOptionalString(kidData.studentName) ||
    asOptionalString(kidData.firstName) ||
    'Student'
  );
}

function resolveParticipantFields(kidData: KidLikeDoc) {
  const parentIds = mergeUnique(
    asStringList(kidData.parentIds),
    [asOptionalString(kidData.primaryParentId)].filter(Boolean) as string[],
    [asOptionalString(kidData.parentId)].filter(Boolean) as string[],
  );

  const teacherIds = mergeUnique(
    asStringList(kidData.teacherIds),
    [asOptionalString(kidData.teacherId)].filter(Boolean) as string[],
  );

  const learningPartnerIds = mergeUnique(
    asStringList(kidData.assignedLPs),
    [asOptionalString(kidData.lpId)].filter(Boolean) as string[],
  );

  const participantIds = mergeUnique(parentIds, teacherIds, learningPartnerIds);

  return {
    parentIds,
    teacherIds,
    teacherId: teacherIds[0] || null,
    learningPartnerIds,
    participantIds,
  };
}

function normalizeEnrollmentStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveEnrollment(enrollment: EnrollmentLikeDoc): boolean {
  const status = normalizeEnrollmentStatus(enrollment.status);
  if (!status) return true;
  return ACTIVE_ENROLLMENT_STATUSES.has(status);
}

function resolveKidIdsFromEnrollment(enrollment: EnrollmentLikeDoc): string[] {
  return mergeUnique(
    [asOptionalString(enrollment.kidId)].filter(Boolean) as string[],
    [asOptionalString(enrollment.studentId)].filter(Boolean) as string[],
    asStringList(enrollment.kidIds),
  );
}

async function loadEnrollmentParticipantFields(
  db: admin.firestore.Firestore,
  kidId: string,
) {
  const [byKidIdSnap, byStudentIdSnap, byKidIdsSnap] = await Promise.all([
    db
      .collection('enrollments')
      .where('kidId', '==', kidId)
      .select(
        'status',
        'kidId',
        'studentId',
        'kidIds',
        'parentId',
        'parentIds',
        'primaryParentId',
        'teacherId',
        'teacherIds',
        'assignedLPs',
        'lpId',
      )
      .get(),
    db
      .collection('enrollments')
      .where('studentId', '==', kidId)
      .select(
        'status',
        'kidId',
        'studentId',
        'kidIds',
        'parentId',
        'parentIds',
        'primaryParentId',
        'teacherId',
        'teacherIds',
        'assignedLPs',
        'lpId',
      )
      .get(),
    db
      .collection('enrollments')
      .where('kidIds', 'array-contains', kidId)
      .select(
        'status',
        'kidId',
        'studentId',
        'kidIds',
        'parentId',
        'parentIds',
        'primaryParentId',
        'teacherId',
        'teacherIds',
        'assignedLPs',
        'lpId',
      )
      .get(),
  ]);

  const parentIds: string[] = [];
  const teacherIds: string[] = [];
  const learningPartnerIds: string[] = [];
  const seenEnrollmentIds = new Set<string>();

  [byKidIdSnap, byStudentIdSnap, byKidIdsSnap].forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      if (seenEnrollmentIds.has(docSnap.id)) return;
      seenEnrollmentIds.add(docSnap.id);

      const enrollment = (docSnap.data() || {}) as EnrollmentLikeDoc;
      if (!isActiveEnrollment(enrollment)) return;

      const enrollmentKidIds = resolveKidIdsFromEnrollment(enrollment);
      if (enrollmentKidIds.length > 0 && !enrollmentKidIds.includes(kidId)) {
        return;
      }

      parentIds.push(
        ...mergeUnique(
          asStringList(enrollment.parentIds),
          [asOptionalString(enrollment.primaryParentId)].filter(Boolean) as string[],
          [asOptionalString(enrollment.parentId)].filter(Boolean) as string[],
        ),
      );
      teacherIds.push(
        ...mergeUnique(
          asStringList(enrollment.teacherIds),
          [asOptionalString(enrollment.teacherId)].filter(Boolean) as string[],
        ),
      );
      learningPartnerIds.push(
        ...mergeUnique(
          asStringList(enrollment.assignedLPs),
          [asOptionalString(enrollment.lpId)].filter(Boolean) as string[],
        ),
      );
    });
  });

  return {
    parentIds: mergeUnique(parentIds),
    teacherIds: mergeUnique(teacherIds),
    learningPartnerIds: mergeUnique(learningPartnerIds),
  };
}

async function loadMergedKidData(
  db: admin.firestore.Firestore,
  kidId: string,
): Promise<KidLikeDoc> {
  const [kidSnap, studentSnap] = await Promise.all([
    db.collection('kids').doc(kidId).get(),
    db.collection('students').doc(kidId).get(),
  ]);

  if (!kidSnap.exists && !studentSnap.exists) {
    throw new HttpsError('not-found', 'Student not found');
  }

  return {
    ...((studentSnap.data() || {}) as KidLikeDoc),
    ...((kidSnap.data() || {}) as KidLikeDoc),
  };
}

async function resolveParticipantMetadata(
  db: admin.firestore.Firestore,
  parentIds: string[],
  teacherIds: string[],
  learningPartnerIds: string[],
  participantIds: string[],
): Promise<ParticipantMetadata> {
  if (participantIds.length === 0) {
    return {
      participantNames: {},
      participantRoles: {},
      parentNames: [],
      teacherNames: [],
      learningPartnerNames: [],
    };
  }

  const refs = participantIds.map((uid) => db.collection('users').doc(uid));
  const snaps = await db.getAll(...refs);

  const participantNames: Record<string, string> = {};
  const participantRoles: Record<string, string> = {};
  const namesByUid: Record<string, string> = {};

  snaps.forEach((snap) => {
    if (!snap.exists) return;
    const data = (snap.data() || {}) as UserLikeDoc;
    const displayName = resolveUserDisplayName(data);
    const role = normalizeUserRole(data.role);
    namesByUid[snap.id] = displayName;
    participantNames[snap.id] = displayName;
    participantRoles[snap.id] = role;
  });

  parentIds.forEach((uid) => {
    if (!participantRoles[uid]) participantRoles[uid] = 'parent';
    if (!participantNames[uid]) participantNames[uid] = namesByUid[uid] || 'Parent';
  });
  teacherIds.forEach((uid) => {
    if (!participantRoles[uid]) participantRoles[uid] = 'teacher';
    if (!participantNames[uid]) participantNames[uid] = namesByUid[uid] || 'Teacher';
  });
  learningPartnerIds.forEach((uid) => {
    if (!participantRoles[uid]) participantRoles[uid] = 'learningPartner';
    if (!participantNames[uid]) participantNames[uid] = namesByUid[uid] || 'Learning Partner';
  });

  const parentNames = mergeUnique(
    parentIds.map((uid) => participantNames[uid] || namesByUid[uid] || 'Parent'),
  );
  const teacherNames = mergeUnique(
    teacherIds.map((uid) => participantNames[uid] || namesByUid[uid] || 'Teacher'),
  );
  const learningPartnerNames = mergeUnique(
    learningPartnerIds.map(
      (uid) => participantNames[uid] || namesByUid[uid] || 'Learning Partner',
    ),
  );

  return {
    participantNames,
    participantRoles,
    parentNames,
    teacherNames,
    learningPartnerNames,
  };
}

export async function buildMessageThreadSyncPayload(
  db: admin.firestore.Firestore,
  kidId: string,
): Promise<MessageThreadSyncPayload> {
  const [mergedKidData, enrollmentParticipants] = await Promise.all([
    loadMergedKidData(db, kidId),
    loadEnrollmentParticipantFields(db, kidId),
  ]);

  const mergedWithEnrollment: KidLikeDoc = {
    ...mergedKidData,
    parentIds: mergeUnique(
      asStringList(mergedKidData.parentIds),
      [asOptionalString(mergedKidData.primaryParentId)].filter(Boolean) as string[],
      [asOptionalString(mergedKidData.parentId)].filter(Boolean) as string[],
      enrollmentParticipants.parentIds,
    ),
    parentId:
      asOptionalString(mergedKidData.parentId) ||
      asOptionalString(mergedKidData.primaryParentId) ||
      enrollmentParticipants.parentIds[0] ||
      null,
    teacherIds: mergeUnique(
      asStringList(mergedKidData.teacherIds),
      [asOptionalString(mergedKidData.teacherId)].filter(Boolean) as string[],
      enrollmentParticipants.teacherIds,
    ),
    teacherId:
      asOptionalString(mergedKidData.teacherId) ||
      enrollmentParticipants.teacherIds[0] ||
      null,
    assignedLPs: mergeUnique(
      asStringList(mergedKidData.assignedLPs),
      [asOptionalString(mergedKidData.lpId)].filter(Boolean) as string[],
      enrollmentParticipants.learningPartnerIds,
    ),
    lpId:
      asOptionalString(mergedKidData.lpId) ||
      enrollmentParticipants.learningPartnerIds[0] ||
      null,
  };

  const kidName = resolveKidName(mergedWithEnrollment);
  const {
    parentIds,
    teacherIds,
    teacherId,
    learningPartnerIds,
    participantIds,
  } = resolveParticipantFields(mergedWithEnrollment);
  const participantMetadata = await resolveParticipantMetadata(
    db,
    parentIds,
    teacherIds,
    learningPartnerIds,
    participantIds,
  );

  return {
    threadId: `student_${kidId}`.slice(0, MAX_ID_LENGTH),
    kidId,
    kidName,
    parentIds,
    teacherId,
    teacherIds,
    learningPartnerIds,
    participantIds,
    participantMetadata,
  };
}

export async function upsertMessageThread(
  db: admin.firestore.Firestore,
  payload: MessageThreadSyncPayload,
): Promise<void> {
  const threadRef = db.collection('messageThreads').doc(payload.threadId);
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(threadRef);
    const existingData = (existing.data() || {}) as Record<string, unknown>;
    const createdAt = existingData.createdAt || now;
    const existingParticipantNames = asStringMap(existingData.participantNames);
    const existingParticipantRoles = asStringMap(existingData.participantRoles);
    const existingParentNames = asStringList(existingData.parentNames);
    const existingTeacherNames = asStringList(existingData.teacherNames);
    const existingLearningPartnerNames = asStringList(
      existingData.learningPartnerNames,
    );

    tx.set(
      threadRef,
      {
        threadType: 'student',
        kidId: payload.kidId,
        kidName: payload.kidName,
        parentIds: payload.parentIds,
        teacherId: payload.teacherId,
        teacherIds: payload.teacherIds,
        learningPartnerIds: payload.learningPartnerIds,
        participantIds: payload.participantIds,
        participantNames: {
          ...existingParticipantNames,
          ...payload.participantMetadata.participantNames,
        },
        participantRoles: {
          ...existingParticipantRoles,
          ...payload.participantMetadata.participantRoles,
        },
        parentNames:
          payload.participantMetadata.parentNames.length > 0
            ? payload.participantMetadata.parentNames
            : existingParentNames,
        teacherNames:
          payload.participantMetadata.teacherNames.length > 0
            ? payload.participantMetadata.teacherNames
            : existingTeacherNames,
        learningPartnerNames:
          payload.participantMetadata.learningPartnerNames.length > 0
            ? payload.participantMetadata.learningPartnerNames
            : existingLearningPartnerNames,
        adminVisible: true,
        status: 'active',
        createdAt,
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

export const createOrSyncMessageThread = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const auth = request.auth as AuthLike;
    const input = (request.data || {}) as CreateOrSyncMessageThreadInput;
    const kidId = asOptionalString(input.kidId);
    if (!kidId) {
      throw new HttpsError('invalid-argument', 'kidId is required');
    }

    const db = admin.firestore();
    const payload = await buildMessageThreadSyncPayload(db, kidId);

    const adminAllowed = await isAdminUser(db, auth);
    if (!adminAllowed && !payload.participantIds.includes(auth.uid)) {
      throw new HttpsError(
        'permission-denied',
        'You are not allowed to create or access this message thread.',
      );
    }

    await upsertMessageThread(db, payload);

    return { threadId: payload.threadId };
  },
);
