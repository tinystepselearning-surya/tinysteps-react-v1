import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const read=(p:string)=>fs.readFileSync(path.resolve(process.cwd(),p),'utf8');
const backfill=read('functions/src/adminCreateUser.ts');
const creation=read('functions/src/adminCreateUserCanonical.ts');
const index=read('functions/src/index.ts');
describe('R5C2C24 grouped canonical user administration',()=>{
  it.each([['teacher backfill',backfill],['canonical user creation',creation]])('%s uses canonical Admin without fallback',(_,code)=>{
    expect(code).toContain("from './helpers/canonicalAdminGuard'");
    expect(code).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(code).not.toContain("from './helpers/adminGuard'");
    expect(code).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves bounded teacher document backfill writes',()=>{
    expect(backfill).toContain("export const backfillTeacherDocs = onCall(");
    expect(backfill).toContain("db.collection('teachers').doc(uid)");
    expect(backfill).toContain("role', '==', 'teacher'");
    expect(backfill).toContain('await teacherRef.set(');
    expect(backfill).toContain('{ merge: true }');
    expect(backfill).toContain('maxInstances: 5');
  });
  it('preserves canonical create, access projection and rollback logic',()=>{
    expect(creation).toContain('export const adminCreateUser = onCall(');
    expect(creation).toContain('writeCanonicalAuthUserCreatePlan({');
    expect(creation).toContain('refreshAuthAccessReadModelBestEffort({');
    expect(creation).toContain('.deleteUser(createdUid)');
  });
  it('retains both public exports',()=>{
    expect(index).toContain('adminCreateUser');
    expect(index).toContain('backfillTeacherDocs');
  });
});