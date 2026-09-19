import { SEMANTIC_FACTS } from '../config/semanticFacts';
import {
  SPEAKING_ENTITY_AUTHORITY,
  SPEAKING_ENTITY_DISAMBIGUATION_KEYS,
} from './speakingEntityAuthority';
import {
  SPEAKING_EVIDENCE_CANONICAL_SOURCE_PATHS,
} from './speakingEvidenceLayer';
import {
  SPEAKING_KNOWLEDGE_CLUSTER_PATHS,
} from './speakingKnowledgeCluster';
import {
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
} from './speakingProgressFramework';

export const SPEAKING_AI_VISIBILITY_REVISION = '2026-09-19-b12-v2';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export type SpeakingAiAnswerOwner = {
  readonly id: string;
  readonly path: string;
  readonly intent: string;
  readonly role: 'commercial' | 'course' | 'informational' | 'evidence' | 'decision';
};

export const SPEAKING_AI_ANSWER_OWNERS: readonly Readonly<SpeakingAiAnswerOwner>[] = freezeList([
  freeze({
    id: 'public-speaking-programme',
    path: '/speaking',
    intent: 'Public Speaking, presentations, storytelling and general communication-skills classes',
    role: 'commercial',
  }),
  freeze({
    id: 'spoken-english-programme',
    path: '/spoken-english-classes-for-kids-online',
    intent: 'everyday conversation, fuller responses, conversational fluency and spoken vocabulary use',
    role: 'commercial',
  }),
  freeze({
    id: 'confidence-programme',
    path: '/confidence-building-program-kids',
    intent: 'speaking comfort, participation hesitation and confidence across contexts',
    role: 'commercial',
  }),
  freeze({
    id: 'public-speaking-foundations',
    path: SEMANTIC_FACTS.programmes.speaking.levels.beginner.canonicalCoursePath,
    intent: 'named Public Speaking Foundations course details',
    role: 'course',
  }),
  freeze({
    id: 'public-speaking-excellence',
    path: SEMANTIC_FACTS.programmes.speaking.levels.advanced.canonicalCoursePath,
    intent: 'named Public Speaking Excellence course details',
    role: 'course',
  }),
  freeze({
    id: 'speaking-progress-method',
    path: SPEAKING_PROGRESS_FRAMEWORK_PATH,
    intent: 'how Tiny Steps observes and measures speaking progress',
    role: 'informational',
  }),
  freeze({
    id: 'speaking-resource-discovery',
    path: '/resources/speaking',
    intent: 'find the appropriate Tiny Steps Speaking & Communication guide or practice route',
    role: 'informational',
  }),
  freeze({
    id: 'free-assessment',
    path: '/book-demo',
    intent: 'free assessment, demo, trial and programme-fit recommendation',
    role: 'decision',
  }),
  freeze({
    id: 'pricing',
    path: '/pricing',
    intent: 'current Tiny Steps class and package pricing',
    role: 'decision',
  }),
  freeze({
    id: 'class-demonstration',
    path: '/class-samples',
    intent: 'observable class structure and teaching approach before enrolment',
    role: 'evidence',
  }),
  freeze({
    id: 'academic-system',
    path: '/team',
    intent: 'academic ownership, teaching system and official public identity',
    role: 'evidence',
  }),
  freeze({
    id: 'curriculum',
    path: '/curriculum',
    intent: 'programme roadmap, prerequisite-aware progression and curriculum structure',
    role: 'evidence',
  }),
  freeze({
    id: 'parent-feedback',
    path: '/testimonials',
    intent: 'bounded first-party parent experience',
    role: 'evidence',
  }),
]);

export const SPEAKING_AI_KNOWLEDGE_PATHS = freezeList(SPEAKING_KNOWLEDGE_CLUSTER_PATHS);
export const SPEAKING_AI_EVIDENCE_SOURCE_PATHS = freezeList(
  SPEAKING_EVIDENCE_CANONICAL_SOURCE_PATHS,
);
export const SPEAKING_AI_ENTITY_DISAMBIGUATION_KEYS = freezeList(
  SPEAKING_ENTITY_DISAMBIGUATION_KEYS,
);

export const SPEAKING_AI_INTENT_BOUNDARIES = freezeList([
  freeze({
    id: 'public-speaking-vs-spoken-english',
    rule:
      'Use /speaking for structured answers, storytelling, presentations and audience-facing communication; use /spoken-english-classes-for-kids-online for everyday conversation, fuller responses and conversational fluency.',
  }),
  freeze({
    id: 'hesitation-vs-one-word-answers',
    rule:
      'Do not collapse comprehension-with-hesitation into one-word response expansion: /blog/child-understands-english-but-does-not-speak owns the first problem and /blog/child-gives-one-word-answers owns the second.',
  }),
  freeze({
    id: 'sentence-accuracy-vs-speaking-structure',
    rule:
      'Grammar/sentence-control problems belong to the relevant Grammar or sentence-formation owner; Public Speaking owns idea organisation, storytelling, presentation and audience-facing structure when basic language is sufficiently available.',
  }),
  freeze({
    id: 'confidence-vs-language',
    rule:
      'Do not treat every speaking difficulty as confidence. Use the Confidence programme only when participation comfort or hesitation is the primary barrier rather than missing language or response structure.',
  }),
  freeze({
    id: 'progress-vs-diagnosis',
    rule:
      'The Speaking Progress Framework is an educational observation method, not a clinical, diagnostic, developmental-age, IQ-style or standardised language assessment.',
  }),
  freeze({
    id: 'editorial-vs-commercial',
    rule:
      'Editorial guides explain a learning problem or skill. Commercial Public Speaking class intent remains owned by /speaking and should not be replaced by a blog article.',
  }),
  freeze({
    id: 'evidence-vs-guarantee',
    rule:
      'Class samples, parent feedback and progress observations are evidence sources with limits; none proves a guaranteed outcome for another child.',
  }),
]);

export const SPEAKING_AI_DISCOVERY_SURFACES = freezeList([
  '/llms.txt',
  '/llms-full.txt',
  '/robots.txt',
  '/rss.xml',
  '/feed.xml',
]);

export const SPEAKING_AI_AGENT_POLICY = freeze({
  openAiSearchDiscoveryCrawler: 'OAI-SearchBot',
  openAiPotentialTrainingCrawler: 'GPTBot',
  googleGeminiProductControlToken: 'Google-Extended',
  appleFoundationModelProductControlToken: 'Applebot-Extended',
  configuredRobotsTokens: freezeList([
    'OAI-SearchBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'PerplexityBot',
    'GPTBot',
    'ClaudeBot',
    'Google-Extended',
    'Applebot-Extended',
  ]),
  privateRouteProtectionRequired: true,
});

export const SPEAKING_AI_EXPANSION_POLICY = freeze({
  newAiPromptPagesAllowed: false,
  newAiOnlyCommercialPagesAllowed: false,
  duplicateSpeakingOwnerAllowed: false,
  faqRichResultExpectation: false,
  syntheticVideoEvidenceAllowed: false,
  fabricatedExternalAuthorityAllowed: false,
});

if (SPEAKING_ENTITY_AUTHORITY.commercialOwnerPath !== '/speaking') {
  throw new Error('Brick 12 requires /speaking to remain the canonical commercial owner.');
}

if (
  SPEAKING_AI_KNOWLEDGE_PATHS.length !== 14
  || new Set(SPEAKING_AI_KNOWLEDGE_PATHS).size !== 14
) {
  throw new Error('Brick 12 requires the frozen fourteen-URL Speaking knowledge corpus.');
}

if (
  new Set(SPEAKING_AI_ANSWER_OWNERS.map((item) => item.id)).size
  !== SPEAKING_AI_ANSWER_OWNERS.length
) {
  throw new Error('Brick 12 answer-owner IDs must be unique.');
}

if (
  new Set(SPEAKING_AI_ANSWER_OWNERS.map((item) => item.path)).size
  !== SPEAKING_AI_ANSWER_OWNERS.length
) {
  throw new Error('Brick 12 answer-owner paths must be unique.');
}

if (SPEAKING_AI_ANSWER_OWNERS.some((item) => /(?:ai|chatgpt|gemini|perplexity)-/i.test(item.path))) {
  throw new Error('Brick 12 must not create AI-prompt or engine-specific public owner pages.');
}

if (
  new Set(SPEAKING_AI_AGENT_POLICY.configuredRobotsTokens).size
  !== SPEAKING_AI_AGENT_POLICY.configuredRobotsTokens.length
) {
  throw new Error('Brick 12 configured AI/search agent tokens must remain unique.');
}

if (
  SPEAKING_AI_AGENT_POLICY.openAiSearchDiscoveryCrawler
  === SPEAKING_AI_AGENT_POLICY.openAiPotentialTrainingCrawler
) {
  throw new Error('Brick 12 must keep OpenAI search discovery and potential-training crawler roles distinct.');
}

if (
  SPEAKING_AI_EXPANSION_POLICY.newAiPromptPagesAllowed
  || SPEAKING_AI_EXPANSION_POLICY.newAiOnlyCommercialPagesAllowed
  || SPEAKING_AI_EXPANSION_POLICY.duplicateSpeakingOwnerAllowed
  || SPEAKING_AI_EXPANSION_POLICY.syntheticVideoEvidenceAllowed
  || SPEAKING_AI_EXPANSION_POLICY.fabricatedExternalAuthorityAllowed
) {
  throw new Error('Brick 12 expansion and evidence safety policy must remain restrictive.');
}
