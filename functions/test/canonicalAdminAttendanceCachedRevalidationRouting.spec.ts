import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const cachedSource = read(
  'functions/src/attendanceValidation/cachedGroupRevalidationCallable.ts',
);
const manualSource = read(
  'functions/src/attendanceValidation/manualVerificationCallable.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C11 cached AVS revalidation Admin authorization', () => {
  it('authorizes the cached revalidation callable from canonical Admin access only', () => {
    expect(cachedSource).toContain(
      "from '../helpers/canonicalAdminGuard'",
    );
    expect(cachedSource).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(cachedSource).not.toContain(
      "from '../helpers/adminGuard'",
    );
    expect(cachedSource).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves cached-only revalidation behavior', () => {
    expect(cachedSource).toContain(
      'loadAvsBusinessGroupForSession',
    );
    expect(cachedSource).toContain(
      'loadAvsGroupEvidence',
    );
    expect(cachedSource).toContain(
      'Fresh Teams evidence required; cached recheck never calls Graph.',
    );
    expect(cachedSource).toContain(
      'graphLogicalCalls: 0',
    );
    expect(cachedSource).toContain(
      'persistAvsGroupCases',
    );
  });

  it('keeps manual verification decoupled from the cached callable module', () => {
    expect(manualSource).toContain(
      "from './avsId'",
    );
    expect(manualSource).not.toContain(
      "from './cachedGroupRevalidationCallable'",
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { revalidateAttendanceValidationGroupCached } from "./attendanceValidation/cachedGroupRevalidationCallable";',
    );
  });
});
