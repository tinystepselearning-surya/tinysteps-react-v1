// CI sync trigger for PR validation
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Grammar primary commercial ownership', () => {
  const ownership = read('src/lib/commercialC2KeywordOwnership.ts');
  const internalLinks = read('src/lib/seo/internalLinkMap.ts');
  const popularPrograms = read('src/components/Home/PopularPrograms.tsx');
  const chooser = read('src/pages/parents/choosing-course.tsx');
  const courseRegistry = read('src/lib/publicCoursePages.js');
  const courseDetail = read('src/pages/CourseDetailPage.tsx');
  const subjectLandings = read('src/content/publicSubjectLandings.ts');
  const subjectLandingPage = read('src/components/public/SubjectLandingPage.tsx');
  const routeSeo = read('src/lib/routeSeoRegistry.js');
  const grammarPage = read('src/pages/grammar.tsx');

  it('keeps /grammar as the broad commercial owner', () => {
    expect(ownership).toContain("id: 'grammar-provider'");
    expect(ownership).toContain("canonicalOwnerPath: '/grammar'");
    expect(ownership).toContain("primaryQuery: 'online grammar classes for kids'");
    expect(ownership).toContain("forbiddenPrimaryClaimants: ['/courses/grammar','/courses/grammar-mastery','/english-grammar-writing-classes','/resources/grammar']");
    expect(grammarPage).toContain("const canonicalPath = '/grammar'");
    expect(grammarPage).toContain("robots: 'index,follow'");
    expect(grammarPage).toContain("const seoTitle = 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps'");
  });

  it('routes generic Grammar discovery to /grammar while preserving level-specific course links', () => {
    expect(internalLinks).toContain("id: 'grammar-page'");
    expect(internalLinks).toContain("href: '/grammar'");
    expect(internalLinks).toContain("'online grammar classes for kids'");
    expect(internalLinks).toContain("'grammar classes for kids'");

    expect(popularPrograms).toMatch(/title: 'Grammar Pro Lab'[\s\S]*?href: '\/grammar'/);
    expect(chooser).toMatch(/title: 'Start with grammar'[\s\S]*?destination: '\/grammar'/);

    expect(internalLinks).toMatch(/id: 'course-basic-grammar'[\s\S]*?href: '\/courses\/grammar'[\s\S]*?'Beginner Grammar course'/);
    expect(internalLinks).toMatch(/id: 'course-advanced-grammar'[\s\S]*?href: '\/courses\/grammar-mastery'[\s\S]*?'Advanced Grammar course'/);
    expect(chooser).toMatch(/title: 'Beginner Grammar'[\s\S]*?path: '\/courses\/grammar'/);
  });

  it('keeps Grammar course pages self-canonical but level-specific and subordinate to the programme owner', () => {
    expect(courseRegistry).toContain("routePath: '/courses/grammar'");
    expect(courseRegistry).toContain("h1: 'Beginner Grammar Foundations: Sentence Building & Punctuation'");
    expect(courseRegistry).toContain("title: 'Beginner Grammar Foundations for Kids | Tiny Steps'");
    expect(courseRegistry).toContain("Foundation-level Grammar course inside the Tiny Steps Grammar programme");

    expect(courseRegistry).toContain("routePath: '/courses/grammar-mastery'");
    expect(courseRegistry).toContain("h1: 'Advanced Grammar Mastery Classes for Kids'");
    expect(courseRegistry).toContain("Advanced-level Grammar course inside the Tiny Steps Grammar programme");
    expect(courseRegistry.match(/label: 'Grammar programme overview', to: '\/grammar'/g)?.length).toBe(2);

    expect(routeSeo).toContain("canonicalPath: coursePage.routePath");
    expect(routeSeo).toContain("robots: 'index,follow'");
    expect(courseDetail).toContain("robots={isCanonicalSlug ? 'index,follow' : 'noindex,follow'}");
    expect(courseDetail).toContain('This is a level-specific course inside the');
    expect(courseDetail).toContain('to="/grammar"');
  });

  it('demotes the combined Grammar/Writing URL to chooser intent instead of broad Grammar-class intent', () => {
    expect(subjectLandings).toContain("route: '/english-grammar-writing-classes'");
    expect(subjectLandings).toContain("seoTitle: 'Grammar Level Guide for Kids: Beginner vs Advanced | Tiny Steps'");
    expect(subjectLandings).toContain("heroTitle: 'Grammar Levels Guide: Beginner, Advanced, or Writing?'");
    expect(subjectLandings).toContain('Generic grammar-class intent belongs to the Grammar programme');

    expect(subjectLandings).not.toContain("seoTitle: 'English Grammar & Writing Classes for Kids | Tiny Steps Learning'");
    expect(subjectLandingPage).toContain("Parent intent: choosing a Grammar level • Beginner vs Advanced Grammar • when to choose Writing.");
    expect(subjectLandingPage).toContain('Primary programme owners:');
    expect(subjectLandingPage).toContain('to="/grammar"');
    expect(subjectLandingPage).toContain('to="/writing-classes-for-kids"');

    expect(routeSeo).toContain("title: 'Grammar Level Guide for Kids: Beginner vs Advanced | Tiny Steps'");
    expect(routeSeo).toContain("canonicalPath: '/english-grammar-writing-classes'");
    expect(routeSeo).toContain("robots: 'index,follow'");
  });
});
