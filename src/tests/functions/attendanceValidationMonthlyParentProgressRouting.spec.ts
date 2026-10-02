import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (relative: string) => fs.readFileSync(path.resolve(process.cwd(), relative), 'utf8');

describe('AVS monthly parent tracker routing', () => {
  const callable = read('functions/src/attendanceValidation/monthlyParentProgressCallable.ts');
  const index = read('functions/src/index.ts');
  const client = read('src/lib/callFunctions.ts');
  const rules = read('firestore.rules');
  const contract = read('scripts/avs-callable-contract.mjs');

  it('uses an admin-only callable and writes only monthly workflow metadata', () => {
    expect(callable).toContain('await ensureAdmin(request.auth)');
    expect(callable).toContain("const COLLECTION = 'attendanceValidationMonthlyParentProgress'");
    expect(callable).not.toContain("collection('classSessions')");
    expect(callable).not.toContain("collection('billingCharges')");
    expect(callable).not.toContain("collection('teacherEarnings')");
  });

  it('keeps Not Started implicit and scopes persisted progress by parent plus month', () => {
    expect(callable).toContain("if (status === 'not_started')");
    expect(callable).toContain('await ref.delete()');
    expect(callable).toContain('const progressId = `${monthKey}__${parentId}`');
  });

  it('exports and routes the callable in asia-south1', () => {
    expect(index).toContain(
      'export { updateAttendanceValidationMonthlyParentProgress } from "./attendanceValidation/monthlyParentProgressCallable";',
    );
    expect(client).toContain("updateAttendanceValidationMonthlyParentProgress: 'asia-south1'");
    expect(contract).toContain("'updateAttendanceValidationMonthlyParentProgress'");
  });

  it('keeps monthly progress browser-write protected', () => {
    expect(rules).toContain('match /attendanceValidationMonthlyParentProgress/{progressId}');
    expect(rules).toContain('allow read: if isAdmin();');
    expect(rules).toContain('allow create, update, delete: if false;');
  });
});
