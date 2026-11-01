/**
 * Explicitly approved Speaking-only meta description experiment (2026-11-01).
 *
 * Keep historical C4 search/CTR controls untouched for before/after reporting.
 * Changes only the search-result description. Course eligibility, H1, titles,
 * canonicals, links, prices, Phonics and assessment functionality remain unchanged.
 * Google may use page text instead of this metadata to generate its snippet.
 */
export const SPEAKING_META_DESCRIPTION_EXPERIMENT = Object.freeze({
  ownerPath: '/speaking',
  authorizedOn: '2026-11-01',
  status: 'approved-description-only',
  titleFrozen: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps',
  controlDescription:
    'Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.',
  candidateDescription:
    'Live 1:1 public speaking classes for kids. Practise clear answers, storytelling and presentations with teacher feedback. ₹400/class; free 35-min assessment.',
  noCourseEligibilityChange: true,
  noOtherPageChange: true,
});
