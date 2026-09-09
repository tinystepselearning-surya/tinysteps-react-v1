import { PHONICS_PROGRAMMATIC_PILOT_PAGES } from './phonicsProgrammaticPilot.js';
import { PHONICS_WAVE_2_PAGES } from './phonicsWave2Publication.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_EDITORIAL_REVIEW_REVISION = '2026-09-09-r9.1';
export const PHONICS_WAVE_2_EDITORIAL_REVIEW_REVISION = '2026-09-09-r12';
export const PHONICS_EDITORIAL_REVIEW_STATUSES = freezeList(['pending', 'approved', 'changes-requested']);
export const PHONICS_EDITORIAL_REVIEWER_KEYS = freezeList(['founder-priya']);

/** Never mark approved until the named reviewer has actually reviewed that exact publication revision. */
const PILOT_REVIEW_DECISIONS = freeze({});
const WAVE_2_REVIEW_DECISIONS = freeze({});

function buildReviewRecord(page, decisions, governanceRevision) {
  const decision = decisions[page.conceptId] ?? {};
  return freeze({
    conceptId: page.conceptId,
    path: page.path,
    reviewerKey: decision.reviewerKey ?? 'founder-priya',
    editorialReviewStatus: decision.editorialReviewStatus ?? 'pending',
    reviewedAt: decision.reviewedAt ?? null,
    reviewedRevision: decision.reviewedRevision ?? null,
    reviewNotes: decision.reviewNotes ?? null,
    governanceRevision,
  });
}

/** Historical R9.1 contract: exactly the original 16 pilot review records. */
export const PHONICS_EDITORIAL_REVIEW_RECORDS = freezeList(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => buildReviewRecord(page, PILOT_REVIEW_DECISIONS, PHONICS_EDITORIAL_REVIEW_REVISION)),
);

/** R12 adds a separate pending ledger for the 15 Wave 2 publications. */
export const PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS = freezeList(
  PHONICS_WAVE_2_PAGES.map((page) => buildReviewRecord(page, WAVE_2_REVIEW_DECISIONS, PHONICS_WAVE_2_EDITORIAL_REVIEW_REVISION)),
);

export const PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS = freezeList([
  ...PHONICS_EDITORIAL_REVIEW_RECORDS,
  ...PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS,
]);

const byConceptId = new Map(PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.map((record) => [record.conceptId, record]));
const byPath = new Map(PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS.map((record) => [record.path, record]));

export const getPhonicsEditorialReviewByConceptId = (conceptId) => byConceptId.get(String(conceptId || '')) ?? null;
export const getPhonicsEditorialReviewByPath = (pathname) => {
  const normalized = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return byPath.get(normalized) ?? null;
};
export const getApprovedPhonicsEditorialReview = (pathname) => {
  const record = getPhonicsEditorialReviewByPath(pathname);
  return record?.editorialReviewStatus === 'approved' ? record : null;
};
