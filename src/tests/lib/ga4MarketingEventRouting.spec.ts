// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scopeMarketingEventToWebStream } from '../../lib/analytics';

describe('GA4 marketing event destination isolation', () => {
  it('targets website stream when another Firebase Analytics stream is also configured', () => {
    expect(scopeMarketingEventToWebStream(
      { page_path: '/book-demo', form_name: 'public_assessment_form', submission_id: 'fake-test-id' },
      'G-J3TTBH8CN9',
    )).toEqual({
      page_path: '/book-demo',
      form_name: 'public_assessment_form',
      submission_id: 'fake-test-id',
      send_to: 'G-J3TTBH8CN9',
    });
  });

  it('cannot be redirected to the Firebase web stream by supplied event fields', () => {
    const actual = scopeMarketingEventToWebStream({
      send_to: 'G-5RMQVF1HGD',
      page_path: '/phonics',
    }, 'G-J3TTBH8CN9');
    expect(actual.send_to).toBe('G-J3TTBH8CN9');
    expect(actual.page_path).toBe('/phonics');
  });

  it('honors a configured alternate web stream for nonproduction deployments', () => {
    expect(scopeMarketingEventToWebStream(
      { page_path: '/book-demo' },
      'G-ALTERNATESTAGE',
    ).send_to).toBe('G-ALTERNATESTAGE');
  });

  it('scopes both website page views and custom events instead of using default group routing', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/analytics.ts'), 'utf8');
    expect(source).toContain("window.gtag('event', 'page_view', scopeMarketingEventToWebStream(");
    expect(source).toContain("window.gtag('event', name, scopeMarketingEventToWebStream(withMarketingContext(params)))");
    expect(source).toContain('send_to: measurementId');
    expect(source).toContain("window.gtag('config', measurementId, { send_page_view: false })");
  });
});
