import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import {
  PHONICS_34_AUTHORITY_ROUTES,
  PHONICS_34_AUTHORITY_SLUGS,
} from '../../lib/phonicsAuthorityRoutes.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { injectSeoMetadata } from '../../../scripts/prerender.mjs';

const repoRoot = process.cwd();
const expectedRobots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

function countMeta(html, name) {
  return (html.match(new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'gi')) || []).length;
}

function firebaseSourceMatchesRoute(source, route) {
  const glob = String(source || '');
  const escaped = glob
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');

  return new RegExp(`^${escaped}$`).test(route);
}

describe('Phonics 34 search and AI crawlability lock', () => {
  it('keeps exactly 34 authoritative public phonics articles resolvable and indexable', () => {
    expect(PHONICS_34_AUTHORITY_SLUGS).toHaveLength(34);
    expect(new Set(PHONICS_34_AUTHORITY_SLUGS).size).toBe(34);
    expect(PHONICS_34_AUTHORITY_ROUTES).toHaveLength(34);

    for (const slug of PHONICS_34_AUTHORITY_SLUGS) {
      const route = `/blog/${slug}`;
      const post = postsBySlug.get(slug);

      expect(post, `missing normalized BlogPost for ${slug}`).toBeDefined();
      expect(post?.metaDescription?.length, `meta description too long for ${slug}`).toBeLessThanOrEqual(160);
      expect(post?.faq?.length || 0, `missing extractable FAQs for ${slug}`).toBeGreaterThanOrEqual(5);
      expect(shouldNoindexBlogSlug(slug), `${slug} unexpectedly noindexed`).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug), `${slug} missing from sitemap policy`).toBe(true);
      expect(
        PUBLIC_ROUTE_MANIFEST.some((entry) => entry.path === route),
        `${route} must stay in the dynamic blog pipeline instead of the static route manifest`,
      ).toBe(false);
    }
  });

  it('overrides stale noindex metadata for every Phonics 34 prerender and emits one self-canonical index directive', () => {
    const staleNoindexHtml = `<!doctype html><html><head>
      <title>stale</title>
      <meta name="description" content="stale">
      <meta name="robots" content="noindex, follow">
      <meta name="googlebot" content="noindex">
      <meta name="bingbot" content="noindex">
      <link rel="canonical" href="https://tinystepslearning.com/stale">
    </head><body><article><h1>Article</h1><p>Meaningful rendered article content.</p></article></body></html>`;

    for (const route of PHONICS_34_AUTHORITY_ROUTES) {
      const output = injectSeoMetadata(staleNoindexHtml, route);
      const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      expect(output, `${route} retained noindex`).not.toMatch(/<meta\s+name=["'](?:robots|googlebot|bingbot)["'][^>]*content=["'][^"']*noindex/i);
      expect(output).toContain(`<meta name="robots" content="${expectedRobots}">`);
      expect(output).toContain(`<meta name="googlebot" content="${expectedRobots}">`);
      expect(output).toContain(`<meta name="bingbot" content="${expectedRobots}">`);
      expect(output).toMatch(new RegExp(`<link rel=["']canonical["'] href=["']https://tinystepslearning\\.com${escapedRoute}["']>`));
      expect(countMeta(output, 'robots')).toBe(1);
      expect(countMeta(output, 'googlebot')).toBe(1);
      expect(countMeta(output, 'bingbot')).toBe(1);
    }
  });

  it('keeps search and AI crawlers allowed on public pages while private routes remain protected', () => {
    const robots = fs.readFileSync(path.join(repoRoot, 'public/robots.txt'), 'utf8');

    expect(robots).toMatch(/User-agent:\s*\*\s*\nAllow:\s*\//i);
    for (const crawler of [
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-User',
      'Claude-SearchBot',
      'PerplexityBot',
      'GPTBot',
      'ClaudeBot',
      'CCBot',
    ]) {
      expect(robots, `${crawler} is not explicitly allowed`).toMatch(
        new RegExp(`User-agent:\\s*${crawler}[\\s\\S]{0,120}Allow:\\s*\\/`, 'i'),
      );
    }

    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /teacher/');
    expect(robots).toContain('Disallow: /parent/');
    expect(robots).toContain('Sitemap: https://tinystepslearning.com/sitemap.xml');
  });

  it('does not apply an X-Robots-Tag noindex hosting header to any Phonics 34 article route', () => {
    const firebase = JSON.parse(fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8'));
    const headers = firebase?.hosting?.headers || [];
    const authorityNoindexHeaders = headers.filter((entry) => {
      const hasNoindexHeader = (entry?.headers || []).some((header) =>
        String(header?.key || '').toLowerCase() === 'x-robots-tag'
        && /noindex/i.test(String(header?.value || '')),
      );
      if (!hasNoindexHeader) return false;

      return PHONICS_34_AUTHORITY_ROUTES.some((route) =>
        firebaseSourceMatchesRoute(entry?.source, route),
      );
    });

    expect(authorityNoindexHeaders).toEqual([]);

    // RSS/Atom feeds are non-HTML discovery resources and should remain noindex.
    for (const feedSource of ['/blog/rss.xml', '/blog/feed.xml']) {
      const feedHeader = headers.find((entry) => entry?.source === feedSource);
      expect(feedHeader?.headers || []).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'X-Robots-Tag',
            value: 'noindex',
          }),
        ]),
      );
    }
  });

  it('publishes every Phonics 34 authority URL in the LLM-facing full authority directory', () => {
    const llmsFull = fs.readFileSync(path.join(repoRoot, 'public/llms-full.txt'), 'utf8');

    for (const route of PHONICS_34_AUTHORITY_ROUTES) {
      expect(llmsFull).toContain(`https://tinystepslearning.com${route}`);
    }
  });
});
