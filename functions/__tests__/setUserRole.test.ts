import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';

jest.mock('firebase-admin', () => {
  const actualAdmin = jest.requireActual<typeof import('firebase-admin')>('firebase-admin');
  return {
    ...actualAdmin,
    auth: () => ({
      setCustomUserClaims: jest.fn((uid: string, claims: Record<string, any>) => Promise.resolve()) as jest.MockedFunction<(uid: string, claims: Record<string, any>) => Promise<void>>,
    }),
  };
});

const setUserRole = require('../index').setUserRole;

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('setUserRole Cloud Function', () => {
  it('should allow admin to set user role', async () => {
    const context = {
      auth: {
        token: { admin: true },
      },
    };

    const data = { uid: 'test-user', role: 'teacher' };

    // Define the mock function correctly without type assertions
    const mockSetCustomUserClaims = jest.fn((uid: string, claims: Record<string, any>) => Promise.resolve());

    const result = await setUserRole(data, context);

    // Ensure the test logic matches the mock function's signature
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('test-user', {
      admin: false,
      teacher: true,
      parent: false,
      kid: false,
      learningPartner: false,
      role: 'teacher',
    });
    expect(result).toEqual({ success: true });
  });

  it('should block non-admin users', async () => {
    const context = {
      auth: {
        token: { admin: false },
      },
    };

    const data = { uid: 'test-user', role: 'teacher' };

    await expect(setUserRole(data, context)).rejects.toThrow('permission-denied');
  });

  it('should reject invalid roles', async () => {
    const context = {
      auth: {
        token: { admin: true },
      },
    };

    const data = { uid: 'test-user', role: 'invalid-role' };

    await expect(setUserRole(data, context)).rejects.toThrow('invalid-argument');
  });
});