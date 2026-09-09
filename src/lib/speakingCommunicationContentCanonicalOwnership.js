import { R19_CANONICAL_TOPIC_OWNERSHIP } from './grammarWritingSemanticCanonicalOwnership.js';
import { getPublishedSpeakingCommunicationContentExecutions } from './speakingCommunicationContentExecutionRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const executionById = new Map(getPublishedSpeakingCommunicationContentExecutions().map((item) => [item.id, item]));

const owned = (executionId, config) => {
  const execution = executionById.get(executionId);
  if (!execution) throw new Error(`R21 canonical ownership requires published execution: ${executionId}`);
  return freeze({
    id: config.id,
    subject: 'speaking-communication',
    intent: 'informational',
    ownerPath: execution.path,
    ownerRole: 'editorial-pillar',
    hubPath: '/resources/speaking',
    queryIntent: config.queryIntent,
    supportingPaths: freezeList(config.supportingPaths),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'speaking-content-r21',
  });
};

export const R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  owned('conversation-skills-parent-guide', {
    id: 'conversation-skills-guide',
    queryIntent: 'conversation skills for kids',
    supportingPaths: ['/resources/speaking', '/blog/child-gives-one-word-answers', '/blog/speaking-debate-starters', '/blog/speaking-confidence-seeds'],
  }),
  owned('storytelling-retelling-parent-guide', {
    id: 'oral-storytelling-retelling-guide',
    queryIntent: 'how to teach storytelling to kids',
    supportingPaths: ['/resources/speaking', '/blog/grammar-speaking-bridge', '/blog/speaking-structure', '/blog/speaking-confidence-seeds'],
  }),
  owned('speaking-delivery-parent-guide', {
    id: 'public-speaking-delivery-guide',
    queryIntent: 'public speaking delivery for kids',
    supportingPaths: ['/resources/speaking', '/blog/speaking-structure', '/blog/speaking-video-feedback', '/blog/speaking-competition-prep'],
  }),
]);

export const R21_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R19_CANONICAL_TOPIC_OWNERSHIP,
  ...R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R21_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R21_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R21 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(R21_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
export const getR21CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getR21CanonicalTopicOwnerPath = (topicId) => getR21CanonicalTopicOwner(topicId)?.ownerPath ?? null;
