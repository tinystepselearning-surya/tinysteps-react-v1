import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  GSC_AUTHORITY_SLUGS,
  PARENT_GOAL_ROUTES,
  buildBlogSearchText,
  filterBlogIndexPosts,
  getAuthorityPosts,
  getPublishedCountLabel,
  sortBlogIndexPostsNewest,
} from '../../pages/blog/blogIndexUx';

describe('B5 blog index UX model', () => {
  it('uses the real normalized registry instead of a stale hard-coded article count', () => {
    expect(blogPosts.length).toBe(76);
    expect(getPublishedCountLabel(blogPosts.length)).toBe('76 published articles');

    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/blog/BlogIndexPage.tsx'), 'utf8');
    expect(source).not.toContain('56+ curated parent articles');
  });

  it('surfaces the GSC-backed authority routes in deliberate order', () => {
    const authority = getAuthorityPosts(blogPosts, 4);
    expect(authority.map((post) => post.slug)).toEqual([...GSC_AUTHORITY_SLUGS]);
    expect(authority.every((post) => !post.slug.startsWith('week-'))).toBe(true);
  });

  it('keeps the B2 parent-goal routes distinct and evergreen', () => {
    const registry = new Set(blogPosts.map((post) => post.slug));
    const targets = PARENT_GOAL_ROUTES.map((route) => route.to.replace(/^\/blog\//, ''));

    expect(new Set(targets).size).toBe(PARENT_GOAL_ROUTES.length);
    expect(targets.every((slug) => registry.has(slug))).toBe(true);
    expect(targets.every((slug) => !slug.startsWith('week-'))).toBe(true);
    expect(targets).toContain('child-knows-abc-but-cannot-read');
    expect(targets).toContain('why-child-knows-letter-sounds-but-cannot-read-words');
  });

  it('searches meaningful body and FAQ text, not only card titles', () => {
    const post = blogPosts.find((candidate) => candidate.slug === 'phonics-for-parents-guide');
    expect(post).toBeTruthy();
    expect(buildBlogSearchText(post!)).toContain(post!.title.toLowerCase());

    const bodyPhrase = post!.body.map((block) => block.content).join(' ').split(/\s+/).slice(0, 3).join(' ');
    const matches = filterBlogIndexPosts(blogPosts, 'All', bodyPhrase);
    expect(matches.some((candidate) => candidate.slug === post!.slug)).toBe(true);
  });

  it('combines topic filtering with parent-style search', () => {
    const phonics = filterBlogIndexPosts(blogPosts, 'Phonics', 'reading');
    expect(phonics.length).toBeGreaterThan(0);
    expect(phonics.every((post) => post.category === 'Phonics')).toBe(true);

    const grammar = filterBlogIndexPosts(blogPosts, 'Grammar', 'sentence');
    expect(grammar.length).toBeGreaterThan(0);
    expect(grammar.every((post) => post.category === 'Grammar')).toBe(true);
  });

  it('uses deterministic newest-first ordering instead of unsupported popularity claims', () => {
    const sorted = sortBlogIndexPostsNewest(blogPosts);
    for (let index = 1; index < sorted.length; index += 1) {
      expect(new Date(sorted[index - 1].date).getTime()).toBeGreaterThanOrEqual(
        new Date(sorted[index].date).getTime(),
      );
    }

    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/blog/BlogIndexPage.tsx'), 'utf8');
    expect(source).not.toContain('Most Popular');
    expect(source).not.toContain('Most Read');
    expect(source).not.toContain('Why this page is easier to use');
  });

  it('keeps the public BlogPage route module stable while delegating to the new typed index', () => {
    const routeModule = fs.readFileSync(path.join(process.cwd(), 'src/pages/BlogPage.tsx'), 'utf8');
    expect(routeModule.trim()).toBe("export { default } from './blog/BlogIndexPage';");
  });
});
