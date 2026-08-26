// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  documentId,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

const teacherId = 'lazy-teacher';
const otherTeacherId = 'lazy-other-teacher';
const kidId = 'lazy-kid';
const enrollmentId = 'lazy-enrollment';
const courseId = 'phonics-foundations';
const topicId = 'phonics-foundations__lesson-01';

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-teacher-progress-lazy-read-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seedProgress() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'kids', kidId), { teacherIds: [] });
    await setDoc(doc(db, 'students', kidId), {});
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      enrollmentId,
      teacherId,
      kidId,
      studentId: kidId,
      courseId,
      status: 'active',
    });
    await setDoc(doc(db, 'students', kidId, 'progress', topicId), {
      topicId,
      topicName: 'Lesson 1 — Letter S',
      area: 'phonics',
      courseId,
      enrollmentId,
      mastery: 'developing',
      source: 'teacher_topic_progress',
    });
  });
}

function selectedLessonQuery(uid: string) {
  const db = testEnv.authenticatedContext(uid, { role: 'teacher' }).firestore();
  return query(
    collection(db, 'students', kidId, 'progress'),
    where('courseId', '==', courseId),
    where('enrollmentId', '==', enrollmentId),
    where(documentId(), '==', topicId),
  );
}

suite('teacher progress selected-lesson lazy reads', () => {
  it('allows the canonical enrollment teacher to query one deterministic lesson document', async () => {
    await seedProgress();
    const snap = await assertSucceeds(getDocs(selectedLessonQuery(teacherId)));
    expect(snap.docs.map((entry) => entry.id)).toEqual([topicId]);
  });

  it('still denies the same selected-lesson query to a different teacher', async () => {
    await seedProgress();
    await assertFails(getDocs(selectedLessonQuery(otherTeacherId)));
  });
});
