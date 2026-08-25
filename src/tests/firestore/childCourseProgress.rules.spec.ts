// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-child-course-progress-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seedProjection() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'kids', 'kid-1'), {
      parentIds: ['parent-1'],
      teacherId: 'teacher-1',
    });
    await setDoc(doc(db, 'students', 'kid-1', 'courseProgress', 'phonics-foundations'), {
      courseId: 'phonics-foundations',
      totalTopics: 30,
      completedTopics: 4,
    });
  });
}

suite('child course progress projection rules', () => {
  it('allows the linked parent, assigned teacher, and admin to read the projection', async () => {
    await seedProjection();
    const projectionPath = ['students', 'kid-1', 'courseProgress', 'phonics-foundations'] as const;

    await assertSucceeds(getDoc(doc(
      testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore(),
      ...projectionPath,
    )));
    await assertSucceeds(getDoc(doc(
      testEnv.authenticatedContext('teacher-1', { role: 'teacher' }).firestore(),
      ...projectionPath,
    )));
    await assertSucceeds(getDoc(doc(
      testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore(),
      ...projectionPath,
    )));
  });

  it('denies unrelated reads and all client writes', async () => {
    await seedProjection();
    const unrelatedDb = testEnv.authenticatedContext('parent-2', { role: 'parent' }).firestore();
    const ownerDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const projectionRef = doc(ownerDb, 'students', 'kid-1', 'courseProgress', 'phonics-foundations');

    await assertFails(getDoc(doc(
      unrelatedDb,
      'students',
      'kid-1',
      'courseProgress',
      'phonics-foundations',
    )));
    await assertFails(updateDoc(projectionRef, { completedTopics: 99 }));
  });
});
