import { R22_CANONICAL_TOPIC_OWNERSHIP } from './speakingCommunicationSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP = freezeList([
  freeze({
    id: 'classroom-communication-guide',
    subject: 'speaking-communication',
    intent: 'informational',
    ownerPath: '/blog/back-to-school-english-confidence-plan',
    ownerRole: 'editorial-pillar',
    hubPath: '/resources/speaking',
    queryIntent: 'classroom English communication and participation for kids',
    supportingPaths: freezeList([
      '/blog/conversation-skills-for-kids',
      '/blog/child-understands-english-but-does-not-speak',
      '/blog/speaking-confidence-seeds',
      '/blog/how-to-improve-sentence-formation-in-kids',
    ]),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'speaking-completion-sp6',
  }),
]);

export const SP6_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R22_CANONICAL_TOPIC_OWNERSHIP,
  ...SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`SP6 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
export const getSP6CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getSP6CanonicalTopicOwnerPath = (topicId) => getSP6CanonicalTopicOwner(topicId)?.ownerPath ?? null;
