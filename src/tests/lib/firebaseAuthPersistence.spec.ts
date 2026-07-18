import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const firebaseConfigSource = readFileSync(
  join(process.cwd(), 'src/lib/firebaseConfig.ts'),
  'utf8',
);

describe('native Firebase authentication persistence contract', () => {
  it('uses browser local persistence as the only native initialization mechanism', () => {
    expect(firebaseConfigSource).toContain('browserLocalPersistence');
    expect(firebaseConfigSource).toContain(
      'persistence: browserLocalPersistence',
    );
    expect(firebaseConfigSource).not.toContain('indexedDBLocalPersistence');
    expect(firebaseConfigSource).not.toContain('inMemoryPersistence');
  });

  it('provides an idempotent native setPersistence gate', () => {
    expect(firebaseConfigSource).toContain('ensureNativeAuthPersistence');
    expect(firebaseConfigSource).toContain(
      'setPersistence(auth, browserLocalPersistence)',
    );
    expect(firebaseConfigSource).toContain('nativeAuthPersistencePromise');
  });

  it('retains the duplicate-initialization fallback to the existing Auth instance', () => {
    expect(firebaseConfigSource).toContain('initializeAuth(app');
    expect(firebaseConfigSource).toContain("firebase-auth:init:fallback-existing");
    expect(firebaseConfigSource).toContain('return getAuth(app)');
  });
});
