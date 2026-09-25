import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8');

const backend = read('functions/src/founderEditorialReview.ts');
const dashboard = read('src/pages/founder/FounderDashboard.tsx');
const reviewPanel = read('src/pages/founder/FounderEditorialReviewsPanel.tsx');
const adminDashboard = read('src/pages/admin/AdminDashboard.tsx');
const sidebar = read('src/pages/admin/components/Sidebar.tsx');
const header = read('src/pages/admin/components/Header.tsx');
const studentWorkspace = read('src/pages/admin/StudentManagement/StudentManagementTab.tsx');
const routes = read('src/app/routes.tsx');
const rules = read('firestore.rules');
const publicReader = read('src/lib/publicEditorialReview.ts');
const phonicsPage = read('src/pages/PhonicsKnowledgePage.tsx');
const firebaseConfig = JSON.parse(read('firebase.json'));

describe('Founder editorial review portal contract', () => {
  it('covers exactly the 31 governed phonics publications at their exact revisions', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);

    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES as readonly any[]) {
      expect(backend).toContain(`"${page.conceptId}": "${page.publicationRevision}"`);
    }
  });

  it('keeps founder approval server-authorized and revision-bound', () => {
    expect(backend).toContain('role !== "founder" || status !== "active"');
    expect(backend).toContain('reviewedByUid: uid');
    expect(backend).toContain('reviewedRevision: status === "approved" ? publicationRevision : null');
    expect(backend).toContain('status !== "approved" && status !== "changes-requested"');
    expect(backend).toContain('delete publicApprovals[conceptId]');
  });

  it('provides a founder-only login and reuses the Admin shell with an allowlisted management view', () => {
    expect(routes).toContain("{ path: 'founder/login', element: <LoginPage /> }");
    expect(routes).toContain("withRoleGate(['founder'], '/founder/login')");
    expect(routes).toContain('<FounderDashboard />');

    expect(dashboard).toContain('<AdminDashboard portal="founder" />');
    expect(adminDashboard).toContain("portal?: 'admin' | 'founder'");
    expect(adminDashboard).toContain("'editorial-reviews'");
    expect(adminDashboard).toContain("'attendance-validation'");
    expect(adminDashboard).toContain("'teacher-payments'");
    expect(adminDashboard).toContain("'parent-payments'");
    expect(adminDashboard).toContain("FOUNDER_BLOCKED_ADMIN_TABS");
    expect(adminDashboard).toContain("'users'");
    expect(adminDashboard).toContain("'attendance-corrections'");
    expect(adminDashboard).toContain("'today-notifications'");
    expect(adminDashboard).toContain("'settings'");
    expect(adminDashboard).toContain("'relationships'");

    expect(sidebar).toContain("portal === 'founder' ? 'Founder' : 'Admin Panel'");
    expect(sidebar).toContain("navigate(`${basePath}?tab=${tab.id}`)");
    expect(header).toContain("portal === 'founder' ? '/founder/login' : '/surya/login'");
    expect(studentWorkspace).toContain("location.pathname.startsWith('/founder') ? '/founder' : '/surya'");

    expect(reviewPanel).toContain('Editorial Reviews');
    expect(reviewPanel).toContain('Open Page');
    expect(reviewPanel).toContain("'approved'");
    expect(reviewPanel).toContain("'changes-requested'");
  });

  it('keeps direct founder URLs on the authenticated SPA shell', () => {
    const rewrites = firebaseConfig.hosting.rewrites as Array<{ source?: string; destination?: string }>;
    const headers = firebaseConfig.hosting.headers as Array<{ source?: string; headers?: Array<{ key?: string; value?: string }> }>;

    expect(rewrites).toContainEqual({ source: '/founder', destination: '/index.html' });
    expect(rewrites).toContainEqual({ source: '/founder/**', destination: '/index.html' });

    for (const source of ['/founder', '/founder/**']) {
      const header = headers.find((entry) => entry.source === source);
      expect(header?.headers).toContainEqual({
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive',
      });
    }
  });

  it('keeps private review state server-only while founder management access stays read-only', () => {
    expect(rules).toContain('match /publicEditorialReviewState/{docId}');
    expect(rules).toContain('allow read: if true;');
    expect(rules).toContain('match /editorialReviewState/{docId}');
    expect(rules).toContain('match /editorialReviewAudit/{docId}');

    expect(rules).toContain('Founder management view (read-only lift-and-shift)');
    for (const collectionName of [
      'users',
      'schools',
      'kids',
      'students',
      'enrollments',
      'classSessions',
      'courses',
      'leads',
      'demoSessions',
      'parentClassRecordings',
      'classSamples',
      'testimonials',
      'parentWorksheetLibrary',
      'billingCharges',
      'payments',
      'parentWallets',
      'parentMonthlyReadModels',
      'teacherPayouts',
      'teacherPaymentOffsets',
      'teacherEarnings',
      'attendanceValidationCases',
    ]) {
      expect(rules).toContain(`match /${collectionName}/{document=**}`);
    }
    expect(rules).toContain('allow read: if isFounder();');
    expect(rules).not.toContain('allow write: if isFounder();');
  });

  it('publishes attribution only for an approval matching the current revision', () => {
    expect(publicReader).toContain("candidate.reviewedRevision === publicationRevision");
    expect(publicReader).toContain("candidate.reviewerKey === 'founder-priya'");
    expect(phonicsPage).toContain('usePublicEditorialApproval');
    expect(phonicsPage).toContain('reviewedBy');
    expect(phonicsPage).toContain('Reviewed for phonics accuracy by');

    const reviewAttributionIndex = phonicsPage.indexOf('Reviewed for phonics accuracy by');
    const nextLearningStepIndex = phonicsPage.indexOf('Your next learning step');
    expect(reviewAttributionIndex).toBeGreaterThan(nextLearningStepIndex);
  });
});
