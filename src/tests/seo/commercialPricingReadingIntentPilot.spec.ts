import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const pricing = read('src/pages/PricingPage.tsx');
const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');
const routeSeo = read('src/lib/routeSeoRegistry.js');

describe('Commercial Pricing and Reading parent-intent pilot', () => {
  it('asks the parent about connected reading rather than implying decoding belongs to Reading', () => {
    expect(pricing).toContain("label: 'Reading',");
    expect(pricing).toContain("href: '/reading-classes-for-kids',");
    expect(pricing).toContain(
      "parentQuestion: 'Does my child read words accurately but still struggle with fluency, phrasing, or understanding a passage?',",
    );
    expect(pricing).not.toContain('Does my child need decoding, fluency or comprehension support?');
  });

  it('keeps the canonical Pricing route, approved fees and assessment entry unchanged', () => {
    expect(pricing).toContain("getRouteConfig('/pricing')");
    expect(pricing).toContain('canonical={pricingCanonicalUrl}');
    expect(routeSeo).toContain("title: 'Online English Classes for Kids Fees & Pricing | Tiny Steps'");
    expect(routeSeo).toContain("canonicalPath: '/pricing'");
    expect(pricing).toContain('ONE_TO_ONE_MONTHLY_PACKAGES');
    expect(pricing).toContain('NEW_GROUP_CLASS_PLAN');
    expect(pricing).toContain('PER_CLASS_PRICE');
    expect(pricing).toContain('to="/book-demo"');
  });

  it('preserves Reading and Phonics ownership and the existing reading-assessment CTA', () => {
    expect(reading).toContain("const canonicalPath = '/reading-classes-for-kids'");
    expect(reading).toContain('Phonics owns sound–spelling knowledge, blending, and decoding unfamiliar words.');
    expect(reading).toContain('Tiny Steps Reading Classes start from connected reading needs');
    expect(reading).toContain('to="/phonics"');
    expect(reading).toContain('to="/book-demo"');
    expect(reading).toContain('<ProgrammeFaqAccordion items={faqItems} accent="sky" />');
  });
});
