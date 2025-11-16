/// <reference types="vitest" />
// use global 'vi' provided by vitest
declare const vi: any;

// Mock firebase-admin used by the handler.
vi.mock('firebase-admin', () => {
  const createUser = vi.fn(async (args: any) => ({ uid: 'new-uid', email: args.email, displayName: args.displayName }));
  const setCustomUserClaims = vi.fn(async () => ({}));
  const generatePasswordResetLink = vi.fn(async () => 'https://fake-reset-link');
  const getUserByEmail = vi.fn(async () => { throw { code: 'auth/user-not-found' } });

  const set = vi.fn(async () => ({}));
  const docGet = vi.fn(async () => ({ data: () => ({ role: 'admin', roles: ['admin'] }) }));

  const firestore = () => ({
    collection: (name: string) => ({
      doc: (id?: string) => ({ set, get: docGet })
    })
  });
  (firestore as any).FieldValue = { serverTimestamp: () => 'now' };

  return {
    auth: () => ({ createUser, setCustomUserClaims, generatePasswordResetLink, getUserByEmail }),
    firestore,
    apps: [],
    initializeApp: () => {},
  };
});

import { adminCreateUserHandler } from '../src/adminCreateUser';

describe('adminCreateUserHandler', () => {
  it('creates a user when called by an admin', async () => {
    const request = {
      auth: { uid: 'admin-uid', token: { admin: true, role: 'admin' } },
      data: { email: 'newuser@example.com', displayName: 'New User', role: 'parent', password: 'Newpass123!' }
    } as any;

    const result = await adminCreateUserHandler(request);

    expect(result).toHaveProperty('success', true);
    expect((result as any).uid).toBe('new-uid');
  });
});
import * as admin from 'firebase-admin';

describe('adminCreateUser (unit)', () => {
  let createUserSpy: any;
  let setCustomClaimsSpy: any;
  let firestoreSetSpy: any;

  beforeEach(() => {
    // spy on the admin.auth().createUser & setCustomUserClaims
  createUserSpy = vi.spyOn(admin.auth(), 'createUser').mockResolvedValue({ uid: 'new-uid' } as any);
    setCustomClaimsSpy = vi.spyOn(admin.auth(), 'setCustomUserClaims').mockResolvedValue(undefined as any);
    // Note: We rely on the module mock's firestore implementation which already provides a doc().set mock
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a user successfully when caller is admin', async () => {
  const data = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      role: 'parent',
  };
  const request = { auth: { uid: 'callerUid', token: { admin: true, role: 'admin'} }, data } as any;
  let res;
  try {
    res = await adminCreateUserHandler(request);
    console.log('unit test: adminCreateUser returned:', res);
  } catch (err) {
    console.error('unit test: adminCreateUser threw error:', err);
    throw err;
  }
  expect(res.success).toBe(true);
  expect((res as any).uid).toBe('new-uid');
  });
});
