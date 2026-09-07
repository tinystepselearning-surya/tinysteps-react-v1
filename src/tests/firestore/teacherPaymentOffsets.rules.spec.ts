// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const suite = emulatorHost ? describe : describe.skip;
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!emulatorHost) return;
  const [host, rawPort] = emulatorHost.split(':');
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-teacher-payment-offset-rules',
    firestore: {
      host,
      port: Number(rawPort || '8085'),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

afterEach(async () => testEnv && testEnv.clearFirestore());
afterAll(async () => testEnv?.cleanup());

async function seedOffset() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'teacherPaymentOffsets', 'offset-1'), {
      teacherId: 'teacher-1',
      recordType: 'teacher_payment_offset',
      amount: 175,
      status: 'applied',
      ledgerImmutable: true,
    });
  });
}

suite('teacher payment offset ledger rules', () => {
  it('allows the owner teacher and admins to read immutable offset evidence', async () => {
    await seedOffset();
    const teacherDb = testEnv.authenticatedContext('teacher-1', { role: 'teacher' }).firestore();
    const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();
    await assertSucceeds(getDoc(doc(teacherDb, 'teacherPaymentOffsets', 'offset-1')));
    await assertSucceeds(getDoc(doc(adminDb, 'teacherPaymentOffsets', 'offset-1')));
  });

  it('denies unrelated reads and every client mutation, including admins', async () => {
    await seedOffset();
    const otherDb = testEnv.authenticatedContext('teacher-2', { role: 'teacher' }).firestore();
    const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();
    await assertFails(getDoc(doc(otherDb, 'teacherPaymentOffsets', 'offset-1')));
    await assertFails(updateDoc(doc(adminDb, 'teacherPaymentOffsets', 'offset-1'), { amount: 1 }));
    await assertFails(setDoc(doc(adminDb, 'teacherPaymentOffsets', 'offset-2'), {
      teacherId: 'teacher-1',
      amount: 175,
    }));
  });
});
