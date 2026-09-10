import { CANONICAL_TOPIC_OWNERSHIP } from './canonicalTopicOwnershipRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from './publicRouteManifest.js';
import { PHONICS_READING_PROBLEMS } from './phonicsReadingProblemRegistry.js';
import { PHONICS_READING_TAXONOMY } from './phonicsReadingTaxonomy.js';
import {
  GRAMMAR_WRITING_GR7_PUBLICATION_POLICY,
  GRAMMAR_WRITING_GR7_STATUS,
} from './grammarWritingGr7Closure.js';
import {
  SPEAKING_COMMUNICATION_COMPLETION_BRICKS,
  SPEAKING_COMMUNICATION_FREEZE,
} from './speakingCommunicationCompletionArchitecture.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const item = (config) => freeze({ ...config });

export const KNOWLEDGE_BASE_FINAL_REVISION = '2026-09-10-kb-final';
export const KNOWLEDGE_BASE_FINAL_STATUS = 'frozen';

export const KNOWLEDGE_BASE_FINAL_SESSIONS = freezeList([
  item({
    id: 'session-a',
    label: 'Phonics & Reading',
    status: 'frozen',
    closureEvidence: 'src/tests/seo/sessionAPhonicsReadingClosure.spec.ts',
    protectedHub: '/resources/phonics',
  }),
  item({
    id: 'session-b',
    label: 'Grammar & Writing',
    status: GRAMMAR_WRITING_GR7_STATUS,
    closureEvidence: 'src/tests/seo/grammarWritingGr7Closure.spec.ts',
    protectedHub: '/resources/grammar',
  }),
  item({
    id: 'session-c',
    label: 'Speaking & Communication',
    status: SPEAKING_COMMUNICATION_FREEZE.state,
    closureEvidence: 'src/tests/seo/resourcesSP6SpeakingCommunicationCompletion.spec.ts',
    protectedHub: SPEAKING_COMMUNICATION_FREEZE.protectedSubjectHub,
  }),
]);

export const KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS = freezeList([
  '/resources/phonics',
  '/resources/grammar',
  '/resources/speaking',
]);

/**
 * Commercial/conversion routes that the frozen knowledge graph may support but
 * must never absorb as informational canonical owners during KB-FINAL.
 * `topicId` is present only where the historical canonical registry already
 * owns that exact intent; newer standalone commercial routes are protected by
 * the public route manifest without rewriting older ownership registries.
 */
export const KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS = freezeList([
  item({ id: 'phonics-classes', subject: 'phonics-reading', path: '/phonics', topicId: 'live-phonics-classes' }),
  item({ id: 'reading-classes', subject: 'phonics-reading', path: '/reading-classes-for-kids', topicId: null }),
  item({ id: 'grammar-classes', subject: 'grammar-writing', path: '/grammar', topicId: 'live-grammar-classes' }),
  item({ id: 'writing-classes', subject: 'grammar-writing', path: '/writing-classes-for-kids', topicId: 'writing-classes' }),
  item({ id: 'public-speaking-classes', subject: 'speaking-communication', path: '/speaking', topicId: 'live-public-speaking-classes' }),
  item({ id: 'spoken-english-classes', subject: 'speaking-communication', path: '/spoken-english-classes-for-kids-online', topicId: 'spoken-english-classes' }),
  item({ id: 'broad-online-english', subject: 'general-english', path: '/online-english-classes-for-kids', topicId: null }),
  item({ id: 'assessment-conversion', subject: 'general-english', path: '/book-demo', topicId: 'free-assessment-booking' }),
]);

export const KNOWLEDGE_BASE_FINAL_POLICY = freeze({
  informationalExpansion: 'frozen',
  reopenKnowledgeBase: 'evidence-required',
  newInformationalOwners: 'hold',
  commercialSeoExpansion: 'separate-project',
  keywordResearch: 'commercial-project',
  rule: 'KB-FINAL may reconcile ownership and integration only. It must not create informational content or reopen PH, GR or SP expansion without a demonstrated user, curriculum or search-intent gap.',
});

export function getKnowledgeBaseFinalSnapshot() {
  return freeze({
    revision: KNOWLEDGE_BASE_FINAL_REVISION,
    status: KNOWLEDGE_BASE_FINAL_STATUS,
    sessions: KNOWLEDGE_BASE_FINAL_SESSIONS,
    protectedHubs: KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS,
    protectedCommercialOwners: KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS,
    policy: KNOWLEDGE_BASE_FINAL_POLICY,
  });
}

const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((route) => [route.path, route]));
const canonicalTopicById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((topic) => [topic.id, topic]));

if (KNOWLEDGE_BASE_FINAL_SESSIONS.length !== 3 || KNOWLEDGE_BASE_FINAL_SESSIONS.some((session) => session.status !== 'frozen')) {
  throw new Error('KB-FINAL requires Sessions A, B and C to remain frozen.');
}
if (GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.informationalExpansion !== 'frozen' || GRAMMAR_WRITING_GR7_PUBLICATION_POLICY.commercialSeoExpansion !== 'separate-project') {
  throw new Error('KB-FINAL detected Grammar/Writing publication-policy drift.');
}
if (SPEAKING_COMMUNICATION_FREEZE.contentExpansionAllowed !== false || SPEAKING_COMMUNICATION_COMPLETION_BRICKS.at(-1)?.state !== 'frozen') {
  throw new Error('KB-FINAL detected Speaking/Communication freeze drift.');
}
if (PHONICS_READING_TAXONOMY.length !== 15 || PHONICS_READING_PROBLEMS.length !== 9) {
  throw new Error('KB-FINAL detected Phonics/Reading closure-scope drift.');
}

const topicIds = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.id);
const queryIntents = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.queryIntent.trim().toLowerCase());
if (new Set(topicIds).size !== topicIds.length) throw new Error('KB-FINAL detected duplicate canonical topic IDs.');
if (new Set(queryIntents).size !== queryIntents.length) throw new Error('KB-FINAL detected duplicate canonical query-intent ownership.');

for (const hub of KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS) {
  const route = routeByPath.get(hub);
  if (!route || !route.indexable || !route.prerender || !route.sitemap || route.canonicalPath !== hub) {
    throw new Error(`KB-FINAL protected hub is not a self-canonical indexable public route: ${hub}`);
  }
}
for (const owner of KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS) {
  const route = routeByPath.get(owner.path);
  if (!route || !route.indexable || !route.prerender || !route.sitemap || route.canonicalPath !== owner.path) {
    throw new Error(`KB-FINAL protected commercial owner is not a self-canonical indexable public route: ${owner.path}`);
  }
  if (owner.topicId) {
    const topic = canonicalTopicById.get(owner.topicId);
    if (!topic || topic.ownerPath !== owner.path) {
      throw new Error(`KB-FINAL canonical owner drift: ${owner.topicId} must remain ${owner.path}.`);
    }
  }
}

for (const topic of CANONICAL_TOPIC_OWNERSHIP) {
  if (KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.includes(topic.ownerPath)) {
    if (topic.ownerRole !== 'subject-hub' || topic.intent !== 'informational') {
      throw new Error(`KB-FINAL subject hub absorbed non-discovery ownership: ${topic.id}.`);
    }
  }
  if (['commercial', 'high-commercial', 'solution-aware', 'transactional-brand'].includes(topic.intent) && KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.includes(topic.ownerPath)) {
    throw new Error(`KB-FINAL commercial intent is incorrectly owned by a knowledge hub: ${topic.id}.`);
  }
}
