import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHONICS_KNOWLEDGE_DATASET } from '../../content/phonicsKnowledge/index.js';
import { PHONICS_PROGRAMMATIC_PILOT_PAGES } from '../../lib/phonicsProgrammaticPilot.js';
import {
  PHONICS_PUBLISHED_RESOURCE_PAGES,
  PHONICS_PUBLISHED_RESOURCE_PATHS,
  PHONICS_PUBLISHED_RESOURCE_SEO,
  PHONICS_WAVE_2_PAGE_COUNT,
  PHONICS_WAVE_2_PAGES,
  getPublishedPhonicsResourcePageBySlug,
} from '../../lib/phonicsPublicationRegistry.js';
import {
  PHONICS_EDITORIAL_REVIEW_RECORDS,
  PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS,
  PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS,
} from '../../lib/phonicsEditorialReviewRegistry.js';
import { PHONICS_RESOURCE_DISCOVERY_CLUSTERS, getPhonicsResourceReachablePaths } from '../../lib/phonicsResourceDiscoveryGraph.js';
import { PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP, R12_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/phonicsWave2CanonicalOwnership.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { getResourceMeasurementContext } from '../../lib/resourceMeasurement.ts';
import {
  assertCurrentWavePublicationEligibility,
  CURRENT_WAVE_PUBLICATION_APPROVAL_STATE,
  evaluateFurtherResourceScale,
  RESOURCE_EXPANSION_GATE_REVISION,
} from '../../lib/resourceExpansionGovernance.js';
import { PHONICS_WAVE_2_APPROVAL_REVISION, PHONICS_WAVE_2_PUBLICATION_APPROVALS } from '../../lib/phonicsWave2Publication.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));

describe('Resources architecture R12 controlled programmatic expansion', () => {
  it('keeps the 16-page seed frozen and adds exactly 15 explicit Wave 2 pages', () => {
    expect(PHONICS_PROGRAMMATIC_PILOT_PAGES).toHaveLength(16);
    expect(PHONICS_WAVE_2_PAGE_COUNT).toBe(15);
    expect(PHONICS_WAVE_2_PAGES).toHaveLength(15);
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES).toHaveLength(31);
    expect(new Set(PHONICS_PUBLISHED_RESOURCE_PATHS).size).toBe(31);
    expect(Object.keys(PHONICS_PUBLISHED_RESOURCE_SEO)).toHaveLength(31);
  });

  it('publishes exactly the Brick 8 future-wave-2 set and nothing supporting-only', () => {
    const futureIds = PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2').map((concept) => concept.id);
    expect(new Set(PHONICS_WAVE_2_PAGES.map((page) => page.conceptId))).toEqual(new Set(futureIds));
    expect(PHONICS_WAVE_2_PAGES.every((page) => page.concept.expansionState === 'future-wave-2')).toBe(true);
    const supportingOnly = new Set(PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'supporting-only').map((concept) => concept.id));
    expect(PHONICS_PUBLISHED_RESOURCE_PAGES.some((page) => supportingOnly.has(page.conceptId))).toBe(false);
  });

  it('requires an explicit current-wave approval instead of auto-publishing curriculum eligibility', () => {
    const eligible = { id: 'future-example', expansionState: 'future-wave-2', canonicalOwnerTopicId: null };
    expect(() => assertCurrentWavePublicationEligibility(eligible, null, {
      curriculumState: 'future-wave-2',
      approvalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    })).toThrow(/explicit current-wave approval/);
    expect(() => assertCurrentWavePublicationEligibility(eligible, {
      publicationApprovalState: CURRENT_WAVE_PUBLICATION_APPROVAL_STATE,
      publicationApprovalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    }, {
      curriculumState: 'future-wave-2',
      approvalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    })).not.toThrow();
    expect(Object.keys(PHONICS_WAVE_2_PUBLICATION_APPROVALS)).toHaveLength(15);
    expect(PHONICS_WAVE_2_PAGES.every((page) => page.publicationApprovalState === CURRENT_WAVE_PUBLICATION_APPROVAL_STATE)).toBe(true);
  });

  it('rejects supporting-only and already-owned concepts even when an approval object is supplied', () => {
    const approval = {
      publicationApprovalState: CURRENT_WAVE_PUBLICATION_APPROVAL_STATE,
      publicationApprovalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    };
    expect(() => assertCurrentWavePublicationEligibility({ id: 'support', expansionState: 'supporting-only' }, approval, {
      curriculumState: 'future-wave-2', approvalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    })).toThrow(/curriculum state/);
    expect(() => assertCurrentWavePublicationEligibility({ id: 'owned', expansionState: 'future-wave-2', canonicalOwnerTopicId: 'existing-owner' }, approval, {
      curriculumState: 'future-wave-2', approvalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
    })).toThrow(/already-owned/);
  });

  it('requires a finalized R11 promote decision plus governance before any later scale', () => {
    expect(evaluateFurtherResourceScale({ curriculumEligible: true, explicitPublicationApproval: true })).toMatchObject({ eligible: false, reason: 'missing-finalized-r11-decision' });
    for (const status of ['observe', 'repair', 'insufficient-evidence', 'blocked']) {
      expect(evaluateFurtherResourceScale({
        decision: { revision: RESOURCE_EXPANSION_GATE_REVISION, status, scopeType: 'cluster' },
        curriculumEligible: true,
        explicitPublicationApproval: true,
      }).eligible).toBe(false);
    }
    expect(evaluateFurtherResourceScale({
      decision: { revision: RESOURCE_EXPANSION_GATE_REVISION, status: 'promote', scopeType: 'cluster' },
      curriculumEligible: true,
      explicitPublicationApproval: true,
    }).eligible).toBe(true);
  });

  it('keeps R11 repair/block scope local and never turns missing evidence into promotion', () => {
    const blocked = evaluateFurtherResourceScale({
      decision: { revision: RESOURCE_EXPANSION_GATE_REVISION, status: 'blocked', scopeType: 'cluster' },
      curriculumEligible: true,
      explicitPublicationApproval: true,
    });
    const unrelated = evaluateFurtherResourceScale({
      decision: { revision: RESOURCE_EXPANSION_GATE_REVISION, status: 'promote', scopeType: 'cluster' },
      curriculumEligible: true,
      explicitPublicationApproval: true,
    });
    expect(blocked).toMatchObject({ eligible: false, blockScope: 'cluster', blocksOtherClusters: false });
    expect(unrelated).toMatchObject({ eligible: true, blocksOtherClusters: false });
  });

  it('gives every publication unique IDs, slugs, paths and query intent', () => {
    for (const values of [
      PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.conceptId),
      PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.topicId),
      PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.slug),
      PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.path),
      PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => page.concept.searchIntent.toLowerCase()),
    ]) expect(new Set(values).size).toBe(values.length);
  });

  it('publishes every page as an indexable self-canonical prerendered sitemap route with SEO', () => {
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      const route = manifestByPath.get(page.path);
      expect(route?.indexable).toBe(true);
      expect(route?.prerender).toBe(true);
      expect(route?.sitemap).toBe(true);
      expect(route?.canonicalPath).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath).toBe(page.path);
      expect(ROUTE_SEO_REGISTRY[page.path]?.title).toBe(page.seoTitle);
      expect(ROUTE_SEO_REGISTRY[page.path]?.description).toBe(page.seoDescription);
    }
  });

  it('adds explicit Wave 2 canonical owners without mutating the historical ownership registry', () => {
    expect(PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(15);
    expect(R12_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(CANONICAL_TOPIC_OWNERSHIP.length + 15);
    for (const page of PHONICS_WAVE_2_PAGES) {
      const owner = PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP.find((entry) => entry.id === page.topicId);
      expect(owner?.ownerPath).toBe(page.path);
      expect(owner?.ownerRole).toBe('skill-guide');
      expect(owner?.intent).toBe('informational');
      expect(owner?.hubPath).toBe('/resources/phonics');
      expect(owner?.queryIntent).toBe(page.concept.searchIntent);
    }
  });

  it('expands the discovery graph and R11 measurement context to all 31 pages', () => {
    const reachable = new Set(getPhonicsResourceReachablePaths());
    const clustered = PHONICS_RESOURCE_DISCOVERY_CLUSTERS.flatMap((cluster) => cluster.pages.map((page) => page.path));
    expect(new Set(clustered)).toEqual(new Set(PHONICS_PUBLISHED_RESOURCE_PATHS));
    for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
      expect(reachable.has(page.path)).toBe(true);
      const context = getResourceMeasurementContext(page.path);
      expect(context?.pagePath).toBe(page.path);
      expect(context?.conceptId).toBe(page.conceptId);
      expect(context?.publicationWave).toBe(page.publicationWave);
    }
  });

  it('preserves the 16-record R9.1 review history and adds 15 genuinely pending records', () => {
    expect(PHONICS_EDITORIAL_REVIEW_RECORDS).toHaveLength(16);
    expect(PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS).toHaveLength(15);
    expect(PHONICS_PUBLISHED_EDITORIAL_REVIEW_RECORDS).toHaveLength(31);
    for (const review of PHONICS_WAVE_2_EDITORIAL_REVIEW_RECORDS) {
      expect(review.editorialReviewStatus).toBe('pending');
      expect(review.reviewedAt).toBeNull();
      expect(review.reviewedRevision).toBeNull();
      expect(review.reviewNotes).toBeNull();
    }
  });

  it('uses one governed reusable renderer and returns not-found for arbitrary slugs', () => {
    const source = read('src/pages/PhonicsKnowledgePage.tsx');
    expect(source).toContain('getPublishedPhonicsResourcePageBySlug');
    expect(source).toContain('getApprovedPhonicsEditorialReview(page.path)');
    expect(source).toContain('<NotFoundPage />');
    expect(getPublishedPhonicsResourcePageBySlug('not-a-real-pattern')).toBeNull();
    expect(getPublishedPhonicsResourcePageBySlug('ar-r-controlled-vowels-phonics')?.conceptId).toBe('r-controlled-ar');
  });
});
