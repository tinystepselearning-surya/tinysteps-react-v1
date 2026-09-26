import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_COURSES } from '../../content/grammarCurriculum';
import {
  GRAMMAR_PUBLISHED_RESOURCE_PAGES,
  GRAMMAR_PUBLISHED_RESOURCE_PATHS,
  GRAMMAR_PUBLISHED_RESOURCE_SEO,
  getPublishedGrammarResourcePageBySlug,
} from '../../lib/grammarPublicationRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { getBreadcrumbTrail } from '../../lib/breadcrumbAeoGeoRegistry.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

const ESTABLISHED_OWNER_IDS = new Set([
  'sentence-formation',
  'conjunctions',
  'subject-verb-agreement',
  'punctuation-and-capital-letters',
  'paragraph-writing',
  'creative-writing',
  'grammar-editing',
  'grammar-assessment',
  'tenses',
]);

describe('Governed programmatic Grammar knowledge library', () => {
  it('publishes 42 focused key concepts in strict curriculum progression order', () => {
    expect(GRAMMAR_PUBLISHED_RESOURCE_PAGES).toHaveLength(42);
    expect(GRAMMAR_PUBLISHED_RESOURCE_PAGES[0].id).toBe('nouns');
    expect(GRAMMAR_PUBLISHED_RESOURCE_PAGES.at(-1)?.id).toBe('opinion-reason-evidence');

    const ranks = GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.progressionRank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(new Set(ranks).size).toBe(ranks.length);

    for (const values of [
      GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.id),
      GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.slug),
      GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.path),
      GRAMMAR_PUBLISHED_RESOURCE_PAGES.map((page) => page.parentQuestion.toLowerCase()),
    ]) {
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('grounds every programmatic page in the canonical 36+36 Grammar curriculum', () => {
    for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
      expect(page.curriculumRefs.length).toBeGreaterThan(0);
      for (const ref of page.curriculumRefs) {
        const course = GRAMMAR_COURSES[ref.courseId];
        expect(course).toBeTruthy();
        const lesson = course.lessons.find((candidate) => candidate.lessonNumber === ref.lessonNumber);
        expect(lesson, `${page.id}: missing ${ref.courseId} lesson ${ref.lessonNumber}`).toBeTruthy();
      }
    }
  });

  it('keeps established broad editorial owners instead of creating pSEO duplicates for them', () => {
    for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
      expect(ESTABLISHED_OWNER_IDS.has(page.id), `${page.id} should remain with an established owner`).toBe(false);
    }

    const hub = read('src/components/resources/GrammarResourceTimeline.tsx');
    for (const owner of [
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/blog/punctuation-and-capital-letters-for-kids',
      '/blog/grammar-conjunctions',
      '/blog/grammar-subject-verb',
      '/blog/grammar-tenses',
      '/blog/how-to-teach-paragraph-writing-to-kids',
      '/blog/grammar-creative-writing',
      '/blog/grammar-editing-camp',
      '/blog/grammar-assessment',
    ]) {
      expect(hub).toContain(owner);
    }
  });

  it('requires substantial, concept-specific teaching content instead of thin keyword pages', () => {
    for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
      expect(page.quickAnswer.trim().length, page.id).toBeGreaterThanOrEqual(80);
      expect(page.teachingBoundary.trim().length, page.id).toBeGreaterThanOrEqual(80);
      expect(page.examples.length, page.id).toBeGreaterThanOrEqual(2);
      expect(page.teachingSteps.length, page.id).toBeGreaterThanOrEqual(3);
      expect(page.commonMistakes.length, page.id).toBeGreaterThanOrEqual(3);
      expect(page.practiceIdeas.length, page.id).toBeGreaterThanOrEqual(3);
      expect(page.publicationState).toBe('published');
      expect(page.path).toBe(`/resources/grammar/${page.slug}`);
    }
  });

  it('makes every page indexable, self-canonical, prerendered and sitemap-eligible', () => {
    expect(new Set(GRAMMAR_PUBLISHED_RESOURCE_PATHS).size).toBe(42);
    expect(Object.keys(GRAMMAR_PUBLISHED_RESOURCE_SEO)).toHaveLength(42);

    for (const page of GRAMMAR_PUBLISHED_RESOURCE_PAGES) {
      const route = manifestByPath.get(page.path);
      expect(route, page.path).toBeTruthy();
      expect(route?.indexable).toBe(true);
      expect(route?.prerender).toBe(true);
      expect(route?.sitemap).toBe(true);
      expect(route?.canonicalPath).toBe(page.path);

      const seo = ROUTE_SEO_REGISTRY[page.path];
      expect(seo?.canonicalPath).toBe(page.path);
      expect(seo?.robots).toContain('index, follow');
      expect(seo?.title).toContain(page.cardTitle);
      expect(seo?.description.length).toBeLessThanOrEqual(170);
    }
  });

  it('uses one reusable renderer, rejects arbitrary slugs and publishes Grammar breadcrumbs', () => {
    const pageSource = read('src/pages/GrammarKnowledgePage.tsx');
    const routes = read('src/app/routes.tsx');

    expect(pageSource).toContain('getPublishedGrammarResourcePageBySlug');
    expect(pageSource).toContain('<NotFoundPage />');
    expect(routes).toContain("path: 'resources/grammar/:slug'");
    expect(getPublishedGrammarResourcePageBySlug('not-a-real-grammar-term')).toBeNull();
    expect(getPublishedGrammarResourcePageBySlug('modal-verbs-for-kids')?.id).toBe('modal-verbs');

    expect(
      getBreadcrumbTrail({
        pathname: '/resources/grammar/modal-verbs-for-kids',
        title: 'Modal Verbs for Kids',
      }).map((item) => item.path),
    ).toEqual([
      '/',
      '/resources',
      '/resources/grammar',
      '/resources/grammar/modal-verbs-for-kids',
    ]);
  });

  it('renders the chronological library from the Grammar hub and keeps programme intent separate', () => {
    const subjectHub = read('src/pages/SubjectResourcesPage.tsx');
    const timeline = read('src/components/resources/GrammarResourceTimeline.tsx');
    const knowledgePage = read('src/pages/GrammarKnowledgePage.tsx');

    expect(subjectHub).toContain('<GrammarResourceTimeline />');
    expect(subjectHub).toContain('GRAMMAR_PUBLISHED_RESOURCE_PAGES');
    expect(timeline).toContain('Learn key grammar concepts in curriculum order');
    expect(timeline).toContain('Beginner Grammar');
    expect(timeline).toContain('Advanced Grammar');

    expect(knowledgePage).toContain('Back to Grammar & Writing');
    expect(knowledgePage).toContain('Explore Live Grammar Support');
    expect(knowledgePage).not.toContain('Book a class');
  });
});
