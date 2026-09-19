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
  const callFunctions = readRepoFile('src/lib/callFunctions.ts');

  it('loads saved AVS cases only for the selected service-date range with a hard page cap', () => {
    expect(dashboard).toContain('export const AV6_CASE_READ_LIMIT = 100');
    expect(dashboard).toContain("collection(db, 'attendanceValidationCases')");
    expect(dashboard).toContain("where('serviceDateYmd', '>=', fromDate)");
    expect(dashboard).toContain("where('serviceDateYmd', '<=', toDate)");
    expect(dashboard).toContain("orderBy('serviceDateYmd', 'desc')");
    expect(dashboard).toContain('limit(AV6_CASE_READ_LIMIT)');
    expect(dashboard).toContain('startAfter(cursor)');
    expect(dashboard).toContain('await getDocs(casesQuery)');
  });

  it('does not auto-read AVS cases merely because the admin page opens', () => {
    expect(dashboard).not.toContain('useEffect(');
    expect(dashboard).toContain('Nothing refreshes automatically. Choose a range below.');
    expect(dashboard).toContain('Opening this page does not read them automatically.');
    expect(dashboard).toContain('Load Saved Results');
  });

  it('uses button tabs instead of a classification select', () => {
    expect(dashboard).toContain('const CLASSIFICATION_TABS');
    expect(dashboard).toContain('role="tablist"');
    expect(dashboard).toContain('role="tab"');
    expect(dashboard).toContain('aria-selected={active}');
    expect(dashboard).not.toContain('<select');
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
    expect(dashboard).toContain('Each page reads at most {AV6_CASE_READ_LIMIT} saved cases.');
  });

  it('keeps fresh revalidation visibly separate from cached result loading', () => {
    expect(dashboard).toContain('Load Saved Results');
    expect(dashboard).toContain('Run Latest Check');
    expect(dashboard).toContain(
      'Run Latest Check revalidates only changed sessions with cached evidence and makes zero Microsoft Graph calls.',
    );
    expect(dashboard).toContain(
      'Latest Check is intentionally capped at 31 calendar days per run.',
    );
  });

  it('calls the changed-only backend with the selected range and reloads that same saved window', () => {
    expect(dashboard).toContain(
      "'runAttendanceValidationLatestCheck'",
    );
    expect(dashboard).toContain('{ fromDate, toDate }');
    expect(dashboard).toContain('await loadSavedCases(false, true)');
    expect(dashboard).toContain('if (!preserveCurrentTab) setClassificationFilter(\'all\')');
    expect(callFunctions).toContain(
      "runAttendanceValidationLatestCheck: 'asia-south1'",
    );
  });

  it('shows an auditable latest-check result summary without implying Graph refresh', () => {
    expect(dashboard).toContain('Latest Check completed');
    expect(dashboard).toContain('latestCheckResult.dirtyFoundCount');
    expect(dashboard).toContain('latestCheckResult.revalidatedCount');
    expect(dashboard).toContain('latestCheckResult.baselineRequiredCount');
    expect(dashboard).toContain(
      'latestCheckResult.readBudget.boundedReadsExcludingStaffRegistry',
    );
    expect(dashboard).toContain('Microsoft Graph calls: {latestCheckResult.graphCalls}');
    expect(dashboard).toContain('latestCheckResult.dirtyBatchAtLimit');
    expect(dashboard).toContain('latestCheckResult.concurrentMarkerChangeDetected');
  });

  it('keeps latest-check range validation stricter than cached viewing', () => {
    expect(dashboard).toContain('inclusiveDateRangeDays(fromDate, toDate)');
    expect(dashboard).toContain(
      'Run Latest Check supports a maximum of 31 calendar days at a time.',
    );
  });
});
