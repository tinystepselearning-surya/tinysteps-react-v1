// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, port = '8085'] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-parent-worksheet-rules',
    firestore: { host, port: Number(port), rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
  });
});
afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'parentWorksheetLibrary', 'family-b'), { title: 'Private', targetCourseIds: ['course-b'], active: true });
    await setDoc(doc(db, 'lessonCatalog', 'lesson-a'), { title: 'Lesson A', teacherScript: 'Teacher only' });
  });
}

suite('parent worksheet distribution rules', () => {
  it('allows admin management', async () => {
    await seed();
    const db = testEnv.authenticatedContext('admin-a', { role: 'admin' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'parentWorksheetLibrary', 'family-b')));
    await assertSucceeds(setDoc(doc(db, 'parentWorksheetLibrary', 'new'), { title: 'New' }));
    await assertSucceeds(updateDoc(doc(db, 'parentWorksheetLibrary', 'family-b'), { title: 'Edited' }));
  });

  it('prevents parents from reading or dumping the distribution collection directly', async () => {
    await seed();
    const db = testEnv.authenticatedContext('parent-a', { role: 'parent' }).firestore();
    await assertFails(getDoc(doc(db, 'parentWorksheetLibrary', 'family-b')));
    await assertFails(getDocs(collection(db, 'parentWorksheetLibrary')));
    await assertFails(getDoc(doc(db, 'lessonCatalog', 'lesson-a')));
  });

  it('prevents teachers and unauthenticated clients from reading parent distribution records', async () => {
    await seed();
    const teacherDb = testEnv.authenticatedContext('teacher-a', { role: 'teacher' }).firestore();
    const publicDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(teacherDb, 'parentWorksheetLibrary', 'family-b')));
    await assertFails(getDoc(doc(publicDb, 'parentWorksheetLibrary', 'family-b')));
  });
});
