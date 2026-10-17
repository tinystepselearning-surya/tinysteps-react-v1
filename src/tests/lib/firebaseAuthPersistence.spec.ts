import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const firebaseConfigSource = readFileSync(
  join(process.cwd(), 'src/lib/firebaseConfig.ts'),
  'utf8',
);

describe('native Firebase authentication persistence contract', () => {
  it('prioritizes durable localStorage on iOS while retaining IndexedDB migration support', () => {
    expect(firebaseConfigSource).toContain('browserLocalPersistence');
    expect(firebaseConfigSource).toContain('indexedDBLocalPersistence');
    expect(firebaseConfigSource).toContain(
      'browserLocalPersistence,\n        indexedDBLocalPersistence',
    );
    expect(firebaseConfigSource).not.toContain('inMemoryPersistence');
  });

  it('migrates existing credentials into localStorage first with IndexedDB fallback', () => {
    expect(firebaseConfigSource).toContain('ensureNativeAuthPersistence');
    const indexedDbAttempt = firebaseConfigSource.indexOf(
      'setPersistence(auth, indexedDBLocalPersistence)',
    );
    const localStorageAttempt = firebaseConfigSource.indexOf(
      'setPersistence(auth, browserLocalPersistence)',
    );
    expect(localStorageAttempt).toBeGreaterThan(-1);
    expect(indexedDbAttempt).toBeGreaterThan(localStorageAttempt);
    expect(firebaseConfigSource).toContain("return 'local-storage' as const");
    expect(firebaseConfigSource).toContain("return 'indexeddb' as const");
    expect(firebaseConfigSource).not.toContain('browserSessionPersistence');
    expect(firebaseConfigSource).toContain('nativeAuthPersistencePromise');
  });

  it('retains the duplicate-initialization fallback to the existing Auth instance', () => {
    expect(firebaseConfigSource).toContain('initializeAuth(app');
    expect(firebaseConfigSource).toContain("firebase-auth:init:fallback-existing");
    expect(firebaseConfigSource).toContain('return getAuth(app)');
  });
});
