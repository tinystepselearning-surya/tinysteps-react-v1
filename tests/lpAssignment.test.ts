import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import { seedTestData } from './utils/seedTestData';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8085,
    },
  });
  await seedTestData(testEnv);
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

describe('Role-Based Assignment System', () => {
  it('should allow admin to assign LP to a parent', async () => {
    const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
    const adminDb = adminContext.firestore();
    const parentDoc = doc(adminDb, 'users', 'parent1');

    await setDoc(parentDoc, { role: 'parent', assignedLP: null });

    const lpDoc = doc(adminDb, 'users', 'lp1');
    await setDoc(lpDoc, { role: 'learningPartner' });

    // Perform assignment as admin (simple merge set for test simplicity)
    await setDoc(parentDoc, { assignedLP: 'lp1' }, { merge: true });

    const updatedParent = await getDoc(parentDoc);
    expect(updatedParent.data()!.assignedLP).toBe('lp1');
  });

  it('should deny LP from accessing unassigned parent', async () => {
    const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
    const adminDb = adminContext.firestore();
    const lpContext = testEnv.authenticatedContext('lp-uid', { learningPartner: true });
    const lpDb = lpContext.firestore();
    const parentDocAdmin = doc(adminDb, 'users', 'parent2');

    await setDoc(parentDocAdmin, { role: 'parent', assignedLP: 'lp2' });

    const parentDocForLp = doc(lpDb, 'users', 'parent2');
    await expect(getDoc(parentDocForLp)).rejects.toThrow();
  });

  it('should enforce updates for LP dashboard (read-after-write)', async () => {
    const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
    const adminDb = adminContext.firestore();
    const lpContext = testEnv.authenticatedContext('lp-uid', { learningPartner: true });
    const lpDb = lpContext.firestore();
    const parentDocAdmin = doc(adminDb, 'users', 'parent3');

    await setDoc(parentDocAdmin, { role: 'parent', assignedLP: null });

    // Admin assigns LP
    await setDoc(parentDocAdmin, { assignedLP: 'lp-uid' }, { merge: true });

    // LP tries to read the parent document
    const parentDocForLp = doc(lpDb, 'users', 'parent3');
    const fetched = await getDoc(parentDocForLp);
    expect(fetched.data()!.assignedLP).toBe('lp-uid');
  });
});