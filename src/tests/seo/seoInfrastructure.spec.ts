import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const firebaseConfigRaw = fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8');
const firebaseConfig = JSON.parse(firebaseConfigRaw);

function readXml(name: string) {
  return fs.readFileSync(path.join(repoRoot, 'public', name), 'utf8');
}

describe('SEO infrastructure', () => {
  it('keeps legacy /main routes out of sitemap files and includes priority canonicals', () => {
    const sitemapXml = [
      readXml('sitemap-static.xml'),
      readXml('sitemap-blog.xml'),
      readXml('sitemap-courses.xml'),
      readXml('sitemap-parents.xml'),
    ].join('\n');

    expect(sitemapXml).toContain('https://tinystepslearning.com/courses/phonics-foundation');
    expect(sitemapXml).toContain('https://tinystepslearning.com/parents/choosing-course');
    expect(sitemapXml).toContain('https://tinystepslearning.com/blog/what-is-phonics-for-kids');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/main/');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/blog/week-8-grammar-tenses');
  });

  it('keeps 301 redirects for /main legacy routes and does not redirect live long-tail landing pages', () => {
    const redirects = firebaseConfig.hosting.redirects as Array<{ source?: string; destination?: string; type?: number }>;

    expect(
      redirects.some((entry) => entry.source === '/main/parents/choosing-course' && entry.destination === '/parents/choosing-course' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/phonics' && entry.destination === '/courses/phonics-foundation' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/grammar' && entry.destination === '/courses/grammar-mastery' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/public-speaking' && entry.destination === '/courses/public-speaking-foundations' && entry.type === 301)
    ).toBe(true);

    // /online-phonics-reading-classes is now a 301 redirect to /phonics (canonical authority page)
    expect(
      redirects.some((entry) => entry.source === '/online-phonics-reading-classes' && entry.destination === '/phonics' && entry.type === 301)
    ).toBe(true);

    // These are self-canonical landing pages (not redirects)
    expect(
      redirects.some((entry) => entry.source === '/english-grammar-writing-classes')
    ).toBe(false);
    expect(
      redirects.some((entry) => entry.source === '/public-speaking-communication-kids')
    ).toBe(false);
  });

  it('uses the public route manifest for P0 canonical redirects and static inventories', async () => {
    const manifestPath = path.join(repoRoot, 'src/lib/publicRouteManifest.js');
    const { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } = await import(pathToFileURL(manifestPath).href);
    // @ts-expect-error Node SEO inventory is an intentionally untyped .mjs module.
    const inventory = await import('../../../scripts/seo-route-inventory.mjs');
    const { PARENT_HELP_ROUTES, PRERENDER_STATIC_ROUTES, SITEMAP_STATIC_ROUTES } = inventory;

    expect(PUBLIC_REDIRECT_MANIFEST).toEqual(
      expect.arrayContaining([
        { source: '/terms', destination: '/terms-and-conditions', status: 301 },
        { source: '/terms/', destination: '/terms-and-conditions', status: 301 },
        {
          source: '/online-english-classes-for-kids-india',
          destination: '/online-english-classes-for-kids',
          status: 301,
        },
      ]),
    );

    const indiaRoute = PUBLIC_ROUTE_MANIFEST.find(
      (entry: { path: string }) => entry.path === '/online-english-classes-for-kids-india',
    );
    expect(indiaRoute).toBeUndefined();
    expect(SITEMAP_STATIC_ROUTES).toContain('/online-english-classes-for-kids');
    expect(SITEMAP_STATIC_ROUTES).not.toContain('/online-english-classes-for-kids-india');
    expect(PRERENDER_STATIC_ROUTES).toContain('/terms-and-conditions');
    expect(SITEMAP_STATIC_ROUTES).not.toContain('/terms-and-conditions');
    expect(PARENT_HELP_ROUTES).toContain('/parents/choosing-course');
  });

  it('permanently redirects the legacy games hub before the SPA rewrite', () => {
    const redirects = firebaseConfig.hosting.redirects as Array<{ source?: string; destination?: string; type?: number }>;
    const legacyRedirects = redirects.filter((entry) => entry.source === '/free-games-for-kids');

    expect(legacyRedirects).toEqual([
      { source: '/free-games-for-kids', destination: '/free-english-games-for-kids', type: 301 },
    ]);
    expect(firebaseConfigRaw.indexOf('"redirects"')).toBeLessThan(firebaseConfigRaw.indexOf('"rewrites"'));
    expect(firebaseConfig.hosting.rewrites.at(-1)).toEqual({
      source: '**',
      function: { functionId: 'notFoundRoute', region: 'asia-south1' },
    });
    expect(firebaseConfig.hosting.trailingSlash).toBe(false);
    expect(redirects.some((entry) => entry.source === '/free-english-games-for-kids')).toBe(false);
  });

  it('keeps only the canonical games hub in indexable and prerender inventories', async () => {
    // @ts-expect-error Node SEO inventory is an intentionally untyped .mjs module.
    const { STATIC_MARKETING_ROUTES } = await import('../../../scripts/seo-route-inventory.mjs');
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const sitemapXml = [
      readXml('sitemap-static.xml'),
      readXml('sitemap-blog.xml'),
      readXml('sitemap-courses.xml'),
      readXml('sitemap-parents.xml'),
    ].join('\n');

    expect(STATIC_MARKETING_ROUTES).toContain('/free-english-games-for-kids');
    expect(STATIC_MARKETING_ROUTES).not.toContain('/free-games-for-kids');
    expect(ROUTE_SEO_REGISTRY['/free-english-games-for-kids']?.canonicalPath).toBe('/free-english-games-for-kids');
    expect(ROUTE_SEO_REGISTRY['/free-games-for-kids']).toBeUndefined();
    expect(sitemapXml).toContain('https://tinystepslearning.com/free-english-games-for-kids');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/free-games-for-kids');

    const prerenderSource = fs.readFileSync(path.join(repoRoot, 'scripts/prerender.mjs'), 'utf8');
    expect(prerenderSource).toContain('...PRERENDER_STATIC_ROUTES');
    expect(prerenderSource).not.toContain("'/free-games-for-kids'");
  });

  it('keeps canonical individual public game routes unchanged', async () => {
    const { PUBLIC_TILE_ROUTES } = await import('../../lib/publicEnglishGames');
    expect(new Set(Object.values(PUBLIC_TILE_ROUTES).filter((route) => route.enabled).map((route) => route.route))).toEqual(
      new Set([
        '/free-letter-tracing-game-for-kids',
        '/letter-tracing-with-sounds-game',
        '/free-letter-sounds-game-for-kids',
        '/free-balloon-pop-phonics-game-for-kids',
        '/free-sound-listening-game-for-kids',
        '/free-word-building-game-for-kids',
        '/free-spelling-game-for-kids',
        '/free-sentence-making-game-for-kids',
        '/free-reading-fluency-game-for-kids',
        '/free-games/word-meaning-flashcards',
        '/free-grammar-practice-game-for-kids',
      ]),
    );
  });

  it('keeps long-tail landing pages self-canonical (except /online-phonics-reading-classes which redirects)', async () => {
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

    // /online-phonics-reading-classes is now a 301 redirect to /phonics (canonical authority page)
    expect(ROUTE_SEO_REGISTRY['/online-phonics-reading-classes']?.canonicalPath).toBe('/phonics');

    // These remain self-canonical independent landing pages
    expect(ROUTE_SEO_REGISTRY['/english-grammar-writing-classes']?.canonicalPath).toBe('/english-grammar-writing-classes');
    expect(ROUTE_SEO_REGISTRY['/public-speaking-communication-kids']?.canonicalPath).toBe('/public-speaking-communication-kids');
    expect(ROUTE_SEO_REGISTRY['/spoken-english-classes-for-kids-online']?.canonicalPath).toBe('/spoken-english-classes-for-kids-online');
    expect(ROUTE_SEO_REGISTRY['/online-english-classes-for-kids']?.canonicalPath).toBe('/online-english-classes-for-kids');

    expect(indexHtml).not.toContain("'/english-grammar-writing-classes': '/grammar'");
    expect(indexHtml).not.toContain("'/public-speaking-communication-kids': '/speaking'");
    expect(indexHtml).not.toContain("'/spoken-english-classes-for-kids-online': '/speaking'");
  });

  it('ships the blog indexing policy module for Node-based SEO scripts', async () => {
    const policyPath = path.join(repoRoot, 'src/lib/blogIndexingPolicy.js');
    expect(fs.existsSync(policyPath)).toBe(true);

    const policy = await import(pathToFileURL(policyPath).href);
    expect(Array.from(policy.INDEXABLE_WEEKLY_BLOG_SLUGS)).toEqual([
      'week-1-phonics-satpin-launch',
      'week-7-grammar-nouns-to-paragraphs',
      'week-12-speaking-confidence-seeds',
    ]);
    expect(policy.shouldIncludeBlogSlugInSitemap('week-1-phonics-satpin-launch')).toBe(true);
    expect(policy.shouldIncludeBlogSlugInSitemap('week-2-phonics-blending-club')).toBe(false);
    expect(policy.shouldNoindexBlogSlug('week-2-phonics-blending-club')).toBe(true);
    expect(policy.shouldNoindexBlogSlug('what-is-phonics-for-kids')).toBe(false);
  });

  it('uses 301 redirects to canonicalize letter-tracing-with-sounds and balloon-pop game aliases before SPA rewrite', () => {
    const redirects = firebaseConfig.hosting.redirects as Array<{ source?: string; destination?: string; type?: number }>;

    // Verify both game alias redirects exist with correct HTTP 301 status
    expect(
      redirects.some(
        (entry) =>
          entry.source === '/free-letter-tracing-with-sounds-game-for-kids' &&
          entry.destination === '/letter-tracing-with-sounds-game' &&
          entry.type === 301
      )
    ).toBe(true);

    expect(
      redirects.some(
        (entry) =>
          entry.source === '/free-phonics-balloon-pop-game-for-kids' &&
          entry.destination === '/free-balloon-pop-phonics-game-for-kids' &&
          entry.type === 301
      )
    ).toBe(true);

    // Verify redirects appear before the SPA rewrite
    expect(firebaseConfigRaw.indexOf('"redirects"')).toBeLessThan(firebaseConfigRaw.indexOf('"rewrites"'));

    // Verify the genuine 404 function is the final catch-all.
    expect(firebaseConfig.hosting.rewrites.at(-1)).toEqual({
      source: '**',
      function: { functionId: 'notFoundRoute', region: 'asia-south1' },
    });
  });

  it('keeps game alias URLs out of indexable and prerender inventories', async () => {
    // @ts-expect-error Node SEO inventory is an intentionally untyped .mjs module.
    const { STATIC_MARKETING_ROUTES } = await import('../../../scripts/seo-route-inventory.mjs');
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const sitemapXml = [
      readXml('sitemap-static.xml'),
      readXml('sitemap-blog.xml'),
      readXml('sitemap-courses.xml'),
      readXml('sitemap-parents.xml'),
    ].join('\n');

    // Verify canonical routes are in indexable inventories
    expect(STATIC_MARKETING_ROUTES).toContain('/letter-tracing-with-sounds-game');
    expect(STATIC_MARKETING_ROUTES).toContain('/free-balloon-pop-phonics-game-for-kids');

    // Verify alias URLs are NOT in indexable inventories
    expect(STATIC_MARKETING_ROUTES).not.toContain('/free-letter-tracing-with-sounds-game-for-kids');
    expect(STATIC_MARKETING_ROUTES).not.toContain('/free-phonics-balloon-pop-game-for-kids');

    // Verify canonical routes are in SEO registry
    expect(ROUTE_SEO_REGISTRY['/letter-tracing-with-sounds-game']?.canonicalPath).toBe('/letter-tracing-with-sounds-game');
    expect(ROUTE_SEO_REGISTRY['/free-balloon-pop-phonics-game-for-kids']?.canonicalPath).toBe('/free-balloon-pop-phonics-game-for-kids');

    // Verify alias URLs are NOT in SEO registry
    expect(ROUTE_SEO_REGISTRY['/free-letter-tracing-with-sounds-game-for-kids']).toBeUndefined();
    expect(ROUTE_SEO_REGISTRY['/free-phonics-balloon-pop-game-for-kids']).toBeUndefined();

    // Verify canonical URLs are in sitemaps
    expect(sitemapXml).toContain('https://tinystepslearning.com/letter-tracing-with-sounds-game');
    expect(sitemapXml).toContain('https://tinystepslearning.com/free-balloon-pop-phonics-game-for-kids');

    // Verify alias URLs are NOT in sitemaps
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/free-letter-tracing-with-sounds-game-for-kids');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/free-phonics-balloon-pop-game-for-kids');

    // Verify prerender script uses canonical routes
    const prerenderSource = fs.readFileSync(path.join(repoRoot, 'scripts/prerender.mjs'), 'utf8');
    expect(prerenderSource).toContain('...PRERENDER_STATIC_ROUTES');
    expect(prerenderSource).not.toContain("'/free-letter-tracing-with-sounds-game-for-kids'");
    expect(prerenderSource).not.toContain("'/free-phonics-balloon-pop-game-for-kids'");
  });

  it('confirms destination pages are self-canonical', () => {
    // Letter Tracing With Sounds
    const letterTracingPageSource = fs.readFileSync(path.join(repoRoot, 'src/pages/public/LetterTracingWithSoundsGamePage.tsx'), 'utf8');
    expect(letterTracingPageSource).toContain("const PAGE_PATH = '/letter-tracing-with-sounds-game'");
    expect(letterTracingPageSource).toContain("canonicalPath: PAGE_PATH");

    // Balloon Pop Phonics
    const balloonPopPageSource = fs.readFileSync(path.join(repoRoot, 'src/pages/public/FreeBalloonPopGamePage.tsx'), 'utf8');
    expect(balloonPopPageSource).toContain("const PAGE_PATH = '/free-balloon-pop-phonics-game-for-kids'");
    expect(balloonPopPageSource).toContain("canonicalPath: PAGE_PATH");
  });
});
