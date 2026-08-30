import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';
import {
  shouldIncludeBlogSlugInSitemap,
  shouldNoindexBlogSlug,
} from '../../lib/blogIndexingPolicy.js';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('Blog #48 back-to-school English confidence quality refresh', () => {
  it('owns classroom participation routines without replacing the confidence-versus-language diagnosis', () => {
    const post = bySlug.get('back-to-school-english-confidence-plan');
    expect(post).toBeDefined();
    expect(post?.title).toBe(
      'Back-to-School English Confidence Plan for Kids: Speaking, Participation and Classroom Routines',
    );
    expect(post?.category).toBe('Parent Tips');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);
    expect(post?.audience).toBe('Parent');
    expect(post?.discoveryCategory).toBe('Speaking & Communication');

    const body = post?.body.map((block) => block.content).join('\n') || '';
    expect(body).toContain('Routine → Rehearse → Respond → Participate → Reflect');
    expect(body).toContain('Step 1 — Routine: choose one classroom speaking job');
    expect(body).toContain('Step 2 — Rehearse: make the language available before adding pressure');
    expect(body).toContain('Step 3 — Respond: fade the support until the child can start independently');
    expect(body).toContain('Step 4 — Participate: make the task more classroom-like');
    expect(body).toContain('Step 5 — Reflect: name the successful strategy and the next small step');
    expect(body).toContain('Seven classroom English routines worth rehearsing before school restarts');
    expect(body).toContain('Asking for clarification');
    expect(body).toContain('Joining pair or group talk');
    expect(body).toContain('Repairing a mistake and continuing');
    expect(body).toContain('A calm back-to-school practice plan parents can adapt');
    expect(body).toContain('How parents can track participation without turning home into school');
    expect(body).toContain('Three different patterns parents should not collapse into “low confidence”');
    expect(body).toContain('For multilingual children, separate English proficiency from willingness to participate');
    expect(body).toContain('How parents and teachers can coordinate the first weeks back');

    expect(body).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(body).toContain('/blog/child-gives-one-word-answers');
    expect(body).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(body).toContain('/blog/speaking-confidence-seeds');
    expect(body).toContain('/blog/how-to-improve-reading-fluency-in-children');
    expect(body).toContain('/blog/june-school-reopening-english-readiness-plan');
    expect(body).toContain('/blog/how-phonics-grammar-and-communication-work-together');
    expect(body).toContain('/phonics');
    expect(body).toContain('/speaking');
    expect(body).toContain('/curriculum');
    expect(body).toContain('/book-demo');

    expect(body).not.toContain('Seven-day intervention protocol');
    expect(body).not.toContain('accuracy drops below about 60 percent');
    expect(body).not.toContain('no visible gain after 2 weeks');
    expect(body).not.toContain('confidence (1-5)');
    expect(body).not.toContain('20-30 minutes/day');
    expect(body).not.toContain('By the end of this protocol, parents should see measurable recovery');
  });

  it('gives Blog #48 evidence, answer-engine FAQs and indexable back-to-school participation status', () => {
    const post = bySlug.get('back-to-school-english-confidence-plan');
    expect(post).toBeDefined();

    const evidence = getBlogEvidenceSummary(post!);
    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(11);
    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /build my child.*English confidence before school starts/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /classroom English routines.*practise/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /memorise a self-introduction/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /speaks at home but not in class/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct.*grammar.*classroom speaking/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /speaking practice is helping/i.test(item.question))).toBe(true);

    expect(shouldNoindexBlogSlug('back-to-school-english-confidence-plan')).toBe(false);
    expect(shouldIncludeBlogSlugInSitemap('back-to-school-english-confidence-plan')).toBe(true);
  });
});
