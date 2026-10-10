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

const createStudent = read(
  'functions/src/adminCreateStudent.ts',
);
const updateStudent = read(
  'functions/src/adminUpdateStudent.ts',
);
const lifecycle = read(
  'functions/src/lifecycle.ts',
);

describe('Wave 1 R5C2C1 learner mutation Admin authorization routing', () => {
  it('routes learner create and update through canonical Admin access', () => {
    for (const source of [
      createStudent,
      updateStudent,
    ]) {
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
    }
  });

  it('keeps learner mutations on their existing canonical-primary writers', () => {
    expect(createStudent).toContain(
      'executeCanonicalLearnerCreate',
    );
    expect(createStudent).toContain(
      "from './schoolOS/identity/canonicalPrimaryWriter'",
    );

    expect(updateStudent).toContain(
      'executeCanonicalLearnerUpdate',
    );
    expect(updateStudent).toContain(
      "from './schoolOS/identity/canonicalPrimaryLearnerUpdate'",
    );
  });

  it('keeps archive routing distinct while protecting lifecycle mutations with canonical Admin', () => {
    expect(updateStudent).toContain(
      "case 'archive_requires_lifecycle_workflow':",
    );
    expect(lifecycle).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(lifecycle).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(lifecycle).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(lifecycle).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });
});
