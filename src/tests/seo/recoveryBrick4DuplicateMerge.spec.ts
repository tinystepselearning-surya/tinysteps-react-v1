import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error SEO consolidation tooling is authored as executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';
// @ts-expect-error Blog intent tooling is authored as executable ESM JavaScript.
import { BLOG_INTENT_CLUSTERS } from '../../../scripts/blog-intent-clusters.mjs';
import { PHONICS_AUTHORITY_SLUGS } from '../../lib/phonicsAuthorityRoutes.js';
import { QUALITY_AUTHORITY_SLUGS } from '../../lib/editorialQualityRoutes.js';

const root = process.cwd();
const comparisonOwner = '/best-online-phonics-classes-for-kids-in-india';
const retiredSources = [
  '/blog/how-to-choose-phonics-classes',
  '/blog/best-online-phonics-classes-for-kids',
  '/blog/best-phonics-classes-for-kids',
] as const;

describe('SEO recovery Brick 4 duplicate merge', () => {
  it('retires all phonics provider-selection duplicates directly into the comparison owner', () => {
    for (const source of retiredSources) {
      expect(RETIRED_BLOG_PATH_REDIRECTS[source]).toBe(comparisonOwner);
    }

    expect(RETIRED_BLOG_PATH_REDIRECTS['/blog/best-online-phonics-classes-for-kids'])
      .not.toBe('/blog/how-to-choose-phonics-classes');
    expect(RETIRED_BLOG_PATH_REDIRECTS['/blog/best-phonics-classes-for-kids'])
      .not.toBe('/blog/how-to-choose-phonics-classes');
  });

  it('removes the retired article from the content registry and authority sets', () => {
    const retiredPostPath = path.join(
      root,
      'src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts',
    );

    expect(fs.existsSync(retiredPostPath)).toBe(false);
    expect(PHONICS_AUTHORITY_SLUGS).toHaveLength(33);
    expect(PHONICS_AUTHORITY_SLUGS).not.toContain('how-to-choose-phonics-classes');
    expect(QUALITY_AUTHORITY_SLUGS).toHaveLength(50);
    expect(QUALITY_AUTHORITY_SLUGS).not.toContain('how-to-choose-phonics-classes');
  });

  it('keeps the useful provider-selection framework on the commercial comparison owner', () => {
    const comparisonSource = fs.readFileSync(
      path.join(root, 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx'),
      'utf8',
    );

    for (const signal of [
      'const decisionGates = [',
      'const comparisonFormats = [',
      'const providerScorecard = [',
      'const demoQuestions = [',
      'const redFlags = [',
      'const pricingQuestions = [',
      "href: '/phonics-fees-india'",
      "href: '/phonics'",
      "href: '/book-demo'",
    ]) {
      expect(comparisonSource).toContain(signal);
    }
  });

  it('keeps the surviving informational class-selection support pages differentiated', () => {
    const cluster = BLOG_INTENT_CLUSTERS.find((entry: { id?: string }) => entry.id === 'phonics-class-selection');
    expect(cluster).toBeDefined();
    expect(cluster?.action).toBe('differentiate');
    expect(cluster?.risk).toBe('resolved');
    expect(cluster?.slugs).toEqual([
      'online-phonics-classes-vs-school',
      'why-parents-choose-online-phonics',
    ]);
    expect(cluster?.slugs).not.toContain('how-to-choose-phonics-classes');
  });

  it('keeps server redirect and generated discovery cleanup wired to the final owner', () => {
    const notFoundRoute = fs.readFileSync(
      path.join(root, 'functions/src/notFoundRoute.ts'),
      'utf8',
    );
    const rssGenerator = fs.readFileSync(
      path.join(root, 'scripts/generate-rss.mjs'),
      'utf8',
    );
    const consolidationAudit = fs.readFileSync(
      path.join(root, 'scripts/audit-blog-consolidation.mjs'),
      'utf8',
    );

    expect(notFoundRoute).toContain(`const PHONICS_COMPARISON_OWNER = "${comparisonOwner}"`);
    for (const source of retiredSources) {
      expect(notFoundRoute).toContain(`"${source}": PHONICS_COMPARISON_OWNER`);
    }

    expect(rssGenerator).not.toContain("'https://tinystepslearning.com/blog/how-to-choose-phonics-classes',");
    expect(rssGenerator).toContain('normalizeLlmDiscoveryFiles');
    expect(rssGenerator).toContain('retiredCommercialBlogUrls');
    expect(consolidationAudit).toContain('STATIC_SITEMAP');
    expect(consolidationAudit).toContain('canonical commercial destination missing from sitemap-static.xml');
  });
});
