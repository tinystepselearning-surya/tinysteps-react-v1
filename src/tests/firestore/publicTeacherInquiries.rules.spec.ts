// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const shouldRun = Boolean(emulatorHost);
const suite = shouldRun ? describe : describe.skip;

function buildPublicTeacherInquiry(overrides: Record<string, unknown> = {}) {
  return {
    candidateName: 'Asha Rao',
    phone: '+919999999999',
    email: 'asha@example.com',
    location: 'Hyderabad, Telangana',
    experience: '3 years online English teaching',
    specialization: 'Phonics',
    currentContext: 'Online tutoring',
    availability: '5-9 PM IST, Mon-Sat',
    candidateNote: 'Comfortable with young learners.',
    stage: 'open',
    source: 'careers_page',
    sourcePath: '/careers',
    requestedAt: new Date('2026-10-02T00:00:00.000Z'),
    createdAt: new Date('2026-10-02T00:00:00.000Z'),
    updatedAt: new Date('2026-10-02T00:00:00.000Z'),
    ...overrides,
  };
}

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-firestore-rules',
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

suite('public teacher enquiries firestore rules', () => {
  it('allows a valid unauthenticated Careers application', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(
      addDoc(collection(db, 'teacherInquiries'), buildPublicTeacherInquiry()),
    );
  });

  it('rejects public attempts to write admin workflow fields', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      addDoc(
        collection(db, 'teacherInquiries'),
        buildPublicTeacherInquiry({ adminNotes: 'Internal note' }),
      ),
    );
    await assertFails(
      addDoc(
        collection(db, 'teacherInquiries'),
        buildPublicTeacherInquiry({ finalStatus: 'selected' }),
      ),
    );
    await assertFails(
      addDoc(
        collection(db, 'teacherInquiries'),
        buildPublicTeacherInquiry({ stage: 'admin_review' }),
      ),
    );
  });

  it('rejects unsupported specialization or source values', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      addDoc(
        collection(db, 'teacherInquiries'),
        buildPublicTeacherInquiry({ specialization: 'Science' }),
      ),
    );
    await assertFails(
      addDoc(
        collection(db, 'teacherInquiries'),
        buildPublicTeacherInquiry({ source: 'manual' }),
      ),
    );
  });

  it('denies unauthenticated read, list, update and delete', async () => {
    let createdId = '';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const created = await addDoc(
        collection(context.firestore(), 'teacherInquiries'),
        buildPublicTeacherInquiry(),
      );
      createdId = created.id;
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'teacherInquiries', createdId)));
    await assertFails(getDocs(collection(db, 'teacherInquiries')));
    await assertFails(
      updateDoc(doc(db, 'teacherInquiries', createdId), { stage: 'admin_review' }),
    );
    await assertFails(deleteDoc(doc(db, 'teacherInquiries', createdId)));
  });
});
