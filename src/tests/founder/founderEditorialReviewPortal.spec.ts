import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8');

const backend = read('functions/src/founderEditorialReview.ts');
const dashboard = read('src/pages/founder/FounderDashboard.tsx');
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

  it('provides a founder-only login and lightweight review workspace', () => {
    expect(routes).toContain("{ path: 'founder/login', element: <LoginPage /> }");
    expect(routes).toContain("withRoleGate(['founder'], '/founder/login')");
    expect(routes).toContain('<FounderDashboard />');

    expect(dashboard).toContain('Editorial Reviews');
    expect(dashboard).toContain('Open Page');
    expect(dashboard).toContain('Logout');
    expect(dashboard).toContain('sticky top-0');
    expect(dashboard).toContain("'approved'");
    expect(dashboard).toContain("'changes-requested'");
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

  it('keeps private review state server-only and public approval state read-only', () => {
    expect(rules).toContain('match /publicEditorialReviewState/{docId}');
    expect(rules).toContain('allow read: if true;');
    expect(rules).toContain('match /editorialReviewState/{docId}');
    expect(rules).toContain('match /editorialReviewAudit/{docId}');
    expect(rules).toContain('!isFounder()');
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
