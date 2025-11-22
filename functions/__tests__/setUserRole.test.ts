import * as admin from 'firebase-admin';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';

// ✅ Import from index.ts
import { setUserRoleHandler } from '../src/index';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
  });

  // Mock admin.auth() so we don't hit real Firebase
  const getUserMock = vi.fn(async (uid: string) => ({ uid, customClaims: {} }));
  const setCustomUserClaimsMock = vi.fn(async (_uid: string, _claims: Record<string, any>) => Promise.resolve());

  vi.spyOn(admin, 'auth').mockImplementation(
    () =>
      ({
        getUser: getUserMock,
        setCustomUserClaims: setCustomUserClaimsMock,
      } as any),
  );
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('setUserRole Cloud Function', () => {
  it('should allow admin to set user role', async () => {
    const context: any = {
      auth: {
        token: { admin: true },
      },
    };

    const VALID_UID = 't'.repeat(28);
    const data = { uid: VALID_UID, role: 'teacher' };

    const result = await setUserRoleHandler(data, context);

    // Verify admin.auth().setCustomUserClaims was called with expected claims
    const authMock = admin.auth();
    expect(authMock.setCustomUserClaims).toHaveBeenCalledWith(VALID_UID, {
      admin: false,
      teacher: true,
      parent: false,
      kid: false,
      learningPartner: false,
      role: 'teacher',
    });

    // Handler returns response object when successful
    expect(result).toHaveProperty('success', true);
  });

  it('should block non-admin users', async () => {
    const context: any = {
      auth: {
        token: { admin: false },
      },
    };

    const VALID_UID = 't'.repeat(28);
    const data = { uid: VALID_UID, role: 'teacher' };

    await expect(setUserRoleHandler(data, context)).rejects.toHaveProperty('code', 'permission-denied');
  });

  it('should reject invalid roles', async () => {
    const context: any = {
      auth: {
        token: { admin: true },
      },
    };

    const VALID_UID = 't'.repeat(28);
    const data = { uid: VALID_UID, role: 'invalid-role' };

    await expect(setUserRoleHandler(data, context)).rejects.toHaveProperty('code', 'invalid-argument');
  });
});
