import {
  SPEAKING_PROGRESS_DIMENSIONS,
  type SpeakingProgressDimensionId,
} from './speakingProgressFramework';
import {
  SPEAKING_COMMUNICATION_FREEZE,
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS,
} from './speakingCommunicationCompletionArchitecture.js';
import {
  SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS,
} from './speakingCommunicationKnowledgeArchitecture.js';

export const SPEAKING_KNOWLEDGE_CLUSTER_REVISION = '2026-09-19-b8-v2';

export type SpeakingKnowledgeClusterLink = {
  readonly ownerIds: readonly string[];
  readonly to: string;
  readonly title: string;
  readonly description: string;
  readonly label: string;
};

export type SpeakingKnowledgeClusterGroup = {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly dimensionIds: readonly SpeakingProgressDimensionId[];
  readonly dimensionLabels: readonly string[];
  readonly links: readonly SpeakingKnowledgeClusterLink[];
};

const freezeRecord = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

const tier1ById = new Map(
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.map((item) => [item.id, item] as const),
);
const dimensionById = new Map(
  SPEAKING_PROGRESS_DIMENSIONS.map((item) => [item.id, item] as const),
);

function link(
  ownerIds: readonly string[],
  title: string,
  description: string,
  label: string,
): SpeakingKnowledgeClusterLink {
  const owners = ownerIds.map((ownerId) => {
    const owner = tier1ById.get(ownerId);
    if (!owner) throw new Error(`Brick 8 references an unknown Tier-1 speaking owner: ${ownerId}.`);
    return owner;
  });
  const ownerPaths = new Set(owners.map((owner) => owner.ownerPath));
  if (ownerPaths.size !== 1) {
    throw new Error(`Brick 8 grouped owner IDs must resolve to one established path: ${ownerIds.join(', ')}.`);
  }
  return freezeRecord({
    ownerIds: freezeList(ownerIds),
    to: owners[0].ownerPath,
    title,
    description,
    label,
  });
}

function group(config: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  dimensionIds: readonly SpeakingProgressDimensionId[];
  links: readonly SpeakingKnowledgeClusterLink[];
}): SpeakingKnowledgeClusterGroup {
  const dimensions = config.dimensionIds.map((dimensionId) => {
    const dimension = dimensionById.get(dimensionId);
    if (!dimension) throw new Error(`Brick 8 references an unknown Speaking Progress dimension: ${dimensionId}.`);
    return dimension;
  });
  return freezeRecord({
    ...config,
    dimensionIds: freezeList(config.dimensionIds),
    dimensionLabels: freezeList(dimensions.map((dimension) => dimension.shortLabel)),
    links: freezeList(config.links),
  });
}

/**
 * Brick 8 does not create a second speaking taxonomy. It curates the already
 * frozen SP6 Tier-1 owners into five parent-facing discovery groups and maps
 * those groups to the Brick 7 progress dimensions that parents can observe.
 */
export const SPEAKING_KNOWLEDGE_CLUSTER_GROUPS: readonly SpeakingKnowledgeClusterGroup[] = freezeList([
  group({
    id: 'everyday-speaking-foundations',
    eyebrow: 'Everyday speaking foundations',
    title: 'Start, expand and sustain spoken responses',
    description:
      'Use these guides when the main need is getting an answer started, expanding it with useful language, or keeping a two-way exchange moving.',
    dimensionIds: [
      'response_expansion',
      'sentence_formation',
      'vocabulary_in_use',
      'listening_response',
      'prompt_independence',
    ],
    links: [
      link(
        ['response-initiation'],
        'Understands English but does not speak',
        'Separate comprehension from word retrieval, sentence formulation, confidence and prompt dependence before choosing the next step.',
        'Check response initiation',
      ),
      link(
        ['response-expansion'],
        'Child gives one-word answers',
        'Diagnose why replies stay short and build fuller relevant responses without rewarding length for its own sake.',
        'Build fuller responses',
      ),
      link(
        ['conversation', 'spoken-vocabulary-transfer'],
        'Conversation skills for kids',
        'Practise listening, turn-taking, staying on topic, follow-up questions, repair and retrieving useful vocabulary during real interaction.',
        'Build conversation skills',
      ),
    ],
  }),
  group({
    id: 'confidence-and-context',
    eyebrow: 'Confidence & context',
    title: 'Transfer speaking into classrooms and new listeners',
    description:
      'Confidence is treated as participation and independence across settings—not loudness, extroversion, accent conformity or constant eye contact.',
    dimensionIds: [
      'prompt_independence',
      'presentation_audience',
      'fresh_task_transfer',
    ],
    links: [
      link(
        ['confidence-context-transfer'],
        'Speaking confidence progression',
        'Use a gradual context-and-support pathway instead of treating confidence as one fixed personality trait.',
        'Explore confidence transfer',
      ),
      link(
        ['classroom-communication'],
        'Classroom communication and participation',
        'Connect ordinary speaking skills with answering, clarification, group participation and predictable classroom routines.',
        'Build classroom participation',
      ),
      link(
        ['familiar-audience-practice'],
        'Family speaking showcase',
        'Use a familiar low-stakes audience to practise independence before increasing audience or task demands.',
        'Practise with family',
      ),
    ],
  }),
  group({
    id: 'storytelling-and-organisation',
    eyebrow: 'Storytelling & organisation',
    title: 'Turn ideas into a sequence a listener can follow',
    description:
      'Move from oral retelling and story sequencing into short planned talks without making memorised scripts the definition of organisation.',
    dimensionIds: [
      'storytelling_retelling',
      'idea_organisation',
      'sentence_formation',
    ],
    links: [
      link(
        ['storytelling-retelling'],
        'How to teach storytelling to kids',
        'Build meaningful sequence, relevant detail, listener clarity and increasing independence in retelling and story creation.',
        'Teach oral storytelling',
      ),
      link(
        ['story-card-practice'],
        'Story Cards speaking bridge',
        'Use a structured activity to rehearse oral sentences, sequence and relevant story detail before a fresh task.',
        'Practise with Story Cards',
      ),
      link(
        ['speech-organisation'],
        'Speaking structure for kids',
        'Organise a short talk around purpose, a useful opening, a small number of points, transitions and a conclusion.',
        'Organise a short talk',
      ),
    ],
  }),
  group({
    id: 'discussion-and-presentation',
    eyebrow: 'Discussion & presentation',
    title: 'Explain, reason and present ideas clearly',
    description:
      'Use these resources when the child needs to support an opinion, organise a presentation, or make delivery choices that help the listener follow meaning.',
    dimensionIds: [
      'idea_organisation',
      'listening_response',
      'delivery_intelligibility',
      'presentation_audience',
    ],
    links: [
      link(
        ['discussion-reasoning'],
        'Debate and reasoning for kids',
        'Practise a position, reasons, examples, listening to another view and respectful response rather than simply speaking for longer.',
        'Build reasoned discussion',
      ),
      link(
        ['delivery'],
        'Public-speaking delivery for kids',
        'Use pace, audible volume, pausing, emphasis and intelligibility to support meaning without pushing accent conformity or theatrical performance.',
        'Improve delivery',
      ),
      link(
        ['visual-aids'],
        'Visual aids in public speaking',
        'Use pictures, props, charts or slides to clarify the message without allowing the visual to replace the speaker.',
        'Use visuals well',
      ),
    ],
  }),
  group({
    id: 'rehearsal-and-transfer',
    eyebrow: 'Rehearsal & transfer',
    title: 'Use feedback, retry and fresh-task transfer',
    description:
      'Practise one observable target, retry it, and then check whether the skill appears beyond the exact rehearsed script or event.',
    dimensionIds: [
      'delivery_intelligibility',
      'presentation_audience',
      'fresh_task_transfer',
    ],
    links: [
      link(
        ['rehearsal-feedback'],
        'Video feedback for speaking',
        'Use optional recording to notice one target, retry it and compare performance without turning the recording into a personality or accent score.',
        'Use focused feedback',
      ),
      link(
        ['competition-preparation'],
        'Public-speaking competition preparation',
        'Apply structure, delivery and feedback to a real event while keeping event readiness separate from broad speaking development.',
        'Prepare for an event',
      ),
    ],
  }),
]);

export const SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS: readonly string[] = freezeList(
  SPEAKING_KNOWLEDGE_CLUSTER_GROUPS.flatMap((groupItem) =>
    groupItem.links.flatMap((item) => item.ownerIds),
  ),
);

export const SPEAKING_KNOWLEDGE_CLUSTER_PATHS: readonly string[] = freezeList(
  Array.from(
    new Set(
      SPEAKING_KNOWLEDGE_CLUSTER_GROUPS.flatMap((groupItem) =>
        groupItem.links.map((item) => item.to),
      ),
    ),
  ),
);

export const SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS: readonly SpeakingProgressDimensionId[] = freezeList(
  Array.from(
    new Set(
      SPEAKING_KNOWLEDGE_CLUSTER_GROUPS.flatMap((groupItem) => groupItem.dimensionIds),
    ),
  ),
);

export const SPEAKING_KNOWLEDGE_CLUSTER_DOMAIN_IDS: readonly string[] = freezeList(
  Array.from(
    new Set(
      SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.map((item) => item.domainId),
    ),
  ),
);

if (SPEAKING_COMMUNICATION_FREEZE.state !== 'frozen' || SPEAKING_COMMUNICATION_FREEZE.contentExpansionAllowed) {
  throw new Error('Brick 8 requires the frozen SP6 Speaking knowledge architecture.');
}

if (
  SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS.length !== SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.length
  || new Set(SPEAKING_KNOWLEDGE_CLUSTER_OWNER_IDS).size !== SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.length
) {
  throw new Error('Brick 8 must represent every established Tier-1 speaking cluster exactly once.');
}

if (
  SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS.length !== SPEAKING_PROGRESS_DIMENSIONS.length
  || new Set(SPEAKING_KNOWLEDGE_CLUSTER_DIMENSION_IDS).size !== SPEAKING_PROGRESS_DIMENSIONS.length
) {
  throw new Error('Brick 8 must connect the knowledge cluster to all Brick 7 speaking progress dimensions.');
}

if (
  SPEAKING_KNOWLEDGE_CLUSTER_DOMAIN_IDS.length !== SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.length
  || !SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.every((domain) =>
    SPEAKING_KNOWLEDGE_CLUSTER_DOMAIN_IDS.includes(domain.id))
) {
  throw new Error('Brick 8 must preserve coverage of all established Speaking & Communication knowledge domains.');
}

if (SPEAKING_KNOWLEDGE_CLUSTER_PATHS.length !== 14) {
  throw new Error('Brick 8 expects fifteen Tier-1 records to resolve to fourteen established knowledge URLs.');
}

for (const path of SPEAKING_KNOWLEDGE_CLUSTER_PATHS) {
  if (!path.startsWith('/blog/')) {
    throw new Error(`Brick 8 knowledge destinations must remain established blog resources: ${path}.`);
  }
  if (
    path === SPEAKING_COMMUNICATION_FREEZE.protectedCommercialOwner
    || path === SPEAKING_COMMUNICATION_FREEZE.protectedSpokenEnglishCommercialOwner
  ) {
    throw new Error(`Brick 8 knowledge content must not replace a protected commercial owner: ${path}.`);
  }
}
