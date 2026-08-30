import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #21 quality lock', () => {
  it('owns the synthetic-phonics-versus-traditional-reading parent decision without creating a false literacy dichotomy', () => {
    const post = bySlug.get('synthetic-phonics-vs-traditional-reading');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Synthetic Phonics vs Traditional Reading: How Parents Decide What to Use');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('Quick answer: choose the reading process, not just the label');
    expect(body).toContain('What does synthetic phonics actually mean?');
    expect(body).toContain('What does “traditional reading” mean—and why is the comparison easy to oversimplify?');
    expect(body).toContain('The real parent decision: what happens when the word is unfamiliar?');
    expect(body).toContain('six differences parents can actually observe');
    expect(body).toContain('What strong synthetic phonics instruction should look like');
    expect(body).toContain('Where do storybooks, vocabulary and comprehension fit?');
    expect(body).toContain('A simple parent observation: use fresh words, not a high-stakes home test');
    expect(body).toContain('What if school uses a mixed method?');
    expect(body).toContain('What progress should parents look for?');
    expect(body).toContain('Common myths about synthetic phonics');
    expect(body).toContain('What the evidence does—and does not—say');

    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-rules-for-beginners');
    expect(body).toContain('/blog/child-knows-abc-but-cannot-read');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-to-choose-phonics-classes');
    expect(body).toContain('/blog/phonics-comprehension');
    expect(body).toContain('/blog/how-long-does-phonics-take');
    expect(body).toContain('/blog/science-of-phonics-learning');

    expect(body).not.toMatch(/(?:works?|progress|improv\w*)[^\n]{0,60}\b\d+[-–]?\d*\s*(?:days?|weeks?|months?)\b/i);
    expect(body).not.toMatch(/synthetic phonics (?:is )?(?:always|universally) (?:better|best)/i);
    expect(body).not.toMatch(/traditional reading (?:is )?(?:always )?(?:bad|wrong|worse)/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('adds evidence boundaries, a non-diagnostic observation framework and answer-engine FAQs', () => {
    const post = bySlug.get('synthetic-phonics-vs-traditional-reading');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('There is no single research-defined programme called “traditional reading.”');
    expect(body).toContain('meaning should not be asked to do the job of identifying a word');
    expect(body).toContain('Attend → Map → Blend → Check → Transfer');
    expect(body).toContain('not a standardized assessment or diagnostic tool');
    expect(body).toContain('There is **no universal research-defined number of days or weeks**');
    expect(body).toContain('Outside England, those documents are useful implementation references rather than rules.');
    expect(body).toContain('does not justify telling parents that every product carrying the word “synthetic” is equally effective');
    expect(body).toContain('cannot diagnose dyslexia or another learning condition');

    expect(post?.faq).toHaveLength(6);
    expect(post?.faq?.some((item) => /same as phonics/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /traditional reading instruction always bad/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /still read storybooks/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /school uses mixed reading methods/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /decode rather than memorise/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how long should synthetic phonics take/i.test(item.question))).toBe(true);
  });
});
