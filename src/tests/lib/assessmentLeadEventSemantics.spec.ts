// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackGenerateLead,
  trackLeadFormAttempt,
  trackLeadFormSubmit,
} from '../../lib/conversionTracking';

const analytics = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock('../../lib/analytics', () => analytics);

describe('assessment form event semantics', () => {
  beforeEach(() => {
    analytics.trackEvent.mockReset();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/book-demo');
  });

  it('records an attempt as diagnostic, without a successful-submit or booking event', () => {
    trackLeadFormAttempt({ form_name: 'public_assessment_form', source_context: 'homepage_hero_assessment' });
    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith('lead_form_submit_attempt', expect.objectContaining({
      form_name: 'public_assessment_form',
      page_path: '/book-demo',
    }));
    const eventNames = analytics.trackEvent.mock.calls.map(([name]) => name);
    expect(eventNames).not.toContain('lead_form_submit');
    expect(eventNames).not.toContain('funnel_form_submit');
    expect(eventNames).not.toContain('generate_lead');
    expect(eventNames).not.toContain('funnel_demo_booking_complete');
  });

  it('keeps the existing two post-save submit events for successful leads', () => {
    trackLeadFormSubmit({ form_name: 'public_assessment_form' });
    trackGenerateLead({ form_name: 'public_assessment_form', submission_id: 'synthetic-id' });
    expect(analytics.trackEvent.mock.calls.map(([name]) => name)).toEqual([
      'lead_form_submit',
      'funnel_form_submit',
      'generate_lead',
    ]);
    expect(analytics.trackEvent).toHaveBeenCalledWith('generate_lead', expect.objectContaining({
      submission_id: 'synthetic-id',
    }));
    expect(analytics.trackEvent.mock.calls.map(([name]) => name)).not.toContain('funnel_demo_booking_complete');
  });
});
