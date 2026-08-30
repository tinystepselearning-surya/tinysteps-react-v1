import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

describe('authoritative Blog #16 quality lock', () => {
  it('owns letter-sound game practice without fixed dosage, sound-count or alphabet-before-blending rules', () => {
    const post = bySlug.get('phonics-games-for-letter-sounds');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Phonics Games for Letter Sounds: Parent Routine for Daily Practice');
    expect(post?.author).toBe('Priya');
    expect(post?.date).toBe('2025-11-22');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('see it → say it → hear it → find or write it → use it in a word');
    expect(body).toContain('Letter names and letter sounds are different—and children need both');
    expect(body).toContain('Do not wait for all 26 letters before blending begins');
    expect(body).toContain('Game 1 — See the letter, say the sound');
    expect(body).toContain('Game 2 — Hear the sound, find the letter');
    expect(body).toContain('Game 3 — Sound detective');
    expect(body).toContain('Game 4 — Same or different?');
    expect(body).toContain('Game 5 — Make one tiny word');
    expect(body).toContain('Game 6 — Say it, then spell it');
    expect(body).toContain('There is no research-defined universal number such as “three to five sounds”');
    expect(body).toContain('This article does not prescribe a universal 10-minute routine');

    expect(body).toContain('/blog/online-phonics-games');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/phonics-blending-activities');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/satpin-phonics-guide');
    expect(body).toContain('/blog/phonics-rules-for-beginners');

    expect(body).not.toMatch(/10-minute daily routine/i);
    expect(body).not.toMatch(/3-5 target sounds/i);
    expect(body).not.toMatch(/5-6 days a week/i);
    expect(body).not.toMatch(/6-8 weeks/i);
    expect(body).not.toMatch(/master all (?:26|twenty-six) letters before blending/i);
    expect(body).not.toMatch(/guaranteed?\s+(?:confidence|reading|to read)/i);
  });

  it('adds evidence, accurate Tiny Steps game boundaries and five extractable FAQs', () => {
    const post = bySlug.get('phonics-games-for-letter-sounds');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('blendable pronunciations');
    expect(body).toContain('avoiding an added “uh” sound');
    expect(body).toContain('Balloon Pop: sound-to-letter recognition');
    expect(body).toContain('We treat this as listening and letter-sound recognition practice—not proof of word reading');
    expect(body).toContain('Letter Tracing With Sounds: formation plus sound connection');
    expect(body).toContain('tracing accuracy does not by itself prove');
    expect(body).toContain('These are observation signals, not mastery percentages or a diagnostic screen');
    expect(body).toContain('This article is educational guidance and cannot diagnose');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /best phonics games for learning letter sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /letter names or letter sounds first/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /how many letter sounds/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /every letter sound before starting to blend/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /game is helping/i.test(item.question))).toBe(true);
  });
});
