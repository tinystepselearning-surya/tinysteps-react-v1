import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  buildMessageThreadSyncPayload,
  upsertMessageThread,
} from './createOrSyncMessageThread';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';

type LooseDoc = Record<string, unknown>;

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  value.forEach((item) => {
    const normalized = asOptionalString(item);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });

  return out;
}

function sortedList(value: unknown): string[] {
  return [...asStringList(value)].sort((a, b) => a.localeCompare(b));
}

function mergeUnique(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  lists.forEach((list) => {
    list.forEach((value) => {
      if (seen.has(value)) return;
      seen.add(value);
      out.push(value);
    });
  });

  return out;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeEnrollmentComparable(data: LooseDoc | null): Record<string, unknown> | null {
  if (!data) return null;

  return {
    kidId: asOptionalString(data.kidId) || '',
    studentId: asOptionalString(data.studentId) || '',
    kidIds: sortedList(data.kidIds),
    parentId: asOptionalString(data.parentId) || '',
    parentIds: sortedList(data.parentIds),
    primaryParentId: asOptionalString(data.primaryParentId) || '',
    teacherId: asOptionalString(data.teacherId) || '',
    teacherIds: sortedList(data.teacherIds),
    lpId: asOptionalString(data.lpId) || '',
    assignedLPs: sortedList(data.assignedLPs),
    status: asOptionalString(data.status) || '',
  };
}

function normalizeKidComparable(data: LooseDoc | null): Record<string, unknown> | null {
  if (!data) return null;

  return {
    fullName: asOptionalString(data.fullName) || '',
    name: asOptionalString(data.name) || '',
    displayName: asOptionalString(data.displayName) || '',
    studentName: asOptionalString(data.studentName) || '',
    childName: asOptionalString(data.childName) || '',
    firstName: asOptionalString(data.firstName) || '',
    parentId: asOptionalString(data.parentId) || '',
    parentIds: sortedList(data.parentIds),
    primaryParentId: asOptionalString(data.primaryParentId) || '',
    teacherId: asOptionalString(data.teacherId) || '',
    teacherIds: sortedList(data.teacherIds),
    lpId: asOptionalString(data.lpId) || '',
    assignedLPs: sortedList(data.assignedLPs),
    status: asOptionalString(data.status) || '',
  };
}

function hasComparableChanged(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): boolean {
  if (!before && !after) return false;
  if (!before || !after) return true;
  return stableStringify(before) !== stableStringify(after);
}

function collectKidIdsFromEnrollment(data: LooseDoc | null): string[] {
  if (!data) return [];

  return mergeUnique(
    [asOptionalString(data.kidId)].filter(Boolean) as string[],
    [asOptionalString(data.studentId)].filter(Boolean) as string[],
    asStringList(data.kidIds),
  );
}

async function syncKidThread(
  db: admin.firestore.Firestore,
  kidId: string,
  reason: string,
  context: Record<string, unknown>,
): Promise<boolean> {
  try {
    const payload = await buildMessageThreadSyncPayload(db, kidId);
    await upsertMessageThread(db, payload);

    logger.info('autoSyncMessageThreads:thread_synced', {
      kidId,
      threadId: payload.threadId,
      reason,
      ...context,
    });
    return true;
  } catch (error) {
    const errorCode = typeof (error as { code?: unknown })?.code === 'string'
      ? String((error as { code?: string }).code)
      : '';

    if (errorCode === 'not-found') {
      logger.debug('autoSyncMessageThreads:kid_not_found', {
        kidId,
        reason,
        ...context,
      });
      return false;
    }

    logger.error('autoSyncMessageThreads:sync_failed', {
      kidId,
      reason,
      message: error instanceof Error ? error.message : String(error),
      ...context,
    });
    return false;
  }
}

async function syncKidThreads(
  kidIds: string[],
  reason: string,
  context: Record<string, unknown>,
): Promise<void> {
  const uniqueKidIds = mergeUnique(kidIds).filter(Boolean);
  if (uniqueKidIds.length === 0) return;

  const db = admin.firestore();
  for (const kidId of uniqueKidIds) {
    await syncKidThread(db, kidId, reason, context);
  }
}

export const onEnrollmentMessageThreadAutoSync = onDocumentWritten(
  {
    document: 'enrollments/{enrollmentId}',
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before.exists
      ? (event.data.before.data() as LooseDoc)
      : null;
    const afterData = event.data?.after.exists
      ? (event.data.after.data() as LooseDoc)
      : null;

    const beforeComparable = normalizeEnrollmentComparable(beforeData);
    const afterComparable = normalizeEnrollmentComparable(afterData);
    if (!hasComparableChanged(beforeComparable, afterComparable)) {
      return;
    }

    const kidIds = mergeUnique(
      collectKidIdsFromEnrollment(beforeData),
      collectKidIdsFromEnrollment(afterData),
    );

    await syncKidThreads(kidIds, 'enrollment_write', {
      enrollmentId: event.params.enrollmentId,
    });
  },
);

export const onKidMessageThreadAutoSync = onDocumentWritten(
  {
    document: 'kids/{kidId}',
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before.exists
      ? (event.data.before.data() as LooseDoc)
      : null;
    const afterData = event.data?.after.exists
      ? (event.data.after.data() as LooseDoc)
      : null;

    const beforeComparable = normalizeKidComparable(beforeData);
    const afterComparable = normalizeKidComparable(afterData);
    if (!hasComparableChanged(beforeComparable, afterComparable)) {
      return;
    }

    const kidIds = mergeUnique(
      [asOptionalString(event.params.kidId)].filter(Boolean) as string[],
      collectKidIdsFromEnrollment(beforeData),
      collectKidIdsFromEnrollment(afterData),
    );

    await syncKidThreads(kidIds, 'kid_write', {
      kidId: event.params.kidId,
    });
  },
);

export const onStudentMessageThreadAutoSync = onDocumentWritten(
  {
    document: 'students/{kidId}',
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before.exists
      ? (event.data.before.data() as LooseDoc)
      : null;
    const afterData = event.data?.after.exists
      ? (event.data.after.data() as LooseDoc)
      : null;

    const beforeComparable = normalizeKidComparable(beforeData);
    const afterComparable = normalizeKidComparable(afterData);
    if (!hasComparableChanged(beforeComparable, afterComparable)) {
      return;
    }

    const kidIds = mergeUnique(
      [asOptionalString(event.params.kidId)].filter(Boolean) as string[],
      collectKidIdsFromEnrollment(beforeData),
      collectKidIdsFromEnrollment(afterData),
    );

    await syncKidThreads(kidIds, 'student_write', {
      kidId: event.params.kidId,
    });
  },
);
