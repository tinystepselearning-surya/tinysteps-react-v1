import {
  COMMERCIAL_C8_CLAIM_SAFETY,
  COMMERCIAL_C8_STATUS,
  COMMERCIAL_C8_TRUST_SURFACES,
} from './commercialC8TrustEvidenceDifferentiation';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
} from './speakingProgressFramework';

export const SPEAKING_EVIDENCE_LAYER_REVISION = '2026-09-19-b9-v1';

export type SpeakingEvidenceKind =
  | 'observable-classroom'
  | 'programme-delivery'
  | 'progress-method'
  | 'academic-ownership'
  | 'programme-architecture'
  | 'parent-feedback';

export type SpeakingEvidenceSurface = {
  readonly id: string;
  readonly kind: SpeakingEvidenceKind;
  readonly title: string;
  readonly path: string;
  readonly sourcePath: string;
  readonly sourceLabel: string;
  readonly supports: readonly string[];
  readonly doesNotProve: readonly string[];
  readonly summary: string;
};

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

const evidence = (config: SpeakingEvidenceSurface): Readonly<SpeakingEvidenceSurface> =>
  freeze({
    ...config,
    supports: freezeList(config.supports),
    doesNotProve: freezeList(config.doesNotProve),
  });

export const SPEAKING_EVIDENCE_SURFACES: readonly Readonly<SpeakingEvidenceSurface>[] = freezeList([
  evidence({
    id: 'observable-classroom',
    kind: 'observable-classroom',
    title: 'See the teaching approach in class samples',
    path: '/class-samples',
    sourcePath: '/class-samples',
    sourceLabel: 'Class samples',
    summary:
      'Parents can inspect how live teacher-guided classes are structured, how children participate, and how teachers prompt, correct and invite another attempt.',
    supports: [
      'live teacher-guided class structure',
      'child participation',
      'guided correction and retry',
      'observable teaching approach before purchase',
    ],
    doesNotProve: [
      'that every class will look identical',
      'that every child will achieve the same result',
      'that a specific speaking sample is always available',
    ],
  }),
  evidence({
    id: 'programme-delivery',
    kind: 'programme-delivery',
    title: 'See how speaking support is delivered',
    path: '/speaking#teacher-delivery',
    sourcePath: '/speaking',
    sourceLabel: 'Speaking programme delivery',
    summary:
      'The Speaking programme documents a model → prompt → attempt → feedback → retry pattern, with support reduced as the child becomes more independent.',
    supports: [
      'teacher-guided speaking practice',
      'responsive prompting and feedback',
      'gradual reduction of support',
      'observable delivery criteria such as idea organisation and prompting need',
    ],
    doesNotProve: [
      'a fixed improvement timeline',
      'that one teaching routine fits every child',
      'a guaranteed confidence or fluency outcome',
    ],
  }),
  evidence({
    id: 'progress-method',
    kind: 'progress-method',
    title: 'Inspect the speaking progress method',
    path: SPEAKING_PROGRESS_FRAMEWORK_PATH,
    sourcePath: SPEAKING_PROGRESS_FRAMEWORK_PATH,
    sourceLabel: 'Speaking Progress Framework',
    summary:
      `Progress is described across ${SPEAKING_PROGRESS_DIMENSIONS.length} observable dimensions and ${SPEAKING_PROGRESS_OBSERVATION_BANDS.length} support/independence bands, with fresh-task transfer used as stronger evidence than memorised performance alone.`,
    supports: [
      'observable speaking dimensions',
      'support-to-independence progression',
      'fresh-task transfer evidence',
      'same-child comparison over time',
    ],
    doesNotProve: [
      'a developmental-age score',
      'an IQ-style result or diagnosis',
      'a single universal percentage for speaking ability',
    ],
  }),
  evidence({
    id: 'academic-ownership',
    kind: 'academic-ownership',
    title: 'Review who owns the academic system',
    path: '/team',
    sourcePath: '/team',
    sourceLabel: 'Academic team',
    summary:
      'The team surface documents founder-led academic direction, curriculum design, teacher guidance and a classroom process built around observation, correction, retry and reduced support.',
    supports: [
      'named academic ownership',
      'documented curriculum-design responsibility',
      'teacher-guidance process',
      'observation-informed instructional adjustment',
    ],
    doesNotProve: [
      'external accreditation',
      'third-party endorsement',
      'unsupported professional credentials',
    ],
  }),
  evidence({
    id: 'programme-architecture',
    kind: 'programme-architecture',
    title: 'Review the structured learning roadmap',
    path: '/curriculum',
    sourcePath: '/curriculum',
    sourceLabel: 'Curriculum roadmap',
    summary:
      'The curriculum surface shows how Tiny Steps organises English learning into structured pathways while allowing prerequisite-aware pacing instead of one rigid age-only sequence.',
    supports: [
      'structured programme progression',
      'prerequisite-aware teaching',
      'connection between speaking, grammar, reading and language skills',
    ],
    doesNotProve: [
      'that every child follows the same sequence',
      'that age alone determines placement',
      'a guaranteed completion timeline',
    ],
  }),
  evidence({
    id: 'parent-feedback',
    kind: 'parent-feedback',
    title: 'Read bounded first-party parent feedback',
    path: '/testimonials',
    sourcePath: '/testimonials',
    sourceLabel: 'Parent feedback',
    summary:
      'Tiny Steps publishes curated first-party parent feedback as individual family experience. It is a decision signal alongside class samples, curriculum and the child’s own assessment—not universal outcome proof.',
    supports: [
      'reported parent experience',
      'themes families noticed in teaching and participation',
      'decision context alongside other evidence',
    ],
    doesNotProve: [
      'that the same outcome will occur for another child',
      'an independently verified clinical or academic effect',
      'an aggregate satisfaction percentage',
    ],
  }),
]);

export const SPEAKING_EVIDENCE_REQUIRED_C8_PATHS = freezeList([
  '/class-samples',
  '/speaking',
  '/team',
  '/curriculum',
  '/testimonials',
]);

export const SPEAKING_EVIDENCE_CLAIM_BOUNDARIES = freeze({
  aggregateRatingsRequireApprovedTestimonials:
    SEMANTIC_FACTS.proofPolicy.aggregateRatingsRequireApprovedTestimonials,
  generatedFallbackTestimonialsAllowed:
    SEMANTIC_FACTS.proofPolicy.generatedFallbackTestimonialsAllowed,
  unsupportedSatisfactionPercentagesAllowed:
    SEMANTIC_FACTS.proofPolicy.unsupportedSatisfactionPercentagesAllowed,
  universalGuaranteedTimelineAllowed:
    SEMANTIC_FACTS.outcomePolicy.universalGuaranteedTimelineAllowed,
  progressEvidenceStandard: SEMANTIC_FACTS.outcomePolicy.evidenceStandard,
  parentFeedbackRepresentsUniversalOutcome:
    COMMERCIAL_C8_CLAIM_SAFETY.parentFeedbackRepresentsUniversalOutcome,
  fabricatedReviewClaimsAllowed:
    COMMERCIAL_C8_CLAIM_SAFETY.fabricatedReviewClaimsAllowed,
});

if (COMMERCIAL_C8_STATUS !== 'frozen') {
  throw new Error('Brick 9 requires the frozen Commercial C8 evidence governance layer.');
}

for (const path of SPEAKING_EVIDENCE_REQUIRED_C8_PATHS) {
  if (!COMMERCIAL_C8_TRUST_SURFACES.some((surface) => surface.path === path)) {
    throw new Error(`Brick 9 evidence source is not part of the frozen C8 trust system: ${path}.`);
  }
}

if (
  SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.generatedFallbackTestimonialsAllowed
  || SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.unsupportedSatisfactionPercentagesAllowed
  || SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.universalGuaranteedTimelineAllowed
  || SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.parentFeedbackRepresentsUniversalOutcome
  || SPEAKING_EVIDENCE_CLAIM_BOUNDARIES.fabricatedReviewClaimsAllowed
) {
  throw new Error('Brick 9 claim-safety boundaries must remain restrictive.');
}

if (new Set(SPEAKING_EVIDENCE_SURFACES.map((item) => item.id)).size !== SPEAKING_EVIDENCE_SURFACES.length) {
  throw new Error('Brick 9 evidence IDs must be unique.');
}

if (SPEAKING_EVIDENCE_SURFACES.some((item) => !item.supports.length || !item.doesNotProve.length)) {
  throw new Error('Every Brick 9 evidence surface must state both support and proof boundaries.');
}
