import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  applyBlogEditorialCleanup,
  cleanBlogBlock,
  cleanBlogText,
  cleanBlogTitle,
  getWeekSeriesLabel,
} from '../../content/blog/shared/editorialCleanup';

const EXPOSED_ACTION_ROUTE = /\b(Explore|Read|Visit|Build|Compare|Try|Play|Book|Start|See|View|Open)\s+([^.:!?]{1,120}?):\s*(\/[a-z0-9][a-z0-9\-_/?.=&%#]*)/i;

describe('blog editorial cleanup', () => {
  it('removes Week N from the primary title while preserving useful topic wording', () => {
    expect(cleanBlogTitle('Week 10: Subject-Verb Agreement Rescue Plan')).toBe('Subject-Verb Agreement Rescue Plan');
    expect(cleanBlogTitle('Week 23 — Bridge Grammar & Speaking with Story Cards')).toBe('Bridge Grammar & Speaking with Story Cards');
    expect(cleanBlogTitle('How to Improve Reading Fluency in Children')).toBe('How to Improve Reading Fluency in Children');
  });

  it('retains Week identity as secondary series metadata', () => {
    expect(getWeekSeriesLabel('week-10-grammar-subject-verb')).toBe('Week 10 Roadmap');
    expect(getWeekSeriesLabel('how-to-improve-reading-fluency-in-children')).toBe('');
  });

  it('replaces numbered and unnumbered template FAQ headings with reader-facing copy', () => {
    expect(cleanBlogBlock({ type: 'h2', content: 'FAQ section with 5 parent questions' }).content)
      .toBe('Frequently Asked Questions');
    expect(cleanBlogBlock({ type: 'h2', content: '11. FAQ section with 5 parent questions' }).content)
      .toBe('Frequently Asked Questions');
  });

  it('turns multiple exposed internal routes into readable links instead of dropping destinations', () => {
    const cleaned = cleanBlogText(
      'Explore grammar support: /grammar. Build communication confidence: /speaking. Compare learning routes: /courses. Read connected-skill guide: /blog/how-phonics-grammar-and-communication-work-together. Try home routine ideas: /blog/how-to-engage-kids-in-english-learning-at-home.',
    );

    expect(cleaned).toContain('[Explore grammar support](/grammar)');
    expect(cleaned).toContain('[Build communication confidence](/speaking)');
    expect(cleaned).toContain('[Compare learning routes](/courses)');
    expect(cleaned).toContain('[Read connected-skill guide](/blog/how-phonics-grammar-and-communication-work-together)');
    expect(cleaned).toContain('[Try home routine ideas](/blog/how-to-engage-kids-in-english-learning-at-home)');
    expect(cleaned).not.toMatch(EXPOSED_ACTION_ROUTE);
  });

  it('normalizes a bare legacy booking query into the current demo route', () => {
    expect(cleanBlogBlock({ type: 'li', content: '/?book=1' }).content)
      .toBe('[Book a free Tiny Steps assessment](/book-demo)');
  });

  it('does not mutate the source object', () => {
    const post = {
      slug: 'week-10-grammar-subject-verb',
      title: 'Week 10: Subject-Verb Agreement Rescue Plan',
      category: 'Grammar' as const,
      author: 'Priya',
      date: '2026-01-29',
      readTime: '9 min',
      excerpt: 'Example excerpt',
      body: [{ type: 'h2' as const, content: '11. FAQ section with 5 parent questions' }],
    };
    const cleaned = applyBlogEditorialCleanup(post);
    expect(cleaned.title).toBe('Subject-Verb Agreement Rescue Plan');
    expect(cleaned.seriesLabel).toBe('Week 10 Roadmap');
    expect(cleaned.body[0].content).toBe('Frequently Asked Questions');
    expect(post.title).toContain('Week 10');
  });

  it('leaves the normalized 77-article registry free of known template leakage', () => {
    expect(blogPosts.length).toBe(77);

    for (const post of blogPosts) {
      expect(post.title, `${post.slug}: Week prefix leaked into primary title`).not.toMatch(/^\s*Week\s+\d+\s*(?::|[-–—])/i);

      if (/^week-\d+/i.test(post.slug)) {
        expect(post.seriesLabel, `${post.slug}: missing secondary Week metadata`).toMatch(/^Week \d+ Roadmap$/);
      }

      for (const block of post.body) {
        expect(block.content, `${post.slug}: FAQ template heading leaked`).not.toMatch(/FAQ section with \d+ parent questions/i);
        expect(block.content, `${post.slug}: raw internal action route leaked`).not.toMatch(EXPOSED_ACTION_ROUTE);
      }
    }
  });
});
