import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const facts = read('src/config/semanticFacts.ts');
const hub = read('src/pages/speaking.tsx');
const courseRegistry = read('src/lib/publicCoursePages.js');
const courseDetail = read('src/pages/CourseDetailPage.tsx');
const curriculum = read('src/pages/CurriculumPage.tsx');
const coursesPage = read('src/pages/CoursesPage.tsx');
const chooser = read('src/pages/parents/choosing-course.tsx');
const rss = read('public/rss.xml');
const feed = read('public/feed.xml');
const sitemapCourses = read('public/sitemap-courses.xml');
const sitemapIndex = read('public/sitemap.xml');
const firebase = read('firebase.json');
const manifest = read('src/lib/publicRouteManifest.js');
const routes = read('src/app/routes.tsx');
const routeSeo = read('src/lib/routeSeoRegistry.js');
const sitemapGenerator = read('scripts/generate-sitemaps.js');
const seoSmoke = read('scripts/seo-smoke.mjs');
const internalLinks = read('src/lib/seo/internalLinkMap.ts');

describe('Speaking growth Brick 6 programme architecture', () => {
  it('keeps internal course IDs stable while declaring canonical public course routes', () => {
    expect(facts).toContain("courseId: 'basic-public-speaking'");
    expect(facts).toContain("publicSlug: 'basic-public-speaking'");
    expect(facts).toContain("canonicalPublicSlug: 'public-speaking-foundations'");
    expect(facts).toContain("canonicalCoursePath: '/courses/public-speaking-foundations'");

    expect(facts).toContain("courseId: 'advanced-public-speaking'");
    expect(facts).toContain("publicSlug: 'advanced-public-speaking'");
    expect(facts).toContain("canonicalPublicSlug: 'public-speaking-excellence'");
    expect(facts).toContain("canonicalCoursePath: '/courses/public-speaking-excellence'");

    expect(facts).toContain("ageRange: { min: 4, max: 7, label: 'Ages 4–7' }");
    expect(facts).toContain("ageRange: { min: 7, max: 12, label: 'Ages 7–12' }");
    expect((facts.match(/lessonCount: 36/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('keeps /speaking as the architecture root without pretending two levels are a Google Course list', () => {
    expect(hub).toContain("const canonicalPath = '/speaking';");
    expect(hub).toContain("name: 'Tiny Steps Public Speaking levels'");
    expect(hub).toContain("'@id': `${canonicalUrl}#public-speaking-levels`");
    expect(hub).toContain('publicSpeakingLevelArchitecture.map');
    expect(hub).toContain("name: 'Tiny Steps adjacent speaking specialist pathways'");
    expect(hub).toContain("'@id': `${canonicalUrl}#speaking-specialist-pathways`");
    expect(hub).toContain("itemListOrder: 'https://schema.org/ItemListUnordered'");
    expect(hub).toContain('speakingSpecialistPathways.map');
    expect(hub).toContain("'@type': 'WebPage'");
    expect(hub).toContain('speakingFacts.levels.beginner.canonicalCoursePath');
    expect(hub).toContain('speakingFacts.levels.advanced.canonicalCoursePath');
    expect(hub).toContain('to="/spoken-english-classes-for-kids-online"');
    expect(hub).toContain('to="/confidence-building-program-kids"');

    expect(hub).not.toContain('createCourseListSchema');
    expect(hub).not.toContain('createCourseSchema(');
    expect(hub).not.toContain("name: 'Public Speaking (Intermediate)'");
  });

  it('defines exactly two published Public Speaking levels with readiness-based progression', () => {
    expect(courseRegistry).toContain('const SPEAKING_LEVEL_SEQUENCE = [');
    expect(courseRegistry).toContain("name: 'Public Speaking Foundations'");
    expect(courseRegistry).toContain("routePath: '/courses/public-speaking-foundations'");
    expect(courseRegistry).toContain("name: 'Public Speaking Excellence'");
    expect(courseRegistry).toContain("routePath: '/courses/public-speaking-excellence'");
    expect(courseRegistry).not.toContain("name: 'Public Speaking Intermediate'");

    expect(courseRegistry).toContain('No previous Public Speaking course is required.');
    expect(courseRegistry).toContain('Children may arrive from Public Speaking Foundations or demonstrate equivalent readiness during assessment.');
    expect(courseRegistry).toContain("progressionTitle: 'Tiny Steps Public Speaking progression'");
    expect(courseRegistry).toContain('sequence: SPEAKING_LEVEL_SEQUENCE');
  });

  it('gives both levels clear prerequisites, skills, readiness, provider, teaching method and next-path links', () => {
    for (const token of [
      'prerequisiteNote:',
      'entrySignals:',
      'skillsBuilt:',
      'exitSignals:',
      'providerNote:',
      'teachingMethod:',
      'Continue to Public Speaking Excellence',
      'Review Public Speaking Foundations',
      'Everyday conversation support: Spoken English',
      'Specialist confidence support',
      'Meet the Tiny Steps academic team',
      'View real class samples',
    ]) {
      expect(courseRegistry).toContain(token);
    }
  });

  it('renders Speaking-level architecture without breaking the existing Phonics stage contract', () => {
    expect(courseDetail).toContain("'@id': `${canonicalUrl}#speaking-program-levels`");
    expect(courseDetail).toContain("name: 'Tiny Steps Public Speaking programme levels'");
    expect(courseDetail).toContain("'Course fit · Speaking level'");
    expect(courseDetail).toContain("'speaking-level-fit'");
    expect(courseDetail).toContain('Prerequisite / starting-point note:');
    expect(courseDetail).toContain("'Signs this may be the right starting level'");
    expect(courseDetail).toContain("'Skills this level builds'");
    expect(courseDetail).toContain("'Signs this may be the right starting stage'");
    expect(courseDetail).toContain("'Skills this stage builds'");
    expect(courseDetail).toContain('Provider and teacher system');
    expect(courseDetail).toContain('How the level is taught');
    expect(courseDetail).toContain('to="/team"');
    expect(courseDetail).toContain('to="/class-samples"');

    expect(courseDetail).toContain("'@id': `${canonicalUrl}#phonics-program-stages`");
    expect(courseDetail).toContain("name: 'Tiny Steps phonics programme stages'");
    expect(courseDetail).toContain("'Course fit · Phonics stage'");
    expect(courseDetail).toContain("'Tiny Steps phonics progression'");
  });

  it('uses canonical public course names as Course entities and keeps Tiny Steps as provider through the shared helper', () => {
    expect(courseDetail).toContain("name: 'Public Speaking Foundations'");
    expect(courseDetail).toContain("name: 'Public Speaking Excellence'");
    expect(courseDetail).toContain("educationalLevel: 'Beginner Public Speaking; ages 4–7; assessment-led placement'");
    expect(courseDetail).toContain("educationalLevel: 'Advanced Public Speaking; ages 7–12; assessment-led placement'");
    expect(courseDetail).toContain('areaServed: Array.isArray(coursePageConfig?.areaServed)');
  });

  it('aligns the curriculum and public course chooser with the same level names and boundaries', () => {
    expect(curriculum).toContain('speakingFacts.levels.beginner.canonicalCoursePath');
    expect(curriculum).toContain('speakingFacts.levels.advanced.canonicalCoursePath');
    expect(curriculum).toContain('Understand the prompt → choose and organise an idea');
    expect(curriculum).not.toContain("bestFor: 'Children who give short answers, hesitate, or need guided full-sentence speaking practice.'");

    expect(coursesPage).toContain("title: 'Public Speaking Foundations'");
    expect(coursesPage).toContain("title: 'Public Speaking Excellence'");
    expect(coursesPage).toContain('children with everyday conversational-fluency gaps may need Spoken English');
    expect(coursesPage).not.toContain('Children who give one-word answers, feel shy');

    expect(chooser).toContain("title: 'Start with speaking structure'");
    expect(chooser).toContain("destination: '/speaking'");
    expect(chooser).toContain('Short answers do not automatically mean Public Speaking.');
    expect(chooser).not.toContain("destination: '/courses/public-speaking-foundations',\n    ctaLabel: 'Explore speaking foundations'");
  });

  it('keeps legacy Basic/Advanced course aliases as direct non-indexable redirects', () => {
    for (const [source, destination] of [
      ['/courses/basic-public-speaking', '/courses/public-speaking-foundations'],
      ['/courses/basic-public-speaking/', '/courses/public-speaking-foundations'],
      ['/courses/advanced-public-speaking', '/courses/public-speaking-excellence'],
      ['/courses/advanced-public-speaking/', '/courses/public-speaking-excellence'],
    ] as const) {
      expect(firebase).toContain(`"source": "${source}", "destination": "${destination}", "type": 301`);
      expect(manifest).toContain(`{ source: '${source}', destination: '${destination}', status: 301 }`);
      expect(routeSeo).toContain(`'${source}': {`);
      expect(routeSeo).toContain(`canonicalPath: '${destination}'`);
    }

    expect(routes).toContain("path: 'courses/basic-public-speaking/'");
    expect(routes).toContain("path: 'courses/advanced-public-speaking/'");
    expect(routeSeo).toContain("robots: 'noindex, follow'");
  });

  it('keeps sitemap smoke consistent: canonicals required, retired aliases absent', () => {
    expect(seoSmoke).toContain("'https://tinystepslearning.com/courses/public-speaking-foundations'");
    expect(seoSmoke).toContain("'https://tinystepslearning.com/courses/public-speaking-excellence'");
    expect(seoSmoke).toContain("'https://tinystepslearning.com/public-speaking-communication-kids'");
    expect(seoSmoke).toContain("'https://tinystepslearning.com/spoken-english-classes-for-kids'");

    const requiredCoreBlock = seoSmoke.slice(
      seoSmoke.indexOf('const REQUIRED_CORE_URLS = ['),
      seoSmoke.indexOf('const REQUIRED_SELF_CANONICAL_LONG_TAIL_PATHS'),
    );
    expect(requiredCoreBlock).not.toContain('public-speaking-communication-kids');
    expect(requiredCoreBlock).not.toContain("'https://tinystepslearning.com/spoken-english-classes-for-kids'");
  });

  it('keeps Speaking course sitemap freshness tied to the files that actually render the course pages', () => {
    expect(sitemapGenerator).toContain("routePath.startsWith('/courses/public-speaking-')");
    expect(sitemapGenerator).toContain('publicCoursePagesJs');
    expect(sitemapGenerator).toContain('courseDetailTsx');
    expect(sitemapCourses).toContain(
      '<loc>https://tinystepslearning.com/courses/public-speaking-foundations</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
    expect(sitemapCourses).toContain(
      '<loc>https://tinystepslearning.com/courses/public-speaking-excellence</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
    expect(sitemapIndex).toContain(
      '<loc>https://tinystepslearning.com/sitemap-courses.xml</loc>\n    <lastmod>2026-09-19</lastmod>',
    );
  });

  it('registers both canonical Public Speaking course pages for automatic internal linking', () => {
    expect(internalLinks).toContain("id: 'course-public-speaking-foundations'");
    expect(internalLinks).toContain("href: '/courses/public-speaking-foundations'");
    expect(internalLinks).toContain("id: 'course-public-speaking-excellence'");
    expect(internalLinks).toContain("href: '/courses/public-speaking-excellence'");
    expect(internalLinks).toContain("'Public Speaking Excellence course'");
    expect(internalLinks).toContain("'Advanced Public Speaking course'");
  });

  it('keeps discovery descriptions synchronized with the canonical public course descriptions', () => {
    const foundationsDescription =
      'Live 1:1 Public Speaking Foundations for ages 4–7, building organised responses, picture talk, show-and-tell, simple storytelling, clear expression, and short presentation readiness.';
    const excellenceDescription =
      'Live 1:1 advanced Public Speaking for ages 7–12, developing longer structured talks, storytelling, presentations, impromptu speaking, guided debate, audience awareness, and stronger delivery.';

    expect(courseRegistry).toContain(foundationsDescription);
    expect(courseRegistry).toContain(excellenceDescription);
    expect(rss).toContain(foundationsDescription);
    expect(rss).toContain(excellenceDescription);
    expect(feed).toContain(foundationsDescription);
    expect(feed).toContain(excellenceDescription);
  });

  it('does not fabricate course-specific VideoObject markup without a course-specific video surface', () => {
    expect(hub).not.toContain("'@type': 'VideoObject'");
    expect(courseDetail).not.toContain("'@type': 'VideoObject'");
  });
});
