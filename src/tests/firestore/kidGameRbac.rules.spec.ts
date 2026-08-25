// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-kid-game-rbac',
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

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    for (const [uid, role] of [
      ['teacher-a', 'teacher'],
      ['teacher-b', 'teacher'],
      ['parent-a', 'parent'],
      ['parent-b', 'parent'],
      ['admin-a', 'admin'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), { uid, role, status: 'active' });
    }

    await setDoc(doc(db, 'kids', 'kid-a'), {
      parentIds: ['parent-a'],
      primaryParentId: 'parent-a',
      teacherId: 'teacher-a',
      teacherIds: ['teacher-a'],
    });
    await setDoc(doc(db, 'kids', 'kid-b'), {
      parentIds: ['parent-b'],
      primaryParentId: 'parent-b',
      teacherId: 'teacher-b',
      teacherIds: ['teacher-b'],
    });

    for (const kidId of ['kid-a', 'kid-b']) {
      await setDoc(doc(db, 'kids', kidId, 'gameProgress', 'letter-tracing'), { score: 1 });
      await setDoc(doc(db, 'kids', kidId, 'gameSummaries', 'letter-tracing'), { score: 1 });
      await setDoc(doc(db, 'kids', kidId, 'activity', 'head'), { updatedAtMs: 1 });
      await setDoc(doc(db, 'kids', kidId, 'gameSessions', 'session-1'), {
        createdByUid: kidId === 'kid-a' ? 'teacher-a' : 'teacher-b',
      });
    }
  });
}

suite('kid game RBAC rules', () => {
  it('allows an assigned teacher to use permitted game data for their own student', async () => {
    await seed();
    const db = testEnv.authenticatedContext('teacher-a', { role: 'teacher' }).firestore();

    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'gameProgress', 'letter-tracing')));
    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'gameSummaries', 'letter-tracing')));
    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'activity', 'head')));
    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'gameSessions', 'session-1')));
    await assertSucceeds(setDoc(doc(db, 'kids', 'kid-a', 'gameProgress', 'new-progress'), { score: 2 }));
    await assertSucceeds(
      setDoc(doc(db, 'kids', 'kid-a', 'gameSessions', 'teacher-created'), {
        createdByUid: 'teacher-a',
        gameId: 'letter-tracing',
      }),
    );
  });

  it('blocks a teacher from another teacher student game data', async () => {
    await seed();
    const db = testEnv.authenticatedContext('teacher-a', { role: 'teacher' }).firestore();

    await assertFails(getDoc(doc(db, 'kids', 'kid-b', 'gameProgress', 'letter-tracing')));
    await assertFails(getDoc(doc(db, 'kids', 'kid-b', 'gameSummaries', 'letter-tracing')));
    await assertFails(getDoc(doc(db, 'kids', 'kid-b', 'activity', 'head')));
    await assertFails(getDoc(doc(db, 'kids', 'kid-b', 'gameSessions', 'session-1')));
    await assertFails(setDoc(doc(db, 'kids', 'kid-b', 'gameProgress', 'blocked'), { score: 2 }));
    await assertFails(
      setDoc(doc(db, 'kids', 'kid-b', 'gameSessions', 'blocked'), {
        createdByUid: 'teacher-a',
      }),
    );
  });

  it('keeps parent access scoped to their own child', async () => {
    await seed();
    const db = testEnv.authenticatedContext('parent-a', { role: 'parent' }).firestore();

    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'gameProgress', 'letter-tracing')));
    await assertFails(getDoc(doc(db, 'kids', 'kid-b', 'gameProgress', 'letter-tracing')));
  });

  it('rejects forged game-session ownership even for an assigned teacher', async () => {
    await seed();
    const db = testEnv.authenticatedContext('teacher-a', { role: 'teacher' }).firestore();

    await assertFails(
      setDoc(doc(db, 'kids', 'kid-a', 'gameSessions', 'forged'), {
        createdByUid: 'teacher-b',
      }),
    );
  });

  it('preserves admin access', async () => {
    await seed();
    const db = testEnv.authenticatedContext('admin-a', { role: 'admin' }).firestore();

    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-a', 'gameProgress', 'letter-tracing')));
    await assertSucceeds(getDoc(doc(db, 'kids', 'kid-b', 'gameProgress', 'letter-tracing')));
  });
});
