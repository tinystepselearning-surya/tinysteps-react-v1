// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { captureLeadAttribution } from '../../lib/leadAttribution';

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
