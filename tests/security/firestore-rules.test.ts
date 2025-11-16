import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import fs from 'fs';
import { seedTestData } from '../utils/seedTestData';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1', // Explicitly use IPv4 to avoid potential IPv6 issues
    port: 8085, // Ensure this matches your Firestore emulator port (localhost started by emulator on 8085)
    },
  });
  // Increase log level for diagnostics; set back to 'error' after debugging if needed
  setLogLevel('debug');

  // Seed necessary documents so rules that depend on existing resource data pass.
  await seedTestData(testEnv);
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describe('Firestore Security Rules', () => {
  describe('users/{uid}', () => {
    it('Admin reads own user doc → ALLOW', async () => {
  const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
      const db = adminContext.firestore();
      const docRef = db.collection('users').doc('admin-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Admin reads other user doc → ALLOW', async () => {
  const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
      const db = adminContext.firestore();
      const docRef = db.collection('users').doc('other-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads own doc → ALLOW', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads other teacher doc → DENY', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('other-teacher-uid');
      await expect(docRef.get()).rejects.toThrow();
    });

    it('Teacher writes own doc (limited fields: name, email) → ALLOW', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.set({ name: 'New Name', email: 'newemail@example.com' }, { merge: true })).resolves.toBeUndefined();
    });

    it('Teacher writes own doc (tries to set role) → DENY', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('users').doc('teacher-uid');
      await expect(docRef.set({ role: 'admin' }, { merge: true })).rejects.toThrow();
    });
  });

  describe('kids/{kidId}', () => {
    it('Parent reads their kid doc → ALLOW', async () => {
  const parentContext = testEnv.authenticatedContext('parent-uid', { parent: true });
      const db = parentContext.firestore();
      const docRef = db.collection('kids').doc('kid-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Parent reads other kid doc → DENY', async () => {
  const parentContext = testEnv.authenticatedContext('parent-uid', { parent: true });
      const db = parentContext.firestore();
      const docRef = db.collection('kids').doc('other-kid-uid');
      await expect(docRef.get()).rejects.toThrow();
    });

    it('Teacher reads assigned student doc → ALLOW', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('kids').doc('assigned-kid-uid');
      await expect(docRef.get()).resolves.toBeDefined();
    });

    it('Teacher reads unassigned student doc → DENY', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('kids').doc('unassigned-kid-uid');
      await expect(docRef.get()).rejects.toThrow();
    });
  });

  // Add more tests for other collections following the same pattern

  describe('bulkUploadJobs', () => {
    it('Admin creates a job → ALLOW', async () => {
  const adminContext = testEnv.authenticatedContext('admin-uid', { admin: true });
      const db = adminContext.firestore();
      const docRef = db.collection('bulkUploadJobs').doc('job1');
      await expect(docRef.set({ createdBy: 'admin-uid', rowCount: 1 })).resolves.toBeUndefined();
    });

    it('Teacher creates a job → DENY', async () => {
  const teacherContext = testEnv.authenticatedContext('teacher-uid', { teacher: true });
      const db = teacherContext.firestore();
      const docRef = db.collection('bulkUploadJobs').doc('job2');
      await expect(docRef.set({ createdBy: 'teacher-uid', rowCount: 1 })).rejects.toThrow();
    });
  });
});