import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Phonics Brick 2 buyer-comparison authority guardrails', () => {
  it('keeps the dedicated best-online page canonical and distinct from the main /phonics program owner', () => {
    const registry = read('src/lib/routeSeoRegistry.js');
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(registry).toContain("'/phonics': {");
    expect(registry).toContain("canonicalPath: '/phonics'");
    expect(registry).toContain("'/best-online-phonics-classes-for-kids-in-india': {");
    expect(registry).toContain("canonicalPath: '/best-online-phonics-classes-for-kids-in-india'");

    expect(page).toContain('This page is the Tiny Steps buyer-comparison guide.');
    expect(page).toContain('main phonics programme page');
    expect(page).toContain('For the full Tiny Steps phonics method, levels, and learning pathway');
  });

  it('owns the requested high-value buyer and comparison keyword family', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
    const requiredTerms = [
      'best online phonics classes in India',
      'best phonics classes for kids',
      'best phonics classes online',
      'best phonics course in India',
      'how to choose phonics classes',
      'online phonics classes comparison',
      '1-to-1 vs group phonics classes',
      'what to look for in a phonics class',
      'which phonics program is best for my child',
    ];

    for (const term of requiredTerms) {
      expect(page, term).toContain(term);
    }
  });

  it('answers best-class intent through a four-gate parent decision framework', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(page).toContain('How should parents choose the best phonics class?');
    expect(page).toContain('1. Child fit');
    expect(page).toContain('2. Teaching quality');
    expect(page).toContain('3. Proof of transfer');
    expect(page).toContain('4. Practical clarity');
    expect(page).toContain('12 checks before choosing a phonics programme');
    expect(page).toContain('8 questions to ask during a phonics demo or assessment');
    expect(page).toContain('Comparison red flags');
  });

  it('covers format and value comparison while delegating fee ownership', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(page).toContain('1-to-1 vs group phonics classes vs app practice');
    expect(page).toContain('Live 1:1 phonics');
    expect(page).toContain('Small-group phonics');
    expect(page).toContain('App or self-practice');
    expect(page).toContain('How should price factor into a phonics-class decision?');
    expect(page).toContain('The dedicated phonics-fee page owns the full fee and package explanation.');
    expect(page).toContain('to="/phonics-fees-india"');
    expect(page).toContain('No single provider format is automatically best for every child.');
  });

  it('maps Tiny Steps claims to inspectable proof routes', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    for (const route of ['/book-demo', '/phonics', '/curriculum?tab=phonics', '/class-samples', '/testimonials', '/pricing']) {
      expect(page, route).toContain(route);
    }

    expect(page).toContain('What can parents verify before choosing Tiny Steps?');
    expect(page).toContain('Starting-point clarity');
    expect(page).toContain('Program progression');
    expect(page).toContain('Curriculum evidence');
    expect(page).toContain('Live-class evidence');
    expect(page).toContain('Parent experience');
    expect(page).toContain('Commercial clarity');
  });

  it('keeps the retired editorial comparison URL consolidated into the buyer guide', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
    const consolidationMap = read('scripts/blog-consolidation-map.mjs');
    const retiredArticlePath = path.join(repoRoot, 'src/content/blog/posts/phonics/how-to-choose-phonics-classes.ts');

    expect(page).not.toContain('/blog/how-to-choose-phonics-classes');
    expect(fs.existsSync(retiredArticlePath)).toBe(false);
    expect(consolidationMap).toContain("'/blog/how-to-choose-phonics-classes': PHONICS_COMPARISON_OWNER");
    expect(consolidationMap).toContain("const PHONICS_COMPARISON_OWNER = '/best-online-phonics-classes-for-kids-in-india'");
  });

  it('uses centralized public facts and preserves realistic-claims boundaries', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(page).toContain('PUBLIC_SITE_FACTS.audience.label');
    expect(page).toContain('PUBLIC_SITE_FACTS.liveSessions.label');
    expect(page).toContain('PER_CLASS_PRICE');
    expect(page).toContain('ONE_TO_ONE_MONTHLY_PACKAGES');
    expect(page).toContain('avoids unsupported “#1” claims');
    expect(page).toContain('A fixed “read in X weeks” promise');
    expect(page).not.toContain("Tiny Steps is India's #1");
    expect(page).not.toContain('Tiny Steps is the best phonics');
  });

  it('exposes AEO and GEO structures that match the visible comparison content', () => {
    const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');

    expect(page).toContain("'@id': `${canonicalUrl}#decision-framework`");
    expect(page).toContain("'@id': `${canonicalUrl}#provider-scorecard`");
    expect(page).toContain("'@id': `${canonicalUrl}#faq`");
    expect(page).toContain("'@id': `${canonicalUrl}#webpage`");
    expect(page).toContain('createFAQPageSchema(faqItems)');
    expect(page).toContain("name: 'Online phonics classes comparison'");
    expect(page).toContain("name: '1-to-1 vs group phonics classes'");
    expect(page).toContain("name: 'Phonics provider evaluation'");
  });
});