import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
process.chdir(root);
export default defineConfig({root, test: {environment: 'node', include: ['functions/test/milestone3FirestoreFinance*.spec.ts'],
  fileParallelism: false, testTimeout: 20000, hookTimeout: 30000}});
