import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #64 subject-verb agreement quality', () => {
  it('owns SVA intent with accurate evergreen rules and transfer guidance', () => {
    const post = bySlug.get('grammar-subject-verb');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('FIND → CHECK → MATCH → SAY → WRITE → TRANSFER');
    expect(body).toContain('Why “one person = add S” is only a shortcut');
    expect(body).toContain('I play.');
    expect(body).toContain('You play.');
    expect(body).toContain('He / She / It plays.');
    expect(body).toContain('third-person singular');
    expect(body).toContain('go → **goes**');
    expect(body).toContain('The verb be: am, is and are');
    expect(body).toContain('Was vs were');
    expect(body).toContain('Have vs has');
    expect(body).toContain('Do vs does');
    expect(body).toContain('The **child plays**.');
    expect(body).toContain('The **children play**.');
    expect(body).toContain('Maya and Aarav **play** chess.');
    expect(body).toContain('The box of crayons is on the table.');
    expect(body).toContain('Keep subject-verb agreement separate from tense');
    expect(body).toContain('HEAR → COMPARE → PRODUCE');
    expect(body).toContain('SEE → SAY → SWAP → WRITE');
    expect(body).toContain('Subject-verb agreement in connected writing');
    expect(body).toContain('How to know whether subject-verb agreement is becoming secure');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/grammar');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*10\b/i);
    expect(body).not.toContain('Week 11');
    expect(body).not.toContain('Common errors in Indian English context');
    expect(body).not.toContain('One person — add S. Many people — no S.');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships SVA-specific FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-subject-verb');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what is subject-verb agreement/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /he plays.*they play/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /i play.*i plays/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /difference between is and are/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /has and have/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /he go.*he goes/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /without worksheets/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-subject-verb')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-subject-verb')).toBe(true);
    expect(shouldNoindexBlogSlug('week-10-grammar-subject-verb')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-10-grammar-subject-verb']).toBe(
      '/blog/grammar-subject-verb',
    );
    expect(bySlug.has('week-10-grammar-subject-verb')).toBe(false);
  });
});
