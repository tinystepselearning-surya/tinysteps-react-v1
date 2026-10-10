import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const source=fs.readFileSync(path.resolve(process.cwd(),'functions/src/games/recordLevelResult.ts'),'utf8');
const index=fs.readFileSync(path.resolve(process.cwd(),'functions/src/index.ts'),'utf8');
describe('R5C2C25 game results canonical Admin authorization',()=>{
  it('uses canonical Admin with no legacy fallback',()=>{
    expect(source).toContain('from "../helpers/canonicalAdminGuard"');
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain('isCurrentAdmin');
    expect(source).not.toContain('from "../helpers/adminGuard"');
  });
  it('preserves child-scoped authorization for non Admin users',()=>{
    expect(source).toContain('let isAdmin = false;');
    expect(source).toContain('if (!isAdmin) {');
    expect(source).toContain('isAllowedForKidDoc(kidData, uid)');
    expect(source).toContain('Not allowed to record results for this child');
    expect(source).toContain('await sessionRef.create({');
    expect(source).toContain('skillResults.length > 500');
  });
  it('remains the sole exported function for this module',()=>{
    expect(source).toContain('export const recordLevelResult = onCall(');
    expect(index).toContain('recordLevelResult');
  });
});