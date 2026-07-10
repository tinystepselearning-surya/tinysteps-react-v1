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
import { PUBLIC_MAIN_CONCERN_OPTIONS } from '../../lib/publicLeadForm';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const shouldRun = Boolean(emulatorHost);

const suite = shouldRun ? describe : describe.skip;

function buildPublicLeadPayload(overrides: Record<string, unknown> = {}) {
  return {
    parentName: 'Priya',
    whatsappNumber: '+919999999999',
    primaryPhone: '+919999999999',
    phoneNormalized: '+919999999999',
    childName: 'Aarav',
    childAge: 7,
    interestTrack: 'phonics',
    programInterest: 'Phonics',
    source: 'website',
    sourceDetail: 'public_assessment_form',
    initialMessageSnippet: 'Needs after-school timing',
    mainConcern: 'Blending sounds to read words',
    urgency: 'This week',
    timezone: 'Asia/Kolkata',
    sourcePath: '/book-demo',
    attribution: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'summer',
      utm_content: 'hero',
      utm_term: 'phonics classes',
    },
    requestedAt: new Date('2026-07-05T00:00:00.000Z'),
    createdAt: new Date('2026-07-05T00:00:00.000Z'),
    updatedAt: new Date('2026-07-05T00:00:00.000Z'),
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

suite('public leads firestore rules', () => {
  it('allows unauthenticated create for every current public mainConcern option', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    for (const mainConcern of PUBLIC_MAIN_CONCERN_OPTIONS) {
      await assertSucceeds(addDoc(collection(db, 'leads'), buildPublicLeadPayload({ mainConcern })));
    }
  });

  it('rejects invalid mainConcern values for unauthenticated create', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(addDoc(collection(db, 'leads'), buildPublicLeadPayload({ mainConcern: 'Struggles with blending' })));
    await assertFails(addDoc(collection(db, 'leads'), buildPublicLeadPayload({ mainConcern: 'Reading comprehension' })));
    await assertFails(addDoc(collection(db, 'leads'), buildPublicLeadPayload({ mainConcern: '' })));
  });

  it('rejects unexpected extra fields for unauthenticated create', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(addDoc(collection(db, 'leads'), buildPublicLeadPayload({ extraField: true })));
  });

  it('denies unauthenticated read, list, update, and delete on the public leads collection', async () => {
    let createdId = '';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const created = await addDoc(collection(context.firestore(), 'leads'), buildPublicLeadPayload());
      createdId = created.id;
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'leads', createdId)));
    await assertFails(getDocs(collection(db, 'leads')));
    await assertFails(updateDoc(doc(db, 'leads', createdId), { parentName: 'Changed' }));
    await assertFails(deleteDoc(doc(db, 'leads', createdId)));
  });
});
