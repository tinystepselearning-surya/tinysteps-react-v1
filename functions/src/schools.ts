import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import { ensureAdmin } from './helpers/adminGuard';
import { normalizeRole } from './helpers/roles';
import {
  addSchoolAccess,
  normalizeSchoolStatus,
  removeSchoolAccess,
} from './helpers/schools';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FirestoreData = admin.firestore.DocumentData;

function requireString(
  value: unknown,
  field: string,
  maxLength = 160,
): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }

  if (normalized.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be ${maxLength} characters or fewer`,
    );
  }

  return normalized;
}

function optionalString(
  value: unknown,
  maxLength = 160,
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Expected a string value');
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new HttpsError(
      'invalid-argument',
      `Value must be ${maxLength} characters or fewer`,
    );
  }

  return normalized;
}

function optionalEmail(value: unknown): string | null {
  const email = optionalString(value, 200);
  if (!email) return null;

  const normalized = email.toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    throw new HttpsError('invalid-argument', 'Invalid email address');
  }

  return normalized;
}

function optionalUid(value: unknown): string | null {
  return optionalString(value, 128);
}

function requireSchoolId(value: unknown): string {
  return requireString(value, 'schoolId', 128);
}

function normalizeInitialSchoolAdminIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new HttpsError(
      'invalid-argument',
      'schoolAdminUserIds must be an array',
    );
  }

  const values = Array.from(
    new Set(
      value.map((item) =>
        requireString(item, 'schoolAdminUserId', 128),
      ),
    ),
  );

  if (values.length > 10) {
    throw new HttpsError(
      'invalid-argument',
      'A maximum of 10 School Admin users may be linked during creation',
    );
  }

  return values;
}

function assertActiveUserRole(
  snap: admin.firestore.DocumentSnapshot,
  expectedRole: 'learningPartner' | 'schoolAdmin',
  label: string,
): FirestoreData {
  if (!snap.exists) {
    throw new HttpsError('not-found', `${label} user was not found`);
  }

  const data = snap.data() || {};
  if (normalizeRole(data.role) !== expectedRole) {
    throw new HttpsError(
      'failed-precondition',
      `${label} must have role ${expectedRole}`,
    );
  }

  const status =
    typeof data.status === 'string'
      ? data.status.trim().toLowerCase()
      : 'active';

  if (status !== 'active') {
    throw new HttpsError('failed-precondition', `${label} must be active`);
  }

  return data;
}

function displayNameFromUser(data: FirestoreData): string {
  return String(
    data.displayName || data.name || data.email || 'User',
  ).trim();
}

function emailFromUser(data: FirestoreData): string | null {
  return typeof data.email === 'string'
    ? data.email.trim().toLowerCase() || null
    : null;
}

interface CreateSchoolRequest {
  name?: unknown;
  status?: unknown;
  contactName?: unknown;
  contactDesignation?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  learningPartnerId?: unknown;
  schoolAdminUserIds?: unknown;
}

export const adminCreateSchool = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as CreateSchoolRequest;
    const name = requireString(payload.name, 'School name', 160);
    const status = normalizeSchoolStatus(payload.status ?? 'active');
    if (!status) {
      throw new HttpsError('invalid-argument', 'Invalid school status');
    }

    const contactName = requireString(
      payload.contactName,
      'Contact person name',
      120,
    );
    const contactDesignation = optionalString(payload.contactDesignation, 120);
    const contactEmail = optionalEmail(payload.contactEmail);
    const contactPhone = optionalString(payload.contactPhone, 40);
    const city = optionalString(payload.city, 100);
    const state = optionalString(payload.state, 100);
    const country = optionalString(payload.country, 100) || 'India';
    const learningPartnerId = optionalUid(payload.learningPartnerId);
    const schoolAdminUserIds = normalizeInitialSchoolAdminIds(
      payload.schoolAdminUserIds,
    );

    const db = admin.firestore();
    const schoolRef = db.collection('schools').doc();
    const schoolId = schoolRef.id;
    const schoolCode = `TS-${schoolId.slice(0, 10).toUpperCase()}`;

    await db.runTransaction(async (tx) => {
      let learningPartnerData: FirestoreData | null = null;

      if (learningPartnerId) {
        const lpSnap = await tx.get(
          db.collection('users').doc(learningPartnerId),
        );
        learningPartnerData = assertActiveUserRole(
          lpSnap,
          'learningPartner',
          'Learning Partner',
        );
      }

      const schoolAdminUsers: Array<{
        userId: string;
        accessSnap: admin.firestore.DocumentSnapshot;
      }> = [];

      for (const userId of schoolAdminUserIds) {
        const userSnap = await tx.get(db.collection('users').doc(userId));
        assertActiveUserRole(userSnap, 'schoolAdmin', 'School Admin');
        const accessSnap = await tx.get(
          db.collection('schoolUsers').doc(userId),
        );
        schoolAdminUsers.push({ userId, accessSnap });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const lpName = learningPartnerData
        ? displayNameFromUser(learningPartnerData)
        : null;
      const lpEmail = learningPartnerData
        ? emailFromUser(learningPartnerData)
        : null;

      tx.set(schoolRef, {
        schemaVersion: 1,
        schoolCode,
        name,
        nameSearch: name.toLowerCase(),
        status,
        contact: {
          name: contactName,
          designation: contactDesignation,
          email: contactEmail,
          phone: contactPhone,
        },
        location: { city, state, country },
        learningPartnerId: learningPartnerId || null,
        learningPartnerName: lpName,
        learningPartnerEmail: lpEmail,
        learningPartnerAssignedAt: learningPartnerId ? now : null,
        createdAt: now,
        createdBy: request.auth!.uid,
        updatedAt: now,
        updatedBy: request.auth!.uid,
      });

      for (const entry of schoolAdminUsers) {
        const existing = entry.accessSnap.exists
          ? entry.accessSnap.data() || {}
          : {};
        const next = addSchoolAccess(
          existing.schoolIds,
          existing.primarySchoolId,
          schoolId,
          false,
        );

        tx.set(
          db.collection('schoolUsers').doc(entry.userId),
          {
            schemaVersion: 1,
            userId: entry.userId,
            role: 'schoolAdmin',
            schoolIds: next.schoolIds,
            primarySchoolId: next.primarySchoolId,
            status: 'active',
            createdAt: existing.createdAt || now,
            createdBy: existing.createdBy || request.auth!.uid,
            updatedAt: now,
            updatedBy: request.auth!.uid,
          },
          { merge: true },
        );
      }

      if (learningPartnerId) {
        tx.set(schoolRef.collection('learningPartnerAssignments').doc(), {
          schemaVersion: 1,
          schoolId,
          changeType: 'assigned',
          previousLearningPartnerId: null,
          previousLearningPartnerName: null,
          newLearningPartnerId: learningPartnerId,
          newLearningPartnerName: lpName,
          changedAt: now,
          changedBy: request.auth!.uid,
        });
      }
    });

    logger.info('School created', {
      schoolId,
      schoolCode,
      createdBy: request.auth?.uid,
    });

    return { ok: true, schoolId, schoolCode };
  },
);

interface UpdateSchoolRequest {
  schoolId?: unknown;
  name?: unknown;
  status?: unknown;
  contactName?: unknown;
  contactDesignation?: unknown;
  contactEmail?: unknown;
  contactPhone?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
}

export const adminUpdateSchool = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as UpdateSchoolRequest;
    const schoolId = requireSchoolId(payload.schoolId);
    const name = requireString(payload.name, 'School name', 160);
    const status = normalizeSchoolStatus(payload.status);
    if (!status) {
      throw new HttpsError('invalid-argument', 'Invalid school status');
    }

    const contactName = requireString(
      payload.contactName,
      'Contact person name',
      120,
    );
    const contactDesignation = optionalString(payload.contactDesignation, 120);
    const contactEmail = optionalEmail(payload.contactEmail);
    const contactPhone = optionalString(payload.contactPhone, 40);
    const city = optionalString(payload.city, 100);
    const state = optionalString(payload.state, 100);
    const country = optionalString(payload.country, 100) || 'India';

    const db = admin.firestore();
    const schoolRef = db.collection('schools').doc(schoolId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(schoolRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'School not found');
      }

      const before = snap.data() || {};
      const beforeStatus = normalizeSchoolStatus(before.status) || 'active';
      const now = admin.firestore.FieldValue.serverTimestamp();
      const update: Record<string, unknown> = {
        name,
        nameSearch: name.toLowerCase(),
        status,
        contact: {
          name: contactName,
          designation: contactDesignation,
          email: contactEmail,
          phone: contactPhone,
        },
        location: { city, state, country },
        updatedAt: now,
        updatedBy: request.auth!.uid,
      };

      if (beforeStatus !== 'archived' && status === 'archived') {
        update.archivedAt = now;
        update.archivedBy = request.auth!.uid;
      }

      if (beforeStatus === 'archived' && status !== 'archived') {
        update.archivedAt = admin.firestore.FieldValue.delete();
        update.archivedBy = admin.firestore.FieldValue.delete();
      }

      tx.update(schoolRef, update);
    });

    logger.info('School updated', {
      schoolId,
      updatedBy: request.auth?.uid,
      status,
    });

    return { ok: true, schoolId };
  },
);

interface AssignSchoolLpRequest {
  schoolId?: unknown;
  learningPartnerId?: unknown;
}

export const adminAssignSchoolLearningPartner = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as AssignSchoolLpRequest;
    const schoolId = requireSchoolId(payload.schoolId);
    const newLpId = optionalUid(payload.learningPartnerId);
    const db = admin.firestore();
    const schoolRef = db.collection('schools').doc(schoolId);
    const historyRef = schoolRef
      .collection('learningPartnerAssignments')
      .doc();

    const result = await db.runTransaction(async (tx) => {
      const schoolSnap = await tx.get(schoolRef);
      if (!schoolSnap.exists) {
        throw new HttpsError('not-found', 'School not found');
      }

      const school = schoolSnap.data() || {};
      if (normalizeSchoolStatus(school.status) === 'archived') {
        throw new HttpsError(
          'failed-precondition',
          'Archived schools cannot receive a Learning Partner assignment',
        );
      }

      let newLpData: FirestoreData | null = null;
      if (newLpId) {
        const lpSnap = await tx.get(db.collection('users').doc(newLpId));
        newLpData = assertActiveUserRole(
          lpSnap,
          'learningPartner',
          'Learning Partner',
        );
      }

      const previousId =
        typeof school.learningPartnerId === 'string'
          ? school.learningPartnerId.trim() || null
          : null;
      const previousName =
        typeof school.learningPartnerName === 'string'
          ? school.learningPartnerName
          : null;
      const newName = newLpData ? displayNameFromUser(newLpData) : null;
      const newEmail = newLpData ? emailFromUser(newLpData) : null;

      if (previousId === newLpId) {
        if (newLpId) {
          tx.update(schoolRef, {
            learningPartnerName: newName,
            learningPartnerEmail: newEmail,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: request.auth!.uid,
          });
        }
        return { changed: false };
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.update(schoolRef, {
        learningPartnerId: newLpId,
        learningPartnerName: newName,
        learningPartnerEmail: newEmail,
        learningPartnerAssignedAt: newLpId ? now : null,
        updatedAt: now,
        updatedBy: request.auth!.uid,
      });

      const changeType =
        previousId && newLpId
          ? 'reassigned'
          : previousId && !newLpId
            ? 'unassigned'
            : 'assigned';

      tx.set(historyRef, {
        schemaVersion: 1,
        schoolId,
        changeType,
        previousLearningPartnerId: previousId,
        previousLearningPartnerName: previousName,
        newLearningPartnerId: newLpId,
        newLearningPartnerName: newName,
        changedAt: now,
        changedBy: request.auth!.uid,
      });

      return { changed: true, changeType };
    });

    return { ok: true, schoolId, ...result };
  },
);

interface LinkSchoolUserRequest {
  schoolId?: unknown;
  userId?: unknown;
  makePrimary?: unknown;
}

export const adminLinkSchoolUser = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as LinkSchoolUserRequest;
    const schoolId = requireSchoolId(payload.schoolId);
    const userId = requireString(payload.userId, 'userId', 128);
    const makePrimary = payload.makePrimary === true;
    const db = admin.firestore();
    const schoolRef = db.collection('schools').doc(schoolId);
    const userRef = db.collection('users').doc(userId);
    const accessRef = db.collection('schoolUsers').doc(userId);

    const result = await db.runTransaction(async (tx) => {
      const schoolSnap = await tx.get(schoolRef);
      const userSnap = await tx.get(userRef);
      const accessSnap = await tx.get(accessRef);

      if (!schoolSnap.exists) {
        throw new HttpsError('not-found', 'School not found');
      }

      const school = schoolSnap.data() || {};
      if (normalizeSchoolStatus(school.status) === 'archived') {
        throw new HttpsError(
          'failed-precondition',
          'Cannot link users to an archived school',
        );
      }

      assertActiveUserRole(userSnap, 'schoolAdmin', 'School Admin');
      const existing = accessSnap.exists ? accessSnap.data() || {} : {};
      const next = addSchoolAccess(
        existing.schoolIds,
        existing.primarySchoolId,
        schoolId,
        makePrimary,
      );
      const now = admin.firestore.FieldValue.serverTimestamp();

      tx.set(
        accessRef,
        {
          schemaVersion: 1,
          userId,
          role: 'schoolAdmin',
          schoolIds: next.schoolIds,
          primarySchoolId: next.primarySchoolId,
          status: 'active',
          createdAt: existing.createdAt || now,
          createdBy: existing.createdBy || request.auth!.uid,
          updatedAt: now,
          updatedBy: request.auth!.uid,
        },
        { merge: true },
      );

      return next;
    });

    return { ok: true, userId, schoolId, ...result };
  },
);

interface UnlinkSchoolUserRequest {
  schoolId?: unknown;
  userId?: unknown;
}

export const adminUnlinkSchoolUser = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const payload = (request.data || {}) as UnlinkSchoolUserRequest;
    const schoolId = requireSchoolId(payload.schoolId);
    const userId = requireString(payload.userId, 'userId', 128);
    const db = admin.firestore();
    const schoolRef = db.collection('schools').doc(schoolId);
    const accessRef = db.collection('schoolUsers').doc(userId);

    const result = await db.runTransaction(async (tx) => {
      const schoolSnap = await tx.get(schoolRef);
      const accessSnap = await tx.get(accessRef);

      if (!schoolSnap.exists) {
        throw new HttpsError('not-found', 'School not found');
      }

      if (!accessSnap.exists) {
        return {
          changed: false,
          schoolIds: [] as string[],
          primarySchoolId: null as string | null,
        };
      }

      const existing = accessSnap.data() || {};
      const beforeIds = Array.isArray(existing.schoolIds)
        ? existing.schoolIds
        : [];

      if (!beforeIds.includes(schoolId)) {
        return {
          changed: false,
          schoolIds: beforeIds,
          primarySchoolId: existing.primarySchoolId || null,
        };
      }

      const next = removeSchoolAccess(
        existing.schoolIds,
        existing.primarySchoolId,
        schoolId,
      );
      const now = admin.firestore.FieldValue.serverTimestamp();

      tx.set(
        accessRef,
        {
          schemaVersion: 1,
          userId,
          role: 'schoolAdmin',
          schoolIds: next.schoolIds,
          primarySchoolId: next.primarySchoolId,
          status: next.schoolIds.length > 0 ? 'active' : 'unassigned',
          updatedAt: now,
          updatedBy: request.auth!.uid,
        },
        { merge: true },
      );

      return { changed: true, ...next };
    });

    return { ok: true, userId, schoolId, ...result };
  },
);
