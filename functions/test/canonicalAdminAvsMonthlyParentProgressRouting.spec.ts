import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const source = read('functions/src/attendanceValidation/monthlyParentProgressCallable.ts');
const indexSource = read('functions/src/index.ts');

describe('Wave 1 R5C2C15 AVS monthly parent progress canonical Admin authorization', () => {
  it('uses canonical Admin authority, with no legacy Admin fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });

  it('preserves only the existing completed-month AVS parent workflow', () => {
    expect(source).toContain("const COLLECTION = 'attendanceValidationMonthlyParentProgress';");
    expect(source).toContain("const START_MONTH = '2026-09';");
    expect(source).toContain("const ALLOWED_STATUSES = new Set(['not_started', 'in_progress', 'completed']);");
    expect(source).toContain("type WorkflowAction = 'billing_reviewed' | 'invoice_sent';");
    expect(source).toContain("db.collection('users').doc(parentId).get()");
    expect(source).toContain("const ref = db.collection(COLLECTION).doc(progressId);");
    expect(source).not.toContain("db.collection('payments')");
    expect(source).not.toContain("db.collection('teacherEarnings')");
    expect(source).not.toContain("db.collection('billingCharges')");
  });

  it('retains one separately deployable callable', () => {
    expect(indexSource).toContain(
      'export { updateAttendanceValidationMonthlyParentProgress } from "./attendanceValidation/monthlyParentProgressCallable";',
    );
  });
});
