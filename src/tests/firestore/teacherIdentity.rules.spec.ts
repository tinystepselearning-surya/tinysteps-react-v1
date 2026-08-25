// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

const canonicalTeacherId = 'teacher-canonical';
const staleAliasTeacherId = 'teacher-stale-alias';
const unrelatedTeacherId = 'teacher-unrelated';
const parentId = 'parent-owner';
const adminId = 'admin-owner';

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-teacher-identity-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seedIdentityRecords() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const canonicalWithStaleAliases = {
      teacherId: canonicalTeacherId,
      teacherIds: [canonicalTeacherId, staleAliasTeacherId],
      assignedTeacherId: staleAliasTeacherId,
      primaryTeacherId: staleAliasTeacherId,
      teacherUid: staleAliasTeacherId,
      teacher_id: staleAliasTeacherId,
      parentId,
      status: 'scheduled',
    };
    const legacyWithoutCanonical = {
      assignedTeacherId: staleAliasTeacherId,
      parentId,
      status: 'scheduled',
    };

    await Promise.all([
      setDoc(doc(db, 'enrollments', 'canonical'), canonicalWithStaleAliases),
      setDoc(doc(db, 'classSessions', 'canonical'), canonicalWithStaleAliases),
      setDoc(doc(db, 'enrollments', 'legacy'), legacyWithoutCanonical),
      setDoc(doc(db, 'classSessions', 'legacy'), legacyWithoutCanonical),
    ]);
  });
}

function teacherDb(uid: string) {
  return testEnv.authenticatedContext(uid, { role: 'teacher' }).firestore();
}

suite('canonical-first teacher identity rules', () => {
  it('allows the canonical teacher to read canonical enrollments and sessions', async () => {
    await seedIdentityRecords();
    const db = teacherDb(canonicalTeacherId);

    await assertSucceeds(getDoc(doc(db, 'enrollments', 'canonical')));
    await assertSucceeds(getDoc(doc(db, 'classSessions', 'canonical')));
  });

  it('denies stale-alias and unrelated teachers when canonical teacherId exists', async () => {
    await seedIdentityRecords();
    const staleDb = teacherDb(staleAliasTeacherId);
    const unrelatedDb = teacherDb(unrelatedTeacherId);

    await assertFails(getDoc(doc(staleDb, 'enrollments', 'canonical')));
    await assertFails(getDoc(doc(staleDb, 'classSessions', 'canonical')));
    await assertFails(getDocs(query(
      collection(staleDb, 'enrollments'),
      where('assignedTeacherId', '==', staleAliasTeacherId),
    )));
    await assertFails(getDocs(query(
      collection(staleDb, 'classSessions'),
      where('assignedTeacherId', '==', staleAliasTeacherId),
    )));
    await assertFails(getDoc(doc(unrelatedDb, 'enrollments', 'canonical')));
    await assertFails(getDoc(doc(unrelatedDb, 'classSessions', 'canonical')));
  });

  it('keeps legacy fallback only for records where teacherId is absent', async () => {
    await seedIdentityRecords();
    const db = teacherDb(staleAliasTeacherId);

    await assertSucceeds(getDoc(doc(db, 'enrollments', 'legacy')));
    await assertSucceeds(getDoc(doc(db, 'classSessions', 'legacy')));
  });

  it('keeps canonical teacher queries authorized', async () => {
    await seedIdentityRecords();
    const db = teacherDb(canonicalTeacherId);

    await assertSucceeds(getDocs(query(
      collection(db, 'enrollments'),
      where('teacherId', '==', canonicalTeacherId),
    )));
    await assertSucceeds(getDocs(query(
      collection(db, 'classSessions'),
      where('teacherId', '==', canonicalTeacherId),
    )));
  });

  it('preserves admin and parent reads', async () => {
    await seedIdentityRecords();
    const adminDb = testEnv.authenticatedContext(adminId, { role: 'admin' }).firestore();
    const parentDb = testEnv.authenticatedContext(parentId, { role: 'parent' }).firestore();

    await assertSucceeds(getDoc(doc(adminDb, 'enrollments', 'canonical')));
    await assertSucceeds(getDoc(doc(adminDb, 'classSessions', 'canonical')));
    await assertSucceeds(getDoc(doc(parentDb, 'enrollments', 'canonical')));
    await assertSucceeds(getDoc(doc(parentDb, 'classSessions', 'canonical')));
  });

  it('does not preserve old-teacher access through aliases after reassignment', async () => {
    await seedIdentityRecords();
    const oldTeacherDb = teacherDb(staleAliasTeacherId);
    const newTeacherDb = teacherDb(canonicalTeacherId);

    await assertFails(getDoc(doc(oldTeacherDb, 'enrollments', 'canonical')));
    await assertFails(getDoc(doc(oldTeacherDb, 'classSessions', 'canonical')));
    await assertSucceeds(getDoc(doc(newTeacherDb, 'enrollments', 'canonical')));
    await assertSucceeds(getDoc(doc(newTeacherDb, 'classSessions', 'canonical')));
  });
});
