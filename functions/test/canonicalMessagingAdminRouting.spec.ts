import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const files = [
  'functions/src/messaging/sendMessage.ts',
  'functions/src/messaging/createOrSyncMessageThread.ts',
];
describe('R5C2C29 messaging canonical Admin boundary', () => {
  for (const p of files) {
    it(`${p} uses canonical Admin with no legacy fallback`, () => {
      const source = read(p);
      expect(source).toContain("from '../helpers/canonicalAdminGuard'");
      expect(source).toContain('await ensureCanonicalAdmin(auth);');
      expect(source).not.toContain("from '../helpers/adminGuard'");
      expect(source).not.toContain('isCurrentAdmin(auth)');
      expect(source).toContain('return false;');
    });
  }
});
