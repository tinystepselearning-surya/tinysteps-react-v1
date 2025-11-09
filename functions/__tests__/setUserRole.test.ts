import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';

jest.mock('firebase-admin', () => {
  const actualAdmin = jest.requireActual<typeof import('firebase-admin')>('firebase-admin');
  return {
    ...actualAdmin,
    auth: () => ({
      setCustomUserClaims: jest.fn(),
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

    const mockSetCustomUserClaims = admin.auth().setCustomUserClaims as jest.Mock;
    mockSetCustomUserClaims.mockResolvedValueOnce(undefined);

    const result = await setUserRole(data, context);

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('test-user', { role: 'teacher' });
    expect(result).toEqual({ success: true });
  });

  it('should block non-admin users', async () => {
    const context = {
      auth: {
        token: { admin: false },
      },
    };

    const data = { uid: 'test-user', role: 'teacher' };

    await expect(setUserRole(data, context)).rejects.toThrow('PERMISSION_DENIED');
  });

  it('should reject invalid roles', async () => {
    const context = {
      auth: {
        token: { admin: true },
      },
    };

    const data = { uid: 'test-user', role: 'invalid-role' };

    await expect(setUserRole(data, context)).rejects.toThrow('INVALID_ARGUMENT');
  });
});