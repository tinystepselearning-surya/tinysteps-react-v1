import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C8_STATUS,
  COMMERCIAL_C8_TRUST_SURFACES,
} from '../../lib/commercialC8TrustEvidenceDifferentiation';
import {
  SPEAKING_EVIDENCE_CLAIM_BOUNDARIES,
  SPEAKING_EVIDENCE_LAYER_REVISION,
  SPEAKING_EVIDENCE_REQUIRED_C8_PATHS,
  SPEAKING_EVIDENCE_SURFACES,
} from '../../lib/speakingEvidenceLayer';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
} from '../../lib/speakingProgressFramework';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

const speakingSource = read('src/pages/speaking.tsx');
const classSamplesSource = read('src/pages/ClassSamplesPage.tsx');
const testimonialsSource = read('src/pages/TestimonialsPage.tsx');
const teamSource = read('src/pages/team/TeamPageSections.tsx');
const curriculumSource = read('src/pages/CurriculumPage.tsx');
const sitemapGeneratorSource = read('scripts/generate-sitemaps.js');
const routeManifestSource = read('src/lib/publicRouteManifest.js');
const routesSource = read('src/app/routes.tsx');

describe('Speaking growth Brick 9 evidence layer', () => {
  it('builds on the frozen Commercial C8 evidence system instead of creating another trust architecture', () => {
    expect(SPEAKING_EVIDENCE_LAYER_REVISION).toBe('2026-09-19-b9-v1');
    expect(COMMERCIAL_C8_STATUS).toBe('frozen');
    expect(SPEAKING_EVIDENCE_SURFACES).toHaveLength(6);
    expect(SPEAKING_EVIDENCE_SURFACES.map((item) => item.kind)).toEqual([
      'observable-classroom',
      'programme-delivery',
      'progress-method',
      'academic-ownership',
      'programme-architecture',
      'parent-feedback',
    ]);

    const c8Paths = new Set(COMMERCIAL_C8_TRUST_SURFACES.map((surface) => surface.path));
    for (const evidencePath of SPEAKING_EVIDENCE_REQUIRED_C8_PATHS) {
      expect(c8Paths.has(evidencePath)).toBe(true);
    }
  });

  it('requires every evidence surface to state both what it supports and what it does not prove', () => {
    expect(new Set(SPEAKING_EVIDENCE_SURFACES.map((item) => item.id)).size).toBe(
      SPEAKING_EVIDENCE_SURFACES.length,
    );
    for (const item of SPEAKING_EVIDENCE_SURFACES) {
      expect(item.supports.length).toBeGreaterThan(0);
      expect(item.doesNotProve.length).toBeGreaterThan(0);
      expect(Object.isFrozen(item)).toBe(true);
      expect(Object.isFrozen(item.supports)).toBe(true);
      expect(Object.isFrozen(item.doesNotProve)).toBe(true);
    }
  });

  it('keeps testimonial and outcome claim boundaries restrictive', () => {
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.aggregateRatingsRequireApprovedTestimonials).toBe(true);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.generatedFallbackTestimonialsAllowed).toBe(false);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.unsupportedSatisfactionPercentagesAllowed).toBe(false);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.universalGuaranteedTimelineAllowed).toBe(false);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.parentFeedbackRepresentsUniversalOutcome).toBe(false);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.fabricatedReviewClaimsAllowed).toBe(false);
    expect(SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.progressEvidenceStandard).toContain('fresh');
  });

  it('uses the existing class-sample surface as observable teaching evidence with appropriate boundaries', () => {
    expect(classSamplesSource).toContain('Tiny Steps classes are live teacher-guided online classes.');
    expect(classSamplesSource).toContain(
      'Children are encouraged to read, speak, answer, practise, and try again with teacher support.',
    );
    expect(classSamplesSource).toContain("title: 'Public Speaking'");
    expect(classSamplesSource).toContain(
      'Child answers prompts, describes pictures, or tells a short story.',
    );

    const classEvidence = SPEAKING_EVIDENCE_SURFACES.find((item) => item.id === 'observable-classroom');
    expect(classEvidence?.path).toBe('/class-samples');
    expect(classEvidence?.doesNotProve).toContain('that every child will achieve the same result');
    expect(classEvidence?.doesNotProve).toContain('that a specific speaking sample is always available');
  });

  it('anchors progress evidence in Brick 7 rather than a testimonial or invented score', () => {
    const progressEvidence = SPEAKING_EVIDENCE_SURFACES.find((item) => item.id === 'progress-method');
    expect(progressEvidence?.summary).toContain(`${SPEAKING_PROGRESS_DIMENSIONS.length} observable dimensions`);
    expect(progressEvidence?.summary).toContain(
      `${SPEAKING_PROGRESS_OBSERVATION_BANDS.length} support/independence bands`,
    );
    expect(progressEvidence?.supports).toContain('fresh-task transfer evidence');
    expect(progressEvidence?.doesNotProve).toContain('a developmental-age score');
    expect(progressEvidence?.doesNotProve).toContain('an IQ-style result or diagnosis');
  });

  it('anchors academic ownership and programme architecture in existing verified surfaces', () => {
    expect(teamSource).toContain('Built around how children actually learn');
    expect(teamSource).toContain('Observe the child during class');
    expect(teamSource).toContain('Reduce teacher support gradually');
    expect(curriculumSource).toContain('The complete Tiny Steps learning roadmap');
    expect(curriculumSource).toContain(
      'Children do not have to complete every pathway in a fixed age order.',
    );

    expect(
      SPEAKING_EVIDENCE_SURFACES.find((item) => item.id === 'academic-ownership')?.doesNotProve,
    ).toContain('external accreditation');
    expect(
      SPEAKING_EVIDENCE_SURFACES.find((item) => item.id === 'programme-architecture')?.doesNotProve,
    ).toContain('a guaranteed completion timeline');
  });

  it('keeps first-party parent feedback explicitly bounded and avoids review inflation on the Speaking page', () => {
    expect(testimonialsSource).toContain('curated set of first-party parent feedback excerpts');
    expect(testimonialsSource).toContain('They describe individual family experiences');
    expect(testimonialsSource).toContain('it is not a promise or guarantee of a particular outcome');

    const parentEvidence = SPEAKING_EVIDENCE_SURFACES.find((item) => item.id === 'parent-feedback');
    expect(parentEvidence?.path).toBe('/testimonials');
    expect(parentEvidence?.doesNotProve).toContain(
      'that the same outcome will occur for another child',
    );
    expect(parentEvidence?.doesNotProve).toContain('an aggregate satisfaction percentage');

    expect(speakingSource).not.toContain('AggregateRating');
    expect(speakingSource).not.toContain('createTestimonialsStructuredData');
    expect(speakingSource).not.toContain('ratingValue');
  });

  it('surfaces a compact evidence layer on the canonical /speaking owner', () => {
    expect(speakingSource).toContain(
      "import {\n  SPEAKING_EVIDENCE_SURFACES,\n} from '../lib/speakingEvidenceLayer'",
    );
    expect(speakingSource).toContain('data-speaking-evidence-layer');
    expect(speakingSource).toContain('What you can verify — and what each source does not prove');
    expect(speakingSource).toContain('SPEAKING_EVIDENCE_SURFACES.map');
    expect(speakingSource).toContain('data-speaking-evidence-kind={item.kind}');
    expect(speakingSource).toContain('Does not prove:');
    expect(speakingSource).toContain('No single source is treated as proof of a guaranteed result for every child.');
  });

  it('adds bounded evidence-source structured data without review or rating schema', () => {
    expect(speakingSource).toContain("name: 'Tiny Steps Speaking evidence sources'");
    expect(speakingSource).toContain("`${canonicalUrl}#evidence-sources`");
    expect(speakingSource).toContain('numberOfItems: SPEAKING_EVIDENCE_SURFACES.length');
    expect(speakingSource).toContain('Evidence boundary: ${item.doesNotProve[0]}.');
    expect(speakingSource).toContain('speakingEvidenceSchema');
    expect(speakingSource).not.toContain("'@type': 'Review'");
    expect(speakingSource).not.toContain("'@type': 'AggregateRating'");
  });

  it('creates no new public route and keeps /speaking as the commercial owner', () => {
    expect(routesSource).not.toContain("path: 'speaking-evidence'");
    expect(routeManifestSource).not.toContain("route('/speaking-evidence'");
    expect(routeManifestSource).not.toContain("route('/speaking-proof'");
  });

  it('tracks evidence-source changes in the existing /speaking sitemap freshness contract', () => {
    expect(sitemapGeneratorSource).toContain(
      "const speakingEvidenceLayerTs = path.join(root, 'src', 'lib', 'speakingEvidenceLayer.ts')",
    );
    expect(sitemapGeneratorSource).toContain(
      "'/speaking': [appRoutesTs, speakingPageTsx, speakingEvidenceLayerTs]",
    );
  });
});
