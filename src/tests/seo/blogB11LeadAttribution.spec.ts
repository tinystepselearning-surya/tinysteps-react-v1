import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  getBlogConversionConfig,
  isParentDemoConversion,
} from '../../content/blog/shared/conversionFamilies';
import { getBlogTechnicalAuthority } from '../../content/blog/shared/technicalAuthority';
import {
  buildBlogDemoPath,
  parseBlogLeadSourceDetail,
} from '../../lib/blogLeadAttribution';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const PROTECTED_FAMILIES = {
  'child-knows-abc-but-cannot-read': ['phonics-diagnostic', '/phonics'],
  'why-child-knows-letter-sounds-but-cannot-read-words': ['phonics-diagnostic', '/phonics'],
  'how-kids-learn-blending': ['phonics-practice', '/phonics'],
  'phonics-blending-activities': ['phonics-practice', '/phonics'],
  'satpin-phonics-guide': ['phonics-practice', '/phonics'],
  'phonics-for-parents-guide': ['phonics-practice', '/phonics'],
  'how-to-improve-reading-fluency-in-children': ['reading-fluency', '/phonics'],
  'child-knows-grammar-but-makes-mistakes': ['grammar-diagnostic', '/grammar'],
  'how-to-improve-sentence-formation-in-kids': ['sentence-building', '/grammar'],
  'week-7-grammar-nouns-to-paragraphs': ['sentence-building', '/grammar'],
  'child-understands-english-but-does-not-speak': ['speaking-confidence', '/speaking'],
  'child-gives-one-word-answers': ['speaking-confidence', '/speaking'],
  'week-12-speaking-confidence-seeds': ['speaking-confidence', '/speaking'],
} as const;

describe('B11 blog lead conversion and attribution guardrails', () => {
  it('keeps the 76-post corpus and routes protected owners to the correct conversion family', () => {
    expect(blogPosts).toHaveLength(76);

    for (const [slug, [family, programRoute]] of Object.entries(PROTECTED_FAMILIES)) {
      const post = bySlug.get(slug);
      expect(post, `${slug} must remain live`).toBeTruthy();
      const config = getBlogConversionConfig(post!);
      expect(config.family, slug).toBe(family);
      expect(config.primaryAction.kind, slug).toBe('demo');
      expect(config.primaryAction.to, slug).toBe('/book-demo');
      expect(config.secondaryAction?.to, slug).toBe(programRoute);
      expect(isParentDemoConversion(config), slug).toBe(true);
    }
  });

  it('keeps Schools & Research outside the parent demo funnel', () => {
    const schoolPosts = blogPosts.filter(
      (post) => getBlogTechnicalAuthority(post).audience === 'Schools & Research',
    );

    expect(schoolPosts.length).toBeGreaterThan(0);
    for (const post of schoolPosts) {
      const config = getBlogConversionConfig(post);
      expect(config.family, post.slug).toBe('schools-partnership');
      expect(config.primaryAction.kind, post.slug).toBe('schools');
      expect(config.primaryAction.to, post.slug).toBe('/for-schools');
      expect(config.secondaryAction?.to, post.slug).toBe('/contact');
      expect(isParentDemoConversion(config), post.slug).toBe(false);
    }
  });

  it('uses bounded internal blog attribution without replacing generic first-touch acquisition', () => {
    expect(
      buildBlogDemoPath({
        slug: 'child-gives-one-word-answers',
        family: 'speaking-confidence',
        ctaPosition: 'article_end',
      }),
    ).toBe(
      '/book-demo?from=blog&article=child-gives-one-word-answers&intent=speaking-confidence&cta=article_end',
    );

    expect(
      parseBlogLeadSourceDetail(
        'blog|child-gives-one-word-answers|speaking-confidence|article_end',
      ),
    ).toEqual({
      articleSlug: 'child-gives-one-word-answers',
      family: 'speaking-confidence',
      ctaPosition: 'article_end',
    });

    const blogAttribution = readRepoFile('src/lib/blogLeadAttribution.ts');
    const genericAttribution = readRepoFile('src/lib/conversionTracking.ts');
    expect(blogAttribution).toContain("ts_blog_conversion_attribution_v1");
    expect(blogAttribution).toContain('firstArticleSlug');
    expect(blogAttribution).toContain('lastArticleSlug');
    expect(genericAttribution).toContain('ts_lead_attribution_v1');
    expect(genericAttribution).toContain('existing?.landingPage || patch.landingPage');
    expect(genericAttribution).toContain('existing?.firstSeenAt || patch.firstSeenAt');
  });

  it('writes blog context through the existing public lead sourceDetail field and measures the real form funnel', () => {
    const demoPage = readRepoFile('src/pages/public/BookDemoPage.tsx');
    const publicLeadForm = readRepoFile('src/lib/publicLeadForm.ts');
    const tracking = readRepoFile('src/lib/blogConversionTracking.ts');

    expect(demoPage).toContain('resolveBlogLeadSourceDetail(location.search)');
    expect(demoPage).toContain('trackBlogDemoStart');
    expect(demoPage).toContain('trackBlogDemoSubmit');
    expect(demoPage).toContain('source={assessmentSource}');
    expect(publicLeadForm).toContain("sourceDetail: opts.source || 'public_assessment_form'");

    for (const eventName of [
      'blog_article_view',
      'blog_cta_impression',
      'blog_cta_click',
      'blog_program_click',
      'blog_demo_start',
      'blog_demo_submit',
    ]) {
      expect(tracking).toContain(`'${eventName}'`);
    }
  });

  it('consolidates the blog conversion UX into one contextual end card without adding a sticky CTA', () => {
    const page = readRepoFile('src/pages/BlogPostPage.tsx');
    const card = readRepoFile('src/components/blog/BlogConversionCard.tsx');

    expect(page).toContain('getBlogConversionConfig');
    expect(page).toContain('captureBlogArticleContext');
    expect(page).toContain('trackBlogArticleView');
    expect(page).toContain('<BlogConversionCard slug={slug} config={blogConversionConfig} />');
    expect(page).not.toContain('Continue with Tiny Steps learning paths');
    expect(page).not.toContain('>Parent Guidance<');
    expect(page).toContain("searchLabel={isSchoolConversion ? 'Schools often ask' : 'Parents often search'}");

    expect(card).toContain("const CTA_POSITION = 'article_end'");
    expect(card).toContain('IntersectionObserver');
    expect(card).not.toMatch(/\bfixed\b/);
    expect(card).not.toMatch(/\bsticky\b/);
  });

  it('documents the conversion taxonomy, privacy boundary and zero-URL policy', () => {
    const audit = readRepoFile('docs/seo/blog-bricks/B11_CONVERSION_ATTRIBUTION_AUDIT.md');
    const measurement = readRepoFile('docs/seo/blog-bricks/B11_MEASUREMENT_SPEC.md');

    expect(audit).toContain('Live blog inventory: **76**');
    expect(audit).toContain('New blog URLs planned in B11: **0**');
    expect(audit).toContain('no fingerprinting');
    expect(audit).toContain('Schools are a separate conversion journey');
    expect(measurement).toContain('blog_demo_submit');
    expect(measurement).toContain('Acquisition versus influence');
    expect(measurement).toContain('Only `blog_demo_submit` represents a successfully submitted');
  });
});
