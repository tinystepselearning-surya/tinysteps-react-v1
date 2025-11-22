import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import { onAuthUserCreate } from '../src/onAuthUserCreate';

let testEnv: any;
let testFunctions: any;

beforeAll(async () => {
  // Initialize Firebase test environment
  testEnv = await initializeTestEnvironment({
    projectId: 'tinysteps-test',
    firestore: {
      rules: '', // We'll test without rules for now
    },
  });

  // Initialize functions test
  testFunctions = functionsTest({
    projectId: 'tinysteps-test',
  });

  // Mock admin.initializeApp to prevent multiple initializations
  vi.spyOn(admin, 'initializeApp').mockImplementation(() => admin.app() || ({} as any));
});

afterAll(async () => {
  testFunctions.cleanup();
  await testEnv.cleanup();
});

describe('onAuthUserCreate', () => {
  let wrappedOnAuthUserCreate: any;

  beforeAll(() => {
    wrappedOnAuthUserCreate = testFunctions.wrap(onAuthUserCreate);
  });

  it('should create a new user document for a new user', async () => {
    const mockUser = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
      providerData: [{ providerId: 'google.com' }],
    };

    // Mock Firestore
    const mockDocRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const mockCollection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDocRef),
    });

    vi.spyOn(admin, 'firestore').mockReturnValue({
      collection: mockCollection,
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
      },
    } as any);

    // Mock Auth setCustomUserClaims
    const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(admin, 'auth').mockReturnValue({
      setCustomUserClaims: mockSetCustomUserClaims,
    } as any);

    // Call the wrapped function
    await wrappedOnAuthUserCreate(mockUser);

    // Assertions
    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDocRef.get).toHaveBeenCalled();
    expect(mockDocRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
        displayName: 'Test User',
        provider: 'google.com',
        role: 'parent',
        roles: ['parent'],
        status: 'active',
      })
    );

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('test-uid-123', {
      parent: true,
      role: 'parent',
    });
  });

  it('should update provider if user doc exists but provider is missing', async () => {
    const mockUser = {
      uid: 'existing-uid-456',
      email: 'existing@example.com',
      displayName: 'Existing User',
      providerData: [{ providerId: 'password' }],
    };

    const mockDocRef = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: 'teacher', provider: null }),
      }),
      update: vi.fn().mockResolvedValue(undefined),
    };

    const mockCollection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDocRef),
    });

    vi.spyOn(admin, 'firestore').mockReturnValue({
      collection: mockCollection,
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
      },
    } as any);

    const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(admin, 'auth').mockReturnValue({
      setCustomUserClaims: mockSetCustomUserClaims,
    } as any);

    await wrappedOnAuthUserCreate(mockUser);

    expect(mockDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'password',
      })
    );

    expect(mockSetCustomUserClaims).toHaveBeenCalledWith('existing-uid-456', {
      teacher: true,
      role: 'teacher',
    });
  });

  it('should handle setCustomUserClaims failure and persist claimsFallback', async () => {
    const mockUser = {
      uid: 'fail-uid-789',
      email: 'fail@example.com',
      displayName: 'Fail User',
      providerData: [],
    };

    const mockDocRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn().mockResolvedValue(undefined),
    };

    const mockCollection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDocRef),
    });

    vi.spyOn(admin, 'firestore').mockReturnValue({
      collection: mockCollection,
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
      },
    } as any);

    // Mock setCustomUserClaims to fail
    const mockSetCustomUserClaims = vi.fn().mockRejectedValue(new Error('Emulator restriction'));
    vi.spyOn(admin, 'auth').mockReturnValue({
      setCustomUserClaims: mockSetCustomUserClaims,
    } as any);

    await wrappedOnAuthUserCreate(mockUser);

    // Should still create the user doc
    expect(mockDocRef.set).toHaveBeenCalledTimes(2);

    // Check the merge call for claimsFallback
    expect(mockDocRef.set).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        claimsFallback: { parent: true, role: 'parent' },
      }),
      { merge: true }
    );
  });

  it('should handle errors gracefully', async () => {
    const mockUser = {
      uid: 'error-uid',
      email: 'error@example.com',
    };

    // Mock Firestore to throw error
    vi.spyOn(admin, 'firestore').mockImplementation(() => {
      throw new Error('Firestore error');
    });

    // Should not throw, just log error
    await expect(wrappedOnAuthUserCreate(mockUser)).resolves.not.toThrow();
  });
});