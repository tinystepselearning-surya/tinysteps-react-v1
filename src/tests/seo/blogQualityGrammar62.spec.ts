import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #62 English tenses quality', () => {
  it('owns tense/time-control intent with accurate evergreen explanations', () => {
    const post = bySlug.get('grammar-tenses');
    expect(post).toBeDefined();
    expect(post?.title).toBe('English Tenses for Kids: Simple Present, Past and Future Explained');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('YESTERDAY → TODAY → TOMORROW');
    expect(body).toContain('HEAR → NOTICE → CHOOSE → SAY → WRITE → TRANSFER');
    expect(body).toContain('Simple present vs happening right now');
    expect(body).toContain('Regular and irregular past verbs');
    expect(body).toContain('Future time for kids: will and going to');
    expect(body).toContain('Tense consistency across a story or paragraph');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('I eat breakfast every morning.');
    expect(body).toContain('I am eating breakfast now.');
    expect(body).toContain('go → **went**');
    expect(body).toContain('eat → **ate**');
    expect(body).toContain('will + base verb');
    expect(body).toContain('subject–verb agreement / present-form');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/grammar-subject-verb');

    expect(body).not.toMatch(/\bWeek\s*8\b/i);
    expect(body).not.toContain('Week 9');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
    expect(body).not.toContain('Today we eat toast');
  });

  it('ships tense-specific FAQs, cited evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-tenses');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what are tenses/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /simple present/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /yesterday i go/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /irregular verbs/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /same tense/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-tenses')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-tenses')).toBe(true);
    expect(shouldNoindexBlogSlug('week-8-grammar-tenses')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-8-grammar-tenses']).toBe(
      '/blog/grammar-tenses',
    );
    expect(bySlug.has('week-8-grammar-tenses')).toBe(false);
  });
});
