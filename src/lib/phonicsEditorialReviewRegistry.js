import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
} from './phonicsProgrammaticPilot.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_EDITORIAL_REVIEW_REVISION = '2026-09-09-r9.1';
export const PHONICS_EDITORIAL_REVIEW_STATUSES = freezeList([
  'pending',
  'approved',
  'changes-requested',
]);
export const PHONICS_EDITORIAL_REVIEWER_KEYS = freezeList(['founder-priya']);

/**
 * Human review decisions live at the publication layer, never in Brick 8.
 *
 * IMPORTANT: Do not mark a record approved until the named reviewer has
 * actually reviewed that exact R9 publication revision. Pending records must
 * not render a public review claim or reviewedBy structured data.
 */
const REVIEW_DECISIONS = freeze({
  // Example shape after a real review (do not copy without an actual review):
  // 'ck-rule': freeze({
  //   editorialReviewStatus: 'approved',
  //   reviewerKey: 'founder-priya',
  //   reviewedAt: '2026-09-09',
  //   reviewedRevision: '2026-09-09-r9',
  //   reviewNotes: 'Checked rule wording, examples, exceptions and teaching sequence.',
  // }),
});

function buildReviewRecord(page) {
  const decision = REVIEW_DECISIONS[page.conceptId] ?? {};
  return freeze({
    conceptId: page.conceptId,
    path: page.path,
    reviewerKey: decision.reviewerKey ?? 'founder-priya',
    editorialReviewStatus: decision.editorialReviewStatus ?? 'pending',
    reviewedAt: decision.reviewedAt ?? null,
    reviewedRevision: decision.reviewedRevision ?? null,
    reviewNotes: decision.reviewNotes ?? null,
    governanceRevision: PHONICS_EDITORIAL_REVIEW_REVISION,
  });
}

export const PHONICS_EDITORIAL_REVIEW_RECORDS = freezeList(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map(buildReviewRecord),
);

const byConceptId = new Map(PHONICS_EDITORIAL_REVIEW_RECORDS.map((record) => [record.conceptId, record]));
const byPath = new Map(PHONICS_EDITORIAL_REVIEW_RECORDS.map((record) => [record.path, record]));

export const getPhonicsEditorialReviewByConceptId = (conceptId) =>
  byConceptId.get(String(conceptId || '')) ?? null;

export const getPhonicsEditorialReviewByPath = (pathname) => {
  const normalized = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return byPath.get(normalized) ?? null;
};

export const getApprovedPhonicsEditorialReview = (pathname) => {
  const record = getPhonicsEditorialReviewByPath(pathname);
  return record?.editorialReviewStatus === 'approved' ? record : null;
};
