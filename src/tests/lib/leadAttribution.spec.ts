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

  it('stores the first landing page in session storage and keeps it across submissions', () => {
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
      utmSource: 'google',
      utmMedium: 'cpc',
      gclid: 'test-gclid',
    });
    expect(window.sessionStorage.getItem('ts_landing_page_v1')).toBe('/phonics');

    window.history.replaceState({}, '', '/book-demo?fbclid=test-fbclid');

    const secondCapture = captureLeadAttribution();

    expect(secondCapture).toMatchObject({
      landingPage: '/phonics',
      submittedFromPath: '/book-demo',
      submittedFromUrl: '/book-demo?fbclid=test-fbclid',
      fbclid: 'test-fbclid',
    });
  });
});
