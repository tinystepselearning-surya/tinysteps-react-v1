import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Best online phonics buyer guide UX refresh', () => {
  const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

  it('keeps the buyer journey in decision-first scroll order', () => {
    const orderedSections = [
      '<Section id="comparison-framework" tint="warm">',
      '<Section id="programme-fit">',
      '<Section id="format-comparison" tint="blue">',
      '<Section id="provider-scorecard">',
      '<Section id="tiny-steps-evidence" tint="lavender">',
      '<div id="parent-reviews"',
      '<Section id="pricing" tint="warm">',
      '<Section id="faq" tint="lavender">',
      'Ready to compare Tiny Steps against your child’s actual needs?',
      '<ClusterSeoNav cluster="phonics" />',
    ];

    let previousIndex = -1;
    for (const marker of orderedSections) {
      const currentIndex = page.indexOf(marker);
      expect(currentIndex, marker).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }
  });

  it('adds compact in-page navigation without replacing conversion destinations', () => {
    expect(page).toContain('aria-label="On this page"');
    expect(page).toContain('IntersectionObserver');
    expect(page).toContain("{ id: 'comparison-framework', label: 'Choose' }");
    expect(page).toContain("{ id: 'programme-fit', label: 'Child fit' }");
    expect(page).toContain("{ id: 'tiny-steps-evidence', label: 'Tiny Steps' }");
    expect(page).toContain("{ id: 'pricing', label: 'Cost' }");
    expect(page).toContain("{ id: 'faq', label: 'FAQs' }");
    expect(page).toContain('to="/book-demo"');
    expect(page).toContain('to="/phonics"');
  });

  it('uses progressive disclosure for FAQ answers while preserving the FAQ source data and schema', () => {
    expect(page).toContain('<details');
    expect(page).toContain('<summary');
    expect(page).toContain('createFAQPageSchema(faqItems)');
    expect(page).toContain("'@id': `${canonicalUrl}#faq`");
    expect(page).toContain('Frequently asked questions');
  });

  it('keeps motion restrained and offers reduced-motion-safe transitions', () => {
    expect(page).toContain('motion-safe:transition-all');
    expect(page).not.toContain('animate-bounce');
    expect(page).not.toContain('animate-pulse');
    expect(page).not.toContain('parallax');
  });
});
