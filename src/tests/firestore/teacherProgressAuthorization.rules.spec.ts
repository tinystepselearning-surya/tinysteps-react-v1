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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

const teacherA = 'teacher-a';
const teacherB = 'teacher-b';
const teacherOld = 'teacher-old';
const teacherOther = 'teacher-other';
const adminId = 'admin-a';
const parentA = 'parent-a';
const parentB = 'parent-b';
const childA = 'child-a';
const childB = 'child-b';
const phonicsCourse = 'phonics-foundations';
const grammarCourse = 'basic-grammar';
const advancedCourse = 'advanced-phonics';
const phonicsEnrollment = 'enroll-phonics-a';
const grammarEnrollment = 'enroll-grammar-b';
const childBEnrollment = 'enroll-child-b-a';
const reassignedEnrollment = 'enroll-reassigned';

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-teacher-progress-auth-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

function teacherDb(uid: string) {
  return testEnv.authenticatedContext(uid, { role: 'teacher' }).firestore();
}

function parentDb(uid: string) {
  return testEnv.authenticatedContext(uid, { role: 'parent' }).firestore();
}

function progressRef(db: any, kidId: string, topicId: string) {
  return doc(db, 'students', kidId, 'progress', topicId);
}

function canonicalProgress(enrollmentId: string, courseId: string, extra: Record<string, unknown> = {}) {
  return {
    topicId: `${courseId}__lesson-01`,
    topicName: 'Lesson 1',
    area: courseId.includes('grammar') ? 'grammar' : 'phonics',
    courseId,
    enrollmentId,
    mastery: 'developing',
    source: 'teacher_topic_progress',
    ...extra,
  };
}

async function seedBase() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      // Deliberately stale child-level aliases: Teacher A is not present here.
      setDoc(doc(db, 'kids', childA), {
        parentIds: [parentA],
        primaryParentId: parentA,
        teacherId: teacherOld,
        teacherIds: [teacherOld],
      }),
      // Child B has no teacher aliases at all.
      setDoc(doc(db, 'kids', childB), {
        parentIds: [parentB],
        primaryParentId: parentB,
      }),
      setDoc(doc(db, 'students', childA), { parentIds: [parentA], primaryParentId: parentA }),
      setDoc(doc(db, 'students', childB), { parentIds: [parentB], primaryParentId: parentB }),
      setDoc(doc(db, 'enrollments', phonicsEnrollment), {
        enrollmentId: phonicsEnrollment,
        teacherId: teacherA,
        kidId: childA,
        studentId: childA,
        kidIds: [childA],
        courseId: phonicsCourse,
        parentId: parentA,
        status: 'active',
      }),
      setDoc(doc(db, 'enrollments', grammarEnrollment), {
        enrollmentId: grammarEnrollment,
        teacherId: teacherB,
        kidId: childA,
        studentId: childA,
        kidIds: [childA],
        courseId: grammarCourse,
        parentId: parentA,
        status: 'active',
      }),
      setDoc(doc(db, 'enrollments', childBEnrollment), {
        enrollmentId: childBEnrollment,
        teacherId: teacherA,
        kidId: childB,
        courseId: phonicsCourse,
        parentId: parentB,
        status: 'active',
      }),
      setDoc(doc(db, 'enrollments', reassignedEnrollment), {
        enrollmentId: reassignedEnrollment,
        teacherId: teacherA,
        kidId: childA,
        courseId: advancedCourse,
        parentId: parentA,
        status: 'active',
      }),
      setDoc(progressRef(db, childA, 'phonics-existing'), canonicalProgress(phonicsEnrollment, phonicsCourse)),
      setDoc(progressRef(db, childA, 'grammar-existing'), canonicalProgress(grammarEnrollment, grammarCourse)),
      setDoc(progressRef(db, childA, 'reassigned-existing'), canonicalProgress(reassignedEnrollment, advancedCourse)),
      // Historical record created by the pre-canonical editor: no enrollmentId.
      setDoc(progressRef(db, childA, 'historical-missing-enrollment'), {
        topicName: 'Historical lesson',
        courseId: phonicsCourse,
        mastery: 'developing',
      }),
    ]);
  });
}

async function assertTeacherCrudSucceeds(uid: string, kidId: string, enrollmentId: string, courseId: string) {
  const db = teacherDb(uid);
  await assertSucceeds(getDoc(progressRef(db, kidId, 'phonics-existing')));

  const newRef = progressRef(db, kidId, `create-${uid}-${courseId}`);
  await assertSucceeds(setDoc(newRef, canonicalProgress(enrollmentId, courseId)));
  await assertSucceeds(updateDoc(newRef, { mastery: 'proficient' }));
}

suite('teacher progress authorization follows canonical enrollment ownership', () => {
  it('allows canonical enrollment teacher READ/CREATE/UPDATE despite stale kid teacher aliases', async () => {
    await seedBase();
    await assertTeacherCrudSucceeds(teacherA, childA, phonicsEnrollment, phonicsCourse);

    const db = teacherDb(teacherA);
    await assertSucceeds(getDocs(query(
      collection(db, 'students', childA, 'progress'),
      where('courseId', '==', phonicsCourse),
      where('enrollmentId', '==', phonicsEnrollment),
    )));
  });

  it('allows canonical enrollment teacher when child aliases are entirely missing', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    const ref = progressRef(db, childB, 'child-b-create');
    await assertSucceeds(setDoc(ref, canonicalProgress(childBEnrollment, phonicsCourse)));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { mastery: 'proficient' }));
  });

  it('denies a different teacher READ/CREATE/UPDATE', async () => {
    await seedBase();
    const db = teacherDb(teacherOther);
    await assertFails(getDoc(progressRef(db, childA, 'phonics-existing')));
    const ref = progressRef(db, childA, 'different-teacher-create');
    await assertFails(setDoc(ref, canonicalProgress(phonicsEnrollment, phonicsCourse)));
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(progressRef(context.firestore(), childA, 'different-teacher-update'), canonicalProgress(phonicsEnrollment, phonicsCourse));
    });
    await assertFails(updateDoc(progressRef(db, childA, 'different-teacher-update'), { mastery: 'mastered' }));
  });

  it('denies same-child cross-course READ/CREATE/UPDATE', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    await assertFails(getDoc(progressRef(db, childA, 'grammar-existing')));
    const ref = progressRef(db, childA, 'cross-course-create');
    await assertFails(setDoc(ref, canonicalProgress(grammarEnrollment, grammarCourse)));
    await assertFails(updateDoc(progressRef(db, childA, 'grammar-existing'), { mastery: 'mastered' }));
  });

  it('denies a correct teacher using an enrollment under the wrong child path', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(progressRef(context.firestore(), childB, 'forged-child-existing'), canonicalProgress(phonicsEnrollment, phonicsCourse));
    });
    await assertFails(getDoc(progressRef(db, childB, 'forged-child-existing')));
    await assertFails(setDoc(
      progressRef(db, childB, 'forged-child-create'),
      canonicalProgress(phonicsEnrollment, phonicsCourse),
    ));
    await assertFails(updateDoc(progressRef(db, childB, 'forged-child-existing'), { mastery: 'mastered' }));
  });

  it('denies nonexistent/forged enrollment identifiers for READ/CREATE/UPDATE', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(progressRef(context.firestore(), childA, 'forged-enrollment-existing'), canonicalProgress('not-real', phonicsCourse));
    });
    await assertFails(getDoc(progressRef(db, childA, 'forged-enrollment-existing')));
    await assertFails(setDoc(
      progressRef(db, childA, 'forged-enrollment-create'),
      canonicalProgress('not-real', phonicsCourse),
    ));
    await assertFails(updateDoc(progressRef(db, childA, 'forged-enrollment-existing'), { mastery: 'mastered' }));
  });

  it('denies a legitimate enrollment paired with a forged course for READ/CREATE/UPDATE', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(progressRef(context.firestore(), childA, 'forged-course-existing'), canonicalProgress(phonicsEnrollment, grammarCourse));
    });
    await assertFails(getDoc(progressRef(db, childA, 'forged-course-existing')));
    await assertFails(setDoc(
      progressRef(db, childA, 'forged-course-create'),
      canonicalProgress(phonicsEnrollment, grammarCourse),
    ));
    await assertFails(updateDoc(progressRef(db, childA, 'forged-course-existing'), { mastery: 'mastered' }));
  });

  it('revokes the previous teacher after canonical reassignment even if kid aliases stay stale', async () => {
    await seedBase();
    const oldDb = teacherDb(teacherA);
    await assertSucceeds(getDoc(progressRef(oldDb, childA, 'reassigned-existing')));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'enrollments', reassignedEnrollment), { teacherId: teacherB });
      // Intentionally leave kids.teacherId/teacherIds unchanged/stale.
    });

    await assertFails(getDoc(progressRef(oldDb, childA, 'reassigned-existing')));
    await assertFails(setDoc(
      progressRef(oldDb, childA, 'reassigned-old-create'),
      canonicalProgress(reassignedEnrollment, advancedCourse),
    ));
    await assertFails(updateDoc(progressRef(oldDb, childA, 'reassigned-existing'), { mastery: 'mastered' }));

    const newDb = teacherDb(teacherB);
    await assertSucceeds(getDoc(progressRef(newDb, childA, 'reassigned-existing')));
    const newRef = progressRef(newDb, childA, 'reassigned-new-create');
    await assertSucceeds(setDoc(newRef, canonicalProgress(reassignedEnrollment, advancedCourse)));
    await assertSucceeds(updateDoc(newRef, { mastery: 'proficient' }));
  });

  it('denies identity mutation on an authorized progress document', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    const ref = progressRef(db, childA, 'phonics-existing');

    await assertFails(updateDoc(ref, { enrollmentId: childBEnrollment }));
    await assertFails(updateDoc(ref, { courseId: grammarCourse }));
    await assertFails(updateDoc(ref, {
      enrollmentId: childBEnrollment,
      courseId: grammarCourse,
    }));
  });

  it('preserves parent-own-child reads, denies other parents, and does not broaden parent writes', async () => {
    await seedBase();
    const ownerDb = parentDb(parentA);
    const otherDb = parentDb(parentB);
    const ref = progressRef(ownerDb, childA, 'phonics-existing');

    await assertSucceeds(getDoc(ref));
    await assertSucceeds(getDoc(progressRef(ownerDb, childA, 'historical-missing-enrollment')));
    await assertFails(getDoc(progressRef(otherDb, childA, 'phonics-existing')));
    await assertFails(updateDoc(ref, { mastery: 'mastered' }));
  });

  it('preserves admin read/write/delete behavior', async () => {
    await seedBase();
    const db = testEnv.authenticatedContext(adminId, { role: 'admin' }).firestore();
    const existing = progressRef(db, childA, 'phonics-existing');
    await assertSucceeds(getDoc(existing));
    await assertSucceeds(updateDoc(existing, { mastery: 'mastered' }));
    const created = progressRef(db, childA, 'admin-create');
    await assertSucceeds(setDoc(created, { courseId: phonicsCourse }));
    await assertSucceeds(deleteDoc(created));
  });

  it('denies historical teacher reads until a unique mapping is explicitly backfilled', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    const historical = progressRef(db, childA, 'historical-missing-enrollment');
    await assertFails(getDoc(historical));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(progressRef(context.firestore(), childA, 'historical-missing-enrollment'), {
        enrollmentId: phonicsEnrollment,
      });
    });
    await assertSucceeds(getDoc(historical));
  });

  it('does not guess for an ambiguous historical record', async () => {
    await seedBase();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'enrollments', 'phonics-history-second'), {
        teacherId: teacherA,
        studentId: childA,
        courseId: phonicsCourse,
        parentId: parentA,
        status: 'completed',
      });
    });

    // Ambiguous records remain without enrollmentId and therefore remain closed to teacher access.
    await assertFails(getDoc(progressRef(
      teacherDb(teacherA),
      childA,
      'historical-missing-enrollment',
    )));
  });

  it('keeps teacher delete enrollment-scoped instead of child-alias-scoped', async () => {
    await seedBase();
    const db = teacherDb(teacherA);
    const canonical = progressRef(db, childA, 'phonics-existing');
    await assertSucceeds(deleteDoc(canonical));
    await assertFails(deleteDoc(progressRef(db, childA, 'historical-missing-enrollment')));
  });
});
