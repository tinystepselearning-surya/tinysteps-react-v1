import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error SEO consolidation tooling is authored as executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';

const root = process.cwd();
const canonicalSlug = 'why-child-knows-letter-sounds-but-cannot-read-words';
const canonicalPath = `/blog/${canonicalSlug}`;
const retiredPath = '/blog/child-knows-letter-sounds-but-cannot-read';
const articlePath = path.join(
  root,
  'src/content/blog/posts/parent-tips/why-child-knows-letter-sounds-but-cannot-read-words.ts',
);

function articleSource() {
  return fs.readFileSync(articlePath, 'utf8');
}

describe('SEO recovery Brick 5 parent-problem authority', () => {
  it('preserves the existing one-way historical consolidation', () => {
    expect(RETIRED_BLOG_PATH_REDIRECTS[retiredPath]).toBe(canonicalPath);
    expect(RETIRED_BLOG_PATH_REDIRECTS[canonicalPath]).toBeUndefined();

    const notFoundRoute = fs.readFileSync(
      path.join(root, 'functions/src/notFoundRoute.ts'),
      'utf8',
    );
    expect(notFoundRoute).toContain(
      `"${retiredPath}": "${canonicalPath}"`,
    );
  });

  it('keeps the exact high-intent parent problem as the page title and snippet focus', () => {
    const source = articleSource();

    expect(source).toContain("title: 'Why Does My Child Know Letter Sounds But Cannot Read Words?'");
    expect(source).toContain('Child knows letter sounds but cannot blend or read words?');
    expect(source).toContain('phonics sounds but cannot blend or read fresh words');
    expect(source).not.toContain('Blog 50');
  });

  it('protects the six-stage diagnostic sequence from sound recall through connected reading', () => {
    const source = articleSource();

    for (const signal of [
      'Sound recall → Oral blend → Printed blend → CVC decoding → Fresh-word transfer → Connected-text transfer',
      'Stage 1 — Sound recall',
      'Stage 2 — Oral blend',
      'Stage 3 — Printed blend',
      'Stage 4 — CVC decoding',
      'Stage 5 — Fresh-word transfer',
      'Stage 6 — Connected-text transfer',
    ]) {
      expect(source).toContain(signal);
    }
  });

  it('keeps adjacent intents separated and sends parents to the correct supporting authorities', () => {
    const source = articleSource();

    for (const route of [
      '/blog/child-knows-abc-but-cannot-read',
      '/blog/how-kids-learn-blending',
      '/blog/phonics-blending-activities',
      '/blog/cvc-words-explained-for-parents',
      '/blog/how-to-improve-reading-fluency-in-children',
      '/blog/why-child-reads-words-but-does-not-understand-story',
    ]) {
      expect(source).toContain(route);
    }
  });

  it('keeps the parent journey educational before the assessment handoff', () => {
    const source = articleSource();

    expect(source).toContain('A practical home routine: known sounds, CVC words, one fresh transfer');
    expect(source).toContain('When structured phonics support makes sense');
    expect(source).toContain('/phonics');
    expect(source).toContain('/book-demo');
    expect(source).toContain('free 35-minute 1:1 demo assessment');
    expect(source).toContain('One difficulty with blending is not enough to diagnose a condition.');
  });

  it('keeps query-shaped FAQ coverage without turning the page into keyword duplication', () => {
    const source = articleSource();

    for (const question of [
      'Why does my child know letter sounds but cannot read words?',
      'My child knows phonics sounds but cannot blend. What should I practise first?',
      'Why can my child say s, a and t but not read sat?',
      'How can I tell whether my child is decoding or memorising words?',
      'When should I get extra help if my child knows sounds but still cannot read?',
    ]) {
      expect(source).toContain(question);
    }
  });
});
