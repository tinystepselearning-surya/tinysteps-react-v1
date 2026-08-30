import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));

export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    globals: true,
    include: ['functions/test/**/*.spec.ts'],
    // Firestore emulator transaction/concurrency tests can legitimately exceed
    // Vitest's 5s default on hosted CI runners. Let the contract finish so a
    // timed-out transaction cannot leak state into the following test.
    testTimeout: 15_000,
  },
});
