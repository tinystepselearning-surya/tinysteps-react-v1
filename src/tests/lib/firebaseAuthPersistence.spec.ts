import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const firebaseConfigSource = readFileSync(
  join(process.cwd(), 'src/lib/firebaseConfig.ts'),
  'utf8',
);

describe('native Firebase authentication persistence contract', () => {
  it('uses IndexedDB durability with browser local-storage fallback during native initialization', () => {
    expect(firebaseConfigSource).toContain('browserLocalPersistence');
    expect(firebaseConfigSource).toContain('indexedDBLocalPersistence');
    expect(firebaseConfigSource).toContain(
      'indexedDBLocalPersistence,\n        browserLocalPersistence',
    );
    expect(firebaseConfigSource).not.toContain('inMemoryPersistence');
  });

  it('provides an idempotent native setPersistence gate in fallback order', () => {
    expect(firebaseConfigSource).toContain('ensureNativeAuthPersistence');
    const indexedDbAttempt = firebaseConfigSource.indexOf(
      'setPersistence(auth, indexedDBLocalPersistence)',
    );
    const localStorageAttempt = firebaseConfigSource.indexOf(
      'setPersistence(auth, browserLocalPersistence)',
    );
    expect(indexedDbAttempt).toBeGreaterThan(-1);
    expect(localStorageAttempt).toBeGreaterThan(indexedDbAttempt);
    expect(firebaseConfigSource).toContain(
      "return 'local-storage' as const",
    );
    expect(firebaseConfigSource).toContain('nativeAuthPersistencePromise');
  });

  it('retains the duplicate-initialization fallback to the existing Auth instance', () => {
    expect(firebaseConfigSource).toContain('initializeAuth(app');
    expect(firebaseConfigSource).toContain("firebase-auth:init:fallback-existing");
    expect(firebaseConfigSource).toContain('return getAuth(app)');
  });
});
