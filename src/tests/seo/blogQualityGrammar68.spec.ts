import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';
import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../../lib/blogWeekRenames.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #68 story cards grammar-speaking bridge quality', () => {
  it('owns the story-card activity bridge without stealing diagnostic or creative-writing intent', () => {
    const post = bySlug.get('grammar-speaking-bridge');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Story Cards for Kids: Build Grammar and Speaking Skills Together');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-09-06');
    expect(post?.readTime).toBe('15 min read');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Grammar');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('PICK → THINK → SAY → EXPAND → CONNECT → RETELL → TRANSFER');
    expect(body).toContain('Character:');
    expect(body).toContain('Setting:');
    expect(body).toContain('Action or goal:');
    expect(body).toContain('Problem or change:');
    expect(body).toContain('Start with one complete sentence—not a full story');
    expect(body).toContain('Use grammar to make the story clearer—not to interrupt every sentence');
    expect(body).toContain('Complete sentence:');
    expect(body).toContain('Add a connected idea:');
    expect(body).toContain('opening → event → problem → response → ending');
    expect(body).toContain('Because or So?');
    expect(body).toContain('Change the Time');
    expect(body).toContain('Character Swap');
    expect(body).toContain('Retell Without the Cards');
    expect(body).toContain('How to reduce support as the child becomes stronger');
    expect(body).toContain('Optional writing transfer: speak first, then write from memory or notes');
    expect(body).toContain('How to know whether story-card practice is transferring');
    expect(body).toContain('Evidence and sources reviewed');

    expect(body).toContain('/blog/grammar-nouns-to-paragraphs');
    expect(body).toContain('/blog/grammar-creative-writing');
    expect(body).toContain('/blog/grammar-tenses');
    expect(body).toContain('/blog/grammar-subject-verb');
    expect(body).toContain('/blog/grammar-conjunctions');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/grammar');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');

    expect(body).not.toMatch(/\bWeek\s*23\b/i);
    expect(body).not.toContain('Week 24');
    expect(body).not.toContain('Done checklist');
    expect(body).not.toContain('one adjective per sentence');
    expect(body).not.toContain('Then you copy one sentence');
    expect(body).not.toContain('Parent guide: how to use this weekly plan in real life');
    expect(body).not.toContain('Tiny Steps quality standard for this week');
  });

  it('ships story-card FAQs, evidence and promoted clean indexability', () => {
    const post = bySlug.get('grammar-speaking-bridge');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);

    expect(post?.faq).toHaveLength(8);
    expect(post?.faq?.some((item) => /what are story cards/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /practise grammar/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many story cards/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct grammar/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /one-word answers/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /write the story/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /creative writing practice/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /no longer needs story-card scaffolds/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('grammar-speaking-bridge')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('grammar-speaking-bridge')).toBe(true);
    expect(shouldNoindexBlogSlug('week-23-grammar-speaking-bridge')).toBe(true);
    expect(LEGACY_WEEK_BLOG_PATH_REDIRECTS['/blog/week-23-grammar-speaking-bridge']).toBe(
      '/blog/grammar-speaking-bridge',
    );
    expect(bySlug.has('week-23-grammar-speaking-bridge')).toBe(false);
  });
});
