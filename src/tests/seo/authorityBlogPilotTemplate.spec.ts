import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const PILOT_SLUGS = [
  'what-is-phonics-for-kids',
  'how-to-teach-paragraph-writing-to-kids',
  'how-to-teach-storytelling-to-kids',
  'child-understands-english-but-does-not-speak',
  'phonics-for-parents-guide',
];

describe('authority blog template pilot', () => {
  it('limits the new authority layout to exactly one pilot from each blog category', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    for (const slug of PILOT_SLUGS) {
      expect(page).toContain("'" + slug + "'");
      expect(blogPosts.some((post) => post.slug === slug)).toBe(true);
    }

    expect(PILOT_SLUGS).toHaveLength(5);
    expect(new Set(PILOT_SLUGS).size).toBe(5);

    const categories = PILOT_SLUGS.map(
      (slug) => blogPosts.find((post) => post.slug === slug)?.category,
    );
    expect(new Set(categories)).toEqual(
      new Set(['Phonics', 'Grammar', 'Public Speaking', 'Parent Tips', 'Research']),
    );
  });

  it('reuses the SATPIN visual system without replacing the SATPIN-specific teaching experience', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain("lazy(() => import('../components/blog/AuthorityBlogExperience'))");
    expect(page).toContain("import AuthorityBlogSidebar from '../components/blog/AuthorityBlogSidebar'");
    expect(page).toContain("const isSatpinGuide = slug === 'satpin-phonics-guide'");
    expect(page).toContain('const isAuthorityPilot = Boolean(slug && AUTHORITY_BLOG_PILOT_SLUGS.has(slug))');
    expect(page).toContain('const useAuthorityLayout = isSatpinGuide || isAuthorityPilot');
    expect(page).toContain('<SatpinGuideExperience');
    expect(page).toContain('<AuthorityBlogExperience');
    expect(page).toContain('<SatpinGuideSidebar tocItems={tocItems} />');
    expect(page).toContain('<AuthorityBlogSidebar');
    expect(page).toContain('compact={useAuthorityLayout}');
  });

  it('provides the reusable left-side scroll-spy index and mobile guide index', () => {
    const sidebar = read('src/components/blog/AuthorityBlogSidebar.tsx');
    const experience = read('src/components/blog/AuthorityBlogExperience.tsx');

    expect(sidebar).toContain('Guide index');
    expect(sidebar).toContain('aria-current');
    expect(sidebar).toContain('requestAnimationFrame');
    expect(sidebar).toContain('window.innerHeight * 0.28');
    expect(sidebar).toContain('section.getBoundingClientRect().top <= readingMarker');
    expect(sidebar).toContain('document.documentElement.scrollHeight - 8');
    expect(sidebar).toContain('AuthorityBlogJumpNavClicked');

    expect(experience).toContain('<details');
    expect(experience).toContain('Guide index');
    expect(experience).toContain('lg:hidden');
    expect(experience).toContain('data-authority-section');
    expect(experience).toContain('AuthorityBlogSectionViewed');
  });

  it('keeps the authority reading experience editorial, crawlable and evidence-aware', () => {
    const experience = read('src/components/blog/AuthorityBlogExperience.tsx');

    expect(experience).toContain('Quick answer');
    expect(experience).toContain('ts-answer-title ts-blog-hero-title');
    expect(experience).toContain('ts-answer-summary ts-blog-quick-answer');
    expect(experience).toContain('border-y border-slate-200/70 px-1 py-7');
    expect(experience).toContain('Evidence behind this guide');
    expect(experience).toContain('Read source');
    expect(experience).toContain('target="_blank"');
    expect(experience).toContain('rel="noopener noreferrer"');
    expect(experience).toContain("raw.startsWith('**')");
    expect(experience).toContain("href.startsWith('/')");
    expect(experience).toContain('@@card:');
    expect(experience).toContain("split('|')");
  });

  it('uses article-specific hero points and curated eight-section indexes for all five pilots', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain('AUTHORITY_PILOT_HERO_POINTS');
    expect(page).toContain('AUTHORITY_PILOT_TOC_PREFIXES');
    expect(page).toContain('isAuthorityPilot && pilotHeroPoints');
    expect(page).toContain('priorityPrefixes = AUTHORITY_PILOT_TOC_PREFIXES[slug] || []');

    for (const slug of PILOT_SLUGS) {
      const heroStart = page.indexOf("'" + slug + "': [", page.indexOf('AUTHORITY_PILOT_HERO_POINTS'));
      const tocStart = page.indexOf("'" + slug + "': [", page.indexOf('AUTHORITY_PILOT_TOC_PREFIXES'));
      expect(heroStart).toBeGreaterThan(-1);
      expect(tocStart).toBeGreaterThan(-1);
    }
  });

  it('keeps FAQ, author and the existing tracked conversion card outside the reusable article renderer', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain("{post?.faq?.length ? <ParentsAlsoAsk items={post.faq} /> : null}");
    expect(page).toContain('<AboutAuthor');
    expect(page).toContain('<BlogConversionCard slug={slug} config={blogConversionConfig} />');
    expect(page).toContain('{!useAuthorityLayout ? (');
  });
});
