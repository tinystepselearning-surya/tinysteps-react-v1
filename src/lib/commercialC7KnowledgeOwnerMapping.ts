import { B7_BLOG_AUTHORITY_PLANS } from '../content/blog/shared/authorityLinking';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS, COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY, COMMERCIAL_C5_STATUS } from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_STATUS } from './commercialC6ValidationFreeze';
import {
  COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES,
  COMMERCIAL_C7_R0_STATUS,
  type CommercialC7KnowledgeSurface,
} from './commercialC7KnowledgeConversionAudit';
import { KNOWLEDGE_BASE_FINAL_STATUS } from './knowledgeBaseFinalClosure.js';
import { SP6_CANONICAL_TOPIC_OWNERSHIP } from './speakingCommunicationCompletionCanonicalOwnership.js';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);
const unique = (values: readonly string[]) => Array.from(new Set(values.filter(Boolean)));
const normalize = (value: string) => value.trim().toLowerCase();

export const COMMERCIAL_C7_R1_REVISION = '2026-09-11-c7-r1';
export const COMMERCIAL_C7_R1_STATUS = 'knowledge-owner-mapping-validated';

export type CommercialC7R1Decision =
  | 'KEEP_EXISTING_OWNER'
  | 'ADD_CONTEXTUAL_HANDOFF'
  | 'PRESERVE_ASSESSMENT_FIRST'
  | 'HOLD_SOFT_DISCOVERY';

export type CommercialC7R1OwnerFamily =
  | 'phonics-programme'
  | 'phonics-comparison'
  | 'phonics-fees'
  | 'reading-programme'
  | 'reading-fluency'
  | 'grammar-programme'
  | 'writing-programme'
  | 'spoken-english'
  | 'public-speaking'
  | 'confidence-building'
  | 'broad-english'
  | 'general-pricing'
  | 'assessment-first'
  | 'soft-discovery';

export type CommercialC7R1OwnerMapping = {
  path: string;
  subjects: readonly string[];
  intents: readonly string[];
  evidenceIds: readonly string[];
  currentTargets: readonly string[];
  primaryCommercialOwner: string | null;
  ownerFamily: CommercialC7R1OwnerFamily;
  decision: CommercialC7R1Decision;
  rationale: string;
  currentOwnerAlreadyLinked: boolean;
};

type MappingInput = Pick<
  CommercialC7KnowledgeSurface,
  'path' | 'subjects' | 'intents' | 'evidenceIds' | 'currentTargets' | 'commercialTargets' | 'directAssessment'
>;

const frozenCommercialOwnerPaths = unique(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath));
const commercialOwnerSet = new Set(frozenCommercialOwnerPaths);
const finalKnowledgeIntentSet = new Set(['informational', 'problem-aware', 'progress-aware', 'practice']);
const blogPlanByPath = new Map(B7_BLOG_AUTHORITY_PLANS.map((plan) => [`/blog/${plan.slug}`, plan]));

const finalKnowledgeInputs = new Map<string, MappingInput>();
for (const surface of COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES) {
  finalKnowledgeInputs.set(surface.path, surface);
}

for (const topic of SP6_CANONICAL_TOPIC_OWNERSHIP) {
  if (!finalKnowledgeIntentSet.has(String(topic.intent))) continue;
  if (commercialOwnerSet.has(String(topic.ownerPath))) continue;

  const path = String(topic.ownerPath);
  const existing = finalKnowledgeInputs.get(path);
  const supportingPaths = Array.isArray(topic.supportingPaths) ? topic.supportingPaths.map(String) : [];
  const currentTargets = unique([...(existing?.currentTargets ?? []), ...supportingPaths]);
  const commercialTargets = currentTargets.filter((target) => commercialOwnerSet.has(target));

  finalKnowledgeInputs.set(path, {
    path,
    subjects: unique([...(existing?.subjects ?? []), String(topic.subject || '')]),
    intents: unique([...(existing?.intents ?? []), String(topic.intent || '')]),
    evidenceIds: unique([...(existing?.evidenceIds ?? []), `sp6:${String(topic.id)}`]),
    currentTargets,
    commercialTargets,
    directAssessment: currentTargets.includes('/book-demo'),
  });
}

const explicitOwnerByPath = new Map<string, { owner: string; family: CommercialC7R1OwnerFamily; rationale: string }>([
  [
    '/blog/online-english-classes-for-kids-india',
    {
      owner: '/online-english-classes-for-kids',
      family: 'broad-english',
      rationale: 'Buyer-guide intent belongs to the frozen broad-English programme chooser; /courses and /class-samples remain supporting evidence, not the commercial owner.',
    },
  ],
  [
    '/blog/how-to-improve-reading-fluency-in-children',
    {
      owner: '/reading-fluency-program',
      family: 'reading-fluency',
      rationale: 'Explicit fluency problem intent maps to the frozen specialist reading-fluency programme rather than generic reading classes.',
    },
  ],
  [
    '/slow-reader-child-help',
    {
      owner: '/reading-fluency-program',
      family: 'reading-fluency',
      rationale: 'The slow-reader problem route is the clearest knowledge bridge into the specialist fluency programme.',
    },
  ],
  [
    '/shy-child-speaking-confidence',
    {
      owner: '/confidence-building-program-kids',
      family: 'confidence-building',
      rationale: 'Explicit shyness/confidence intent maps to the frozen confidence-building specialist owner.',
    },
  ],
  [
    '/blog/child-understands-english-but-does-not-speak',
    {
      owner: '/spoken-english-classes-for-kids-online',
      family: 'spoken-english',
      rationale: 'Independent spoken-output difficulty maps to the frozen spoken-English owner, not the public-speaking owner.',
    },
  ],
  [
    '/blog/how-to-teach-paragraph-writing-to-kids',
    {
      owner: '/writing-classes-for-kids',
      family: 'writing-programme',
      rationale: 'Paragraph composition is writing-specific and maps to the frozen writing programme owner.',
    },
  ],
]);

function textFor(input: MappingInput) {
  return normalize([input.path, ...input.subjects, ...input.intents, ...input.evidenceIds].join(' '));
}

function currentPrimaryOwner(input: MappingInput) {
  const plan = blogPlanByPath.get(input.path);
  if (plan && commercialOwnerSet.has(plan.primary.to)) return plan.primary.to;
  if (plan?.secondary && commercialOwnerSet.has(plan.secondary.to) && plan.secondary.to !== '/book-demo') return plan.secondary.to;
  return input.commercialTargets.find((target) => target !== '/book-demo') ?? null;
}

function ownerFamilyFor(owner: string): CommercialC7R1OwnerFamily {
  if (owner === '/phonics') return 'phonics-programme';
  if (owner === '/best-online-phonics-classes-for-kids-in-india') return 'phonics-comparison';
  if (owner === '/phonics-fees-india') return 'phonics-fees';
  if (owner === '/reading-classes-for-kids') return 'reading-programme';
  if (owner === '/reading-fluency-program') return 'reading-fluency';
  if (owner === '/grammar') return 'grammar-programme';
  if (owner === '/writing-classes-for-kids') return 'writing-programme';
  if (owner === '/spoken-english-classes-for-kids-online') return 'spoken-english';
  if (owner === '/speaking') return 'public-speaking';
  if (owner === '/confidence-building-program-kids') return 'confidence-building';
  if (owner === '/online-english-classes-for-kids') return 'broad-english';
  if (owner === '/pricing') return 'general-pricing';
  return 'assessment-first';
}

function inferOwner(input: MappingInput): { owner: string | null; family: CommercialC7R1OwnerFamily; rationale: string } {
  const explicit = explicitOwnerByPath.get(input.path);
  if (explicit) return explicit;

  const text = textFor(input);
  const current = currentPrimaryOwner(input);
  if (current) {
    return {
      owner: current,
      family: ownerFamilyFor(current),
      rationale: 'The current knowledge handoff already points to a frozen C2 commercial owner, so R1 preserves that ownership.',
    };
  }

  if (input.directAssessment) {
    return {
      owner: '/book-demo',
      family: 'assessment-first',
      rationale: 'The current journey already uses assessment first because the underlying programme need is unresolved.',
    };
  }

  if (input.intents.includes('practice') && input.commercialTargets.length === 0) {
    return {
      owner: null,
      family: 'soft-discovery',
      rationale: 'Pure practice intent stays low-pressure until the parent signals a programme decision; R1 does not force a commercial CTA.',
    };
  }
  if (text.includes('parent-routine') && input.commercialTargets.length === 0) {
    return {
      owner: null,
      family: 'soft-discovery',
      rationale: 'Home-routine intent stays in parent-help/practice discovery unless a programme need becomes explicit.',
    };
  }

  if (text.includes('phonics-comparison')) {
    return {
      owner: '/best-online-phonics-classes-for-kids-in-india',
      family: 'phonics-comparison',
      rationale: 'Phonics comparison intent belongs to the one frozen dedicated comparison owner.',
    };
  }
  if (text.includes('phonics') || input.subjects.includes('phonics-reading') || input.intents.includes('focused-knowledge')) {
    if (text.includes('fluency')) {
      return {
        owner: '/reading-fluency-program',
        family: 'reading-fluency',
        rationale: 'Explicit reading-fluency intent maps to the frozen specialist fluency owner.',
      };
    }
    if (text.includes('comprehension') || text.includes('reading-programme') || text.includes('reading classes')) {
      return {
        owner: '/reading-classes-for-kids',
        family: 'reading-programme',
        rationale: 'Broad reading/comprehension intent maps to the frozen reading programme owner.',
      };
    }
    return {
      owner: '/phonics',
      family: 'phonics-programme',
      rationale: 'Phonics/decoding knowledge maps to the frozen phonics programme owner while assessment remains optional, not forced.',
    };
  }

  if (input.subjects.includes('grammar-writing') || text.includes('grammar')) {
    if (text.includes('writing') || text.includes('paragraph') || text.includes('composition')) {
      return {
        owner: '/writing-classes-for-kids',
        family: 'writing-programme',
        rationale: 'Writing/composition knowledge maps to the frozen writing programme owner.',
      };
    }
    return {
      owner: '/grammar',
      family: 'grammar-programme',
      rationale: 'Grammar/sentence knowledge maps to the frozen grammar programme owner.',
    };
  }

  if (input.subjects.includes('speaking-communication') || text.includes('speaking') || text.includes('communication')) {
    if (text.includes('confidence') || text.includes('shy') || text.includes('reluctant')) {
      return {
        owner: '/confidence-building-program-kids',
        family: 'confidence-building',
        rationale: 'Explicit confidence/shyness knowledge maps to the frozen confidence-building specialist owner.',
      };
    }
    if (text.includes('spoken') || text.includes('conversation') || text.includes('one-word') || text.includes('does-not-speak')) {
      return {
        owner: '/spoken-english-classes-for-kids-online',
        family: 'spoken-english',
        rationale: 'Everyday spoken-output/conversation intent maps to the frozen spoken-English owner.',
      };
    }
    return {
      owner: '/speaking',
      family: 'public-speaking',
      rationale: 'Structured speaking/communication intent maps to the frozen public-speaking programme owner.',
    };
  }

  if (input.subjects.includes('general-english') || text.includes('cross-skill') || text.includes('buyer-guide')) {
    return {
      owner: '/online-english-classes-for-kids',
      family: 'broad-english',
      rationale: 'Broad or cross-skill English knowledge maps to the frozen programme chooser unless the existing path is already assessment-first.',
    };
  }

  return {
    owner: null,
    family: 'soft-discovery',
    rationale: 'R1 found no evidence-backed commercial owner for this early informational surface, so it remains a discovery-only route.',
  };
}

function decisionFor(input: MappingInput, owner: string | null): CommercialC7R1Decision {
  if (!owner) return 'HOLD_SOFT_DISCOVERY';
  if (owner === '/book-demo' && input.directAssessment) return 'PRESERVE_ASSESSMENT_FIRST';
  if (input.currentTargets.includes(owner)) return 'KEEP_EXISTING_OWNER';
  return 'ADD_CONTEXTUAL_HANDOFF';
}

export const COMMERCIAL_C7_R1_OWNER_MAPPINGS = freezeList<Readonly<CommercialC7R1OwnerMapping>>(
  Array.from(finalKnowledgeInputs.values())
    .map((input) => {
      const resolved = inferOwner(input);
      const decision = decisionFor(input, resolved.owner);
      return freeze({
        path: input.path,
        subjects: freezeList(input.subjects),
        intents: freezeList(input.intents),
        evidenceIds: freezeList(input.evidenceIds),
        currentTargets: freezeList(input.currentTargets),
        primaryCommercialOwner: resolved.owner,
        ownerFamily: resolved.family,
        decision,
        rationale: resolved.rationale,
        currentOwnerAlreadyLinked: Boolean(resolved.owner && input.currentTargets.includes(resolved.owner)),
      });
    })
    .sort((a, b) => a.path.localeCompare(b.path)),
);

const mappingByPath = new Map(COMMERCIAL_C7_R1_OWNER_MAPPINGS.map((mapping) => [mapping.path, mapping]));

export const COMMERCIAL_C7_R1_POLICY = freeze({
  architectureOnly: true,
  knowledgeBaseRemainsFrozen: true,
  liveKnowledgeCopyChangesAllowed: false,
  newKnowledgeUrlsAllowed: false,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  singleConversionOwner: '/book-demo' as const,
  onePrimaryCommercialOwnerPerMappedSurface: true,
  softDiscoveryMayRemainUnmapped: true,
  implementationRequiresLaterBrick: true,
  rule:
    'C7-R1 assigns at most one frozen commercial owner to each commercially relevant knowledge surface. Pure practice/home-routine discovery may remain unforced. No live contextual handoff is implemented until a later C7 brick validates placement and copy.',
});

export const COMMERCIAL_C7_R1_SUMMARY = freeze({
  mappedSurfaceCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.length,
  commerciallyMappedSurfaceCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => Boolean(mapping.primaryCommercialOwner)).length,
  softDiscoveryHoldCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'HOLD_SOFT_DISCOVERY').length,
  keepExistingCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'KEEP_EXISTING_OWNER').length,
  addContextualHandoffCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'ADD_CONTEXTUAL_HANDOFF').length,
  assessmentFirstCount: COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'PRESERVE_ASSESSMENT_FIRST').length,
  uniqueMappedOwnerCount: new Set(
    COMMERCIAL_C7_R1_OWNER_MAPPINGS.map((mapping) => mapping.primaryCommercialOwner).filter(Boolean),
  ).size,
  frozenCommercialOwnerCount: frozenCommercialOwnerPaths.length,
  finalKnowledgeOwnerRegistryCount: SP6_CANONICAL_TOPIC_OWNERSHIP.length,
});

export function getCommercialC7R1Mapping(path: string) {
  return mappingByPath.get(path) ?? null;
}

export function getCommercialC7R1Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_R1_REVISION,
    status: COMMERCIAL_C7_R1_STATUS,
    mappings: COMMERCIAL_C7_R1_OWNER_MAPPINGS,
    policy: COMMERCIAL_C7_R1_POLICY,
    summary: COMMERCIAL_C7_R1_SUMMARY,
  });
}

if (COMMERCIAL_C7_R0_STATUS !== 'knowledge-conversion-audit-complete') throw new Error('C7-R1 requires completed C7-R0.');
if (KNOWLEDGE_BASE_FINAL_STATUS !== 'frozen') throw new Error('C7-R1 requires the frozen knowledge base.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C7-R1 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C7-R1 must preserve active C4 controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented' || COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C7-R1 requires the frozen C5 conversion owner.');
if (COMMERCIAL_C6_STATUS !== 'frozen') throw new Error('C7-R1 requires frozen C6 architecture.');
if (frozenCommercialOwnerPaths.length !== 14) throw new Error('C7-R1 requires the frozen 14-owner commercial architecture.');
if (COMMERCIAL_C7_R1_OWNER_MAPPINGS.some((mapping) => mapping.primaryCommercialOwner && !commercialOwnerSet.has(mapping.primaryCommercialOwner))) {
  throw new Error('C7-R1 mapped a knowledge surface outside the frozen C2 owner set.');
}
if (COMMERCIAL_C7_R1_OWNER_MAPPINGS.some((mapping) => mapping.decision === 'HOLD_SOFT_DISCOVERY' && mapping.primaryCommercialOwner)) {
  throw new Error('C7-R1 soft-discovery holds must not force a commercial owner.');
}
if (COMMERCIAL_C7_R1_OWNER_MAPPINGS.some((mapping) => mapping.decision !== 'HOLD_SOFT_DISCOVERY' && !mapping.primaryCommercialOwner)) {
  throw new Error('C7-R1 commercially relevant mappings require exactly one primary owner.');
}
const broadEnglishBuyerGuide = mappingByPath.get('/blog/online-english-classes-for-kids-india');
if (broadEnglishBuyerGuide?.primaryCommercialOwner !== '/online-english-classes-for-kids' || broadEnglishBuyerGuide.decision !== 'ADD_CONTEXTUAL_HANDOFF') {
  throw new Error('C7-R1 must map the broad-English buyer guide to /online-english-classes-for-kids without implementing it yet.');
}
