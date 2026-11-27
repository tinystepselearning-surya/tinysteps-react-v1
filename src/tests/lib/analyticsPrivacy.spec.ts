// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('web analytics privacy', () => {
  const gtag = vi.fn();
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('PROD', true);
    vi.stubGlobal('location', new URL('https://tinystepslearning.com/pricing?utm_source=school-fair&utm_campaign=family%40example.test&kidId=fixture-child#auth-fixture'));
    gtag.mockClear();
    vi.stubGlobal('gtag', gtag);
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://tinystepslearning.com/parent/profile?token=fixture');
  });

  afterEach(() => {
    // Let the interaction timer remove its listeners without loading real tags.
    window.dispatchEvent(new Event('scroll'));
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('removes identifying fields from the actual Google tag invocation', async () => {
    const { trackEvent } = await import('../../lib/analytics');
    trackEvent('generate_lead', {
      submission_id: 'fixture-lead', documentId: 'fixture-record', kid_id: 'fixture-child',
      ChildName: 'Fixture Name', childAge: 7, mainConcern: 'private description',
      notes: 'private text', contact: 'fixture@invalid.test', recipient: '+91 98765 43210',
      extras: { kidId: 'nested-fixture' }, url: 'https://wa.me/example?text=fixture',
      utm_medium: 'referral', utm_campaign: 'fixture@invalid.test', utm_term: 'private text',
      sourcePath: '/pricing?token=fixture', destination_path: '/parent/profile?uid=fixture',
      page_location: 'https://other.test/?token=fixture',
      form_name: 'public_assessment_form', lead_type: 'parent_assessment_request', value: 1,
    });

    expect(gtag).toHaveBeenLastCalledWith('event', 'generate_lead', expect.objectContaining({
      form_name: 'public_assessment_form', lead_type: 'parent_assessment_request', value: 1,
      utm_medium: 'referral', sourcePath: '/pricing',
      page_location: 'https://tinystepslearning.com/pricing?utm_source=school-fair',
      page_referrer: 'https://tinystepslearning.com/',
    }));
    const [, , params] = gtag.mock.lastCall!;
    for (const key of [
      'submission_id', 'documentId', 'kid_id', 'ChildName', 'childAge', 'mainConcern',
      'notes', 'contact', 'recipient', 'extras', 'url', 'utm_campaign', 'utm_term', 'destination_path',
    ]) {
      expect(params).not.toHaveProperty(key);
    }
    expect(JSON.stringify(params)).not.toMatch(/fixture|private/i);
  });

  it('sanitizes page-view, initial tag configuration and referrer URLs', async () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://example.test/path?email=fixture#auth');
    const { trackPageView } = await import('../../lib/analytics');
    trackPageView('/pricing?book=1&token=fixture');
    const expected = {
      page_location: 'https://tinystepslearning.com/pricing?utm_source=school-fair',
      page_referrer: 'https://example.test/',
    };
    expect(gtag).toHaveBeenCalledWith('config', 'G-5RMQVF1HGD', {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ...expected,
    });
    expect(gtag).toHaveBeenLastCalledWith('event', 'page_view', expect.objectContaining({
      ...expected, page_path: '/pricing', send_to: 'G-5RMQVF1HGD',
    }));
  });

  it('rejects unknown keys and Google tag control fields at the outbound boundary', async () => {
    const { trackEvent } = await import('../../lib/analytics');
    trackEvent('generate_lead', {
      form_name: 'public_assessment_form', lead_type: 'parent_assessment_request',
      value: 1, unexpected_field: 'Synthetic Private Name',
      send_to: 'G-UNAPPROVED', user_id: 'synthetic-user',
      page_location: 'https://invalid.test/private', page_referrer: 'https://invalid.test/private',
      item_id: 'unrelated-field', event_callback: 'unexpected',
    });
    const [, , params] = gtag.mock.lastCall!;
    expect(params).toMatchObject({ form_name: 'public_assessment_form', value: 1 });
    expect(params.send_to).toBe('G-5RMQVF1HGD');
    for (const key of ['unexpected_field', 'user_id', 'item_id', 'event_callback']) {
      expect(params).not.toHaveProperty(key);
    }
    expect(JSON.stringify(params)).not.toMatch(/Synthetic Private Name|G-UNAPPROVED|invalid\.test/);
  });

  it('does not disclose unregistered dynamic route segments or arbitrary article slugs', async () => {
    const { analyticsPageContext, safeAnalyticsParameters } = await import('../../lib/analyticsPrivacy');
    const context = analyticsPageContext(
      'https://tinystepslearning.com/blog/synthetic-private-name?token=synthetic',
      'https://tinystepslearning.com/courses/synthetic-private-id',
    );
    expect(context).toEqual({
      page_location: 'https://tinystepslearning.com/blog',
      page_referrer: 'https://tinystepslearning.com/courses',
    });
    expect(safeAnalyticsParameters({
      page_path: '/resources/grammar/synthetic-private-name',
      article_slug: 'synthetic-private-name',
      destination_path: '/courses/phonics-foundation',
    }, 'blog_article_view')).toEqual({
      page_path: '/resources/grammar',
      destination_path: '/courses/phonics-foundation',
    });
  });

  it('categorizes raw DOM labels without disclosing their text', async () => {
    const { safeAnalyticsParameters } = await import('../../lib/analyticsPrivacy');
    expect(safeAnalyticsParameters({
      cta_label: 'Book an assessment for Synthetic Private Name',
      link_label: 'Synthetic Private Name',
      page_title: 'Synthetic Private Name',
      error_message: 'Synthetic Private Name',
      interaction_target: 'Synthetic Private Name',
    }, 'funnel_cta_click')).toEqual({ cta_label: 'assessment', link_label: 'other' });
  });

  it('keeps approved attribution channels but rejects unreviewed campaign and query-derived source text', async () => {
    const { analyticsPageContext, safeAnalyticsParameters } = await import('../../lib/analyticsPrivacy');
    expect(analyticsPageContext(
      'https://tinystepslearning.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=Synthetic-Private-Name',
      '',
    )).toEqual({
      page_location: 'https://tinystepslearning.com/pricing?utm_source=google&utm_medium=cpc',
      page_referrer: '',
    });
    expect(safeAnalyticsParameters({
      lead_utm_source: 'Synthetic-Private-Name',
      utm_medium: 'referral',
      utm_campaign: 'Synthetic-Private-Name',
      source: 'blog|synthetic-private-name|private-family|private-position',
      source_context: 'Synthetic Private Name',
      form_name: 'public_assessment_form',
      value: 1,
    }, 'generate_lead')).toEqual({
      utm_medium: 'referral',
      source: 'blog',
      source_context: 'other',
      form_name: 'public_assessment_form',
      value: 1,
    });
  });

  it('routes all approved web events to B even if a stale build variable specifies A', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-J3TTBH8CN9');
    const { trackPageView, trackEvent } = await import('../../lib/analytics');
    trackPageView('/pricing');
    trackEvent('book_assessment_click', { location: 'header', send_to: 'G-J3TTBH8CN9' });
    const configs = gtag.mock.calls.filter(([command]) => command === 'config');
    const events = gtag.mock.calls.filter(([command]) => command === 'event');
    expect(configs).toHaveLength(1);
    expect(configs[0][1]).toBe('G-5RMQVF1HGD');
    expect(events).toHaveLength(2);
    expect(events.every(([, , params]) => params.send_to === 'G-5RMQVF1HGD')).toBe(true);
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('G-J3TTBH8CN9');
  });

  it('deduplicates query-only route updates and suppresses explicit collection on portal and play surfaces', async () => {
    const { trackPageView, trackEvent } = await import('../../lib/analytics');
    trackPageView('/pricing');
    vi.stubGlobal('location', new URL('https://tinystepslearning.com/pricing?book=1'));
    trackPageView('/pricing?book=1');
    vi.stubGlobal('location', new URL('https://tinystepslearning.com/parent/profile'));
    trackPageView('/parent/profile');
    trackEvent('generate_lead', { value: 1 });
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-5RMQVF1HGD']).toBe(true);
    vi.stubGlobal('location', new URL('https://tinystepslearning.com/free-letter-tracing-game-for-kids'));
    trackPageView('/free-letter-tracing-game-for-kids');
    trackEvent('letter_tracing_item_complete', { item_id: 'a' });
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(1);
    vi.stubGlobal('location', new URL('https://tinystepslearning.com/pricing'));
    trackPageView('/pricing');
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-5RMQVF1HGD']).toBe(false);
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(2);
  });

  it('does not start the web collector inside a native Capacitor runtime', async () => {
    vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
    const { trackPageView, trackEvent } = await import('../../lib/analytics');
    trackPageView('/pricing');
    trackEvent('generate_lead', { value: 1 });
    expect(gtag).not.toHaveBeenCalled();
  });
});
