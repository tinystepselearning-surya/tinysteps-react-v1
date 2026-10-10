import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const read = (file: string) => readFileSync(
  resolve(process.cwd(), 'functions/src', file),
  'utf8',
);
const assignment = read('assignLP.ts');
const role = read('adminSetUserRoleCanonical.ts');
const index = read('index.ts');

describe('R5C2C35 bounded LP assignment and generic Admin role authorization', () => {
  it('canonicalizes all four LP callables with no legacy requester fallback', () => {
    expect(assignment).toContain("from './helpers/canonicalAdminGuard'");
    expect(assignment).not.toContain("from './helpers/adminGuard'");
    expect(assignment.match(/await ensureCanonicalAdmin\(auth\);/g)).toHaveLength(4);
    expect(assignment).not.toContain('await ensureAdmin(auth);');
    for(const name of [
      'assignLPToParent',
      'unassignLPFromParent',
      'assignLPToTeacher',
      'unassignLPFromTeacher',
    ]) {
      expect(assignment).toContain('export const ' + name + ' = onCall');
      expect(index).toContain(name);
    }
  });

  it('canonicalizes role mutation while retaining explicit generic-role scope', () => {
    expect(role).toContain("from './helpers/canonicalAdminGuard'");
    expect(role).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(role).not.toContain("from './helpers/adminGuard'");
    expect(role).not.toContain('await ensureAdmin(request.auth);');
    expect(role).toContain('isGenericAuthUserRole(nextRole)');
    expect(role).toContain('planCanonicalAuthUserUpdate');
    expect(role).toContain('writeCanonicalAuthUserUpdatePlan');
    expect(role).toContain('validateClaimsSize');
    expect(assignment).toContain("export { adminSetUserRole } from './adminSetUserRoleCanonical';");
    expect(index).toContain('adminSetUserRole');
  });

  it('preserves symmetric parent/teacher LP association mutations', () => {
    expect(assignment).toContain("'parent' ? 'assignedParents' : 'assignedTeachers'");
    expect(assignment).toContain('FieldValue.arrayUnion(lpId)');
    expect(assignment).toContain('FieldValue.arrayRemove(lpId)');
    expect(assignment).toContain('await batch.commit()');
    expect(assignment).toContain("normalizeRole(parent.role) !== 'parent'");
    expect(assignment).toContain("normalizeRole(teacher.role) !== 'teacher'");
    expect(assignment).toContain("normalizeRole(lp.role) !== 'learningPartner'");
  });
});
