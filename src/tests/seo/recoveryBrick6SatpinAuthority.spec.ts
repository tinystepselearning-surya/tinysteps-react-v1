import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGACY_WEEK_BLOG_RENAMES } from '../../lib/blogWeekRenames.js';
import { PHONICS_AUTHORITY_SLUGS } from '../../lib/phonicsAuthorityRoutes.js';

const root = process.cwd();
const guidePath = path.join(
  root,
  'src/content/blog/posts/phonics/satpin-phonics-guide.ts',
);
const routinePath = path.join(
  root,
  'src/content/blog/posts/phonics/week-1-phonics-satpin-launch.ts',
);

function read(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('SEO recovery Brick 6 SATPIN authority', () => {
  it('keeps the SATPIN guide as the master meaning/order/words/blending authority', () => {
    const source = read(guidePath);

    expect(source).toContain(
      "title: 'SATPIN Phonics: Sounds, Order, Words & Blending Guide'",
    );
    expect(source).toContain('SATPIN phonics explained: sounds, order, words, blending');

    for (const heading of [
      'SATPIN order: why you may see SATPIN, SATIPN or a slightly different sequence',
      'SATPIN words: what can children read with the first set?',
      'SATPIN sentences and early reading: when to move beyond single words',
      'What comes after SATPIN?',
    ]) {
      expect(source).toContain(heading);
    }
  });

  it('keeps the main guide educational, evidence-bounded and free of internal editorial numbering', () => {
    const source = read(guidePath);

    expect(source).toContain('SATPIN is a practical **launch set**, not a finish line');
    expect(source).toContain('does **not** establish SATPIN as the single mandatory first set');
    expect(source).toContain('This article provides educational guidance, not diagnosis.');
    expect(source).not.toMatch(/Blog #\d+/);
  });

  it('keeps the home-plan article distinct as implementation support rather than a second master guide', () => {
    const guide = read(guidePath);
    const routine = read(routinePath);

    expect(routine).toContain(
      "title: 'SATPIN at Home: A Parent Launch Plan for Early Blending and Reading'",
    );
    expect(routine).toContain('A practical SATPIN home plan for parents');
    expect(routine).toContain('practical home-routine companion');
    expect(routine).toContain('Use seven flexible practice sessions — not a seven-day deadline');
    expect(routine).toContain('A simple 10-minute SATPIN routine');
    expect(routine).toContain('/blog/satpin-phonics-guide');

    expect(guide).not.toContain('Use seven flexible practice sessions — not a seven-day deadline');
    expect(guide).not.toContain('A simple 10-minute SATPIN routine');
  });

  it('preserves the public support-page identity and both SATPIN authority URLs', () => {
    expect(LEGACY_WEEK_BLOG_RENAMES['week-1-phonics-satpin-launch']?.slug).toBe(
      'phonics-satpin-launch',
    );
    expect(PHONICS_AUTHORITY_SLUGS).toContain('satpin-phonics-guide');
    expect(PHONICS_AUTHORITY_SLUGS).toContain('phonics-satpin-launch');
  });

  it('connects SATPIN authority to diagnosis and the commercial phonics pathway without hard selling', () => {
    const source = read(guidePath);

    for (const route of [
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/blog/how-kids-learn-blending',
      '/blog/phonics-blending-activities',
      '/blog/cvc-words-explained-for-parents',
      '/blog/phonics-rules-for-beginners',
      '/phonics',
      '/book-demo',
    ]) {
      expect(source).toContain(route);
    }

    expect(source).toContain('book a free 35-minute 1:1 demo assessment');
  });

  it('keeps query-shaped FAQ coverage for order, words, blending, reading and next steps', () => {
    const source = read(guidePath);

    for (const question of [
      'What is SATPIN phonics?',
      'What is the correct SATPIN order?',
      'What words can children make with SATPIN?',
      'Should a child know all six SATPIN sounds before blending?',
      'How do SATPIN words become early reading?',
      'What comes after SATPIN?',
      'What if my child knows SATPIN sounds but cannot blend words?',
    ]) {
      expect(source).toContain(question);
    }
  });
});
