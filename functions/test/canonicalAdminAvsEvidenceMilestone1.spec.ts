import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const read=(p:string)=>fs.readFileSync(path.resolve(process.cwd(),p),'utf8');
const src=read('functions/src/attendanceValidation/forceFreshEvidenceCallable.ts');
const idx=read('functions/src/index.ts');
describe('Wave 1 milestone 1 AVS evidence canonical Admin migration',()=>{
  it('requires canonical Admin with no legacy fallback',()=>{
    expect(src).toContain("from '../helpers/canonicalAdminGuard'");
    expect(src).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(src).not.toContain("from '../helpers/adminGuard'");
    expect(src).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves existing evidence transport and operational restrictions',()=>{
    expect(src).toContain('forceRefreshAttendanceValidationEvidence = onCall(');
    expect(src).toContain('MICROSOFT_TENANT_ID');
    expect(src).toContain('MICROSOFT_CLIENT_ID');
    expect(src).toContain('MICROSOFT_CLIENT_SECRET');
    expect(src).toContain('operationalMutationAllowed: false');
  });
  it('retains exported evidence callable',()=>{
    expect(idx).toContain('forceRefreshAttendanceValidationEvidence');
  });
});