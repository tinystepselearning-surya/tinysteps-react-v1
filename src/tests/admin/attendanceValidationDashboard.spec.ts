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
  const businessView = readRepoFile(
    'src/pages/admin/components/AttendanceValidationBusinessView.tsx',
  );
  const businessReconciliation = readRepoFile(
    'src/lib/attendanceValidationBusinessReconciliation.ts',
  );

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
    expect(dashboard).toContain('Display names may use bounded enrollment and teacher-user reads only');
    expect(dashboard).toContain('Load Results');
  });

  it('shows exactly three primary business outcome tabs', () => {
    expect(dashboard).toContain('AttendanceValidationBusinessView');
    expect(businessView).toContain("value: 'verified', label: 'Verified'");
    expect(businessView).toContain("value: 'false_present', label: 'False Present'");
    expect(businessView).toContain("value: 'false_absent', label: 'False Absent'");
    expect(businessView).toContain('role="tablist"');
    expect(businessView).toContain('role="tab"');
    expect(businessView).toContain('aria-selected={active}');
    expect(businessView).not.toContain("label: 'Missing attendance'");
    expect(businessView).not.toContain("label: 'Conflict'");
    expect(businessView).not.toContain("label: 'No class'");
    expect(businessView).not.toContain("label: 'Missing Teams'");
    expect(businessView).not.toContain("label: 'Ambiguous'");
  });

  it('filters the already-loaded business groups by canonical teacher identity', () => {
    expect(businessView).toContain("const [teacherFilter, setTeacherFilter] = useState('all')");
    expect(businessView).toContain('teacherFilterKey(group.teacherId, group.teacherName)');
    expect(businessView).toContain('Filter AVS business reconciliation by teacher');
    expect(businessView).toContain('All teachers ({groups.length})');
    expect(dashboard).not.toContain("collection(db, 'kids')");
  });

  it('resets search and expanded group state when switching teachers', () => {
    expect(businessView).toContain('setTeacherFilter(value)');
    expect(businessView).toContain("setSearch('')");
    expect(businessView).toContain('setExpandedKey(null)');
  });

  it('uses bounded enrollment and canonical teacher-user reads for display names', () => {
    expect(dashboard).not.toContain('onSnapshot(');
    expect(dashboard).not.toContain("collection(db, 'classSessions')");
    expect(dashboard).toContain('enrichCaseDisplayNames');
    expect(dashboard).toContain("collection(db, 'enrollments')");
    expect(dashboard).toContain("collection(db, 'users')");
    expect(dashboard).toContain('readableDisplayName(data.displayName)');
    expect(dashboard).toContain('readableDisplayName(data.name)');
    expect(dashboard).toContain('readableDisplayName(data.email)');
    expect(dashboard).toContain('canonicalTeacherNames.set(docSnapshot.id, canonicalName)');
    expect(dashboard).toContain('canonicalTeacherName');
    expect(dashboard).toContain("where(documentId(), 'in', chunk)");
    expect(dashboard).toContain('index += 30');
    expect(dashboard).not.toContain("collection(db, 'kids')");
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
    expect(dashboard).toContain('Review saved AVS results and validate completed sessions from {AV6_VALIDATION_START_YMD} onward');
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

  it('shows student/day reconciliation with Teams-supported and Tiny Steps Present counts', () => {
    expect(businessView).toContain('<TableHead>Date</TableHead>');
    expect(businessView).toContain('<TableHead>Student</TableHead>');
    expect(businessView).toContain('<TableHead>Teacher</TableHead>');
    expect(businessView).toContain('Teams supported');
    expect(businessView).toContain('Tiny Steps Present');
    expect(businessView).toContain('Difference');
    expect(businessView).toContain('formatServiceDate(group.serviceDateYmd)');
    expect(businessView).toContain("group.studentName || 'Student name unavailable'");
    expect(businessView).toContain("group.teacherName || 'Teacher name unavailable'");
  });

  it('labels the source-case window separately from the three business outcomes', () => {
    expect(dashboard).toContain('Loaded AVS source cases');
    expect(dashboard).toContain('Verified, False Present, and False Absent');
    expect(businessView).toContain('Student/day groups with no Present-count discrepancy.');
    expect(businessView).toContain('Excess Tiny Steps Present marks beyond Teams-supported attendance.');
    expect(businessView).toContain('Teams-supported attendance missing from Tiny Steps Present marks.');
  });

  it('shows the refined normal operator surface with only Load Results and Run Validation', () => {
    expect(dashboard).toContain('Load Results');
    expect(dashboard).toContain('Run Validation');
    expect(dashboard).toContain('Continue Validation');
    expect(dashboard).toContain(
      "'runAttendanceValidationRange'",
    );
    expect(dashboard).toContain('{ fromDate, toDate }');
    expect(dashboard).toContain('await loadSavedCases(false, true)');
    expect(callFunctions).toContain(
      "runAttendanceValidationRange: 'asia-south1'",
    );
  });

  it('hides legacy pipeline stages from the normal admin UI', () => {
    expect(dashboard).not.toContain('Run Latest Check');
    expect(dashboard).not.toContain('Sync Teacher Identities');
    expect(dashboard).not.toContain('Run First-Time Baseline');
    expect(dashboard).not.toContain('Force Fresh Selected Range');
    expect(dashboard).not.toContain('Teacher Identity Rollout completed');
    expect(dashboard).not.toContain('First-Time Baseline batch complete');
    expect(dashboard).not.toContain('Latest Check completed');
  });

  it('keeps validation bounded to completed ranges and lets the backend choose cached versus fresh work', () => {
    expect(dashboard).toContain(
      'Run Validation supports a maximum of 31 calendar days at a time.',
    );
    expect(dashboard).toContain(
      'Run Validation can include only completed service dates through yesterday IST.',
    );
    expect(dashboard).toContain('max={yesterdayIstYmd()}');
    expect(dashboard).toContain(
      'cached revalidation, first-time Teams evidence, or a fresh Teams re-fetch',
    );
    expect(dashboard).toContain(
      'Fresh Microsoft Graph reads occur only when the unified backend determines they are required.',
    );
  });

  it('shows a compact Run Validation result with continuation instead of pipeline-stage cards', () => {
    expect(dashboard).toContain('Validation batch complete');
    expect(dashboard).toContain('validationResult.processedSessionCount');
    expect(dashboard).toContain('validationResult.cachedRevalidatedCount');
    expect(dashboard).toContain('validationResult.freshRefreshedCount');
    expect(dashboard).toContain('validationResult.firstEvidenceCollectedCount');
    expect(dashboard).toContain('validationResult.graphLogicalCalls');
    expect(dashboard).toContain('validationResult.continueValidation');
    expect(dashboard).toContain(
      'Click Continue Validation to process the next bounded batch',
    );
  });

  it('moves selected-range fresh Graph collection under Advanced and preserves Brick 4 generations', () => {
    expect(dashboard).toContain('<summary className="cursor-pointer text-sm font-medium text-slate-700">');
    expect(dashboard).toContain('Advanced');
    expect(dashboard).toContain('Re-fetch Teams Data');
    expect(dashboard).toContain('Continue Re-fetch');
    expect(dashboard).toContain('Retry Failed Re-fetches');
    expect(dashboard).toContain(
      "'forceRefreshAttendanceValidationRange'",
    );
    expect(dashboard).toContain(
      '{ fromDate, toDate, runId, retryFailures }',
    );
    expect(dashboard).toContain('forceFreshRangeGeneration');
    expect(callFunctions).toContain(
      "forceRefreshAttendanceValidationRange: 'asia-south1'",
    );
  });

  it('keeps the row-level exceptional fresh action as Re-fetch this case', () => {
    expect(dashboard).toContain('Re-fetch this case');
    expect(dashboard).toContain(
      "'forceRefreshAttendanceValidationEvidence'",
    );
    expect(dashboard).toContain('caseId: item.id');
    expect(dashboard).toContain(
      'inputFingerprint: item.inputFingerprint',
    );
    expect(callFunctions).toContain(
      "forceRefreshAttendanceValidationEvidence: 'asia-south1'",
    );
  });

  it('surfaces safe re-fetch organizer failures without exposing organizer IDs', () => {
    expect(dashboard).toContain('safeForceFreshFailureMessage');
    expect(dashboard).toContain('organizer_config_invalid');
    expect(dashboard).toContain('organizer_identity_ambiguous');
    expect(dashboard).toContain('organizer_identity_unresolved');
    expect(dashboard).toContain('Re-fetch stopped before Microsoft Graph');
    expect(dashboard).not.toContain('f0f84eef-5cc2-4ece-8356-df08c2f113bb');
  });

  it('surfaces auditable same-day Present-count reconciliation while preserving case diagnostics', () => {
    expect(dashboard).toContain('sameDayCoverageSeconds');
    expect(dashboard).toContain('sameDayPresentSessionCount');
    expect(dashboard).toContain('sameDayOccurrenceCount');
    expect(businessView).toContain('Same-day Teams overlap:');
    expect(businessView).toContain('Teams occurrences:');
    expect(businessView).toContain('Underlying Tiny Steps rows:');
    expect(businessReconciliation).toContain('AVS_BUSINESS_PRESENT_OVERLAP_SECONDS = 25 * 60');
    expect(businessReconciliation).toContain('supportedPresentCountFromOverlap');
  });

  it('keeps internal AVS classifications diagnostic instead of exposing them as primary tabs', () => {
    expect(dashboard).toContain("'NO_CLASS_OCCURRED'");
    expect(businessView).toContain('Internal:');
    expect(businessView).not.toContain("label: 'No class'");
    expect(businessView).not.toContain("label: 'Missing Teams'");
    expect(businessView).not.toContain("label: 'Ambiguous'");
  });

  it('automatically reloads saved results after unified validation', () => {
    expect(dashboard).toContain('setValidationResult(result)');
    expect(dashboard).toContain('setValidationCompletedAt(new Date())');
    expect(dashboard).toContain('await loadSavedCases(false, true)');
  });

  it('does not offer Re-fetch this case against placeholder evidence that does not exist', () => {
    expect(businessView).toContain(
      "!item.reasons.includes('evidence_document_missing')",
    );
  });
});
