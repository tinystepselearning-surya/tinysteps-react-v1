import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FOUNDER_PROFILE_PATH, FOUNDER_PROFILE_URL } from '../../lib/schemas';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const founderTitle = 'Vannala Ravali Priya | Founder of Tiny Steps Learning';
const founderDescription =
  'Meet Vannala Ravali Priya, Founder of Tiny Steps Learning. Learn about her work in phonics, English curriculum development, teacher development and academic quality.';
const indexableRobots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

describe('Founder Brick 5 discovery, indexing and internal authority', () => {
  it('registers the founder profile as an indexable static route for sitemap and prerender', async () => {
    const manifestPath = path.join(repoRoot, 'src/lib/publicRouteManifest.js');
    const { PUBLIC_ROUTE_MANIFEST } = await import(pathToFileURL(manifestPath).href);
    const founderRoute = PUBLIC_ROUTE_MANIFEST.find(
      (entry: { path: string }) => entry.path === FOUNDER_PROFILE_PATH,
    );

    expect(founderRoute).toMatchObject({
      path: FOUNDER_PROFILE_PATH,
      group: 'static',
      intent: 'index',
      indexable: true,
      sitemap: true,
      prerender: true,
      canonicalPath: FOUNDER_PROFILE_PATH,
      robots: indexableRobots,
      seoRegistry: true,
    });

    // @ts-expect-error Node SEO inventory is intentionally authored as an untyped .mjs module.
    const { PRERENDER_STATIC_ROUTES, SITEMAP_STATIC_ROUTES } = await import('../../../scripts/seo-route-inventory.mjs');
    expect(PRERENDER_STATIC_ROUTES).toContain(FOUNDER_PROFILE_PATH);
    expect(SITEMAP_STATIC_ROUTES).toContain(FOUNDER_PROFILE_PATH);
  });

  it('keeps the founder route metadata centralized in the SEO registry', () => {
    expect(ROUTE_SEO_REGISTRY[FOUNDER_PROFILE_PATH]).toMatchObject({
      title: founderTitle,
      description: founderDescription,
      canonicalPath: FOUNDER_PROFILE_PATH,
      robots: indexableRobots,
      ogType: 'website',
      ogImage: '/priya-founder-tiny-steps-learning.webp',
    });

    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain('getRouteConfig(FOUNDER_PROFILE_PATH)');
  });

  it('injects the exact founder metadata into prerendered HTML', async () => {
    // @ts-expect-error Build tooling is intentionally authored as an executable ESM module.
    const { injectSeoMetadata } = await import('../../../scripts/prerender.mjs');
    const html = '<!doctype html><html><head><title>Old</title><meta name="description" content="Old"><link rel="canonical" href="https://example.com"><meta name="robots" content="noindex"><meta property="og:image" content="https://example.com/old.jpg"></head><body></body></html>';
    const rendered = injectSeoMetadata(html, FOUNDER_PROFILE_PATH);

    expect(rendered).toContain(`<title>${founderTitle}</title>`);
    expect(rendered).toContain(`content="${founderDescription}"`);
    expect(rendered).toContain(`<link rel="canonical" href="${FOUNDER_PROFILE_URL}">`);
    expect(rendered).toContain(`<meta name="robots" content="${indexableRobots}">`);
    expect(rendered).toContain(
      '<meta property="og:image" content="https://tinystepslearning.com/priya-founder-tiny-steps-learning.webp">',
    );
  });

  it('publishes crawlable internal authority links from Team and the HTML sitemap', () => {
    const team = read('src/pages/TeamPage.tsx');
    const sitemapPage = read('src/pages/SitemapPage.tsx');

    expect(team).toContain('to={FOUNDER_PROFILE_PATH}');
    expect(team).toContain('Vannala Ravali Priya — Founder');
    expect(sitemapPage).toContain("to: '/team/vannala-ravali-priya'");
    expect(sitemapPage).toContain('Founder — Vannala Ravali Priya');
  });

  it('keeps Brick 5 discovery contracts independent from later identity corroboration', () => {
    const founderPage = read('src/pages/FounderPriyaPage.tsx');
    expect(founderPage).toContain('FOUNDER_PROFILE_PATH');
    expect(founderPage).toContain('FOUNDER_PROFILE_URL');
    expect(founderPage).toContain("'@type': 'ProfilePage'");
  });
});