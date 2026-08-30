import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const hasUnsupportedReadingGuarantee = (text: string) => {
  const guaranteeClaim = /\bguarantee(?:d|s)?\b[^.!?\n]{0,40}\b(?:reading|fluency|progress)\b/i;
  const explicitRejection = /(?:\bdoes not justify claiming\b|\b(?:does|do|can|will|should) not\b[^.!?\n]{0,120}\bguarantee|\bcannot\b[^.!?\n]{0,120}\bguarantee|\bno\b[^.!?\n]{0,120}\bguarantee|\bmarketing claims? that\b[^.!?\n]{0,120}\bguarantee)/i;

  return text
    .split('\n')
    .some((statement) => guaranteeClaim.test(statement) && !explicitRejection.test(statement));
};

describe('authoritative Blog #13 quality lock', () => {
  it('owns online phonics-game quality and reading transfer without treating engagement or scores as reading progress', () => {
    const post = bySlug.get('online-phonics-games');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Online Phonics Games for Kids: What Actually Builds Reading');
    expect(post?.author).toBe('Priya');
    expect(post?.modifiedDate).toBe('2026-08-30');
    expect(post?.metaDescription?.length).toBeLessThanOrEqual(160);

    const body = post?.body.map((block) => block.content).join('\n') || '';

    expect(body).toContain('game success is practice evidence; transfer is reading evidence');
    expect(body).toContain('The Tiny Steps six-check game-to-reading filter');
    expect(body).toContain('What exact reading skill is the game asking for?');
    expect(body).toContain('Is the phonics information accurate?');
    expect(body).toContain('Does the child have to retrieve or apply the skill?');
    expect(body).toContain('Is the feedback useful?');
    expect(body).toContain('Does the difficulty match what the child has been taught?');
    expect(body).toContain('Can you check transfer outside the game?');
    expect(body).toContain('Why engagement is not the same as reading progress');
    expect(body).toContain('A 60-second parent transfer check after a game');
    expect(body).toContain('Red flags in an online phonics game');

    expect(body).toContain('/free-balloon-pop-phonics-game-for-kids');
    expect(body).toContain('/blog/how-kids-learn-blending');
    expect(body).toContain('/blog/how-phonics-improves-spelling');
    expect(body).toContain('/blog/how-phonics-classes-help-kids-read');
    expect(body).toContain('/blog/phonics-games-for-letter-sounds');
    expect(body).toContain('/blog/phonics-activities-for-kids-at-home');

    expect(body).not.toMatch(/4\s*[-–]\s*6 weeks/i);
    expect(body).toContain('it does not justify claiming that any particular game format guarantees reading progress.');
    expect(hasUnsupportedReadingGuarantee(body)).toBe(false);
    expect(hasUnsupportedReadingGuarantee('This game guarantees reading progress.')).toBe(true);
    expect(hasUnsupportedReadingGuarantee('The programme guarantees fluency.')).toBe(true);
    expect(hasUnsupportedReadingGuarantee('Guaranteed reading progress for every child.')).toBe(true);
    expect(body).not.toMatch(/game alone (?:will|can) teach/i);
    expect(body).not.toContain('Book Free 35-Minute Demo');
  });

  it('adds evidence, transparent product boundaries and five extractable parent FAQs', () => {
    const post = bySlug.get('online-phonics-games');
    expect(post).toBeDefined();

    const body = post?.body.map((block) => block.content).join('\n') || '';
    const evidence = getBlogEvidenceSummary(post!);

    expect(evidence.hasSourceSection).toBe(true);
    expect(evidence.externalSourceCount).toBeGreaterThanOrEqual(5);
    expect(body).toContain('not as a validated rating scale or certification system');
    expect(body).toContain('not as proof that a child can read words');
    expect(body).toContain('The game does not by itself teach the full blending sequence');
    expect(body).toContain('highly engaging phonics computer game did not show reading or spelling gains');
    expect(body).toContain('not standardized assessment tools');

    expect(post?.faq).toHaveLength(5);
    expect(post?.faq?.some((item) => /actually help children learn to read/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /best for a beginner/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /too easy or too hard/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /correct every mistake/i.test(item.question))).toBe(true);
    expect(post?.faq?.some((item) => /Balloon Pop a complete reading game/i.test(item.question))).toBe(true);
  });
});
