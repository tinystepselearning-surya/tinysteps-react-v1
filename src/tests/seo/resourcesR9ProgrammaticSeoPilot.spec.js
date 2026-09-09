import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET, getBrick9PilotCandidates, getPhonicsKnowledgeConcept } from '../../content/phonicsKnowledge/index.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES, PHONICS_PROGRAMMATIC_PILOT_PATHS, PHONICS_PROGRAMMATIC_PILOT_SEO, getPhonicsProgrammaticPilotPageByConceptId, getPhonicsProgrammaticPilotPageByPath, getPhonicsProgrammaticPilotPageBySlug } from '../../lib/phonicsProgrammaticPilot.js';
import { PHONICS_WAVE_2_PAGES } from '../../lib/phonicsWave2Publication.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_REDIRECT_MANIFEST, PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { getBreadcrumbTrail, getAeoGeoPresentation } from '../../lib/breadcrumbAeoGeoRegistry.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const redirectSources = new Set(PUBLIC_REDIRECT_MANIFEST.map((entry) => entry.source));
const ownerById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));

describe('Resources architecture R9 frozen programmatic SEO pilot under R12', () => {
  it('keeps the explicitly reviewed R8 Wave 1 registry frozen at 16', () => {
    const candidates = getBrick9PilotCandidates();
    expect(candidates).toHaveLength(16);
    expect(PHONICS_PROGRAMMATIC_PILOT_PAGES).toHaveLength(16);
    expect(Object.keys(PHONICS_PROGRAMMATIC_PILOT_SEO)).toHaveLength(16);
    expect(new Set(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.conceptId))).toEqual(new Set(candidates.map((concept) => concept.id)));
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
  it('keeps established SATPIN, blending and CVC owners out of the pilot', () => {
    for (const id of ['satpin', 'blending', 'cvc-words']) expect(getPhonicsProgrammaticPilotPageByConceptId(id)).toBeNull();
    expect(PHONICS_PROGRAMMATIC_PILOT_PATHS.join(' ')).not.toMatch(/satpin|blending|cvc/);
  });
  it('keeps Wave 2 additive rather than rewriting the R9 registry', () => {
    const future = PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2');
    expect(future).toHaveLength(15);
    expect(PHONICS_WAVE_2_PAGES).toHaveLength(15);
    for (const concept of future) expect(getPhonicsProgrammaticPilotPageByConceptId(concept.id)).toBeNull();
  });
  it('preserves safe self-canonical R9 routes', () => {
    expect(new Set(PHONICS_PROGRAMMATIC_PILOT_PATHS).size).toBe(16);
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      expect(routePaths.has(page.path)).toBe(true);
      expect(redirectSources.has(page.path)).toBe(false);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]?.title).toBe(page.seoTitle);
    }
  });
  it('preserves one canonical informational owner per historical pilot page', () => {
    for (const page of PHONICS_PROGRAMMATIC_PILOT_PAGES) {
      const owner = ownerById.get(page.topicId);
      expect(owner?.ownerPath).toBe(page.path);
      expect(owner?.subject).toBe('phonics-reading');
      expect(owner?.ownerRole).toBe('skill-guide');
      expect(owner?.queryIntent).toBe(page.concept.searchIntent);
    }
  });
  it('keeps the legacy pilot resolver historical', () => {
    expect(getPhonicsProgrammaticPilotPageBySlug('ck-rule-phonics')?.conceptId).toBe('ck-rule');
    expect(getPhonicsProgrammaticPilotPageByPath('/resources/phonics/ck-rule-phonics')?.conceptId).toBe('ck-rule');
    expect(getPhonicsProgrammaticPilotPageBySlug('ar-r-controlled-vowels-phonics')).toBeNull();
    expect(getPhonicsProgrammaticPilotPageBySlug('not-a-real-pattern')).toBeNull();
  });
  it('keeps differentiated pilot content and hierarchy', () => {
    expect(new Set(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.concept.parentQuestion)).size).toBe(16);
    const page = PHONICS_PROGRAMMATIC_PILOT_PAGES[0];
    expect(getBreadcrumbTrail({ pathname: page.path, title: page.cardTitle }).map((item) => item.path)).toEqual(['/', '/resources', '/resources/phonics', page.path]);
    expect(getAeoGeoPresentation({ pathname: page.path }).subject).toBe('phonics-reading');
  });
  it('retains one reusable page renderer while R12 supplies the expanded registry', () => {
    const routes = read('src/app/routes.tsx');
    const page = read('src/pages/PhonicsKnowledgePage.tsx');
    const grid = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    expect(routes).toContain("{ path: 'resources/phonics/:slug', element: <PhonicsKnowledgePage /> },");
    expect(page).toContain('getPhonicsProgrammaticPilotPageBySlug');
    expect(page).toContain('getPublishedPhonicsResourcePageBySlug');
    expect(page).toContain('<NotFoundPage />');
    expect(grid).toContain('PHONICS_PUBLISHED_RESOURCE_PAGES');
  });
});
