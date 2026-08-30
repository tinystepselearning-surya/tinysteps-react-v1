import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #24 quality lock', () => {
  it('owns practical multisyllabic chunking without turning one split rule, timer or word quota into mastery', () => {
    const post = bySlug.get('phonics-multisyllabic');
    expect(post).toBeDefined();
    expect(post?.title).toBe('How to Help Kids Read Multisyllabic Words: Simple Chunking Practice');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: how do you help a child read a long word?');
    expect(body).toContain('First check: is the child ready for multisyllabic word practice?');
    expect(body).toContain('Syllables and morphemes: two useful ways to see a big word');
    expect(body).toContain('Chunking is a teaching support, not a claim that every word has one visually perfect split.');
    expect(body).toContain('The Tiny Steps five-step long-word routine');
    expect(body).toContain('Choose long words by teaching stage, not by how impressive they look');
    expect(body).toContain('Stage A — two-part words built mostly from secure patterns');
    expect(body).toContain('Stage B — add familiar endings and meaningful word parts');
    expect(body).toContain('Stage C — three or more syllables and more complex morphology');
    expect(body).toContain('A short home practice routine that does not become a word race');
    expect(body).toContain('Clapping syllables can help — but it is not the whole reading lesson');
    expect(body).toContain('Common long-word errors and what they usually tell you');
    expect(body).toContain('The Tiny Steps four-signal progress check');
    expect(body).toContain('When to step back or ask for more support');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/cvc-words-explained-for-parents');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/long-vowel-sounds-for-kids');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/phonics-comprehension');
    expect(body).toContain('/phonics');

    expect(body).not.toMatch(/\bWeek\s+19\b/i);
    expect(body).not.toContain('underline all vowels first');
    expect(body).not.toContain('12 minutes/day');
    expect(body).not.toContain('read race');
    expect(body).not.toContain('Five to ten focused minutes can be enough');
    expect(body).not.toContain('decode three to five fresh multisyllabic words');
    expect(body).not.toMatch(/guaranteed? to (?:master|read|improve)/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('locks evidence boundaries, morphology, transfer, FAQs and indexable authority status', () => {
    const post = bySlug.get('phonics-multisyllabic');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(4);
    expect(body).toContain('The exact Tiny Steps five-step routine above is an editorial teaching routine, not a standardized research protocol.');
    expect(body).toContain('The evidence does not establish one universal chunking algorithm');
    expect(body).toContain('not a required daily dose');
    expect(body).toContain('at least one chance to transfer the routine');
    expect(body).toContain('This article is a practice guide, not a diagnostic assessment for dyslexia or another learning condition.');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /What is a multisyllabic word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /break a long word into parts/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /one correct way to split every multisyllabic word/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /underline every vowel/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /clapping syllables enough/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /still cannot read multisyllabic words/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('phonics-multisyllabic')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('phonics-multisyllabic')).toBe(true);
    expect(shouldNoindexBlogSlug('week-19-phonics-multisyllabic')).toBe(true);
    expect(shouldIncludeBlogSlugInSitemap('week-19-phonics-multisyllabic')).toBe(false);
  });
});
