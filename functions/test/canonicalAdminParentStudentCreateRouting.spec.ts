import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const source = read('functions/src/parentStudents.ts');
const indexSource = read('functions/src/index.ts');

describe('Wave 1 R5C2C12 createStudentForParent Admin authorization', () => {
  it('authorizes from canonical Admin access only', () => {
    expect(source).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(auth);',
    );
    expect(source).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(auth);',
    );
  });

  it('preserves the canonical-primary learner create path', () => {
    expect(source).toContain(
      'executeCanonicalLearnerCreate',
    );
    expect(source).toContain(
      "status: 'active'",
    );
    expect(source).toContain(
      'consistencyVerified:',
    );
  });

  it('keeps createStudentForParent independently exported', () => {
    expect(indexSource).toContain(
      'export { createStudentForParent } from "./parentStudents";',
    );
  });
});
