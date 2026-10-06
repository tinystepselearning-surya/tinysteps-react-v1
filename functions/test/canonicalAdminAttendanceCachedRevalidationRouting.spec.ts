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
  'functions/src/attendanceValidation/cachedGroupRevalidationCallable.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C11 cached AVS group revalidation Admin authorization', () => {
  it('authorizes the callable from canonical Admin access only', () => {
    expect(source).toContain(
      "from '../helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(source).not.toContain(
      "from '../helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves cached-only bounded AVS revalidation behavior', () => {
    expect(source).toContain(
      'loadAvsBusinessGroupForSession',
    );
    expect(source).toContain(
      'loadAvsGroupEvidence',
    );
    expect(source).toContain(
      'Fresh Teams evidence required; cached recheck never calls Graph.',
    );
    expect(source).toContain(
      'graphLogicalCalls: 0',
    );
    expect(source).toContain(
      'persistAvsGroupCases',
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { revalidateAttendanceValidationGroupCached } from "./attendanceValidation/cachedGroupRevalidationCallable";',
    );
  });
});
