import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C8_CLAIM_SAFETY,
  COMMERCIAL_C8_DIFFERENTIATION_PILLARS,
  COMMERCIAL_C8_FREEZE_POLICY,
  COMMERCIAL_C8_STATUS,
  COMMERCIAL_C8_TRUST_SURFACES,
} from '../../lib/commercialC8TrustEvidenceDifferentiation';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Commercial C8 trust, evidence and differentiation freeze', () => {
  it('freezes an existing on-site evidence system instead of creating another URL layer', () => {
    expect(COMMERCIAL_C8_STATUS).toBe('frozen');
    expect(COMMERCIAL_C8_TRUST_SURFACES.length).toBeGreaterThanOrEqual(8);
    expect(COMMERCIAL_C8_DIFFERENTIATION_PILLARS.length).toBeGreaterThanOrEqual(5);
    expect(COMMERCIAL_C8_FREEZE_POLICY.auditAndGovernanceOnly).toBe(true);
    expect(COMMERCIAL_C8_FREEZE_POLICY.newPublicUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.liveBodyCopyExpansionRequired).toBe(false);
  });

  it('anchors academic identity and method in the existing team and curriculum surfaces', () => {
    const team = read('src/pages/team/TeamPageSections.tsx');
    const curriculum = read('src/pages/CurriculumPage.tsx');
    expect(team).toContain('Built around how children actually learn');
    expect(team).toContain('Child development');
    expect(team).toContain('Learning science');
    expect(team).toContain('Observe the child during class');
    expect(team).toContain('Reduce teacher support gradually');
    expect(curriculum).toContain('The complete Tiny Steps learning roadmap');
    expect(curriculum).toContain('Children do not have to complete every pathway in a fixed age order.');
  });

  it('uses observable class evidence and bounded first-party parent proof', () => {
    const classSamples = read('src/pages/ClassSamplesPage.tsx');
    const testimonials = read('src/pages/TestimonialsPage.tsx');
    expect(classSamples).toContain('Tiny Steps classes are live teacher-guided online classes.');
    expect(classSamples).toContain('Children are encouraged to read, speak, answer, practise, and try again with teacher support.');
    expect(testimonials).toContain('curated set of first-party parent feedback excerpts');
    expect(testimonials).toContain('They describe individual family experiences');
    expect(testimonials).toContain('it is not a promise or guarantee of a particular outcome');
  });

  it('keeps programme differentiation tied to responsive delivery evidence', () => {
    const responsive = read('src/components/programs/ResponsiveTeachingSection.tsx');
    expect(responsive).toContain('How teachers deliver this course');
    for (const [file, signal] of [
      ['src/pages/phonics.tsx', 'sound–spelling accuracy'],
      ['src/pages/grammar.tsx', 'self-corrects'],
      ['src/pages/speaking.tsx', 'idea organisation'],
    ] as const) {
      const page = read(file);
      expect(page).toContain('<ResponsiveTeachingSection');
      expect(page).toContain(signal);
    }
  });

  it('preserves school evidence boundaries and rejects unsupported trust inflation', () => {
    const schools = read('src/pages/ForSchoolsPage.tsx');
    expect(schools).toContain('How academic design becomes classroom practice');
    expect(schools).toContain('Model → guided practice → observe → correct → retry → reduce support');
    expect(schools).toContain('independent education provider');
    expect(schools).toMatch(/does not imply endorsement,[\s\S]*approval,[\s\S]*certification or affiliation/);

    expect(COMMERCIAL_C8_CLAIM_SAFETY.unsupportedCredentialsAllowed).toBe(false);
    expect(COMMERCIAL_C8_CLAIM_SAFETY.unsupportedAffiliationsAllowed).toBe(false);
    expect(COMMERCIAL_C8_CLAIM_SAFETY.guaranteedOutcomeClaimsAllowed).toBe(false);
    expect(COMMERCIAL_C8_CLAIM_SAFETY.fabricatedReviewClaimsAllowed).toBe(false);
    expect(COMMERCIAL_C8_CLAIM_SAFETY.thirdPartyCitationImpliesEndorsement).toBe(false);
    expect(COMMERCIAL_C8_CLAIM_SAFETY.parentFeedbackRepresentsUniversalOutcome).toBe(false);
  });

  it('protects all completed commercial architecture through C7', () => {
    expect(COMMERCIAL_C8_FREEZE_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.c5ConversionOwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.c7ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C8_FREEZE_POLICY.nextProject).toContain('C9');
  });
});
