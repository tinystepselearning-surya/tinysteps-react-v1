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
  'functions/src/prepareTeacherFinanceAnalyticsRollups.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C14 teacher-finance analytics Admin authorization', () => {
  it('authorizes the callable from canonical Admin access only', () => {
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

  it('preserves dry-run default and derived-rollup-only write safety', () => {
    expect(source).toContain(
      'const apply = request.data?.apply === true;',
    );
    expect(source).toContain(
      "db.collection('teacherEarnings').limit(maxDocs + 1).get()",
    );
    expect(source).not.toContain(
      "db.collection('teacherEarnings').doc(",
    );
    expect(source).not.toContain(
      "batch.set(db.collection('teacherEarnings')",
    );
    expect(source).toContain(
      "state: monthReadyToApply ? 'preparing' : 'blocked'",
    );
    expect(source).toContain(
      "state: 'ready'",
    );
    expect(source).toContain(
      'const MAX_ALLOWED_DOCS = 10000;',
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { prepareTeacherFinanceAnalyticsRollups } from "./prepareTeacherFinanceAnalyticsRollups";',
    );
  });
});
