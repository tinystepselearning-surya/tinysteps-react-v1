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
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  it,
} from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-founder-management-rules',
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

async function seedFounderManagementData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'users', 'founder-1'), {
      uid: 'founder-1',
      role: 'founder',
      status: 'active',
      displayName: 'Priya',
    });
    await setDoc(doc(db, 'users', 'teacher-1'), {
      uid: 'teacher-1',
      role: 'teacher',
      status: 'active',
      displayName: 'Teacher',
    });
    await setDoc(doc(db, 'kids', 'kid-1'), {
      displayName: 'Student',
      status: 'active',
    });
    await setDoc(doc(db, 'enrollments', 'enrollment-1'), {
      kidId: 'kid-1',
      teacherId: 'teacher-1',
      status: 'active',
    });
    await setDoc(doc(db, 'classSessions', 'session-1'), {
      kidId: 'kid-1',
      teacherId: 'teacher-1',
      status: 'scheduled',
      date: '2026-09-25',
    });
    await setDoc(doc(db, 'leads', 'lead-1'), {
      parentName: 'Parent',
      status: 'new',
    });
    await setDoc(doc(db, 'billingCharges', 'charge-1'), {
      parentId: 'parent-1',
      amount: 400,
      monthKey: '2026-09',
    });
    await setDoc(doc(db, 'teacherEarnings', 'earning-1'), {
      teacherId: 'teacher-1',
      amount: 175,
      monthKey: '2026-09',
    });
    await setDoc(doc(db, 'attendanceValidationCases', 'case-1'), {
      sessionId: 'session-1',
      status: 'open',
    });
  });
}

suite('Founder management read-only rules', () => {
  it('allows Founder to read lifted Admin management data', async () => {
    await seedFounderManagementData();
    const db = testEnv.authenticatedContext('founder-1', { role: 'founder' }).firestore();

    for (const [collectionName, documentId] of [
      ['users', 'teacher-1'],
      ['kids', 'kid-1'],
      ['enrollments', 'enrollment-1'],
      ['classSessions', 'session-1'],
      ['leads', 'lead-1'],
      ['billingCharges', 'charge-1'],
      ['teacherEarnings', 'earning-1'],
      ['attendanceValidationCases', 'case-1'],
    ] as const) {
      await assertSucceeds(getDoc(doc(db, collectionName, documentId)));
    }

    await assertSucceeds(getDocs(collection(db, 'users')));
    await assertSucceeds(getDocs(collection(db, 'leads')));
  });

  it('does not grant Founder direct mutation authority in lifted Admin collections', async () => {
    await seedFounderManagementData();
    const db = testEnv.authenticatedContext('founder-1', { role: 'founder' }).firestore();

    await assertFails(updateDoc(doc(db, 'users', 'teacher-1'), {
      displayName: 'Changed by Founder',
    }));
    await assertFails(updateDoc(doc(db, 'kids', 'kid-1'), {
      displayName: 'Changed by Founder',
    }));
    await assertFails(updateDoc(doc(db, 'enrollments', 'enrollment-1'), {
      status: 'archived',
    }));
    await assertFails(updateDoc(doc(db, 'leads', 'lead-1'), {
      status: 'closed',
    }));
    await assertFails(updateDoc(doc(db, 'billingCharges', 'charge-1'), {
      amount: 0,
    }));
    await assertFails(updateDoc(doc(db, 'teacherEarnings', 'earning-1'), {
      amount: 0,
    }));
  });

  it('keeps Founder editorial-review state server-only', async () => {
    await seedFounderManagementData();
    const db = testEnv.authenticatedContext('founder-1', { role: 'founder' }).firestore();

    await assertFails(setDoc(doc(db, 'editorialReviewState', 'phonics'), {
      decisions: {},
    }));
    await assertFails(setDoc(doc(db, 'editorialReviewAudit', 'fake-event'), {
      reviewerKey: 'founder-priya',
    }));
  });
});
