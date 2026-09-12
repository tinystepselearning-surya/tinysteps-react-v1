import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  PARENT_COMMUNICATION_17_AUTHORITY_SLUGS,
  QUALITY_AUTHORITY_ROUTES,
  QUALITY_AUTHORITY_SLUGS,
} from '../../lib/editorialQualityRoutes.js';
import { PHONICS_AUTHORITY_SLUGS } from '../../lib/phonicsAuthorityRoutes.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const repoRoot = process.cwd();
const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const COMMERCIAL_OWNER_ROUTES = [
  '/phonics',
  '/best-online-phonics-classes-for-kids-in-india',
  '/phonics-fees-india',
  '/reading-classes-for-kids',
  '/reading-fluency-program',
  '/grammar',
  '/writing-classes-for-kids',
  '/spoken-english-classes-for-kids-online',
  '/speaking',
  '/confidence-building-program-kids',
  '/online-english-classes-for-kids',
  '/online-english-classes-hyderabad',
  '/pricing',
  '/book-demo',
];

describe('Quality-reviewed editorial search and LLM discovery lock', () => {
  it('keeps the current 50 quality-reviewed editorial authorities complete, unique and indexable', () => {
    expect(PHONICS_AUTHORITY_SLUGS).toHaveLength(33);
    expect(PARENT_COMMUNICATION_17_AUTHORITY_SLUGS).toHaveLength(17);
    expect(QUALITY_AUTHORITY_SLUGS).toHaveLength(50);
    expect(new Set(QUALITY_AUTHORITY_SLUGS).size).toBe(50);
    expect(QUALITY_AUTHORITY_ROUTES).toHaveLength(50);
    expect(QUALITY_AUTHORITY_SLUGS).not.toContain('how-to-choose-phonics-classes');

    for (const slug of QUALITY_AUTHORITY_SLUGS) {
      const post = postsBySlug.get(slug);
      expect(post, `missing normalized BlogPost for ${slug}`).toBeDefined();
      expect(shouldNoindexBlogSlug(slug), `${slug} unexpectedly noindexed`).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug), `${slug} missing from sitemap policy`).toBe(true);
    }
  });

  it('publishes every current quality-reviewed editorial URL in sitemap-blog.xml, llms.txt and llms-full.txt', () => {
    const sitemap = fs.readFileSync(path.join(repoRoot, 'public/sitemap-blog.xml'), 'utf8');
    const llms = fs.readFileSync(path.join(repoRoot, 'public/llms.txt'), 'utf8');
    const llmsFull = fs.readFileSync(path.join(repoRoot, 'public/llms-full.txt'), 'utf8');

    for (const route of QUALITY_AUTHORITY_ROUTES) {
      const absoluteUrl = `https://tinystepslearning.com${route}`;
      expect(sitemap, `${route} missing from blog sitemap`).toContain(`<loc>${absoluteUrl}</loc>`);
      expect(llms, `${route} missing from llms.txt`).toContain(absoluteUrl);
      expect(llmsFull, `${route} missing from llms-full.txt`).toContain(absoluteUrl);
    }

    expect(llms).toContain('Complete Quality-Reviewed Editorial Library');
    expect(llmsFull).toContain('Phonics Authority Programme');
    expect(llmsFull).toContain('Parent Communication / English Support Programme');
  });

  it('publishes all 14 canonical commercial owner URLs in llms.txt and the static sitemap', () => {
    const sitemap = fs.readFileSync(path.join(repoRoot, 'public/sitemap-static.xml'), 'utf8');
    const llms = fs.readFileSync(path.join(repoRoot, 'public/llms.txt'), 'utf8');

    expect(COMMERCIAL_OWNER_ROUTES).toHaveLength(14);
    expect(new Set(COMMERCIAL_OWNER_ROUTES).size).toBe(14);
    expect(llms).toContain('## Commercial Programme & Decision Pages');

    for (const route of COMMERCIAL_OWNER_ROUTES) {
      const absoluteUrl = `https://tinystepslearning.com${route}`;
      expect(sitemap, `${route} missing from static sitemap`).toContain(`<loc>${absoluteUrl}</loc>`);
      expect(llms, `${route} missing from llms.txt`).toContain(absoluteUrl);
    }
  });

  it('keeps public AI/search crawlers allowed while private Tiny Steps routes remain blocked', () => {
    const robots = fs.readFileSync(path.join(repoRoot, 'public/robots.txt'), 'utf8');

    for (const crawler of [
      'Bingbot',
      'Googlebot',
      'Google-Extended',
      'Applebot',
      'Applebot-Extended',
      'DuckDuckBot',
      'DuckAssistBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'GPTBot',
      'Claude-User',
      'Claude-SearchBot',
      'ClaudeBot',
      'PerplexityBot',
      'CCBot',
    ]) {
      expect(robots, `${crawler} must remain explicitly allowed on public routes`).toMatch(
        new RegExp(`User-agent:\\s*${crawler}[\\s\\S]{0,260}Allow:\\s*\\/`, 'i'),
      );
    }

    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /teacher/');
    expect(robots).toContain('Disallow: /parent/');
    expect(robots).toContain('Sitemap: https://tinystepslearning.com/sitemap.xml');
  });
});
