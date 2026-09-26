import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const CURATED_SLUGS = [
  'what-is-phonics-for-kids',
  'how-to-teach-paragraph-writing-to-kids',
  'how-to-teach-storytelling-to-kids',
  'child-understands-english-but-does-not-speak',
  'phonics-for-parents-guide',
  'child-knows-abc-but-cannot-read',
  'punctuation-and-capital-letters-for-kids',
  'conversation-skills-for-kids',
  'child-reads-in-class-but-forgets-at-home',
  'why-letter-sounds-are-not-enough-to-read',
];

describe('authority blog template rollout', () => {
  it('applies the authority layout automatically to every normal BlogPost', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(blogPosts.length).toBeGreaterThan(50);
    expect(new Set(blogPosts.map((post) => post.slug)).size).toBe(blogPosts.length);

    expect(page).toContain("const isSatpinGuide = slug === 'satpin-phonics-guide'");
    expect(page).toContain('const isAuthorityArticle = Boolean(post && slug && !isSatpinGuide)');
    expect(page).toContain('const useAuthorityLayout = isSatpinGuide || isAuthorityArticle');
    expect(page).not.toContain('AUTHORITY_BLOG_PILOT_SLUGS');
    expect(page).not.toContain('isAuthorityPilot');

    expect(page).toContain(') : isAuthorityArticle && post ? (');
    expect(page).toContain(') : isAuthorityArticle && slug ? (');
    expect(page).toContain('heroImage={isAuthorityArticle ? resolvedHero : undefined}');
    expect(page).toContain('heroImageAlt={isAuthorityArticle ? metaSource.title : undefined}');
  });

  it('keeps SATPIN on its dedicated teaching experience', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain('<SatpinGuideExperience');
    expect(page).toContain('<SatpinGuideSidebar tocItems={tocItems} />');
    expect(page).toContain('<AuthorityBlogExperience');
    expect(page).toContain('<AuthorityBlogSidebar');
  });

  it('keeps the authority article renderer synchronous and the compact hero image eager', () => {
    const page = read('src/pages/BlogPostPage.tsx');
    const hero = read('src/components/blog/ResearchArticleHero.tsx');

    expect(page).toContain("import AuthorityBlogExperience from '../components/blog/AuthorityBlogExperience'");
    expect(page).not.toContain("lazy(() => import('../components/blog/AuthorityBlogExperience'))");
    expect(hero).toContain('heroImage?: string');
    expect(hero).toContain("lg:grid-cols-[minmax(0,1fr)_300px]");
    expect(hero).toContain('loading="eager"');
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('aspect-[4/3]');
  });

  it('preserves all supported blog block types and protects pre-H2 or H2-less content', () => {
    const experience = read('src/components/blog/AuthorityBlogExperience.tsx');
    const supported = new Set(['h2', 'h3', 'p', 'li']);

    for (const post of blogPosts) {
      expect(Array.isArray(post.body)).toBe(true);
      for (const block of post.body) expect(supported.has(block.type)).toBe(true);
    }

    expect(experience).toContain('const prefaceBlocks: BlogBlock[] = []');
    expect(experience).toContain('else prefaceBlocks.push(block)');
    expect(experience).toContain("id: 'article-overview'");
    expect(experience).toContain('blocks: [...prefaceBlocks, ...sections[0].blocks]');
  });

  it('provides the reusable desktop scroll-spy and mobile guide index library-wide', () => {
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

  it('retains bespoke hero points and eight-section indexes for the ten reviewed articles', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain('AUTHORITY_CURATED_HERO_POINTS');
    expect(page).toContain('AUTHORITY_CURATED_TOC_PREFIXES');
    expect(page).toContain('curatedHeroPoints');
    expect(page).toContain('priorityPrefixes = AUTHORITY_CURATED_TOC_PREFIXES[slug] || []');
    expect(page).toContain('return h2Items.slice(0, 8)');

    for (const slug of CURATED_SLUGS) {
      expect(blogPosts.some((post) => post.slug === slug)).toBe(true);
      const heroStart = page.indexOf("'" + slug + "': [", page.indexOf('AUTHORITY_CURATED_HERO_POINTS'));
      const tocStart = page.indexOf("'" + slug + "': [", page.indexOf('AUTHORITY_CURATED_TOC_PREFIXES'));
      expect(heroStart).toBeGreaterThan(-1);
      expect(tocStart).toBeGreaterThan(-1);
    }
  });

  it('keeps FAQ, author and tracked conversion ownership outside the reusable article renderer', () => {
    const page = read('src/pages/BlogPostPage.tsx');

    expect(page).toContain("{post?.faq?.length ? <ParentsAlsoAsk items={post.faq} /> : null}");
    expect(page).toContain('<AboutAuthor');
    expect(page).toContain('<BlogConversionCard slug={slug} config={blogConversionConfig} />');
    expect(page).toContain('{!useAuthorityLayout ? (');
  });
});
