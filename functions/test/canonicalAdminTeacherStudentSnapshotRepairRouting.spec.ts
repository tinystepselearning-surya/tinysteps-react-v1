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
  'functions/src/repairTeacherStudentSnapshots.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C7 teacher-student snapshot repair Admin authorization', () => {
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

  it('preserves dry-run/apply and bounded repair behavior', () => {
    expect(source).toContain(
      "const apply = request.data?.apply === true;",
    );
    expect(source).toContain(
      'const MAX_BATCH = 400;',
    );
    expect(source).toContain(
      "mode: apply ? 'apply' : 'dry_run'",
    );
    expect(source).toContain(
      "collection('adminStats')",
    );
    expect(source).toContain(
      "updatedBy: 'adminRepairTeacherStudentSnapshots'",
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { adminRepairTeacherStudentSnapshots } from "./repairTeacherStudentSnapshots";',
    );
  });
});
