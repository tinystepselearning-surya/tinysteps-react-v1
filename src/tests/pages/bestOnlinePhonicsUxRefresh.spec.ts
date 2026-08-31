import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Best online phonics buyer guide UX refresh', () => {
  const page = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
  const clusterNav = read('src/components/programs/ClusterSeoNav.tsx');
  const premiumTheme = read('src/components/programs/phonicsBuyerPremium.css');

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
    expect(page).toContain('scroll-mt-[176px]');
    expect(page).toContain('to="/book-demo"');
    expect(page).toContain('to="/phonics"');
  });

  it('uses progressive disclosure for FAQ answers while preserving the FAQ source data and schema', () => {
    expect(page).toContain('<details');
    expect(page).toContain('<summary');
    expect(page).not.toContain('open={index === 0}');
    expect(page).toContain('createFAQPageSchema(faqItems)');
    expect(page).toContain("'@id': `${canonicalUrl}#faq`");
    expect(page).toContain('Frequently asked questions');
  });

  it('uses a restrained premium color system and interactive tile treatment', () => {
    expect(page).toContain('const premiumTones = [');
    expect(page).toContain('from-orange-400 to-amber-400');
    expect(page).toContain('from-sky-400 to-cyan-400');
    expect(page).toContain('from-violet-400 to-fuchsia-400');
    expect(page).toContain('from-emerald-400 to-teal-400');
    expect(page).toContain('hover:-translate-y-1');
    expect(page).toContain('group-hover:scale-125');
    expect(page).toContain('focus-within:-translate-y-1');
  });

  it('finishes the page with a sunrise-orange premium discovery treatment', () => {
    expect(clusterNav).toContain("const BUYER_GUIDE_PATH = '/best-online-phonics-classes-for-kids-in-india'");
    expect(clusterNav).toContain('bg-[linear-gradient(135deg,#FFF8F1_0%,#FFFFFF_46%,#FFF4E8_100%)]');
    expect(clusterNav).toContain('bg-[linear-gradient(135deg,#FF8800_0%,#FF6A00_100%)]');
    expect(clusterNav).toContain('bg-[linear-gradient(90deg,#FFB347_0%,#FF8800_45%,#FF6A00_100%)]');
    expect(premiumTheme).toContain('#ff6a00');
    expect(premiumTheme).toContain('#ff9a3d');
    expect(premiumTheme).toContain('#fffaf6');
  });

  it('retires the guide navigation for the final decision area and delays back-to-top', () => {
    expect(clusterNav).toContain('finalDecisionSection.getBoundingClientRect().top <= 176');
    expect(clusterNav).toContain("pageNavWrapper.style.transform = finalDecisionHasReachedGuide ? 'translateY(-110%)' : 'translateY(0)'");
    expect(clusterNav).toContain('window.scrollY >= 1100');
    expect(clusterNav).toContain("includes('back to top')");
  });

  it('keeps motion restrained and offers reduced-motion-safe transitions', () => {
    expect(page).toContain('motion-safe:transition-all');
    expect(clusterNav).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    expect(page).not.toContain('animate-bounce');
    expect(page).not.toContain('animate-pulse');
    expect(page).not.toContain('parallax');
  });
});
