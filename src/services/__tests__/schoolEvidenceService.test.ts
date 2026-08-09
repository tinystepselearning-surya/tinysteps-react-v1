import { describe, expect, it } from 'vitest';

import { toSchoolReview } from '../schoolEvidenceService';

describe('school evidence parsing', () => {
  it('preserves valid positive review judgements', () => {
    const review = toSchoolReview('review-1', {
      schoolId: 'school-a',
      academicYearId: 'ay',
      implementationRating: 'strong',
      overallStatus: 'on_track',
      summary: 'Implementation is consistent.',
      recommendation: 'Continue and reassess.',
    });

    expect(review.implementationRating).toBe('strong');
    expect(review.overallStatus).toBe('on_track');
  });

  it('does not silently turn malformed legacy review values into positive judgements', () => {
    const review = toSchoolReview('review-legacy', {
      schoolId: 'school-a',
      academicYearId: 'ay',
      implementationRating: 'unknown-value',
      overallStatus: null,
      summary: '',
      recommendation: '',
    });

    expect(review.implementationRating).toBe('developing');
    expect(review.overallStatus).toBe('needs_attention');
  });
});
