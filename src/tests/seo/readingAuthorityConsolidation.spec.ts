import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Reading authority consolidation', () => {
  const courses = read('src/pages/CoursesPage.tsx');
  const registry = read('src/lib/routeSeoRegistry.js');
  const reading = read('src/pages/public/ReadingClassesForKidsPage.tsx');
  const fluency = read('src/pages/public/ReadingFluencyProgramPage.tsx');
  const parents = read('src/pages/parents/ParentsHubPage.tsx');
  const comprehension = read('src/content/blog/posts/parent-tips/why-child-reads-words-but-does-not-understand-story.ts');
  const llms = read('public/llms.txt');
  const sitemap = read('public/sitemap-static.xml');
  const commercialOwners = read('src/lib/commercialC3OwnerPageAudit.ts');

  it('keeps Phonics, Grammar, and Public Speaking as the core course families', () => {
    const title = 'English Courses for Kids: Phonics, Grammar and Public Speaking | Tiny Steps Learning';

    expect(courses).toContain(title);
    expect(registry).toContain(`title: '${title}'`);
    expect(courses).toContain('Core programmes: Phonics, Grammar, and Public Speaking');
    expect(courses).toContain('PUBLIC_FACTS.corePrograms[0]');
    expect(courses).not.toContain("const CORE_PROGRAMS_TEXT = 'Phonics, Reading, Grammar, and Public Speaking';");
  });

  it('keeps Reading visible but subordinate inside the Phonics-to-reading journey', () => {
    const phonicsSection = courses.indexOf('id="phonics-program-section"');
    const readingSupport = courses.indexOf('id="reading-support-pathway"');
    const grammarSection = courses.indexOf('id="grammar-program-section"');

    expect(phonicsSection).toBeGreaterThan(-1);
    expect(readingSupport).toBeGreaterThan(phonicsSection);
    expect(readingSupport).toBeLessThan(grammarSection);
    expect(courses).not.toContain('id="reading-program-section"');
    expect(courses).toContain('Reading is not a separate core course family at Tiny Steps.');
    expect(courses).toContain('It is a holistic extension of the Phonics-to-reading journey');
  });

  it('keeps a separate public Reading route for parent-intent discovery', () => {
    expect(courses).toContain("href: '/reading-classes-for-kids'");
    expect(courses).toContain("href: '/reading-fluency-program'");
    expect(reading).toContain("const canonicalPath = '/reading-classes-for-kids'");
    expect(fluency).toContain("const canonicalPath = '/reading-fluency-program'");
  });

  it('preserves the Reading versus Phonics placement boundary', () => {
    expect(courses).toContain('If decoding is unstable, Phonics remains the starting point.');
    expect(reading).toContain('This Reading pathway begins after the phonics decision.');
    expect(fluency).toContain('If decoding is still unstable:');
    expect(fluency).toContain('to="/phonics"');
  });

  it('keeps supporting authority pages routed to the parent-facing Reading owner', () => {
    expect(parents).toContain("to: '/reading-classes-for-kids'");
    expect(comprehension).toContain('[reading classes for kids](/reading-classes-for-kids)');
    expect(fluency).toContain('to="/reading-classes-for-kids"');
  });

  it('preserves established Reading discovery and machine-readable navigation signals', () => {
    expect(courses).toContain("title: 'Reading'");
    expect(courses).toContain("ctaLabel: 'Explore Reading Support'");
    expect(courses).toContain("href: '/reading-classes-for-kids'");
    expect(courses).toContain("name: 'Tiny Steps core learning paths'");
    expect(courses).toContain("name: 'Reading Classes'");
  });

  it('keeps Reading SEO, AEO, and GEO discovery owners intact', () => {
    expect(reading).toContain("const canonicalPath = '/reading-classes-for-kids'");
    expect(llms).toContain('[Reading Classes for Kids](https://tinystepslearning.com/reading-classes-for-kids)');
    expect(llms).toContain('Commercial searches for Grammar classes, Reading classes or Public Speaking classes belong to');
    expect(sitemap).toContain('<loc>https://tinystepslearning.com/reading-classes-for-kids</loc>');
    expect(commercialOwners).toContain("clusterId:'reading-provider'");
    expect(commercialOwners).toContain("ownerPath:'/reading-classes-for-kids'");
    expect(commercialOwners).toContain("protectedSignals:['generic reading owner','phonics boundary','specialist fluency handoff','writing handoff']");
  });
});
