// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
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
    projectId: 'tinysteps-school-programme-rules',
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
      ['admin-1', 'admin'],
      ['lp-1', 'learningPartner'],
      ['school-admin-1', 'schoolAdmin'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), { uid, role, status: 'active' });
    }
    await setDoc(doc(db, 'schoolUsers', 'school-admin-1'), {
      role: 'schoolAdmin',
      schoolIds: ['school-a'],
      primarySchoolId: 'school-a',
      status: 'active',
    });
    await setDoc(doc(db, 'schools', 'school-a'), {
      name: 'School A',
      status: 'active',
      learningPartnerId: 'lp-1',
      currentAcademicYearId: 'ay-2026-2027',
    });
    await setDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027'), {
      schoolId: 'school-a',
      label: '2026–27',
      status: 'current',
    });
    await setDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027', 'sections', 'ukg-a'), {
      schoolId: 'school-a',
      academicYearId: 'ay-2026-2027',
      gradeId: 'ukg',
      gradeLabel: 'UKG',
      sectionName: 'A',
      studentCount: 30,
      status: 'active',
    });
    await setDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027', 'assessmentSummaries', 'assessment-1'), {
      schoolId: 'school-a',
      academicYearId: 'ay-2026-2027',
      sectionId: 'ukg-a',
      checkpoint: 'baseline',
    });
  });
}

suite('school programme Firestore boundary', () => {
  it.each([
    ['admin-1', 'admin'],
    ['lp-1', 'learningPartner'],
    ['school-admin-1', 'schoolAdmin'],
  ] as const)('denies %s browser reads of academic-year subcollections', async (uid, role) => {
    await seed();
    const db = testEnv.authenticatedContext(uid, { role }).firestore();

    await assertFails(
      getDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027')),
    );
    await assertFails(
      getDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027', 'sections', 'ukg-a')),
    );
    await assertFails(
      getDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027', 'assessmentSummaries', 'assessment-1')),
    );
  });

  it.each([
    ['admin-1', 'admin'],
    ['lp-1', 'learningPartner'],
    ['school-admin-1', 'schoolAdmin'],
  ] as const)('denies %s browser writes to programme subcollections', async (uid, role) => {
    await seed();
    const db = testEnv.authenticatedContext(uid, { role }).firestore();

    await assertFails(
      setDoc(doc(db, 'schools', 'school-a', 'academicYears', 'ay-2026-2027', 'sections', 'new-section'), {
        schoolId: 'school-a',
        academicYearId: 'ay-2026-2027',
        gradeId: 'ukg',
        sectionName: 'B',
        studentCount: 20,
      }),
    );
    await assertFails(
      setDoc(doc(db, 'schools', 'school-a', 'activity', 'fake-client-audit'), {
        type: 'assessment_recorded',
        summary: 'Client-forged audit event',
      }),
    );
  });
});
