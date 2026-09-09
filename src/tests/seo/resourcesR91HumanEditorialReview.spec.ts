import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_EDITORIAL_REVIEW_RECORDS,
  PHONICS_EDITORIAL_REVIEW_STATUSES,
  getApprovedPhonicsEditorialReview,
  getPhonicsEditorialReviewByConceptId,
  getPhonicsEditorialReviewByPath,
} from '../../lib/phonicsEditorialReviewRegistry.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES } from '../../lib/phonicsProgrammaticPilot.js';
import { getEditorialReviewer } from '../../lib/editorialReviewerRegistry';
import {
  FOUNDER_ID,
  FOUNDER_PROFILE_PATH,
  FOUNDER_PROFILE_URL,
  PUBLIC_FACTS,
} from '../../lib/schemas';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('Resources R9.1 human editorial review layer', () => {
  it('creates exactly one review ledger record for every Brick 9 pilot page', () => {
    expect(PHONICS_EDITORIAL_REVIEW_RECORDS).toHaveLength(PHONICS_PROGRAMMATIC_PILOT_PAGES.length);
    expect(new Set(PHONICS_EDITORIAL_REVIEW_RECORDS.map((record) => record.conceptId)).size)
      .toBe(PHONICS_PROGRAMMATIC_PILOT_PAGES.length);
    expect(new Set(PHONICS_EDITORIAL_REVIEW_RECORDS.map((record) => record.path)).size)
      .toBe(PHONICS_PROGRAMMATIC_PILOT_PAGES.length);

    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      const byConcept = getPhonicsEditorialReviewByConceptId(page.conceptId);
      const byPath = getPhonicsEditorialReviewByPath(page.path);
      expect(byConcept?.path).toBe(page.path);
      expect(byPath?.conceptId).toBe(page.conceptId);
    }
  });

  it('never treats pending or changes-requested records as approved', () => {
    for (const record of PHONICS_EDITORIAL_REVIEW_RECORDS) {
      expect(PHONICS_EDITORIAL_REVIEW_STATUSES).toContain(record.editorialReviewStatus);
      if (record.editorialReviewStatus === 'approved') {
        expect(record.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(record.reviewedRevision).toBeTruthy();
        expect(getApprovedPhonicsEditorialReview(record.path)).toEqual(record);
      } else {
        expect(getApprovedPhonicsEditorialReview(record.path)).toBeNull();
      }
    }
  });

  it('starts with no fabricated human approvals', () => {
    expect(PHONICS_EDITORIAL_REVIEW_RECORDS.every((record) => record.editorialReviewStatus === 'pending')).toBe(true);
    expect(PHONICS_EDITORIAL_REVIEW_RECORDS.every((record) => record.reviewedAt === null)).toBe(true);
    expect(PHONICS_EDITORIAL_REVIEW_RECORDS.every((record) => record.reviewedRevision === null)).toBe(true);
  });

  it('resolves the assigned reviewer through the canonical founder entity', () => {
    const reviewer = getEditorialReviewer('founder-priya');
    expect(reviewer.fullName).toBe(PUBLIC_FACTS.founder.fullName);
    expect(reviewer.profilePath).toBe(FOUNDER_PROFILE_PATH);
    expect(reviewer.profileUrl).toBe(FOUNDER_PROFILE_URL);
    expect(reviewer.personId).toBe(FOUNDER_ID);
    expect(reviewer.profilePath).toBe('/team/vannala-ravali-priya');
  });

  it('renders attribution and reviewedBy schema only behind an approved review lookup', () => {
    const source = read('src/pages/PhonicsKnowledgePage.tsx');
    expect(source).toContain('getApprovedPhonicsEditorialReview(page.path)');
    expect(source).toContain('getEditorialReviewer(editorialReview.reviewerKey)');
    expect(source).toContain('Reviewed for phonics accuracy by');
    expect(source).toContain("reviewedBy: { '@id': reviewer.personId }");
    expect(source).toContain('editorialReview && reviewer');
    expect(source).not.toContain("editorialReviewStatus === 'pending' ?");
  });

  it('keeps human review governance out of the Brick 8 knowledge dataset', () => {
    const knowledgeDeclaration = read('src/content/phonicsKnowledge/index.d.ts');
    expect(knowledgeDeclaration).not.toContain('reviewedBy');
    expect(knowledgeDeclaration).not.toContain('reviewedAt');
    expect(knowledgeDeclaration).not.toContain('editorialReviewStatus');
  });
});
