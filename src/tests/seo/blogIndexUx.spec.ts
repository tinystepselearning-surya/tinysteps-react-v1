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
  getBlogCardLabel,
  getBlogDiscoveryTopic,
  getDefaultParentLibraryPosts,
  getLibraryCountLabel,
  getPublishedCountLabel,
  isParentFacingBlogPost,
  sortBlogIndexPostsNewest,
} from '../../pages/blog/blogIndexUx';

describe('B5 blog index UX model with post-B7 polish', () => {
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

  it('uses audience discovery categories for public filters instead of source-folder labels', () => {
    const parentPhonicsGuide = blogPosts.find((post) => post.slug === 'phonics-for-parents-guide');
    expect(parentPhonicsGuide).toBeTruthy();
    expect(parentPhonicsGuide!.category).toBe('Research');
    expect(getBlogDiscoveryTopic(parentPhonicsGuide!)).toBe('Phonics');
    expect(getBlogCardLabel(parentPhonicsGuide!)).toBe('Phonics');

    const phonics = filterBlogIndexPosts(blogPosts, 'Phonics', 'reading');
    expect(phonics.length).toBeGreaterThan(0);
    expect(phonics.every((post) => getBlogDiscoveryTopic(post) === 'Phonics')).toBe(true);

    const schools = filterBlogIndexPosts(blogPosts, 'Schools & Research', '');
    expect(schools.length).toBeGreaterThan(0);
    expect(schools.every((post) => post.audience === 'Schools & Research')).toBe(true);
  });

  it('keeps the default Parent library free of school-research cards', () => {
    const parentPosts = filterBlogIndexPosts(blogPosts, 'Parent', '');
    expect(parentPosts.length).toBeGreaterThan(0);
    expect(parentPosts.every((post) => isParentFacingBlogPost(post))).toBe(true);
    expect(parentPosts.every((post) => post.audience !== 'Schools & Research')).toBe(true);

    const authoritySlugs = new Set(getAuthorityPosts(blogPosts).map((post) => post.slug));
    const library = getDefaultParentLibraryPosts(blogPosts, authoritySlugs);
    expect(library.every((post) => isParentFacingBlogPost(post))).toBe(true);
    expect(library.every((post) => !authoritySlugs.has(post.slug))).toBe(true);
  });

  it('labels the default parent feed as the dynamic remainder after featured guides', () => {
    const authoritySlugs = new Set(getAuthorityPosts(blogPosts).map((post) => post.slug));
    const library = getDefaultParentLibraryPosts(blogPosts, authoritySlugs);

    expect(getLibraryCountLabel(library.length, true)).toBe(`${library.length} more articles`);
    expect(getLibraryCountLabel(1, true)).toBe('1 more article');
    expect(getLibraryCountLabel(0, true)).toBeNull();
    expect(getLibraryCountLabel(12, false)).toBe('12 articles');
    expect(getLibraryCountLabel(1, false)).toBe('1 article');
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

  it('keeps internal SEO strategy language out of public-facing blog copy', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/blog/BlogIndexPage.tsx'), 'utf8');
    expect(source).not.toContain('earning strong search visibility');
    expect(source).not.toContain('authority routes');
    expect(source).not.toContain('without another long feed');
    expect(source).not.toContain('Popular guides parents start with');
    expect(source).toContain('Featured guides to start with');
    expect(source).toContain('Get practical English-learning ideas in your inbox');
  });

  it('wraps discovery filters and preserves explicit B7 modified-date semantics', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/blog/BlogIndexPage.tsx'), 'utf8');
    expect(source).toContain('mt-2 flex flex-wrap gap-2');
    expect(source).not.toContain('overflow-x-auto');
    expect(source).not.toContain('dateModified: isoDateFromYMD(post.date)');
    expect(source).toContain('post.modifiedDate ? { dateModified: isoDateFromYMD(post.modifiedDate) } : {}');
    expect(source).toContain('buildBlogAuthorSchema(resolveBlogAuthor(post.author, post.category))');
  });

  it('keeps the public BlogPage route module stable while delegating to the typed index', () => {
    const routeModule = fs.readFileSync(path.join(process.cwd(), 'src/pages/BlogPage.tsx'), 'utf8');
    expect(routeModule.trim()).toBe("export { default } from './blog/BlogIndexPage';");
  });
});
