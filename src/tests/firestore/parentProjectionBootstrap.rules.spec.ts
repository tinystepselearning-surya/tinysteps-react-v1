// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-parent-projection-bootstrap-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seedKid() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'kids', 'kid-1'), {
      parentIds: ['parent-1'],
      primaryParentId: 'parent-1',
    });
  });
}

const courseRequestPath = [
  'parentProjectionBootstrapRequests',
  'parent-1',
  'kids',
  'kid-1',
  'requests',
  'v1-course-early-phonics',
] as const;

suite('parent canonical projection bootstrap request rules', () => {
  it('allows a linked parent to create/read one deterministic course bootstrap request', async () => {
    await seedKid();
    const parentDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const requestRef = doc(parentDb, ...courseRequestPath);

    await assertSucceeds(setDoc(requestRef, {
      schemaVersion: 1,
      parentId: 'parent-1',
      kidId: 'kid-1',
      kind: 'course_progress',
      courseId: 'early-phonics',
      createdAt: serverTimestamp(),
    }));
    await assertSucceeds(getDoc(requestRef));
  });

  it('allows a linked parent to create the deterministic current-month attendance request shape', async () => {
    await seedKid();
    const parentDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const requestRef = doc(
      parentDb,
      'parentProjectionBootstrapRequests',
      'parent-1',
      'kids',
      'kid-1',
      'requests',
      'v1-attendance-2026-08',
    );

    await assertSucceeds(setDoc(requestRef, {
      schemaVersion: 1,
      parentId: 'parent-1',
      kidId: 'kid-1',
      kind: 'class_attendance',
      monthKey: '2026-08',
      createdAt: serverTimestamp(),
    }));
  });

  it('denies unrelated parents, malformed ids, and all client updates', async () => {
    await seedKid();
    const ownerDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const unrelatedDb = testEnv.authenticatedContext('parent-2', { role: 'parent' }).firestore();

    await assertFails(setDoc(doc(
      unrelatedDb,
      'parentProjectionBootstrapRequests',
      'parent-1',
      'kids',
      'kid-1',
      'requests',
      'v1-course-early-phonics',
    ), {
      schemaVersion: 1,
      parentId: 'parent-1',
      kidId: 'kid-1',
      kind: 'course_progress',
      courseId: 'early-phonics',
      createdAt: serverTimestamp(),
    }));

    await assertFails(setDoc(doc(
      ownerDb,
      'parentProjectionBootstrapRequests',
      'parent-1',
      'kids',
      'kid-1',
      'requests',
      'anything-goes',
    ), {
      schemaVersion: 1,
      parentId: 'parent-1',
      kidId: 'kid-1',
      kind: 'course_progress',
      courseId: 'early-phonics',
      createdAt: serverTimestamp(),
    }));

    const ownerRef = doc(ownerDb, ...courseRequestPath);
    await assertSucceeds(setDoc(ownerRef, {
      schemaVersion: 1,
      parentId: 'parent-1',
      kidId: 'kid-1',
      kind: 'course_progress',
      courseId: 'early-phonics',
      createdAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(ownerRef, { status: 'completed' }));
  });
});
