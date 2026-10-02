import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error SEO tooling is authored as executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const root = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

describe('C1 native Hosting 404 cost stabilization', () => {
  const firebase = readJson('firebase.json');
  const redirects = firebase.hosting.redirects as Array<{
    source?: string;
    destination?: string;
    type?: number;
  }>;
  const rewrites = firebase.hosting.rewrites as Array<{
    source?: string;
    destination?: string;
    function?: { functionId?: string };
  }>;

  it('keeps unmatched public traffic out of Cloud Run', () => {
    expect(rewrites.some((entry) => entry.source === '**')).toBe(false);
    expect(
      rewrites.some((entry) => entry.function?.functionId === 'notFoundRoute'),
    ).toBe(false);
  });

  it('moves all retired and legacy weekly redirects to native Hosting 301s', () => {
    const required = {
      ...RETIRED_BLOG_PATH_REDIRECTS,
      ...LEGACY_WEEK_BLOG_PATH_REDIRECTS,
    };

    for (const [source, destination] of Object.entries(required)) {
      expect(
        redirects.find((entry) => entry.source === source),
        source,
      ).toMatchObject({
        source,
        destination,
        type: 301,
      });
    }
  });

  it('serves a static noindex 404 with no-store response headers', () => {
    const html = fs.readFileSync(path.join(root, 'public', '404.html'), 'utf8');
    expect(html).toMatch(/<meta\s+name="robots"\s+content="[^"]*noindex/i);
    expect(html).toMatch(/<title>404\s*\|\s*Tiny Steps Learning<\/title>/i);

    const rule = firebase.hosting.headers.find(
      (entry: { source?: string }) => entry.source === '404.html',
    );
    expect(rule).toBeDefined();
    expect(rule.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store, max-age=0' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      ]),
    );
  });

  it('preserves explicit private SPA and contact rewrites', () => {
    for (const source of [
      '/api/contact',
      '/surya/**',
      '/admin/**',
      '/teacher/**',
      '/parent/**',
      '/kids/**',
      '/messages/**',
      '/school/**',
    ]) {
      expect(rewrites.some((entry) => entry.source === source), source).toBe(true);
    }
  });
});
