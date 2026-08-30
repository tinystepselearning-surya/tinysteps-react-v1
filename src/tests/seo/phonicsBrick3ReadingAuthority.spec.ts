import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const readingPagePath = 'src/pages/public/ReadingClassesForKidsPage.tsx';

describe('Phonics Brick 3 reading classes authority guardrails', () => {
  it('keeps /reading-classes-for-kids as the broad reading-support owner', () => {
    const page = read(readingPagePath);
    const routes = read('src/app/routes.tsx');

    expect(page).toContain("const canonicalPath = '/reading-classes-for-kids'");
    expect(page).toContain('This is the broad reading owner page.');
    expect(routes).toContain("const ReadingClassesForKidsPage = lazy(() => import('../pages/public/ReadingClassesForKidsPage'))");
    expect(routes).toContain("path: 'reading-classes-for-kids'");
  });

  it('covers the requested high-value reading keyword family', () => {
    const page = read(readingPagePath);
    const requiredTerms = [
      'online reading classes for kids',
      'reading classes for kids',
      'best reading classes for kids',
      'best online reading classes for kids',
      'online reading improvement classes',
      'reading classes for struggling readers',
      'child struggling to read',
      'reading fluency classes',
      'reading comprehension classes',
      'reading tutor online',
      'reading support for kids',
      'help child read fluently',
      '1-to-1 reading classes online',
      'online reading classes in India',
    ];

    for (const term of requiredTerms) {
      expect(page.toLowerCase()).toContain(term.toLowerCase());
    }
  });

  it('separates broad reading support from phonics, fluency, and diagnostic intent', () => {
    const page = read(readingPagePath);

    expect(page).toContain("route: '/phonics'");
    expect(page).toContain("route: '/reading-fluency-program'");
    expect(page).toContain("route: '/child-not-reading-properly'");
    expect(page).toContain("route: '/slow-reader-child-help'");
    expect(page).toContain('Knows letters or sounds but cannot read words');
    expect(page).toContain('Reads accurately but very slowly');
    expect(page).toContain('Reads the words but cannot explain the story');
  });

  it('uses a defensible best-reading-class framework instead of an unsupported ranking claim', () => {
    const page = read(readingPagePath);

    expect(page).toContain('What should parents look for in the best online reading classes?');
    expect(page).toContain('Assessment-first placement');
    expect(page).toContain('Right-level reading material');
    expect(page).toContain('Explicit teaching, not only practice');
    expect(page).toContain('Live correction and retry');
    expect(page).toContain('A clear reading progression');
    expect(page).toContain('Fresh evidence of progress');
    expect(page).toContain('Realistic expectations');
    expect(page).toContain('Parent-visible next steps');
    expect(page).toContain('does not claim to be an objectively ranked “#1” reading provider');
    expect(page).not.toContain("Tiny Steps is India's #1 reading");
    expect(page).not.toContain('Tiny Steps is the best reading class');
  });

  it('builds an answer-engine layer for struggling-reader, tutor, fluency, and comprehension questions', () => {
    const page = read(readingPagePath);

    expect(page).toContain('What do online reading classes for kids usually work on?');
    expect(page).toContain('Are online reading classes effective for struggling readers?');
    expect(page).toContain('What is the difference between phonics classes and reading classes?');
    expect(page).toContain('What is the difference between reading fluency and reading comprehension?');
    expect(page).toContain('Is a 1-to-1 online reading tutor better than a group class?');
    expect(page).toContain('Can reading classes help my child read more fluently?');
  });

  it('keeps visible evidence routes and relevant editorial reading guides connected', () => {
    const page = read(readingPagePath);

    for (const href of [
      '/phonics',
      '/reading-fluency-program',
      '/curriculum',
      '/class-samples',
      '/testimonials',
      '/pricing',
      '/book-demo',
      '/blog/how-to-improve-reading-fluency-in-children',
      '/blog/week-6-phonics-comprehension',
    ]) {
      expect(page).toContain(`'${href}'`);
    }
  });

  it('uses centralized public facts for age, session duration, demo duration, and price', () => {
    const page = read(readingPagePath);

    expect(page).toContain('PUBLIC_AGE_RANGE_LABEL');
    expect(page).toContain('PUBLIC_SESSION_DURATION_LABEL');
    expect(page).toContain('PUBLIC_SITE_FACTS.standardOffer.demoDurationMinutes');
    expect(page).toContain('PUBLIC_SITE_FACTS.standardOffer.oneToOnePerClassInr');
    expect(page).toContain('formatPublicInr');
  });

  it('adds aligned AEO/GEO structured data for the broad reading journey', () => {
    const page = read(readingPagePath);

    expect(page).toContain("'@id': `${canonicalUrl}#reading-pathway`");
    expect(page).toContain("'@id': `${canonicalUrl}#reading-class-quality-criteria`");
    expect(page).toContain("'@id': `${canonicalUrl}#webpage`");
    expect(page).toContain("'@id': `${canonicalUrl}#faq`");
    expect(page).toContain('createWebPageSchema');
    expect(page).toContain('createFAQPageSchema');
    expect(page).toContain("name: 'Reading support for struggling readers'");
    expect(page).toContain("name: 'Reading fluency'");
    expect(page).toContain("name: 'Reading comprehension'");
  });

  it('strengthens the search snippet around live 1:1 reading support without stuffing best claims', () => {
    const page = read(readingPagePath);

    expect(page).toContain("const seoTitle = 'Online Reading Classes for Kids in India | Tiny Steps'");
    expect(page).toContain('Live 1:1 online reading classes for kids in India.');
    expect(page).toContain('assessment-first placement for struggling readers');
    expect(page).toContain('keywords: READING_SEO_KEYWORDS');
  });
});
