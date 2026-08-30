import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { shouldIncludeBlogSlugInSitemap, shouldNoindexBlogSlug } from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';
// This build-time Node utility is JavaScript by design and has no TypeScript declaration.
// @ts-expect-error importing the sitemap source extractor is intentional for this integration lock.
import { extractBlogEntriesFromPostFiles } from '../../../scripts/blog-route-utils.mjs';

type SitemapSourceEntry = {
  slug: string;
  sourceSlug: string;
  date: string | null;
  modifiedDate: string | null;
};

const repoRoot = process.cwd();
const refreshDate = '2026-08-30';
const batch3 = [
  ['synthetic-phonics-vs-traditional-reading', null],
  ['phonics-satpin-launch', 'week-1-phonics-satpin-launch'],
  ['phonics-summer-plan', 'week-16-phonics-summer-plan'],
  ['phonics-multisyllabic', 'week-19-phonics-multisyllabic'],
  ['phonics-blending-club', 'week-2-phonics-blending-club'],
  ['phonics-diagnostics', 'week-22-phonics-diagnostics'],
  ['prevent-summer-slide-reading', 'week-27-prevent-summer-slide-reading'],
  ['phonics-tricky-words', 'week-3-phonics-tricky-words'],
  ['phonics-long-vowels', 'week-4-phonics-long-vowels'],
  ['phonics-r-controlled', 'week-5-phonics-r-controlled'],
  ['phonics-comprehension', 'week-6-phonics-comprehension'],
  ['what-age-to-start-phonics', null],
  ['what-is-phonics-for-kids', null],
  ['why-parents-choose-online-phonics', null],
] as const;

const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Batch #3 modified-date SEO pipeline', () => {
  it('preserves publication dates while carrying the legitimate refresh date to clean sitemap entries', () => {
    const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));
    const sourceEntries = extractBlogEntriesFromPostFiles(
      path.join(repoRoot, 'src/content/blog/posts'),
    ) as SitemapSourceEntry[];
    const entriesByPublicSlug = new Map(sourceEntries.map((entry) => [entry.slug, entry]));

    for (const [slug, legacySourceSlug] of batch3) {
      const post = postsBySlug.get(slug);
      const sitemapEntry = entriesByPublicSlug.get(slug);

      expect(post, `${slug} should remain in the public registry`).toBeDefined();
      expect(post?.date, `${slug} should retain an original publication date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post?.date, `${slug} publication date must not be replaced by its refresh date`).not.toBe(refreshDate);
      expect(post?.modifiedDate, `${slug} should expose the Batch #3 refresh date`).toBe(refreshDate);
      expect(sitemapEntry?.date, `${slug} sitemap publication input`).toBe(post?.date);
      expect(sitemapEntry?.modifiedDate, `${slug} sitemap lastmod input`).toBe(refreshDate);
      expect(shouldIncludeBlogSlugInSitemap(slug), `${slug} sitemap eligibility`).toBe(true);
      expect(shouldNoindexBlogSlug(slug), `${slug} clean URL indexability`).toBe(false);

      if (legacySourceSlug) {
        expect(sitemapEntry?.sourceSlug).toBe(legacySourceSlug);
        expect(postsBySlug.has(legacySourceSlug), `${legacySourceSlug} must not compete as public content`).toBe(false);
        expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS[`/blog/${legacySourceSlug}`]).toBe(`/blog/${slug}`);
      } else {
        expect(sitemapEntry?.sourceSlug).toBe(slug);
      }
    }
  });

  it('wires distinct published and modified dates through sitemap, schema, Open Graph, and RSS', () => {
    const sitemapGenerator = readRepoFile('scripts/generate-sitemaps.js');
    const blogPage = readRepoFile('src/pages/BlogPostPage.tsx');
    const seo = readRepoFile('src/lib/seo.ts');
    const rss = readRepoFile('scripts/generate-rss.mjs');

    expect(sitemapGenerator).toContain('entry.modifiedDate || entry.date');
    expect(sitemapGenerator).toContain('const publicationDate = blogPostSlugDateMap.get(slug)');
    expect(sitemapGenerator).toContain('const mappedLastmod = blogPostSlugLastmodMap.get(slug)');
    expect(blogPage).toContain('obj.datePublished = isoDateFromYMD(metaSource.date)');
    expect(blogPage).toContain('obj.dateModified = isoDateFromYMD(metaSource.modifiedDate)');
    expect(blogPage).toContain('articlePublishedTime: source.date ? isoDateFromYMD(source.date) : undefined');
    expect(blogPage).toContain('articleModifiedTime: source.modifiedDate ? isoDateFromYMD(source.modifiedDate) : undefined');
    expect(seo).toContain('meta[property="article:modified_time"]');
    expect(rss).toContain("extractSingleQuotedField(content, 'modifiedDate')");
    expect(rss).toContain('updatedDate: modifiedDate ? `${modifiedDate}T00:00:00Z` : undefined');
    expect(rss).toContain('<atom:updated>');
  });
});
