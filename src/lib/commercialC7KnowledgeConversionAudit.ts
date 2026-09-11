import { B7_BLOG_AUTHORITY_PLANS } from '../content/blog/shared/authorityLinking';
import { CANONICAL_TOPIC_OWNERSHIP } from './canonicalTopicOwnershipRegistry.js';
import {
  KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS,
  KNOWLEDGE_BASE_FINAL_STATUS,
} from './knowledgeBaseFinalClosure.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from './phonicsPublicationRegistry.js';
import {
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_STATUS,
} from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY, COMMERCIAL_C5_STATUS } from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_STATUS } from './commercialC6ValidationFreeze';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);
const unique = (values: readonly string[]) => Array.from(new Set(values.filter(Boolean)));

export const COMMERCIAL_C7_R0_REVISION = '2026-09-11-c7-r0';
export const COMMERCIAL_C7_R0_STATUS = 'knowledge-conversion-audit-complete';

export type CommercialC7KnowledgeSurfaceKind =
  | 'canonical-knowledge-owner'
  | 'blog-authority-plan'
  | 'published-phonics-knowledge'
  | 'subject-hub-source';

export type CommercialC7KnowledgeCoverage =
  | 'DIRECT_CONVERSION'
  | 'COMMERCIAL_HANDOFF'
  | 'INDIRECT_ONLY'
  | 'NO_KNOWN_HANDOFF';

export type CommercialC7KnowledgeSurface = {
  path: string;
  sourceKinds: readonly CommercialC7KnowledgeSurfaceKind[];
  subjects: readonly string[];
  intents: readonly string[];
  evidenceIds: readonly string[];
  currentTargets: readonly string[];
  commercialTargets: readonly string[];
  directAssessment: boolean;
  coverage: CommercialC7KnowledgeCoverage;
};

type MutableSurface = {
  path: string;
  sourceKinds: CommercialC7KnowledgeSurfaceKind[];
  subjects: string[];
  intents: string[];
  evidenceIds: string[];
  currentTargets: string[];
};

const frozenCommercialOwnerPaths = unique(
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath),
);
const commercialOwnerSet = new Set(frozenCommercialOwnerPaths);
const knowledgeIntentSet = new Set([
  'informational',
  'problem-aware',
  'progress-aware',
  'practice',
]);

const surfaces = new Map<string, MutableSurface>();

function upsertSurface(input: {
  path: string;
  sourceKind: CommercialC7KnowledgeSurfaceKind;
  subjects?: readonly string[];
  intents?: readonly string[];
  evidenceIds?: readonly string[];
  currentTargets?: readonly string[];
}) {
  const existing = surfaces.get(input.path) ?? {
    path: input.path,
    sourceKinds: [],
    subjects: [],
    intents: [],
    evidenceIds: [],
    currentTargets: [],
  };

  existing.sourceKinds = unique([...existing.sourceKinds, input.sourceKind]) as CommercialC7KnowledgeSurfaceKind[];
  existing.subjects = unique([...existing.subjects, ...(input.subjects ?? [])]);
  existing.intents = unique([...existing.intents, ...(input.intents ?? [])]);
  existing.evidenceIds = unique([...existing.evidenceIds, ...(input.evidenceIds ?? [])]);
  existing.currentTargets = unique([...existing.currentTargets, ...(input.currentTargets ?? [])]);
  surfaces.set(input.path, existing);
}

for (const topic of CANONICAL_TOPIC_OWNERSHIP) {
  if (!knowledgeIntentSet.has(topic.intent)) continue;
  if (commercialOwnerSet.has(topic.ownerPath)) continue;

  upsertSurface({
    path: topic.ownerPath,
    sourceKind: 'canonical-knowledge-owner',
    subjects: [topic.subject],
    intents: [topic.intent],
    evidenceIds: [`canonical:${topic.id}`],
    currentTargets: topic.supportingPaths,
  });
}

for (const plan of B7_BLOG_AUTHORITY_PLANS) {
  upsertSurface({
    path: `/blog/${plan.slug}`,
    sourceKind: 'blog-authority-plan',
    subjects: ['editorial-blog'],
    intents: [plan.intent],
    evidenceIds: [`blog-b7:${plan.number}`],
    currentTargets: [plan.primary.to, plan.secondary?.to ?? ''],
  });
}

for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
  upsertSurface({
    path: page.path,
    sourceKind: 'published-phonics-knowledge',
    subjects: ['phonics-reading'],
    intents: ['focused-knowledge'],
    evidenceIds: [`phonics-topic:${page.topicId}`, `phonics-concept:${page.conceptId}`],
    currentTargets: [...page.concept.supportingPaths, '/resources/phonics'],
  });
}

const subjectHubHandoffs = [
  { path: '/resources/phonics', subject: 'phonics-reading', programme: '/phonics' },
  { path: '/resources/grammar', subject: 'grammar-writing', programme: '/grammar' },
  { path: '/resources/speaking', subject: 'speaking-communication', programme: '/speaking' },
] as const;

for (const hub of subjectHubHandoffs) {
  upsertSurface({
    path: hub.path,
    sourceKind: 'subject-hub-source',
    subjects: [hub.subject],
    intents: ['informational'],
    evidenceIds: [`subject-hub:${hub.path}`],
    currentTargets: [hub.programme, '/book-demo'],
  });
}

function coverageFor(targets: readonly string[]): CommercialC7KnowledgeCoverage {
  if (targets.includes('/book-demo')) return 'DIRECT_CONVERSION';
  if (targets.some((target) => commercialOwnerSet.has(target))) return 'COMMERCIAL_HANDOFF';
  if (targets.length > 0) return 'INDIRECT_ONLY';
  return 'NO_KNOWN_HANDOFF';
}

export const COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES = freezeList<Readonly<CommercialC7KnowledgeSurface>>(
  Array.from(surfaces.values())
    .map((surface) => {
      const currentTargets = unique(surface.currentTargets);
      const commercialTargets = currentTargets.filter((target) => commercialOwnerSet.has(target));
      return freeze({
        path: surface.path,
        sourceKinds: freezeList(surface.sourceKinds),
        subjects: freezeList(surface.subjects),
        intents: freezeList(surface.intents),
        evidenceIds: freezeList(surface.evidenceIds),
        currentTargets: freezeList(currentTargets),
        commercialTargets: freezeList(commercialTargets),
        directAssessment: currentTargets.includes('/book-demo'),
        coverage: coverageFor(currentTargets),
      });
    })
    .sort((a, b) => a.path.localeCompare(b.path)),
);

const surfaceByPath = new Map(COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.map((surface) => [surface.path, surface]));
const blogSurfaceBySlug = new Map(
  B7_BLOG_AUTHORITY_PLANS.map((plan) => [plan.slug, surfaceByPath.get(`/blog/${plan.slug}`)]),
);

export const COMMERCIAL_C7_R0_PRIORITY_FINDINGS = freezeList([
  freeze({
    id: 'buyer-guide-broad-english-handoff',
    severity: 'HIGH' as const,
    path: '/blog/online-english-classes-for-kids-india',
    finding:
      'The existing buyer-guide authority plan currently hands off to /courses and /class-samples, not to the frozen broad-English commercial owner or /book-demo.',
    nextStep:
      'C7-R1 should decide whether the primary commercial handoff becomes /online-english-classes-for-kids while retaining class samples as supporting evidence.',
    liveChangeAuthorized: false,
  }),
  freeze({
    id: 'practice-and-parent-routine-soft-handoffs',
    severity: 'REVIEW' as const,
    path: null,
    finding:
      'Some practice and parent-routine pages intentionally hand off only to resource, parent-help or free-practice destinations. These are not automatically conversion defects.',
    nextStep:
      'C7-R1/R2 should preserve low-pressure discovery where intent is early, and add a commercial route only when the next parent decision is genuinely programme-related.',
    liveChangeAuthorized: false,
  }),
  freeze({
    id: 'published-phonics-resource-variance',
    severity: 'REVIEW' as const,
    path: '/resources/phonics/*',
    finding:
      'Published phonics knowledge pages inherit concept supporting paths, so commercial handoff depth varies by concept rather than following one generic CTA rule.',
    nextStep:
      'C7-R1 should map each concept family to the correct next decision and avoid forcing every focused phonics guide directly to assessment.',
    liveChangeAuthorized: false,
  }),
  freeze({
    id: 'subject-hubs-already-conversion-ready',
    severity: 'KEEP' as const,
    path: '/resources/{phonics|grammar|speaking}',
    finding:
      'All three frozen subject hubs already expose both the relevant programme route and /book-demo, so C7 should protect rather than rewrite this layer.',
    nextStep: 'Treat the subject hubs as validated bridge surfaces and focus later implementation on weaker downstream knowledge pages.',
    liveChangeAuthorized: false,
  }),
]);

export const COMMERCIAL_C7_R0_SUMMARY = freeze({
  auditedSurfaceCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.length,
  canonicalKnowledgeOwnerCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.filter((surface) =>
    surface.sourceKinds.includes('canonical-knowledge-owner'),
  ).length,
  blogAuthorityPlanCount: B7_BLOG_AUTHORITY_PLANS.length,
  publishedPhonicsKnowledgePageCount: PHONICS_PUBLISHED_RESOURCE_PAGES.length,
  subjectHubCount: subjectHubHandoffs.length,
  frozenCommercialOwnerCount: frozenCommercialOwnerPaths.length,
  directConversionSurfaceCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.filter((surface) => surface.coverage === 'DIRECT_CONVERSION').length,
  commercialHandoffSurfaceCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.filter((surface) => surface.coverage === 'COMMERCIAL_HANDOFF').length,
  indirectOnlySurfaceCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.filter((surface) => surface.coverage === 'INDIRECT_ONLY').length,
  noKnownHandoffSurfaceCount: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.filter((surface) => surface.coverage === 'NO_KNOWN_HANDOFF').length,
});

export const COMMERCIAL_C7_R0_POLICY = freeze({
  auditOnly: true,
  knowledgeBaseRemainsFrozen: true,
  newKnowledgeUrlsAllowed: false,
  newCommercialUrlsAllowed: false,
  liveKnowledgeCopyChangesAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  singleConversionOwner: '/book-demo' as const,
  rule:
    'C7-R0 inventories current knowledge-to-commercial paths only. C7-R1 must assign the correct frozen commercial owner before C7-R2/R3 may authorise any contextual handoff changes.',
});

export function getCommercialC7R0Surface(path: string) {
  return surfaceByPath.get(path) ?? null;
}

export function getCommercialC7R0BlogSurface(slug: string) {
  return blogSurfaceBySlug.get(slug) ?? null;
}

export function getCommercialC7R0Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_R0_REVISION,
    status: COMMERCIAL_C7_R0_STATUS,
    surfaces: COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES,
    findings: COMMERCIAL_C7_R0_PRIORITY_FINDINGS,
    summary: COMMERCIAL_C7_R0_SUMMARY,
    policy: COMMERCIAL_C7_R0_POLICY,
  });
}

if (KNOWLEDGE_BASE_FINAL_STATUS !== 'frozen') throw new Error('C7-R0 requires the frozen cross-knowledge-base baseline.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C7-R0 requires frozen C2 commercial ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C7-R0 must preserve active C4 controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C7-R0 requires the C5 commercial decision flow.');
if (COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C7-R0 requires /book-demo as the single conversion owner.');
if (COMMERCIAL_C6_STATUS !== 'frozen') throw new Error('C7-R0 starts only after C6 is frozen.');
if (frozenCommercialOwnerPaths.length !== 14) throw new Error('C7-R0 requires the frozen 14-owner commercial architecture.');
if (B7_BLOG_AUTHORITY_PLANS.length !== 51) throw new Error('C7-R0 expects the frozen 51-post blog authority plan baseline.');
if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) throw new Error('C7-R0 expects the frozen 31-page phonics publication baseline.');
if (KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.length !== 3 || subjectHubHandoffs.length !== 3) throw new Error('C7-R0 requires the three frozen subject knowledge hubs.');
if (COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.some((surface) => surface.commercialTargets.some((target) => !commercialOwnerSet.has(target)))) {
  throw new Error('C7-R0 detected a commercial handoff outside the frozen C2 owner set.');
}
for (const hub of subjectHubHandoffs) {
  const surface = surfaceByPath.get(hub.path);
  if (!surface?.currentTargets.includes(hub.programme) || !surface.currentTargets.includes('/book-demo')) {
    throw new Error(`C7-R0 requires programme + assessment handoffs on ${hub.path}.`);
  }
}
