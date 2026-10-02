import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AV6 admin attendance validation dashboard', () => {
  const dashboard = readRepoFile('src/pages/admin/AttendanceValidationDashboard.tsx');
  const tracker = readRepoFile('src/pages/admin/components/AttendanceValidationMonthlyTracker.tsx');
  const adminDashboard = readRepoFile('src/pages/admin/AdminDashboard.tsx');
  const sidebar = readRepoFile('src/pages/admin/components/Sidebar.tsx');
  const routes = readRepoFile('src/app/routes.tsx');
  const firestoreRules = readRepoFile('firestore.rules');
  const callFunctions = readRepoFile('src/lib/callFunctions.ts');
  const businessView = readRepoFile(
    'src/pages/admin/components/AttendanceValidationBusinessView.tsx',
  );
  const correctionPanel = readRepoFile(
    'src/pages/admin/AttendanceCorrectionsAdvancedPanel.tsx',
  );
  const businessReconciliation = readRepoFile(
    'src/lib/attendanceValidationBusinessReconciliation.ts',
  );
  const businessOutcomeEngine = readRepoFile(
    'functions/src/attendanceValidation/businessOutcomeEngine.ts',
  );
  const shadowRunner = readRepoFile(
    'functions/src/attendanceValidation/shadowRunner.ts',
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

  it('keeps the tracker landing separate while a parent review auto-loads only cached AVS cases', () => {
    expect(dashboard).toContain('if (isTrackerMode)');
    expect(dashboard).toContain('AttendanceValidationMonthlyTracker');
    expect(dashboard).toContain('if (!isParentReviewMode || !routeParentId) return;');
    expect(dashboard).toContain('void loadSavedCases(false, true)');
    expect(dashboard).toContain('Saved cases load when this review opens.');
    expect(dashboard).toContain('Microsoft Graph is never called by opening the page');
    expect(dashboard).toContain("searchParams.get('avsRechecked')");
    expect(dashboard).toContain("getDoc(doc(db, 'attendanceValidationCases', id))");
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

  it('splits Verified into Present Match and Zero Match without mixing admin overrides', () => {
    expect(businessView).toContain('All Verified ({tabCounts.verified})');
    expect(businessView).toContain('Present Match ({verifiedCounts.present_match})');
    expect(businessView).toContain('Zero Match ({verifiedCounts.zero_match})');
    expect(businessView).toContain('Admin Verified ({verifiedCounts.admin})');
    expect(businessReconciliation).toContain("'present_match'");
    expect(businessReconciliation).toContain("'zero_match'");
    expect(businessReconciliation).toContain("'admin'");
  });

  it('guides False Absent admins by the remaining Teams-supported Present count', () => {
    expect(businessView).toContain('Teams summary: {group.teamsSupportedPresentCount ?? 0} Present');
    expect(businessView).toContain('Choose {group.differenceCount} row');
    expect(businessView).toContain('below to mark Present.');
    expect(businessView).toContain('Mark Present');
  });

  it('filters the already-loaded business groups by canonical teacher identity', () => {
    expect(businessView).toContain("const [teacherFilter, setTeacherFilter] = useState('all')");
    expect(businessView).toContain('teacherFilterKey(group.teacherId, group.teacherName)');
    expect(businessView).toContain('Filter AVS business reconciliation by teacher');
    expect(businessView).toContain('All teachers ({teacherOptions.length})');
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

  it('keeps AVS itself read-only while routing explicit admin corrections through the canonical workflow', () => {
    expect(dashboard).not.toContain('setDoc(');
    expect(dashboard).not.toContain('updateDoc(');
    expect(dashboard).not.toContain('deleteDoc(');
    expect(dashboard).not.toContain('addDoc(');
    expect(dashboard).not.toContain('writeBatch(');
    expect(dashboard).toContain('returnTo={detailReturnTo}');
    expect(businessView).toContain("params.set('tab', 'attendance-corrections')");
    expect(businessView).toContain("params.set('avsAdmin', '1')");
    expect(businessView).toContain('Mark Present');
    expect(businessView).toContain('Mark Absent');
  });

  it('keeps the September 2026 AVS floor while monthly reviews use fixed month boundaries', () => {
    expect(dashboard).toContain("export const AV6_VALIDATION_START_YMD = '2026-09-01'");
    expect(dashboard).toContain('const detailRange = monthDateRange(detailMonthKey)');
    expect(dashboard).toContain('Review period: {formatServiceDate(detailRange.fromDate)}');
    expect(dashboard).toContain('previousCompletedMonthKey()');
  });

  it('is wired into desktop, mobile, tab and route navigation', () => {
    expect(adminDashboard).toContain("import AttendanceValidationDashboard from './AttendanceValidationDashboard'");
    expect(adminDashboard).toContain("{ id: 'attendance-validation', label: 'Month Close', icon: ShieldCheck }");
    expect(adminDashboard).toContain("'attendance-validation'");
    expect(adminDashboard).toContain('<TabsContent value="attendance-validation"');
    expect(adminDashboard).toContain('<AttendanceValidationDashboard />');

    expect(sidebar).toContain(
      "{ id: 'attendance-validation', label: 'Parent Month Close', icon: ShieldCheck }",
    );
    expect(routes).toContain(
      `{ path: 'attendance-validation', element: <Navigate to="/surya?tab=attendance-validation" replace /> }`,
    );
    expect(routes).toContain(
      `{ path: 'attendance-validation/advanced', element: <AdminDashboard /> }`,
    );
    expect(routes).toContain(
      `{ path: 'attendance-validation/:parentId', element: <AdminDashboard /> }`,
    );
    expect(adminDashboard).toContain(
      "location.pathname.startsWith('/surya/attendance-validation')",
    );
  });


  it('integrates attendance, billing, invoice communication and payment without duplicating finance truth', () => {
    expect(dashboard).toContain('Parent Month Close');
    expect(dashboard).toContain('Billing, invoice & payment');
    expect(dashboard).toContain("updateMonthCloseWorkflow('billing_reviewed')");
    expect(dashboard).toContain("updateMonthCloseWorkflow('invoice_sent')");
    expect(dashboard).toContain("navigate(parentPaymentsUrl('invoice'))");
    expect(dashboard).toContain("navigate(parentPaymentsUrl('receive'))");
    expect(dashboard).toContain("openParentWhatsApp('invoice')");
    expect(dashboard).toContain("openParentWhatsApp('reminder')");
    expect(dashboard).toContain('No duplicate payment state is stored here.');
    expect(dashboard).not.toContain("collection(db, 'billingCharges')");
    expect(dashboard).not.toContain("collection(db, 'payments')");
  });

  it('refreshes the exact billing model after correction and attendance completion and uses verified callable billing', () => {
    expect(dashboard).toContain('Promise.all([reloadExactCases(ids), refreshDetailBilling()])');
    expect(dashboard).toContain("if (result.status === 'completed') await refreshDetailBilling()");
    expect(dashboard).toContain('await reloadExactCases(result.classSessionIds);\n                await refreshDetailBilling();');
    expect(dashboard).toContain('setDetailBilling(verifiedBilling)');
    expect(dashboard).toContain('setDetailBilling(null)');
  });

  it('shows zero-charge months without an invoice and distinguishes sessions from billable classes', () => {
    expect(tracker).toContain("billing?.billedAmount <= 0.01");
    expect(tracker).toContain("? 'Not required'");
    expect(tracker).toContain('Sessions · Billable');
    expect(tracker).toContain('`${billing.sessionCount} sessions · ${billing.billedClassCount} billed`');
    expect(dashboard).toContain("? 'Not required'");
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
    expect(businessView).toContain('Teams Present');
    expect(businessView).toContain('Tiny Steps Present');
    expect(businessView).toContain('Difference');
    expect(businessView).toContain('formatServiceDate(group.serviceDateYmd)');
    expect(businessView).toContain("group.studentName || 'Student name unavailable'");
    expect(businessView).toContain("group.teacherName || 'Teacher name unavailable'");
  });

  it('keeps source-record counts out of the operator outcome surface', () => {
    expect(dashboard).not.toContain('Loaded AVS source cases');
    expect(dashboard).not.toContain("{cases.length} saved case");
    expect(dashboard).not.toContain('Saved/rebuilt AVS cases this call');
    expect(dashboard).toContain('source records; parent enrollment chunks are merged into one page');
    expect(businessView).toContain("value: 'verified', label: 'Verified'");
    expect(businessView).toContain("value: 'false_present', label: 'False Present'");
    expect(businessView).toContain("value: 'false_absent', label: 'False Absent'");
  });

  it('shows the refined operator surfaces with saved-result and validation actions', () => {
    expect(dashboard).toContain('Load results');
    expect(dashboard).toContain('Run validation');
    expect(dashboard).toContain('Continue validation');
    expect(dashboard).toContain(
      "'runAttendanceValidationRange'",
    );
    expect(dashboard).toContain("{ fromDate, toDate, ...(parentId !== 'all' ? { parentId } : {})");
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
      'fresh Teams reads occur only when you explicitly run validation or re-fetch a case.',
    );
    expect(dashboard).toContain(
      'Run validation decides whether cached evidence can be reused or fresh Teams evidence is required.',
    );
  });

  it('shows a compact Run Validation result with continuation instead of pipeline-stage cards', () => {
    expect(dashboard).toContain('Validation batch complete');
    expect(dashboard).toContain('validationResult.processedSessionCount');
    expect(dashboard).toContain('validationResult.cachedRevalidatedCount');
    expect(dashboard).toContain('validationResult.freshRefreshedCount');
    expect(dashboard).toContain('validationResult.firstEvidenceCollectedCount');
    expect(dashboard).toContain('session record{validationResult.processedSessionCount === 1');
    expect(dashboard).not.toContain('already had a saved AVS case');
    expect(dashboard).not.toContain('Saved/rebuilt AVS cases this call');
    expect(dashboard).toContain('formatFailureCodeCounts');
    expect(dashboard).toContain('formatFreshFailureDiagnostics');
    expect(dashboard).toContain('Failure codes:');
    expect(dashboard).toContain('Failure detail:');
    expect(dashboard).toContain('validationResult.graphLogicalCalls');
    expect(dashboard).toContain('validationResult.continueValidation');
    expect(dashboard).toContain(
      'Click Continue Validation to process the next bounded batch',
    );
  });

  it('keeps the old range callable for compatibility but removes its button', () => {
    expect(dashboard).not.toContain('onClick={() => void forceFreshSelectedRange()}');
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

  it('adds row-level attendance, cached recheck, and advanced Teams actions', () => {
    expect(businessView).toContain('Mark Present');
    expect(businessView).toContain('Mark Absent');
    expect(businessView).toContain("params.set('sessionId', item.classSessionId)");
    expect(businessView).toContain("params.set('kidId', item.kidId)");
    expect(businessView).toContain("params.set('enrollmentId', item.enrollmentId)");
    expect(businessView).not.toContain('Re-fetch this case');
    expect(businessView).toContain('Refresh Tiny Steps');
    expect(businessView).toContain('Advanced: Re-fetch Teams Evidence');
    expect(callFunctions).toContain(
      "forceRefreshAttendanceValidationEvidence: 'asia-south1'",
    );
  });


  it('returns attendance corrections to the exact parent-month review', () => {
    expect(businessView).toContain("params.set('avsReturn', returnTo)");
    expect(correctionPanel).toContain("searchParams.get('avsReturn')");
    expect(correctionPanel).toContain("value.startsWith('/surya/attendance-validation/')");
    expect(correctionPanel).toContain("navigate(queryString ? `${returnPath}?${queryString}` : returnPath");
    expect(correctionPanel).toContain("navigate(avsReturnTo || '/surya?tab=attendance-validation')");
  });

  it('classifies Firebase transport failures without weakening the safe failure boundary', () => {
    expect(dashboard).toContain('isAvsTransportFailure');
    expect(dashboard).toContain('err_name_not_resolved');
    expect(dashboard).toContain('functions/internal');
    expect(dashboard).toContain('temporary network, DNS, or service issue');
    expect(dashboard).toContain('Nothing was changed. Please retry.');
    expect(dashboard).toContain('safeLoadResultsFailureMessage(loadError)');
    expect(dashboard).toContain('safeRunValidationFailureMessage(validationError)');
  });

  it('surfaces safe re-fetch organizer failures without exposing organizer IDs', () => {
    expect(dashboard).toContain('safeForceFreshFailureMessage');
    expect(dashboard).toContain('organizer_config_invalid');
    expect(dashboard).toContain('organizer_identity_ambiguous');
    expect(dashboard).toContain('organizer_identity_unresolved');
    expect(dashboard).toContain('Re-fetch stopped before Microsoft Graph');
    expect(dashboard).not.toContain('f0f84eef-5cc2-4ece-8356-df08c2f113bb');
  });

  it('uses only the strict Present-count business rule and persists its backend result', () => {
    expect(dashboard).toContain('businessOutcome');
    expect(dashboard).toContain('teamsSupportedPresentCount');
    expect(dashboard).toContain('tinyStepsPresentCount');
    expect(dashboard).toContain('businessDifferenceCount');
    expect(businessOutcomeEngine).toContain(
      'AVS_BUSINESS_PRESENT_OVERLAP_SECONDS = 25 * 60',
    );
    expect(businessOutcomeEngine).toContain('reconcileAvsBusinessOutcome');
    expect(businessReconciliation).toContain('groupPersistedAvsBusinessOutcomes');
    expect(businessReconciliation).toContain('performs no attendance inference');
  });

  it('does not expose legacy AVS classifications in the business view', () => {
    expect(businessView).not.toContain('Internal:');
    expect(businessView).not.toContain("label: 'No class'");
    expect(businessView).not.toContain("label: 'Missing Teams'");
    expect(businessView).not.toContain("label: 'Ambiguous'");
    expect(businessView).not.toContain("label: 'Conflict'");
  });

  it('automatically reloads saved results after unified validation', () => {
    expect(dashboard).toContain('setValidationResult(result)');
    expect(dashboard).toContain('setValidationCompletedAt(new Date())');
    expect(dashboard).toContain('await loadSavedCases(false, true)');
  });

  it('keeps non-evaluable evidence internal and completely out of the operator business view', () => {
    expect(businessView).toContain("type OperatorBusinessOutcome = Exclude<AvsBusinessOutcome, 'not_evaluable'>");
    expect(businessView).toContain('groups.filter((group) => isOperatorBusinessOutcome(group.outcome))');
    expect(businessView).not.toContain('not evaluated');
    expect(businessView).not.toContain('Show technical reasons');
    expect(businessView).not.toContain('technicalReasonsForGroup');
    expect(businessView).not.toContain("label: 'Not Evaluable'");
    expect(shadowRunner).toContain("businessOutcome: 'not_evaluable'");
    expect(shadowRunner).toContain("resolutionStatus: 'needs_review'");
  });
});
