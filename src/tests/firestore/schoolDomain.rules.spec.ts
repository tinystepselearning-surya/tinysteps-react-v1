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
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-school-domain-rules',
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

async function seedSchoolDomain() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const users = [
      ['admin-1', 'admin'],
      ['lp-1', 'learningPartner'],
      ['lp-2', 'learningPartner'],
      ['school-admin-1', 'schoolAdmin'],
      ['school-admin-2', 'schoolAdmin'],
      ['parent-1', 'parent'],
      ['teacher-1', 'teacher'],
    ] as const;

    for (const [uid, role] of users) {
      await setDoc(doc(db, 'users', uid), {
        uid,
        role,
        status: 'active',
      });
    }

    await setDoc(doc(db, 'schoolUsers', 'school-admin-1'), {
      role: 'schoolAdmin',
      schoolIds: ['school-a', 'school-archived'],
      primarySchoolId: 'school-a',
      status: 'active',
    });
    await setDoc(doc(db, 'schoolUsers', 'school-admin-2'), {
      role: 'schoolAdmin',
      schoolIds: ['school-b'],
      primarySchoolId: 'school-b',
      status: 'active',
    });

    await setDoc(doc(db, 'schools', 'school-a'), {
      name: 'School A',
      status: 'active',
      learningPartnerId: 'lp-1',
    });
    await setDoc(doc(db, 'schools', 'school-b'), {
      name: 'School B',
      status: 'active',
      learningPartnerId: 'lp-2',
    });
    await setDoc(doc(db, 'schools', 'school-archived'), {
      name: 'Archived',
      status: 'archived',
      learningPartnerId: 'lp-1',
    });
    await setDoc(
      doc(
        db,
        'schools',
        'school-a',
        'learningPartnerAssignments',
        'assignment-1',
      ),
      {
        schoolId: 'school-a',
        changeType: 'assigned',
      },
    );
  });
}

const authDb = (uid: string, role: string) =>
  testEnv.authenticatedContext(uid, { role }).firestore();

suite('school-domain RBAC rules', () => {
  it('allows Admin to read all schools and all school memberships', async () => {
    await seedSchoolDomain();
    const db = authDb('admin-1', 'admin');

    const schools = await assertSucceeds(getDocs(collection(db, 'schools')));
    const memberships = await assertSucceeds(
      getDocs(collection(db, 'schoolUsers')),
    );

    expect(schools.size).toBe(3);
    expect(memberships.size).toBe(2);
  });

  it('isolates School Admin membership documents', async () => {
    await seedSchoolDomain();
    const db = authDb('school-admin-1', 'schoolAdmin');

    await assertSucceeds(getDoc(doc(db, 'schoolUsers', 'school-admin-1')));
    await assertFails(getDoc(doc(db, 'schoolUsers', 'school-admin-2')));
  });

  it('allows a School Admin to read only active linked schools', async () => {
    await seedSchoolDomain();
    const db = authDb('school-admin-1', 'schoolAdmin');

    await assertSucceeds(getDoc(doc(db, 'schools', 'school-a')));
    await assertFails(getDoc(doc(db, 'schools', 'school-b')));
    await assertFails(getDoc(doc(db, 'schools', 'school-archived')));
  });

  it('prevents School Admin writes to schools and their own membership', async () => {
    await seedSchoolDomain();
    const db = authDb('school-admin-1', 'schoolAdmin');

    await assertFails(
      updateDoc(doc(db, 'schools', 'school-a'), { name: 'Changed' }),
    );
    await assertFails(
      updateDoc(doc(db, 'schoolUsers', 'school-admin-1'), {
        schoolIds: ['school-a', 'school-b'],
      }),
    );
  });

  it('allows each Learning Partner to read only assigned schools', async () => {
    await seedSchoolDomain();
    const lp1Db = authDb('lp-1', 'learningPartner');
    const lp2Db = authDb('lp-2', 'learningPartner');

    await assertSucceeds(getDoc(doc(lp1Db, 'schools', 'school-a')));
    await assertFails(getDoc(doc(lp1Db, 'schools', 'school-b')));
    await assertSucceeds(getDoc(doc(lp2Db, 'schools', 'school-b')));
  });

  it('denies school records to Parent and Teacher users', async () => {
    await seedSchoolDomain();
    const parentDb = authDb('parent-1', 'parent');
    const teacherDb = authDb('teacher-1', 'teacher');

    await assertFails(getDoc(doc(parentDb, 'schools', 'school-a')));
    await assertFails(getDoc(doc(parentDb, 'schools', 'school-b')));
    await assertFails(getDoc(doc(teacherDb, 'schools', 'school-a')));
    await assertFails(getDoc(doc(teacherDb, 'schools', 'school-b')));
  });

  it('keeps Learning Partner assignment history Admin-only', async () => {
    await seedSchoolDomain();
    const schoolDb = authDb('school-admin-1', 'schoolAdmin');
    const adminDb = authDb('admin-1', 'admin');
    const path = [
      'schools',
      'school-a',
      'learningPartnerAssignments',
      'assignment-1',
    ] as const;

    await assertFails(getDoc(doc(schoolDb, ...path)));
    await assertSucceeds(getDoc(doc(adminDb, ...path)));
  });

  it('supports an assigned Learning Partner schools query', async () => {
    await seedSchoolDomain();
    const lp1Db = authDb('lp-1', 'learningPartner');
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(lp1Db, 'schools'),
          where('learningPartnerId', '==', 'lp-1'),
        ),
      ),
    );

    expect(snap.docs.map((item) => item.id).sort()).toEqual([
      'school-a',
      'school-archived',
    ]);
  });
});
