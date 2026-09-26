import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_PREPUBLICATION_QUALITY_REVISION,
  PHONICS_PREPUBLICATION_QUALITY_STATE,
} from '../../lib/phonicsPrepublicationQuality.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../../lib/phonicsPublicationRegistry.js';

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

describe('Resources R9.1 retired human-review layer', () => {
  it('publishes only pages that already passed the pre-publication quality gate', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(page.prepublicationQualityState, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_STATE);
      expect(page.prepublicationQualityRevision, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_REVISION);
      expect(page.prepublicationQualityChecks.length, page.conceptId).toBeGreaterThanOrEqual(10);
    }
  });

  it('does not expose post-publication reviewer state on public phonics resources', () => {
    const page = read('src/pages/PhonicsKnowledgePage.tsx');
    expect(page).not.toContain('usePublicEditorialApproval');
    expect(page).not.toContain('getApprovedPhonicsEditorialReview');
    expect(page).not.toContain('Reviewed for phonics accuracy by');
    expect(page).not.toContain('reviewedBy');
  });

  it('retires manual review actions while preserving the founder workspace shell', () => {
    const dashboard = read('src/pages/admin/AdminDashboard.tsx');
    const panel = read('src/pages/founder/FounderEditorialReviewsPanel.tsx');
    expect(dashboard).toContain('FounderEditorialReviewsPanel');
    expect(panel).toContain('Pre-publication Quality Status');
    expect(panel).not.toContain('getFounderEditorialReviewState');
    expect(panel).not.toContain('setFounderEditorialReviewDecision');
    expect(panel).not.toContain('Request Changes');
  });
});
