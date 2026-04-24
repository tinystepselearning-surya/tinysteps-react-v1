import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import {
  buildMessageThreadSyncPayload,
  upsertMessageThread,
} from './createOrSyncMessageThread';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const ENROLLMENT_ACTIVE_LIKE = [
  'active',
  'trial',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
] as const;
const STUDENT_ACTIVE_LIKE = ['active', 'trial'] as const;
const MAX_ERROR_ITEMS = 20;
const PROCESS_BATCH_SIZE = 10;

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

function collectKidIdsFromDoc(data: Record<string, unknown>): string[] {
  const kidId = asOptionalString(data.kidId);
  const studentId = asOptionalString(data.studentId);
  const kidIds = asStringList(data.kidIds);
  const output = new Set<string>();
  if (kidId) output.add(kidId);
  if (studentId) output.add(studentId);
  kidIds.forEach((value) => output.add(value));
  return Array.from(output);
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function collectActiveKidIds(db: admin.firestore.Firestore): Promise<Set<string>> {
  const kidIds = new Set<string>();

  const [enrollmentsSnap, activeKidsSnap, activeStudentsSnap] = await Promise.all([
    db
      .collection('enrollments')
      .where('status', 'in', [...ENROLLMENT_ACTIVE_LIKE])
      .select('kidId', 'studentId', 'kidIds')
      .get(),
    db
      .collection('kids')
      .where('status', 'in', [...STUDENT_ACTIVE_LIKE])
      .select('kidId', 'studentId', 'kidIds')
      .get(),
    db
      .collection('students')
      .where('status', 'in', [...STUDENT_ACTIVE_LIKE])
      .select('kidId', 'studentId', 'kidIds')
      .get(),
  ]);

  [enrollmentsSnap, activeKidsSnap, activeStudentsSnap].forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      const kidIdsFromDoc = collectKidIdsFromDoc(data);
      if (kidIdsFromDoc.length === 0) {
        // Fallback: kids/{kidId} and students/{kidId} documents use doc id as kid id.
        kidIds.add(docSnap.id);
        return;
      }
      kidIdsFromDoc.forEach((kidId) => kidIds.add(kidId));
    });
  });

  return kidIds;
}

export const syncMessageThreadsForActiveStudents = onCall(
  { region: REGION, timeoutSeconds: 540, memory: '512MiB' },
  async (request) => {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const activeKidIds = Array.from(await collectActiveKidIds(db));

    let synced = 0;
    let skipped = 0;
    const errorSummaries: string[] = [];

    for (const group of chunk(activeKidIds, PROCESS_BATCH_SIZE)) {
      await Promise.all(
        group.map(async (kidId) => {
          try {
            const payload = await buildMessageThreadSyncPayload(db, kidId);
            await upsertMessageThread(db, payload);
            synced += 1;
          } catch (error) {
            const maybeHttpsError = error as HttpsError;
            if (maybeHttpsError.code === 'not-found') {
              skipped += 1;
              return;
            }

            skipped += 1;
            if (errorSummaries.length < MAX_ERROR_ITEMS) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Unexpected thread sync error';
              errorSummaries.push(`${kidId}: ${errorMessage}`);
            }
          }
        }),
      );
    }

    return {
      scanned: activeKidIds.length,
      synced,
      skipped,
      errors: errorSummaries,
    };
  },
);
