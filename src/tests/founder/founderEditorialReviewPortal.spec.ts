import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8');

describe('Founder workspace programmatic quality status', () => {
  it('keeps the protected founder/admin shell unchanged while retiring manual review actions', () => {
    const dashboard = read('src/pages/admin/AdminDashboard.tsx');
    const panel = read('src/pages/founder/FounderEditorialReviewsPanel.tsx');

    expect(dashboard).toContain("portal?: 'admin' | 'founder'");
    expect(dashboard).toContain('FounderEditorialReviewsPanel');
    expect(panel).toContain('Pre-publication Quality Status');
    expect(panel).toContain('Post-publication approvals required');
    expect(panel).not.toContain('getFounderEditorialReviewState');
    expect(panel).not.toContain('setFounderEditorialReviewDecision');
    expect(panel).not.toContain('Approve');
    expect(panel).not.toContain('Request Changes');
  });

  it('keeps public phonics pages independent from review-state reads and reviewer claims', () => {
    const page = read('src/pages/PhonicsKnowledgePage.tsx');
    expect(page).not.toContain('usePublicEditorialApproval');
    expect(page).not.toContain('getApprovedPhonicsEditorialReview');
    expect(page).not.toContain('Reviewed for phonics accuracy by');
    expect(page).not.toContain('reviewedBy');
  });
});
