import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AV6 admin attendance validation dashboard', () => {
  const dashboard = readRepoFile('src/pages/admin/AttendanceValidationDashboard.tsx');
  const adminDashboard = readRepoFile('src/pages/admin/AdminDashboard.tsx');
  const sidebar = readRepoFile('src/pages/admin/components/Sidebar.tsx');
  const routes = readRepoFile('src/app/routes.tsx');
  const firestoreRules = readRepoFile('firestore.rules');

  it('uses a bounded one-shot Firestore query with a hard 100-document cap', () => {
    expect(dashboard).toContain('export const AV6_CASE_READ_LIMIT = 100');
    expect(dashboard).toContain("collection(db, 'attendanceValidationCases')");
    expect(dashboard).toContain("orderBy('observedAt', 'desc')");
    expect(dashboard).toContain('limit(AV6_CASE_READ_LIMIT)');
    expect(dashboard).toContain('await getDocs(casesQuery)');
  });

  it('does not use realtime listeners or operational collection lookups', () => {
    expect(dashboard).not.toContain('onSnapshot(');
    expect(dashboard).not.toContain("collection(db, 'classSessions')");
    expect(dashboard).not.toContain("collection(db, 'users')");
    expect(dashboard).not.toContain("collection(db, 'kids')");
    expect(dashboard).not.toContain("collection(db, 'enrollments')");
    expect(dashboard).not.toContain("collection(db, 'billingCharges')");
    expect(dashboard).not.toContain("collection(db, 'teacherEarnings')");
  });

  it('does not expose browser-side mutation primitives', () => {
    expect(dashboard).not.toContain('setDoc(');
    expect(dashboard).not.toContain('updateDoc(');
    expect(dashboard).not.toContain('deleteDoc(');
    expect(dashboard).not.toContain('addDoc(');
    expect(dashboard).not.toContain('writeBatch(');
    expect(dashboard).toContain('No attendance or financial correction can be made from this screen');
  });

  it('shows the permanent September 2026 validation scope', () => {
    expect(dashboard).toContain("export const AV6_VALIDATION_START_YMD = '2026-09-01'");
    expect(dashboard).toContain('Read-only AVS shadow cases from {AV6_VALIDATION_START_YMD} onward');
  });

  it('is wired into desktop, mobile, tab and route navigation', () => {
    expect(adminDashboard).toContain("import AttendanceValidationDashboard from './AttendanceValidationDashboard'");
    expect(adminDashboard).toContain("{ id: 'attendance-validation', label: 'AVS', icon: ShieldCheck }");
    expect(adminDashboard).toContain("'attendance-validation'");
    expect(adminDashboard).toContain('<TabsContent value="attendance-validation"');
    expect(adminDashboard).toContain('<AttendanceValidationDashboard />');

    expect(sidebar).toContain(
      "{ id: 'attendance-validation', label: 'Attendance Validation', icon: ShieldCheck }",
    );
    expect(routes).toContain(
      `{ path: 'attendance-validation', element: <Navigate to="/surya?tab=attendance-validation" replace /> }`,
    );
  });

  it('allows admin-only browser reads and denies all browser writes to AVS cases', () => {
    expect(firestoreRules).toContain('match /attendanceValidationCases/{caseId}');
    expect(firestoreRules).toContain('allow read: if isAdmin();');
    expect(firestoreRules).toContain('allow create, update, delete: if false;');
  });

  it('labels dashboard counts as a loaded-window view rather than global totals', () => {
    expect(dashboard).toContain('Loaded window');
    expect(dashboard).toContain('Within loaded window');
    expect(dashboard).toContain('One-shot bounded read: latest {AV6_CASE_READ_LIMIT} cases maximum.');
  });
});
