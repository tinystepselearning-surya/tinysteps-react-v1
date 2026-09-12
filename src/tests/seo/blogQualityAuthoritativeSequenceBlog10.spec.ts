import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
// @ts-expect-error Consolidation tooling is executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';

const root = process.cwd();
const owner = '/best-online-phonics-classes-for-kids-in-india';
const comparison = fs.readFileSync(path.join(root, 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx'), 'utf8');
function arraySource(name: string): string {
  const start = comparison.indexOf('const ' + name + ' = [');
  expect(start, name + ' must remain an explicit comparison section').toBeGreaterThanOrEqual(0);
  const end = comparison.indexOf('\n];', start);
  expect(end).toBeGreaterThan(start);
  return comparison.slice(start, end);
}

describe('authoritative Blog #10 post-Brick-4 consolidation quality lock', () => {
  it('retires the duplicate article and sends all historical aliases directly to the comparison owner', () => {
    expect(blogPosts.some((post) => post.slug === 'how-to-choose-phonics-classes')).toBe(false);
    expect(fs.existsSync(path.join(root, 'src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts'))).toBe(false);
    for (const source of ['/blog/how-to-choose-phonics-classes', '/blog/best-online-phonics-classes-for-kids', '/blog/best-phonics-classes-for-kids']) {
      expect(RETIRED_BLOG_PATH_REDIRECTS[source]).toBe(owner);
    }
    const registry = fs.readFileSync(path.join(root, 'src/lib/routeSeoRegistry.js'), 'utf8');
    expect(registry).toContain("canonicalPath: '/best-online-phonics-classes-for-kids-in-india'");
  });

  it('preserves the approved buyer framework, inspectable evidence and realistic decision FAQs on the survivor', () => {
    expect(arraySource('decisionGates').match(/title:/g)).toHaveLength(4);
    expect(arraySource('comparisonFormats').match(/format:/g)).toHaveLength(3);
    expect(arraySource('providerScorecard').match(/^\s*'/gm)).toHaveLength(12);
    expect(arraySource('demoQuestions').match(/^\s*'/gm)).toHaveLength(8);
    expect(arraySource('redFlags').match(/^\s*'/gm)).toHaveLength(7);
    expect(arraySource('pricingQuestions').match(/^\s*'/gm)).toHaveLength(6);
    for (const signal of ['1. Child fit', '2. Teaching quality', '3. Proof of transfer', '4. Practical clarity', 'fresh words', 'Blending for reading and segmenting for spelling are both taught.', 'No single provider format is automatically best for every child.', 'There is no reliable fixed timeline for every child.', 'fluency, vocabulary, or comprehension may need more attention.']) {
      expect(comparison).toContain(signal);
    }
    for (const route of ['/phonics', '/book-demo', '/curriculum?tab=phonics', '/class-samples', '/testimonials', '/phonics-fees-india']) {
      expect(comparison).toContain(route);
    }
    const faqs = arraySource('faqItems');
    expect(faqs.match(/question:/g)).toHaveLength(10);
    for (const question of ['What should parents look for', 'Are 1:1 phonics classes better than group classes?', 'How should parents compare phonics class pricing?', 'How do I know whether my child needs phonics or broader reading support?', 'How long does phonics progress take?']) {
      expect(faqs).toContain(question);
    }
    expect(comparison).not.toMatch(/read fluently in \d+ (?:days|weeks|months)/i);
    expect(comparison).not.toMatch(/guaranteed? to read/i);
    expect(comparison).not.toContain('/blog/how-to-choose-phonics-classes');
    expect(comparison).toContain('href="#provider-scorecard"');
    expect(comparison).toContain('<Section id="provider-scorecard">');
  });
});
