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
  const dashboard = read('src/pages/admin/AttendanceValidationDashboard.tsx');
  const routes = read('src/app/routes.tsx');
  const adminDashboard = read('src/pages/admin/AdminDashboard.tsx');
  const tracker = read('src/pages/admin/components/AttendanceValidationMonthlyTracker.tsx');
  const monthlyProgress = read('src/lib/attendanceValidationMonthlyParentProgress.ts');

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

  it('uses a monthly task queue that opens dedicated parent review routes', () => {
    expect(dashboard).toContain('AttendanceValidationMonthlyTracker');
    expect(tracker).toContain('Monthly Parent Validation Tracker');
    expect(tracker).toContain("'updateAttendanceValidationMonthlyParentProgress'");
    expect(tracker).toContain("currentStatus === 'not_started'");
    expect(tracker).toContain("updateStatus(parentId, 'in_progress')");
    expect(tracker).toContain("status === 'completed'");
    expect(tracker).toContain('loadAvsMonthlyParentProgress(selectedMonth)');
    expect(tracker).toContain('loadAvsMonthlyParentsWithSessions(selectedMonth)');
    expect(tracker).toContain('void loadTracker()');
    expect(tracker).toContain('sessionCountByParent[parent.id]');
    expect(tracker).not.toContain('aria-label={`Status for ${parent.label}`}');
    expect(tracker).toContain('With sessions this month');
    expect(tracker).toContain('All parents');
    expect(tracker).toContain("useState<TrackerScope>('with_sessions')");
    expect(monthlyProgress).toContain("collectionGroup(db, 'months')");
    expect(monthlyProgress).toContain("where('monthKey', '==', selectedMonth)");
    expect(monthlyProgress).not.toContain("collection(db, 'classSessions')");
    expect(tracker).not.toContain('runAttendanceValidationRange');
    expect(dashboard).toContain('/surya/attendance-validation/${encodeURIComponent(input.parentId)}');
    expect(dashboard).toContain('isParentReviewMode');
    expect(dashboard).toContain('isTrackerMode');
    expect(dashboard).toContain('Advanced validation');
    expect(routes).toContain("{ path: 'attendance-validation/advanced', element: <AdminDashboard /> }");
    expect(routes).toContain("{ path: 'attendance-validation/:parentId', element: <AdminDashboard /> }");
    expect(adminDashboard).toContain("location.pathname.startsWith('/surya/attendance-validation')");
  });
});
