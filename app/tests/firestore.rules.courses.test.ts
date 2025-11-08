/** @vitest-environment node */
import { initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'tinysteps-react-v1';

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules }
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

test('admin can create/read/update/delete a valid course', async () => {
  const adminCtx = testEnv.authenticatedContext({ uid: 'admin1', token: { role: 'admin' } });
  const db = adminCtx.firestore();
  const docId = `course-admin-${Date.now()}`;
  const courseRef = db.collection('courses').doc(docId);
  const validCourse = { title: 'Alpha Course', category: 'phonics', sortOrder: 1, active: true };

  await assertSucceeds(courseRef.set(validCourse));
  await assertSucceeds(courseRef.get());
  await assertSucceeds(courseRef.update({ sortOrder: 2 }));
  await assertSucceeds(courseRef.delete());
});

test('admin cannot write invalid course shape', async () => {
  const adminCtx = testEnv.authenticatedContext({ uid: 'admin2', token: { role: 'admin' } });
  const db = adminCtx.firestore();
  // Missing required fields / bad category / wrong types
  const badCourse = { title: '', category: 'invalid_cat', sortOrder: 'first', active: 'yes' };
  await assertFails(db.collection('courses').doc('bad-course').set(badCourse));
});

test('parent can read courses but cannot write', async () => {
  const adminCtx = testEnv.authenticatedContext({ uid: 'admin3', token: { role: 'admin' } });
  const adminDb = adminCtx.firestore();
  const id = `course-parent-${Date.now()}`;
  const courseRef = adminDb.collection('courses').doc(id);
  const validCourse = { title: 'Beta Course', category: 'grammar_writing', sortOrder: 5, active: true };
  await assertSucceeds(courseRef.set(validCourse));

  const parentCtx = testEnv.authenticatedContext({ uid: 'parent1', token: { role: 'parent' } });
  const parentDb = parentCtx.firestore();

  // parent should be able to read
  await assertSucceeds(parentDb.collection('courses').doc(id).get());
  // parent should not be able to create/update
  await assertFails(parentDb.collection('courses').doc('try-write').set(validCourse));
});

test('lessons access - admin can read/write, parent cannot read', async () => {
  const adminCtx = testEnv.authenticatedContext({ uid: 'admin4', token: { role: 'admin' } });
  const adminDb = adminCtx.firestore();
  const lessonRef = adminDb.collection('lessons').doc(`lesson-${Date.now()}`);
  await assertSucceeds(lessonRef.set({ title: 'Lesson 1', content: '...' }));

  const parentCtx = testEnv.authenticatedContext({ uid: 'parent2', token: { role: 'parent' } });
  const parentDb = parentCtx.firestore();
  await assertFails(parentDb.collection('lessons').doc(lessonRef.id).get());
});
