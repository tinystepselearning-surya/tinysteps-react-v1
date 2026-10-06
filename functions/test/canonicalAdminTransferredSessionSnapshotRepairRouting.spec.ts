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
  'functions/src/repairTransferredTeacherSessionSnapshots.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C9 transferred-session snapshot repair Admin authorization', () => {
  it('authorizes the repair callable from canonical Admin access only', () => {
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

  it('preserves bounded dry-run and transfer-repair semantics', () => {
    expect(source).toContain(
      'const MAX_BATCH = 400;',
    );
    expect(source).toContain(
      "const dryRun = request.data?.dryRun === true;",
    );
    expect(source).toContain(
      "where('enrollmentId', '==', enrollmentId)",
    );
    expect(source).toContain(
      "where('kidIds', 'array-contains', kidId)",
    );
    expect(source).toContain(
      'buildCanonicalTeacherWriteFields(toTeacherUid)',
    );
    expect(source).toContain(
      "updatedBy: 'repairTransferredTeacherSessionSnapshots'",
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { repairTransferredTeacherSessionSnapshots } from "./repairTransferredTeacherSessionSnapshots";',
    );
  });
});
