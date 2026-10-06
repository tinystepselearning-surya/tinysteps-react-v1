import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const source = read(
  'functions/src/enrollmentCanonicalBackfill.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C10 enrollment canonical backfill Admin authorization', () => {
  it('authorizes the backfill callable from canonical Admin access only', () => {
    expect(source).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(source).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves dry-run, paging and bounded-write behavior', () => {
    expect(source).toContain(
      "const apply = request.data?.apply === true;",
    );
    expect(source).toContain(
      'const docsLimit = Math.max(25, Math.min(1000, limitValue));',
    );
    expect(source).toContain(
      'for (let i = 0; i < updates.length; i += 400)',
    );
    expect(source).toContain(
      "mode: apply ? 'apply' : 'dry_run'",
    );
    expect(source).toContain(
      ".doc('enrollmentCanonicalBackfillRuns')",
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { adminBackfillEnrollmentCanonicalFields } from "./enrollmentCanonicalBackfill";',
    );
  });
});
