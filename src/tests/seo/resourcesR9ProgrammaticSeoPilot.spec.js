import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHONICS_KNOWLEDGE_DATASET,
  getBrick9PilotCandidates,
  getPhonicsKnowledgeConcept,
} from '../../content/phonicsKnowledge/index.js';
import {
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  PHONICS_PROGRAMMATIC_PILOT_PATHS,
  getPhonicsProgrammaticPilotPageByConceptId,
  getPhonicsProgrammaticPilotPageByPath,
  getPhonicsProgrammaticPilotPageBySlug,
} from '../../lib/phonicsProgrammaticPilot.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { getBreadcrumbTrail, getAeoGeoPresentation } from '../../lib/breadcrumbAeoGeoRegistry.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const redirectSources = new Set(PUBLIC_REDIRECT_MANIFEST.map((entry) => entry.source));
const ownerById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));

describe('Resources architecture R9 controlled programmatic SEO pilot', () => {
  it('publishes only the explicitly reviewed R8 Wave 1 set', () => {
    const candidates = getBrick9PilotCandidates();
    expect(candidates).toHaveLength(16);
    expect(PHONICS_PROGRAMMATIC_PILOT_PAGES).toHaveLength(16);
    expect(new Set(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.conceptId)))
      .toEqual(new Set(candidates.map((concept) => concept.id)));
    expect(PHONICS_PROGRAMMATIC_PILOT_PAGES.every((page) => page.publicationState === 'approved-wave-1')).toBe(true);
  });

  it('does not mutate Brick 8 into a publication switch', () => {
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(page.concept.publicationStatus).toBe('dataset-only');
      expect(page.concept.publicationApproved).toBe(false);
      expect(page.concept.editorialState).toBe('needs-human-review');
      expect(page.concept.expansionState).toBe('pilot-wave-1');
    }
  });

  it('keeps SATPIN, blending and CVC with their established owners', () => {
    for (const id of ['satpin', 'blending', 'cvc-words']) {
      const concept = getPhonicsKnowledgeConcept(id);
      expect(concept).toBeTruthy();
      expect(concept.expansionState).toBe('existing-owner');
      expect(getPhonicsProgrammaticPilotPageByConceptId(id)).toBeNull();
    }
    const paths = PHONICS_PROGRAMMATIC_PILOT_PATHS.join(' ');
    expect(paths).not.toMatch(/satpin|blending|cvc/);
  });

  it('keeps every future Wave 2 concept unpublished', () => {
    const future = PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2');
    expect(future).toHaveLength(15);
    for (const concept of future) {
      expect(getPhonicsProgrammaticPilotPageByConceptId(concept.id)).toBeNull();
      expect(routePaths.has(`/resources/phonics/${concept.futureSlugCandidate}`)).toBe(false);
    }
  });

  it('provides unique, safe, self-canonical public routes for approved pages', () => {
    expect(new Set(PHONICS_PROGRAMMATIC_PILOT_PATHS).size).toBe(16);
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(page.path).toBe(`/resources/phonics/${page.slug}`);
      expect(routePaths.has(page.path)).toBe(true);
      expect(redirectSources.has(page.path)).toBe(false);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]?.title).toBe(page.seoTitle);
      expect(ROUTE_SEO_REGISTRY[page.path]?.description).toBe(page.seoDescription);
      expect(ROUTE_SEO_REGISTRY[page.path]?.robots || '').not.toMatch(/noindex/i);
    }
  });

  it('registers one canonical informational skill owner per pilot page', () => {
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      const owner = ownerById.get(page.topicId);
      expect(owner).toBeTruthy();
      expect(owner.ownerPath).toBe(page.path);
      expect(owner.subject).toBe('phonics-reading');
      expect(owner.ownerRole).toBe('skill-guide');
      expect(owner.intent).toBe('informational');
      expect(owner.hubPath).toBe('/resources/phonics');
      expect(owner.queryIntent).toBe(page.concept.searchIntent);
    }
  });

  it('resolves approved slugs and paths without exposing unapproved dataset entries', () => {
    const ck = getPhonicsProgrammaticPilotPageBySlug('ck-rule-phonics');
    expect(ck?.conceptId).toBe('ck-rule');
    expect(getPhonicsProgrammaticPilotPageByPath('/resources/phonics/ck-rule-phonics')?.conceptId).toBe('ck-rule');
    expect(getPhonicsProgrammaticPilotPageBySlug('ar-r-controlled-vowels-phonics')).toBeNull();
    expect(getPhonicsProgrammaticPilotPageBySlug('not-a-real-pattern')).toBeNull();
  });

  it('keeps content materially differentiated rather than swapping only word lists', () => {
    const questions = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.concept.parentQuestion);
    const answers = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.concept.quickAnswer);
    const exampleBanks = PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [...page.concept.exampleWords].sort().join('|'));
    expect(new Set(questions).size).toBe(16);
    expect(new Set(answers).size).toBe(16);
    expect(new Set(exampleBanks).size).toBe(16);
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(page.concept.exampleWords.length).toBeGreaterThanOrEqual(5);
      expect(page.concept.teachingNotes.length).toBeGreaterThanOrEqual(2);
      expect(page.concept.practiceIdeas.length).toBeGreaterThanOrEqual(2);
      expect(page.concept.commonConfusions.length).toBeGreaterThanOrEqual(2);
      expect(page.concept.distinctValueSignals.length).toBeGreaterThanOrEqual(3);
      expect(page.concept.curriculumAlignment).toBe('direct');
    }
  });

  it('uses the Brick 7 hierarchy and AEO subject context for granular phonics pages', () => {
    const page = PHONICS_PROGRAMMATIC_PILOT_PAGES[0];
    const trail = getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle });
    expect(trail.map((item) => item.path)).toEqual(['/', '/resources', '/resources/phonics', page.path]);
    const presentation = getAeoGeoPresentation({ pathname: page.path });
    expect(presentation.subject).toBe('phonics-reading');
    expect(presentation.subjectHubPath).toBe('/resources/phonics');
  });

  it('renders the pilot through one reusable page and exposes it from the phonics hub', () => {
    const routes = read('src/app/routes.tsx');
    const page = read('src/pages/PhonicsKnowledgePage.tsx');
    const hub = read('src/pages/SubjectResourcesPage.tsx');
    const grid = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    expect(routes).toContain("const PhonicsKnowledgePage = lazy(() => import('../pages/PhonicsKnowledgePage'));");
    expect(routes).toContain("{ path: 'resources/phonics/:slug', element: <PhonicsKnowledgePage /> },");
    expect(page).toContain('getPhonicsProgrammaticPilotPageBySlug');
    expect(page).toContain('<NotFoundPage />');
    expect(page).toContain('ts-answer-title');
    expect(page).toContain('ts-answer-summary');
    expect(page).toContain("'DefinedTerm'");
    expect(page).toContain("'WebPage'");
    expect(page).not.toContain("'FAQPage'");
    expect(page).not.toContain("'HowTo'");
    expect(hub).toContain('PhonicsPilotGuideGrid');
    expect(grid).toContain('PHONICS_PROGRAMMATIC_PILOT_PAGES');
  });
});
