import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/createAdminHistoricalAttendanceSession.ts'),'utf8');
const index = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/index.ts'),'utf8');
describe('R5C2C23 historical attendance canonical Admin authorization',()=>{
  it('requires canonical Admin without fallback',()=>{
    expect(source).toContain("from './helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from './helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves guarded historical correction and atomic audit writes',()=>{
    expect(source).toContain("const SOURCE = 'admin_historical_attendance_correction'");
    expect(source).toContain('await db.runTransaction(async (tx) => {');
    expect(source).toContain('tx.create(sessionRef, {');
    expect(source).toContain('tx.create(auditRef, {');
    expect(source).toContain("status: 'completed'");
    expect(source).toContain('attendance: null');
    expect(source).toContain('historicalCorrection: true');
  });
  it('preserves deployed export',()=>{expect(index).toContain('createAdminHistoricalAttendanceSession');});
});