import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const recoveryPrimaries = [
  '/phonics',
  '/best-online-phonics-classes-for-kids-in-india',
  '/phonics-fees-india',
  '/free-letter-tracing-game-for-kids',
  '/letter-tracing-with-sounds-game',
] as const;

const retiredRecoveryMap = {
  '/blog/child-knows-letter-sounds-but-cannot-read': '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/blog/how-to-choose-phonics-classes': '/best-online-phonics-classes-for-kids-in-india',
  '/blog/best-online-phonics-classes-for-kids': '/best-online-phonics-classes-for-kids-in-india',
  '/blog/best-phonics-classes-for-kids': '/best-online-phonics-classes-for-kids-in-india',
} as const;

describe('SEO recovery Brick 11 technical consolidation', () => {
  it('keeps the recovery static primaries self-canonical and indexable', () => {
    for (const route of recoveryPrimaries) {
      const config = ROUTE_SEO_REGISTRY[route];
      expect(config, route).toBeTruthy();
      expect(config?.canonicalPath ?? route, route).toBe(route);
      expect(config?.robots ?? 'index,follow', route).not.toMatch(/noindex/i);
    }
  });

  it('keeps retired recovery intents mapped directly to final owners', () => {
    const consolidationMap = read('scripts/blog-consolidation-map.mjs');
    const sources = new Set(Object.keys(retiredRecoveryMap));

    for (const [source, destination] of Object.entries(retiredRecoveryMap)) {
      expect(consolidationMap, source).toContain(`'${source}'`);
      expect(consolidationMap, destination).toContain(destination);
      expect(sources.has(destination as keyof typeof retiredRecoveryMap), `${source} must not redirect through another retired URL`).toBe(false);
    }
  });

  it('normalizes rendered programme-cluster links before navigation', () => {
    const topicCluster = read('src/components/programs/TopicClusterLinks.tsx');
    expect(topicCluster).toContain('normalizeSeoRecoveryInternalHref');
    expect(topicCluster).toContain('const canonicalLinks = links.map');
  });

  it('defensively keeps retired blog slugs out of generated sitemaps', () => {
    const sitemapGenerator = read('scripts/generate-sitemaps.js');
    expect(sitemapGenerator).toContain("import { RETIRED_BLOG_PATH_REDIRECTS } from './blog-consolidation-map.mjs'");
    expect(sitemapGenerator).toContain('const RETIRED_BLOG_SLUGS = new Set');
    expect(sitemapGenerator).toContain('!RETIRED_BLOG_SLUGS.has(slug)');
  });

  it('canonicalizes retired and weekly legacy paths in RSS/LLM discovery generation', () => {
    const rssGenerator = read('scripts/generate-rss.mjs');
    expect(rssGenerator).toContain('rewriteLegacyWeekBlogPaths(rewriteRetiredBlogPaths(text))');
    expect(rssGenerator).toContain('retiredCommercialBlogUrls');
  });

  it('runs the Brick 11 generated-artifact audit during every production build', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(pkg.scripts['seo:recovery-brick11']).toBe('node scripts/audit-seo-recovery-brick11.mjs');
    expect(pkg.scripts.build).toContain('npm run gen:sitemaps && npm run seo:blog-consolidation && npm run seo:recovery-brick11');
    expect(pkg.scripts.prebuild).toContain('scripts/generate-rss.mjs');
  });

  it('protects generated discovery surfaces and redirect-chain checks in the Brick 11 audit', () => {
    const audit = read('scripts/audit-seo-recovery-brick11.mjs');
    for (const file of [
      'public/sitemap-blog.xml',
      'public/rss.xml',
      'public/feed.xml',
      'public/blog/rss.xml',
      'public/blog/feed.xml',
      'public/llms.txt',
      'public/llms-full.txt',
    ]) {
      expect(audit).toContain(file);
    }
    expect(audit).toContain('assertNoRedirectChain');
    expect(audit).toContain('primary is not self-canonical');
    expect(audit).toContain('primary is noindex');
  });
});
