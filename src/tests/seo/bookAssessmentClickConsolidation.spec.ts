import { beforeEach, describe, expect, it, vi } from 'vitest';

const { trackEventMock } = vi.hoisted(() => ({
  trackEventMock: vi.fn(),
}));

vi.mock('../../lib/analytics', () => ({
  trackEvent: trackEventMock,
}));

import { trackBookDemoClick, trackGenerateLead } from '../../lib/conversionTracking';

describe('Single canonical assessment CTA event', () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it('emits exactly one book_assessment_click for one assessment CTA interaction', () => {
    // Existing call sites retain their function name while the emitted event is unified.
    trackBookDemoClick('/phonics:Book free assessment');

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(
      'book_assessment_click',
      expect.objectContaining({
        location: '/phonics:Book free assessment',
        page_path: expect.any(String),
        landing_page: expect.any(String),
      }),
    );
    expect(trackEventMock.mock.calls.some(([name]) => name === 'book_demo_click')).toBe(false);
  });

  it('keeps separate user clicks distinct without emitting the retired event', () => {
    trackBookDemoClick('/pricing:Book assessment');
    trackBookDemoClick('/speaking:Book assessment');

    expect(trackEventMock).toHaveBeenCalledTimes(2);
    expect(trackEventMock.mock.calls.map(([name]) => name)).toEqual([
      'book_assessment_click',
      'book_assessment_click',
    ]);
  });

  it('preserves the saved-lead event without a submission identifier', () => {
    trackGenerateLead({ form_name: 'public_assessment_form' });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(
      'generate_lead',
      expect.objectContaining({ form_name: 'public_assessment_form' }),
    );
    expect(trackEventMock.mock.calls[0][1]).not.toHaveProperty('submission_id');
  });
});
