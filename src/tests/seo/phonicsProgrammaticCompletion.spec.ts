import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_PUBLISHED_RESOURCE_PAGES,
  PHONICS_PUBLISHED_RESOURCE_PATHS,
} from '../../lib/phonicsPublicationRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { getPhonicsResourceReachablePaths } from '../../lib/phonicsResourceDiscoveryGraph.js';
import { getResourceMeasurementContext } from '../../lib/resourceMeasurement';
import { getPhonicsResourceDifferentiation } from '../../lib/phonicsResourceDifferentiation';
import {
  PHONICS_PREPUBLICATION_QUALITY_REVISION,
  PHONICS_PREPUBLICATION_QUALITY_STATE,
} from '../../lib/phonicsPrepublicationQuality.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const sitemap = read('public/sitemap-static.xml');
const rss = read('public/rss.xml');
const feed = read('public/feed.xml');
const llms = read('public/llms.txt');
const llmsFull = read('public/llms-full.txt');
const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((route) => [route.path, route]));
const reachable = new Set(getPhonicsResourceReachablePaths());
describe('Phonics programmatic SEO completion gate', () => {
  it('freezes the governed publication set at 31 pages until a later evidence-gated wave is explicitly approved', () => {
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    expect(PHONICS_PUBLISHED_RESOURCE_PATHS).toHaveLength(31);
    expect(new Set(PHONICS_PUBLISHED_RESOURCE_PATHS).size).toBe(31);
  });

  it('keeps every governed page technically publishable and self-canonical', () => {
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      const route = routeByPath.get(page.path);
      expect(route, page.path).toBeTruthy();
      expect(route?.indexable, page.path).toBe(true);
      expect(route?.prerender, page.path).toBe(true);
      expect(route?.sitemap, page.path).toBe(true);
      expect(route?.canonicalPath, page.path).toBe(page.path);

      const seo = ROUTE_SEO_REGISTRY[page.path];
      expect(seo?.canonicalPath, page.path).toBe(page.path);
      expect(seo?.title, page.path).toBe(page.seoTitle);
      expect(seo?.description, page.path).toBe(page.seoDescription);
      expect(seo?.robots, page.path).not.toMatch(/noindex/i);
    }
  });

  it('publishes every governed URL across sitemap, feeds and both LLM discovery surfaces', () => {
    expect(llms).toContain('## Focused Phonics Resource Library — 31 governed guides');
    expect(llmsFull).toContain('## Focused Phonics Resource Library — 31 governed guides');

    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      const absolute = `https://tinystepslearning.com${page.path}`;
      expect(sitemap, `sitemap: ${page.path}`).toContain(absolute);
      expect(rss, `rss: ${page.path}`).toContain(absolute);
      expect(feed, `feed: ${page.path}`).toContain(absolute);
      expect(llms, `llms: ${page.path}`).toContain(absolute);
      expect(llmsFull, `llms-full: ${page.path}`).toContain(absolute);
    }
  });

  it('keeps every page reachable, measurable and meaningfully differentiated', () => {
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(reachable.has(page.path), page.path).toBe(true);

      const measurement = getResourceMeasurementContext(page.path);
      expect(measurement?.surface, page.path).toBe('phonics_guide');
      expect(measurement?.conceptId, page.path).toBe(page.conceptId);
      expect(measurement?.publicationWave, page.path).toBe(page.publicationWave);

      const differentiation = getPhonicsResourceDifferentiation(page.conceptId);
      expect(differentiation, page.conceptId).toBeTruthy();
      expect(differentiation?.learningOutcome.length, page.conceptId).toBeGreaterThan(40);
      expect(differentiation?.boundarySummary.length, page.conceptId).toBeGreaterThan(40);
    }
  });

  it('requires useful teaching depth instead of allowing thin generated pages', () => {
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      const concept = page.concept;
      expect(concept.parentQuestion.trim().length, page.conceptId).toBeGreaterThan(20);
      expect(concept.quickAnswer.trim().length, page.conceptId).toBeGreaterThan(60);
      expect(concept.searchIntent.trim().length, page.conceptId).toBeGreaterThan(10);
      expect(concept.exampleWords.length, page.conceptId).toBeGreaterThanOrEqual(3);
      expect(concept.teachingNotes.length, page.conceptId).toBeGreaterThanOrEqual(2);
      expect(concept.practiceIdeas.length, page.conceptId).toBeGreaterThanOrEqual(2);
      expect(concept.commonConfusions.length, page.conceptId).toBeGreaterThanOrEqual(1);
      expect(concept.curriculumRefs.length, page.conceptId).toBeGreaterThanOrEqual(1);
      expect(concept.supportingPaths.length, page.conceptId).toBeGreaterThanOrEqual(1);
    }
  });

  it('requires a passed pre-publication quality state on every published page', () => {
    const pageSource = read('src/pages/PhonicsKnowledgePage.tsx');

    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(page.prepublicationQualityState, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_STATE);
      expect(page.prepublicationQualityRevision, page.conceptId).toBe(PHONICS_PREPUBLICATION_QUALITY_REVISION);
      expect(page.prepublicationQualityChecks.length, page.conceptId).toBeGreaterThanOrEqual(10);
    }

    expect(pageSource).not.toContain('usePublicEditorialApproval');
    expect(pageSource).not.toContain('getApprovedPhonicsEditorialReview');
    expect(pageSource).not.toContain('Reviewed for phonics accuracy by');
    expect(pageSource).not.toContain('reviewedBy');
  });

  it('keeps the word utility inside the hub instead of leaking mass individual word URLs', () => {
    for (const source of [sitemap, llms, llmsFull, read('src/lib/publicRouteManifest.js')]) {
      expect(source).not.toMatch(/\/resources\/phonics\/(?:word|words)\//);
    }
  });
});
