// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-rbac-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

afterEach(async () => {
  await testEnv?.clearFirestore();
});

async function seedUsers() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const rows: Record<string, Record<string, unknown>> = {
      'school-admin-1': { role: 'schoolAdmin', roles: ['schoolAdmin'], status: 'active' },
      'parent-1': { role: 'parent', roles: ['parent'], status: 'active' },
      'parent-2': { role: 'parent', roles: ['parent'], status: 'active', assignedLPs: ['lp-2'] },
      'teacher-1': { role: 'teacher', roles: ['teacher'], status: 'active', assignedLPs: ['lp-1'] },
      'teacher-2': { role: 'teacher', roles: ['teacher'], status: 'active' },
      'lp-1': { role: 'learningPartner', roles: ['learningPartner'], status: 'active' },
      'lp-2': { role: 'learningPartner', roles: ['learningPartner'], status: 'active' },
      'admin-1': { role: 'admin', roles: ['admin'], status: 'active' },
    };

    for (const [uid, data] of Object.entries(rows)) {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: uid,
        email: `${uid}@example.com`,
        ...data,
      });
    }
  });
}

suite('users RBAC rules', () => {
  it('allows each signed-in role to read its own user document', async () => {
    await seedUsers();

    for (const [uid, role] of [
      ['school-admin-1', 'schoolAdmin'],
      ['parent-1', 'parent'],
      ['teacher-1', 'teacher'],
      ['lp-1', 'learningPartner'],
    ] as const) {
      const db = testEnv.authenticatedContext(uid, { role }).firestore();
      await assertSucceeds(getDoc(doc(db, 'users', uid)));
    }
  });

  it('blocks parents and teachers from unrelated profiles and directory listing', async () => {
    await seedUsers();
    const parentDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const teacherDb = testEnv.authenticatedContext('teacher-1', { role: 'teacher' }).firestore();

    await assertFails(getDoc(doc(parentDb, 'users', 'teacher-1')));
    await assertFails(getDoc(doc(parentDb, 'users', 'admin-1')));
    await assertFails(getDocs(collection(parentDb, 'users')));

    await assertFails(getDoc(doc(teacherDb, 'users', 'parent-1')));
    await assertFails(getDoc(doc(teacherDb, 'users', 'teacher-2')));
    await assertFails(getDocs(collection(teacherDb, 'users')));
  });

  it('allows a learning partner to get only explicitly assigned profiles and never list users', async () => {
    await seedUsers();
    const lpDb = testEnv.authenticatedContext('lp-1', { role: 'learningPartner' }).firestore();

    await assertSucceeds(getDoc(doc(lpDb, 'users', 'teacher-1')));
    await assertFails(getDoc(doc(lpDb, 'users', 'parent-2')));
    await assertFails(getDoc(doc(lpDb, 'users', 'teacher-2')));
    await assertFails(getDocs(collection(lpDb, 'users')));
  });

  it('allows admins to get arbitrary profiles and list the directory', async () => {
    await seedUsers();
    const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();

    await assertSucceeds(getDoc(doc(adminDb, 'users', 'parent-1')));
    const snap = await assertSucceeds(getDocs(collection(adminDb, 'users')));
    expect(snap.size).toBeGreaterThan(1);
  });

  it('allows safe self-updates while blocking authorization escalation', async () => {
    await seedUsers();
    const parentDb = testEnv.authenticatedContext('parent-1', { role: 'parent' }).firestore();
    const userRef = doc(parentDb, 'users', 'parent-1');

    await assertSucceeds(updateDoc(userRef, { displayName: 'Updated Parent' }));

    for (const patch of [
      { role: 'admin' },
      { rawRole: 'admin' },
      { roles: ['admin'] },
      { superUser: true },
      { permissions: ['admin'] },
      { status: 'archived' },
      { assignedLPs: ['admin-1'] },
      { assignedParents: ['admin-1'] },
      { assignedTeachers: ['admin-1'] },
      { assignedKids: ['admin-1'] },
      { childIds: ['admin-1'] },
    ]) {
      await assertFails(updateDoc(userRef, patch));
    }
  });

  it('still allows admins to manage protected user fields', async () => {
    await seedUsers();
    const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();

    await assertSucceeds(
      updateDoc(doc(adminDb, 'users', 'parent-1'), {
        roles: ['parent'],
        status: 'archived',
      }),
    );
  });

  it('accepts legacy School Admin token alias for self access', async () => {
    await seedUsers();
    const db = testEnv.authenticatedContext('school-admin-1', { role: 'school-admin' }).firestore();

    const snap = await assertSucceeds(getDoc(doc(db, 'users', 'school-admin-1')));
    expect(snap.exists()).toBe(true);
  });
});
