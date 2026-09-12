import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SEO_RECOVERY_BRICK9_PRIORITY_PAGES,
  SEO_RECOVERY_BRICK9_QUALITY_STANDARD,
  SEO_RECOVERY_BRICK9_REVISION,
  SEO_RECOVERY_BRICK9_STATUS,
  getSeoRecoveryBrick9PriorityPage,
} from '../../config/seoRecoveryBrick9PageQuality';
import { blogPosts } from '../../content/blog';
import { cleanBlogText } from '../../content/blog/shared/editorialCleanup';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const priorityPaths = [
  '/phonics',
  '/best-online-phonics-classes-for-kids-in-india',
  '/phonics-fees-india',
  '/pricing',
  '/book-demo',
  '/blog/satpin-phonics-guide',
  '/blog/phonics-satpin-launch',
  '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/free-letter-tracing-game-for-kids',
  '/letter-tracing-with-sounds-game',
];

const blogQualityPaths = [
  '/blog/satpin-phonics-guide',
  '/blog/phonics-satpin-launch',
  '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
];

describe('SEO recovery Brick 9 existing-page quality', () => {
  it('locks the shared 14-point quality standard from the recovery master plan', () => {
    expect(SEO_RECOVERY_BRICK9_REVISION).toBe('2026-09-12-brick9');
    expect(SEO_RECOVERY_BRICK9_STATUS).toBe('existing-page-quality-locked');
    expect(SEO_RECOVERY_BRICK9_QUALITY_STANDARD).toEqual([
      'searchIntent',
      'title',
      'meta',
      'h1',
      'introduction',
      'h2Coverage',
      'examples',
      'expertise',
      'faqs',
      'internalLinks',
      'cta',
      'schema',
      'duplication',
      'freshness',
    ]);
  });

  it('keeps one quality contract for each priority recovery page', () => {
    const paths = SEO_RECOVERY_BRICK9_PRIORITY_PAGES.map((page) => page.path);
    expect(paths).toHaveLength(priorityPaths.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect([...paths].sort()).toEqual([...priorityPaths].sort());

    for (const page of SEO_RECOVERY_BRICK9_PRIORITY_PAGES) {
      expect(page.userJob.trim().length).toBeGreaterThan(20);
      expect(['protect', 'targeted-upgrade']).toContain(page.decision);
      expect(fs.existsSync(path.join(root, page.sourcePath)), `${page.path}: source file missing`).toBe(true);
      expect(getSeoRecoveryBrick9PriorityPage(page.path)?.path).toBe(page.path);
    }
  });

  it('protects the established commercial owners instead of rewriting them for Brick 9', () => {
    for (const pagePath of [
      '/phonics',
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/pricing',
      '/book-demo',
    ]) {
      expect(getSeoRecoveryBrick9PriorityPage(pagePath)?.decision).toBe('protect');
    }
  });

  it('preserves core programme, comparison, fee and assessment quality signals', () => {
    const phonics = read('src/pages/phonics.tsx');
    const comparison = read('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx');
    const fees = read('src/pages/public/PhonicsFeesIndiaPage.tsx');
    const pricing = read('src/pages/PricingPage.tsx');
    const assessment = read('src/pages/public/BookDemoPage.tsx');

    for (const signal of [
      'Online Phonics Classes for Kids',
      'createFAQPageSchema',
      'createCourseSchema',
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/book-demo',
    ]) {
      expect(phonics).toContain(signal);
    }

    for (const signal of [
      'Best Online Phonics Classes for Kids in India',
      'providerScorecard',
      'demoQuestions',
      'redFlags',
      'createFAQPageSchema',
      '/phonics-fees-india',
      '/book-demo',
    ]) {
      expect(comparison).toContain(signal);
    }

    for (const signal of [
      'Phonics Class Fees in India',
      'Compare 1:1 and group phonics fees separately',
      'dateModified: research.reviewedAt',
      'createFAQPageSchema',
      '/book-demo',
    ]) {
      expect(fees).toContain(signal);
    }

    expect(pricing).toContain('createFAQPageSchema');
    expect(pricing).toContain('/phonics-fees-india');
    expect(pricing).toContain('/book-demo');

    for (const signal of [
      'FREE_DEMO_DURATION_MINUTES',
      'assessmentSteps',
      'assessmentOutcomes',
      'assessmentFaqItems',
      'createFAQPageSchema',
      'PublicAssessmentForm',
    ]) {
      expect(assessment).toContain(signal);
    }
  });

  it('keeps the three priority blog authorities answer-first, current and differentiated', () => {
    for (const pagePath of blogQualityPaths) {
      const slug = pagePath.replace('/blog/', '');
      const post = blogPosts.find((candidate) => candidate.slug === slug);
      expect(post, `${pagePath}: normalized blog post missing`).toBeDefined();
      expect(post?.title.trim().length, `${pagePath}: title missing`).toBeGreaterThan(20);
      expect(post?.metaDescription?.trim().length ?? 0, `${pagePath}: meta description missing`).toBeGreaterThan(80);
      expect(post?.excerpt.trim().length ?? 0, `${pagePath}: excerpt missing`).toBeGreaterThan(80);
      expect(post?.modifiedDate, `${pagePath}: freshness date missing`).toMatch(/^2026-/);
      expect(post?.body[0]?.type, `${pagePath}: first block should be answer-first H2`).toBe('h2');
      expect(post?.body[0]?.content, `${pagePath}: quick answer heading missing`).toMatch(/^Quick answer:/i);
    }

    const satpin = blogPosts.find((post) => post.slug === 'satpin-phonics-guide');
    const satpinBody = satpin?.body.map((block) => block.content).join('\n') ?? '';
    expect(satpinBody).toContain('/blog/phonics-satpin-launch');
    expect(satpinBody).toContain('/phonics');
    expect(satpinBody).not.toContain('/blog/week-1-phonics-satpin-launch');

    const diagnostic = blogPosts.find((post) => post.slug === 'why-child-knows-letter-sounds-but-cannot-read-words');
    const diagnosticBody = diagnostic?.body.map((block) => block.content).join('\n') ?? '';
    expect(diagnosticBody).toContain('Sound recall → Oral blend → Printed blend → CVC decoding → Fresh-word transfer → Connected-text transfer');
    expect(diagnosticBody).toContain('/phonics');
    expect(diagnosticBody).toContain('/book-demo');
  });

  it('keeps tracing pages useful without presenting tracing as proof of reading', () => {
    const tracing = read('src/pages/public/FreeLetterTracingGamePage.tsx');
    const tracingWithSounds = read('src/pages/public/LetterTracingWithSoundsGamePage.tsx');

    expect(tracing).toContain('Free ABC Tracing Game for Kids');
    expect(tracing).toContain('children still need letter sounds, blending, and phonics practice for reading');
    expect(tracing).toContain('createFAQPageSchema');
    expect(tracing).toContain('WebApplication');

    expect(tracingWithSounds).toContain('Letter Tracing With Sounds Game');
    expect(tracingWithSounds).toContain('it is not the same as decoding');
    expect(tracingWithSounds).toContain('/blog/satpin-phonics-guide');
    expect(tracingWithSounds).toContain('/phonics');
    expect(tracingWithSounds).toContain('letter formation practice');
    expect(tracingWithSounds).not.toContain('letter formation owner');
  });

  it('keeps reader-facing blog copy free of editorial numbering and SEO ownership jargon', () => {
    expect(cleanBlogText('Blog 56 is the parent-support guide.')).toBe('This guide is the parent-support guide.');
    expect(cleanBlogText('This guide owns the **parent grammar-assessment** intent.'))
      .toBe('This guide focuses on **parent grammar-assessment**.');
    expect(cleanBlogText('This article is the **SATPIN explanation and progression owner**: sounds and order.'))
      .toBe('This guide focuses on **SATPIN explanation and progression**: sounds and order.');
    expect(cleanBlogText('[SATPIN home plan](/blog/week-1-phonics-satpin-launch)'))
      .toBe('[SATPIN home plan](/blog/phonics-satpin-launch)');
  });
});
