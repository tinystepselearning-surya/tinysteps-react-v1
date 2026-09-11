import { COMMERCIAL_C7_STATUS } from './commercialC7ValidationFreeze';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C8_REVISION = '2026-09-12-c8';
export const COMMERCIAL_C8_STATUS = 'frozen';

export type CommercialC8EvidenceKind =
  | 'entity-identity'
  | 'academic-method'
  | 'observable-teaching'
  | 'parent-proof'
  | 'programme-delivery'
  | 'school-implementation';

export type CommercialC8TrustSurface = {
  path: string;
  evidenceKind: CommercialC8EvidenceKind;
  sourceFiles: readonly string[];
  role: string;
  verifiedSignals: readonly string[];
};

export const COMMERCIAL_C8_TRUST_SURFACES = freezeList<Readonly<CommercialC8TrustSurface>>([
  freeze({
    path: '/team',
    evidenceKind: 'entity-identity',
    sourceFiles: freezeList(['src/pages/TeamPage.tsx', 'src/pages/team/TeamPageSections.tsx']),
    role: 'Primary academic-team and learning-design authority surface.',
    verifiedSignals: freezeList([
      'canonical founder identity',
      'founder-led academic team',
      'child development and learning-science framing',
      'observe-correct-retry-reduce-support teaching process',
    ]),
  }),
  freeze({
    path: '/team/vannala-ravali-priya',
    evidenceKind: 'entity-identity',
    sourceFiles: freezeList(['src/pages/FounderPriyaPage.tsx', 'src/lib/schemas.ts']),
    role: 'Canonical founder profile connected to the Tiny Steps educational organization entity.',
    verifiedSignals: freezeList(['ProfilePage identity', 'Person entity', 'worksFor organization relationship']),
  }),
  freeze({
    path: '/curriculum',
    evidenceKind: 'academic-method',
    sourceFiles: freezeList(['src/pages/CurriculumPage.tsx']),
    role: 'Master learning-roadmap surface explaining progression without forcing one fixed age order.',
    verifiedSignals: freezeList(['complete learning roadmap', 'adaptive prompts and pacing', 'programme-owner routing']),
  }),
  freeze({
    path: '/class-samples',
    evidenceKind: 'observable-teaching',
    sourceFiles: freezeList(['src/pages/ClassSamplesPage.tsx']),
    role: 'Observable teaching evidence so parents can inspect class structure and child participation before deciding.',
    verifiedSignals: freezeList(['live teacher-guided classes', 'child participation', 'guided correction', 'class sample videos']),
  }),
  freeze({
    path: '/testimonials',
    evidenceKind: 'parent-proof',
    sourceFiles: freezeList(['src/pages/TestimonialsPage.tsx', 'src/lib/staticTestimonials.ts']),
    role: 'Curated first-party parent feedback presented as individual experience rather than guaranteed outcome evidence.',
    verifiedSignals: freezeList(['first-party feedback', 'individual family experiences', 'no outcome guarantee', 'decision-context links']),
  }),
  freeze({
    path: '/phonics',
    evidenceKind: 'programme-delivery',
    sourceFiles: freezeList(['src/pages/phonics.tsx', 'src/components/programs/ResponsiveTeachingSection.tsx']),
    role: 'Programme-specific delivery evidence for phonics instruction.',
    verifiedSignals: freezeList(['responsive teaching section', 'sound–spelling accuracy', 'teacher-guided correction']),
  }),
  freeze({
    path: '/grammar',
    evidenceKind: 'programme-delivery',
    sourceFiles: freezeList(['src/pages/grammar.tsx', 'src/components/programs/ResponsiveTeachingSection.tsx']),
    role: 'Programme-specific delivery evidence for grammar instruction.',
    verifiedSignals: freezeList(['responsive teaching section', 'self-correction', 'teacher-guided correction']),
  }),
  freeze({
    path: '/speaking',
    evidenceKind: 'programme-delivery',
    sourceFiles: freezeList(['src/pages/speaking.tsx', 'src/components/programs/ResponsiveTeachingSection.tsx']),
    role: 'Programme-specific delivery evidence for speaking and communication.',
    verifiedSignals: freezeList(['responsive teaching section', 'idea organisation', 'teacher-guided practice']),
  }),
  freeze({
    path: '/for-schools',
    evidenceKind: 'school-implementation',
    sourceFiles: freezeList(['src/pages/ForSchoolsPage.tsx']),
    role: 'School implementation evidence with explicit independent-provider and non-endorsement boundaries.',
    verifiedSignals: freezeList([
      'implementation system',
      'model-guided-practice-observe-correct-retry-reduce-support cycle',
      'public reference citations',
      'no endorsement implication',
    ]),
  }),
]);

export const COMMERCIAL_C8_DIFFERENTIATION_PILLARS = freezeList([
  freeze({
    id: 'observable-before-purchase',
    statement: 'Parents can inspect teaching through class samples before committing.',
    evidencePaths: freezeList(['/class-samples']),
  }),
  freeze({
    id: 'responsive-teacher-led-delivery',
    statement: 'Programme delivery adapts modelling, prompts, correction and support to the learner response.',
    evidencePaths: freezeList(['/team', '/curriculum', '/phonics', '/grammar', '/speaking']),
  }),
  freeze({
    id: 'structured-skill-progression',
    statement: 'Tiny Steps presents a structured roadmap while allowing prerequisite-aware pacing rather than a rigid age-only sequence.',
    evidencePaths: freezeList(['/curriculum', '/team']),
  }),
  freeze({
    id: 'proof-with-boundaries',
    statement: 'Parent feedback is shown as first-party experience and explicitly not as a guarantee of identical results.',
    evidencePaths: freezeList(['/testimonials']),
  }),
  freeze({
    id: 'named-academic-ownership',
    statement: 'The organization, founder and academic-design authority are explicitly connected through dedicated entity surfaces.',
    evidencePaths: freezeList(['/team', '/team/vannala-ravali-priya']),
  }),
]);

export const COMMERCIAL_C8_CLAIM_SAFETY = freeze({
  unsupportedCredentialsAllowed: false,
  unsupportedAffiliationsAllowed: false,
  guaranteedOutcomeClaimsAllowed: false,
  fabricatedReviewClaimsAllowed: false,
  thirdPartyCitationImpliesEndorsement: false,
  parentFeedbackRepresentsUniversalOutcome: false,
});

export const COMMERCIAL_C8_FREEZE_POLICY = freeze({
  frozen: true,
  auditAndGovernanceOnly: true,
  newPublicUrlsAllowed: false,
  liveBodyCopyExpansionRequired: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnershipMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  c7ArchitectureMutationAllowed: false,
  reopenOnlyWithVerifiedEvidenceOrMeasuredTrustGap: true,
  nextProject: 'C9 — External Authority & Brand Search Growth',
});

export function getCommercialC8Snapshot() {
  return freeze({
    revision: COMMERCIAL_C8_REVISION,
    status: COMMERCIAL_C8_STATUS,
    trustSurfaces: COMMERCIAL_C8_TRUST_SURFACES,
    differentiationPillars: COMMERCIAL_C8_DIFFERENTIATION_PILLARS,
    claimSafety: COMMERCIAL_C8_CLAIM_SAFETY,
    freezePolicy: COMMERCIAL_C8_FREEZE_POLICY,
  });
}

if (COMMERCIAL_C7_STATUS !== 'frozen') throw new Error('C8 requires C7 to be frozen first.');
if (COMMERCIAL_C8_TRUST_SURFACES.length < 8) throw new Error('C8 requires broad trust/evidence coverage across the existing site.');
if (COMMERCIAL_C8_DIFFERENTIATION_PILLARS.length < 5) throw new Error('C8 requires explicit evidence-backed differentiation pillars.');
for (const pillar of COMMERCIAL_C8_DIFFERENTIATION_PILLARS) {
  if (!pillar.evidencePaths.length) throw new Error(`C8 differentiation pillar ${pillar.id} requires evidence paths.`);
  for (const evidencePath of pillar.evidencePaths) {
    if (!COMMERCIAL_C8_TRUST_SURFACES.some((surface) => surface.path === evidencePath)) {
      throw new Error(`C8 differentiation pillar ${pillar.id} points outside the verified trust surface set: ${evidencePath}`);
    }
  }
}
