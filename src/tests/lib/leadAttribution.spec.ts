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
    window.history.replaceState({}, '', '/phonics?utm_source=google&utm_medium=cpc&gclid=test-gclid');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://www.google.com/search?q=tiny+steps',
    });

    const firstCapture = captureLeadAttribution();

    expect(firstCapture).toMatchObject({
      landingPage: '/phonics',
      submittedFromPath: '/phonics',
      submittedFromUrl: '/phonics?utm_source=google&utm_medium=cpc&gclid=test-gclid',
      referrer: 'https://www.google.com/search?q=tiny+steps',
      referrerDomain: 'google.com',
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'test-gclid',
    });
    expect(firstCapture.firstSeenAt).toBeTruthy();
    expect(window.sessionStorage.getItem('ts_landing_page_v1')).toBe('/phonics');
    expect(window.sessionStorage.getItem('ts_public_lead_attribution_v2')).toContain('test-gclid');

    window.history.replaceState({}, '', '/book-demo?fbclid=later-fbclid');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://tinystepslearning.com/phonics',
    });

    const secondCapture = captureLeadAttribution();

    expect(secondCapture).toMatchObject({
      landingPage: '/phonics',
      submittedFromPath: '/book-demo',
      submittedFromUrl: '/book-demo?fbclid=later-fbclid',
      referrer: 'https://www.google.com/search?q=tiny+steps',
      referrerDomain: 'google.com',
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'test-gclid',
      fbclid: 'later-fbclid',
    });
    expect(secondCapture.firstSeenAt).toBe(firstCapture.firstSeenAt);
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
