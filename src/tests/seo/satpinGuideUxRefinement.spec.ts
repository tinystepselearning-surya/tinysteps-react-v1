import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getBlogEvidenceSummary } from '../../content/blog/shared/editorialTrust';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('SATPIN authority-page UX refinement', () => {
  const post = blogPosts.find((entry) => entry.slug === 'satpin-phonics-guide');

  it('keeps the existing canonical SATPIN authority content and query coverage intact', () => {
    expect(post).toBeTruthy();
    expect(post?.title).toBe('SATPIN Phonics Guide: Sounds, Order, Words & Blending');
    expect(post?.modifiedDate).toBe('2026-09-26');
    expect(post?.faq).toHaveLength(11);

    const body = post?.body.map((block) => block.content).join('\n') || '';
    for (const phrase of [
      'SATPIN sounds: the six starter correspondences in one view',
      'SATPIN order: why you may see SATPIN, SATIPN or a slightly different sequence',
      'Is SATPIN a phonics method?',
      'SATPIN words: what can children read with the first set?',
      'Do children need to master all six SATPIN sounds before blending?',
      'A parent-friendly SATPIN start sequence',
      'What should SATPIN progress look like?',
      'Five common SATPIN difficulties and what to practise next',
      'What comes after SATPIN?',
      'Evidence and references',
    ]) {
      expect(body).toContain(phrase);
    }

    for (const route of [
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/blog/how-kids-learn-blending',
      '/blog/phonics-blending-activities',
      '/blog/cvc-words-explained-for-parents',
      '/blog/phonics-rules-for-beginners',
      '/phonics',
      '/book-demo',
    ]) {
      expect(body).toContain(route);
    }

    expect(getBlogEvidenceSummary(post!).externalSourceCount).toBe(6);
  });

  it('uses a SATPIN-specific presentation layer without creating another SATPIN URL', () => {
    const page = read('src/pages/BlogPostPage.tsx');
    const experience = read('src/components/blog/SatpinGuideExperience.tsx');

    expect(page).toContain("const isSatpinGuide = slug === 'satpin-phonics-guide'");
    expect(page).toContain('<SatpinGuideExperience');
    expect(page).toContain('<SatpinGuideSidebar tocItems={tocItems} />');
    expect(page).toContain("lazy(() => import('../components/blog/SatpinGuideExperience'))");
    expect(page).toContain('<Suspense');
    expect(page).toContain("lg:grid-cols-[240px_minmax(0,1fr)]");
    expect(page).toContain("lg:order-1 lg:block lg:sticky lg:top-24");
    expect(page).toContain('Not sure what your child should learn next?');
    expect(page).toContain('compact={isSatpinGuide}');
    expect(experience).toContain("const SATPIN_SLUG = 'satpin-phonics-guide'");
    expect(experience).not.toContain('/blog/satpin-phonics-guide-v2');
    expect(experience).not.toContain('/satpin-guide-new');
  });

  it('implements chronological, progressive-disclosure and interaction patterns with crawlable source text', () => {
    const experience = read('src/components/blog/SatpinGuideExperience.tsx');

    for (const signal of [
      'SATPIN in 60 seconds',
      'Try the blend',
      'Blending readiness',
      'The chronological pathway',
      'Progress checkpoint',
      'If your child is stuck',
      'The next stage',
      'Evidence behind this guide',
    ]) {
      expect(experience).toContain(signal);
    }

    expect(experience).toContain('<details');
    expect(experience).toContain('data-satpin-section');
    expect(experience).toContain("'SatpinSectionViewed'");
    expect(experience).toContain("'SatpinJumpNavClicked'");
    expect(experience).toContain("'SatpinDiagnosticOpened'");
    expect(experience).toContain("'SatpinAssessmentClicked'");
    expect(experience).toContain("'SatpinPhonicsClassesClicked'");
    expect(experience).toContain('renderRichText');
    expect(experience).toContain("type RichTone = 'light' | 'dark'");
    expect(experience).toContain('Learn a small sound set');
    expect(experience).toContain('Full guidance');
    expect(experience).toContain('ts-answer-title ts-blog-hero-title');
    expect(experience).toContain('ts-answer-summary ts-blog-quick-answer');
    expect(experience).toContain("raw.startsWith('**')");
  });

  it('keeps the evidence URLs in source data while rendering readable source links', () => {
    const body = post?.body.map((block) => block.content).join('\n') || '';
    const experience = read('src/components/blog/SatpinGuideExperience.tsx');

    for (const domain of [
      'gov.uk',
      'educationendowmentfoundation.org.uk',
      'ies.ed.gov',
      'ufli.education.ufl.edu',
    ]) {
      expect(body).toContain(domain);
    }

    expect(experience).toContain('Read source');
    expect(experience).toContain('target="_blank"');
    expect(experience).toContain('rel="noopener noreferrer"');
  });

  it('keeps the shared article hero compact mode opt-in so other blog pages retain their existing layout', () => {
    const hero = read('src/components/blog/ResearchArticleHero.tsx');
    const sidebar = read('src/components/blog/SatpinGuideSidebar.tsx');
    expect(hero).toContain('compact?: boolean');
    expect(hero).toContain('compact = false');
    expect(hero).toContain("compact ? 'pb-10 pt-20 sm:pb-12 sm:pt-24'");
    expect(hero).toContain("compact ? 'grid gap-7'");
    expect(sidebar).toContain('Guide index');
    expect(sidebar).toContain('aria-current');
    expect(sidebar).toContain("['SATPIN sounds:', 'Sounds']");
  });
});
