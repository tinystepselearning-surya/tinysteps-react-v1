import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080, // Ensure this matches your Firestore emulator port
    },
  });
  setLogLevel('error');
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describe('Firestore Security Rules', () => {
  describe('users/{uid}', () => {
    it('Admin reads own user doc → ALLOW', async () => {
      const adminContext = testEnv.authenticatedContext('admin-uid', { role: 'admin' });
      const db = adminContext.firestore();
      const docRef = db.collection('users').doc('admin-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Admin reads other user doc → ALLOW', async () => {
      const adminContext = testEnv.authenticatedContext('admin-uid', { role: 'admin' });
      const db = adminContext.firestore();
      const docRef = db.collection('users').doc('other-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads own doc → ALLOW', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads other teacher doc → DENY', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('other-teacher-uid');
      await expect(docRef.get()).rejects.toThrow();
    });

    it('Teacher writes own doc (limited fields: name, email) → ALLOW', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.set({ name: 'New Name', email: 'newemail@example.com' }, { merge: true })).resolves.toBeUndefined();
    });

    it('Teacher writes own doc (tries to set role) → DENY', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.set({ role: 'admin' }, { merge: true })).rejects.toThrow();
    });
  });

  describe('kids/{kidId}', () => {
    it('Parent reads their kid doc → ALLOW', async () => {
      const parentContext = testEnv.authenticatedContext('parent-uid', { role: 'parent' });
      const db = parentContext.firestore();
      const docRef = db.collection('kids').doc('kid-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Parent reads other kid doc → DENY', async () => {
      const parentContext = testEnv.authenticatedContext('parent-uid', { role: 'parent' });
      const db = parentContext.firestore();
      const docRef = db.collection('kids').doc('other-kid-uid');
      await expect(docRef.get()).rejects.toThrow();
    });

    it('Teacher reads assigned student doc → ALLOW', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('kids').doc('assigned-kid-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads unassigned student doc → DENY', async () => {
      const teacherContext = testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
      const db = teacherContext.firestore();
      const docRef = db.collection('kids').doc('unassigned-kid-uid');
      await expect(docRef.get()).rejects.toThrow();
    });
  });

  // Add more tests for other collections following the same pattern
});