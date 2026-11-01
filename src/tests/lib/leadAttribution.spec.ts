// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { captureLeadAttribution } from '../../lib/leadAttribution';
import { buildLeadAttributionEnrichment, buildPublicLeadPayload, getPublicLeadAttribution } from '../../lib/publicLeadForm';

describe('leadAttribution helper', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: '',
    });
  });

  it('persists first-touch landing, referrer, UTM and click ids across later pages', () => {
    window.history.replaceState({}, '', '/blog/example-article?utm_source=google&utm_medium=organic');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://www.google.com/search?q=tiny+steps',
    });

    const firstCapture = captureLeadAttribution();

    expect(firstCapture).toMatchObject({
      landingPage: '/blog/example-article',
      submittedFromPath: '/blog/example-article',
      submittedFromUrl: '/blog/example-article?utm_source=google&utm_medium=organic',
      referrer: 'https://www.google.com/search?q=tiny+steps',
      referrerDomain: 'google.com',
      utmSource: 'google',
      utmMedium: 'organic',
    });
    expect(firstCapture.firstSeenAt).toBeTruthy();
    expect(window.sessionStorage.getItem('ts_landing_page_v1')).toBe('/blog/example-article');
    expect(window.sessionStorage.getItem('ts_public_lead_attribution_v2')).toContain('organic');

    window.history.replaceState({}, '', '/phonics?fbclid=later-fbclid');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://tinystepslearning.com/phonics',
    });

    const secondCapture = captureLeadAttribution();

    window.history.replaceState({}, '', '/book-demo');
    const conversionCapture = captureLeadAttribution();

    expect(secondCapture).toMatchObject({
      landingPage: '/blog/example-article',
      submittedFromPath: '/phonics',
      submittedFromUrl: '/phonics?fbclid=later-fbclid',
      referrer: 'https://www.google.com/search?q=tiny+steps',
      referrerDomain: 'google.com',
      utmSource: 'google',
      utmMedium: 'organic',
    });
    expect(secondCapture.fbclid).toBeUndefined();
    expect(secondCapture.firstSeenAt).toBe(firstCapture.firstSeenAt);
    expect(conversionCapture).toMatchObject({
      landingPage: '/blog/example-article',
      submittedFromPath: '/book-demo',
      submittedFromUrl: '/book-demo',
      referrer: 'https://www.google.com/search?q=tiny+steps',
      referrerDomain: 'google.com',
      utmSource: 'google',
      utmMedium: 'organic',
      firstSeenAt: firstCapture.firstSeenAt,
    });
  });

  it.each([
    {
      landingPage: '/reading-classes-for-kids',
      mainConcern: 'Reading speed and word accuracy' as const,
      expectedProgram: 'Reading',
    },
    {
      landingPage: '/grammar',
      mainConcern: 'Grammar while speaking or writing' as const,
      expectedProgram: 'Grammar',
    },
  ])(
    'preserves $landingPage first-touch attribution through /book-demo without expanding the anonymous lead schema',
    ({ landingPage, mainConcern, expectedProgram }) => {
      window.history.replaceState({}, '', `${landingPage}?utm_source=google&utm_medium=organic`);
      Object.defineProperty(document, 'referrer', {
        configurable: true,
        value: 'https://www.google.co.in/search?q=online+classes+for+kids',
      });

      const firstTouch = captureLeadAttribution();
      expect(firstTouch.landingPage).toBe(landingPage);
      expect(firstTouch.utmSource).toBe('google');

      window.history.replaceState({}, '', '/book-demo');
      const bookingAttribution = getPublicLeadAttribution();

      expect(bookingAttribution).toMatchObject({
        landingPage,
        sourcePath: '/book-demo',
        submittedFromPath: '/book-demo',
        referrerDomain: 'google.co.in',
        utm_source: 'google',
        utm_medium: 'organic',
        acquisitionChannel: 'google_organic',
      });

      const payload = buildPublicLeadPayload(
        {
          parentName: 'Test Parent',
          childName: 'Test Child',
          whatsapp: '+919999999999',
          childAge: '7',
          mainConcern,
          classFormatPreference: 'one_to_one',
          urgency: '',
        },
        { source: 'book_demo_page', attribution: bookingAttribution },
      );

      expect(payload).toMatchObject({
        source: 'website',
        sourceDetail: 'book_demo_page',
        sourcePath: '/book-demo',
        programInterest: expectedProgram,
        mainConcern,
        classFormatPreference: 'one_to_one',
      });
      // First touch goes to the guarded server enrichment, not the
      // anonymously writable Firestore create document.
      expect(payload).not.toHaveProperty('landingPage');
      expect(payload).not.toHaveProperty('acquisitionChannel');

      expect(buildLeadAttributionEnrichment(bookingAttribution)).toMatchObject({
        landingPage,
        conversionPage: '/book-demo',
        referrerDomain: 'google.co.in',
        utm_source: 'google',
        utm_medium: 'organic',
      });
    },
  );

  it('ignores same-origin referrers as acquisition sources', () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'http://localhost:3000/phonics',
    });
    window.history.replaceState({}, '', '/book-demo');

    const capture = captureLeadAttribution();

    expect(capture.referrer).toBeUndefined();
    expect(capture.referrerDomain).toBeUndefined();
  });
});
