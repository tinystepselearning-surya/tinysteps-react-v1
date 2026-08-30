import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  PARENT_COMMUNICATION_17_AUTHORITY_SLUGS,
  QUALITY_51_AUTHORITY_ROUTES,
  QUALITY_51_AUTHORITY_SLUGS,
} from '../../lib/editorialQualityRoutes.js';
import { PHONICS_34_AUTHORITY_SLUGS } from '../../lib/phonicsAuthorityRoutes.js';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const repoRoot = process.cwd();
const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blogs 1-51 search and LLM discovery lock', () => {
  it('keeps the first 51 quality-reviewed editorial authorities complete, unique and indexable', () => {
    expect(PHONICS_34_AUTHORITY_SLUGS).toHaveLength(34);
    expect(PARENT_COMMUNICATION_17_AUTHORITY_SLUGS).toHaveLength(17);
    expect(QUALITY_51_AUTHORITY_SLUGS).toHaveLength(51);
    expect(new Set(QUALITY_51_AUTHORITY_SLUGS).size).toBe(51);
    expect(QUALITY_51_AUTHORITY_ROUTES).toHaveLength(51);

    for (const slug of QUALITY_51_AUTHORITY_SLUGS) {
      const post = postsBySlug.get(slug);
      expect(post, `missing normalized BlogPost for ${slug}`).toBeDefined();
      expect(shouldNoindexBlogSlug(slug), `${slug} unexpectedly noindexed`).toBe(false);
      expect(shouldIncludeBlogSlugInSitemap(slug), `${slug} missing from sitemap policy`).toBe(true);
    }
  });

  it('publishes every quality-reviewed Blog 1-51 URL in sitemap-blog.xml, llms.txt and llms-full.txt', () => {
    const sitemap = fs.readFileSync(path.join(repoRoot, 'public/sitemap-blog.xml'), 'utf8');
    const llms = fs.readFileSync(path.join(repoRoot, 'public/llms.txt'), 'utf8');
    const llmsFull = fs.readFileSync(path.join(repoRoot, 'public/llms-full.txt'), 'utf8');

    for (const route of QUALITY_51_AUTHORITY_ROUTES) {
      const absoluteUrl = `https://tinystepslearning.com${route}`;
      expect(sitemap, `${route} missing from blog sitemap`).toContain(`<loc>${absoluteUrl}</loc>`);
      expect(llms, `${route} missing from llms.txt`).toContain(absoluteUrl);
      expect(llmsFull, `${route} missing from llms-full.txt`).toContain(absoluteUrl);
    }

    expect(llms).toContain('Complete Quality-Reviewed Editorial Library — 51');
    expect(llmsFull).toContain('Blogs 1-34 — Phonics Authority Programme');
    expect(llmsFull).toContain('Blogs 35-51 — Parent Communication / English Support Programme');
  });

  it('keeps public AI/search crawlers allowed while private Tiny Steps routes remain blocked', () => {
    const robots = fs.readFileSync(path.join(repoRoot, 'public/robots.txt'), 'utf8');

    for (const crawler of [
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
        new RegExp(`User-agent:\\s*${crawler}[\\s\\S]{0,140}Allow:\\s*\\/`, 'i'),
      );
    }

    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /teacher/');
    expect(robots).toContain('Disallow: /parent/');
    expect(robots).toContain('Sitemap: https://tinystepslearning.com/sitemap.xml');
  });
});
