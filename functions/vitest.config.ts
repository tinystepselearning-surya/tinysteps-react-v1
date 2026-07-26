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
  },
});
