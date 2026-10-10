// @vitest-environment node
// M3 Storage characterization with synthetic emulator data only.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {doc, setDoc} from 'firebase/firestore';
import {getMetadata, ref, uploadBytes} from 'firebase/storage';
import {afterAll, afterEach, beforeAll, describe, it} from 'vitest';

const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
const suite = firestoreHost && storageHost ? describe : describe.skip;
let env: RulesTestEnvironment;
const bytes = new Uint8Array([1, 2, 3, 4, 5]);

beforeAll(async () => {
  if (!firestoreHost || !storageHost) return;
  const [fireHost, firePort = '8085'] = firestoreHost.split(':');
  const [storeHost, storePort = '9199'] = storageHost.split(':');
  env = await initializeTestEnvironment({
    projectId: 'tinysteps-m3-storage-parity',
    firestore: {
      host: fireHost,
      port: Number(firePort),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
    storage: {
      host: storeHost,
      port: Number(storePort),
      rules: readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8'),
    },
  });
});
afterEach(async () => {if (env) await env.clearFirestore();});
afterAll(async () => {if (env) await env.cleanup();});
const storage = (uid: string, token: Record<string, unknown> = {}) =>
  env.authenticatedContext(uid, token).storage('gs://tinysteps-m3-storage-parity.appspot.com');

async function seed() {
  await env.withSecurityRulesDisabled(async (runner) => {
    const db = runner.firestore();
    for (const [id, role, status, extra] of [
      ['legacy-super', 'parent', 'active', {superUser: true}],
      ['canonical-only', 'parent', 'active', {}],
      ['admin-1', 'admin', 'active', {}],
      ['inactive-admin', 'admin', 'archived', {superUser: true}],
      ['parent-1', 'parent', 'active', {}],
      ['parent-2', 'parent', 'active', {}],
    ] as const) await setDoc(doc(db, 'users', id), {uid: id, role, status, ...extra});
    await setDoc(doc(db, 'authAccessReadModels', 'canonical-only'), {
      firebaseUid: 'canonical-only', accessActive: true, globalRoles: ['admin'],
    });
  });
}

suite('Milestone 3 Storage legacy and canonical authorization parity emulator', () => {
  it('accepts synthetic active legacy superUser for Admin-only image write', async () => {
    await seed();
    await assertSucceeds(uploadBytes(ref(storage('legacy-super'), 'images/legacy-super.png'), bytes));
    await assertSucceeds(uploadBytes(ref(storage('admin-1'), 'pronunciations/admin-1.mp3'), bytes));
  });

  it('does not yet accept canonical-only role projections and denies inactive Admin', async () => {
    await seed();
    await assertFails(uploadBytes(ref(storage('canonical-only', {role: 'admin'}), 'images/canonical-only.png'), bytes));
    await assertFails(uploadBytes(ref(storage('inactive-admin', {admin: true}), 'images/inactive.png'), bytes));
    await assertFails(uploadBytes(ref(storage('orphan', {role: 'admin'}), 'images/orphan.png'), bytes));
  });

  it('protects student recording owner writes and cross-user reads', async () => {
    await seed();
    const file = 'student_recordings/parent-1/short-sample.webm';
    await assertSucceeds(uploadBytes(ref(storage('parent-1'), file), bytes));
    await assertSucceeds(getMetadata(ref(storage('parent-1'), file)));
    await assertFails(getMetadata(ref(storage('parent-2'), file)));
    await assertFails(uploadBytes(ref(storage('parent-2'), file), bytes));
  });

  it('keeps certificate uploads server-only even for global Admin', async () => {
    await seed();
    await assertFails(uploadBytes(ref(storage('admin-1'), 'certificates/admin-1/cert.pdf'), bytes));
  });
});
