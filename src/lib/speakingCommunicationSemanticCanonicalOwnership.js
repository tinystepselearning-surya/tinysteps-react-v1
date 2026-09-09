import { R21_CANONICAL_TOPIC_OWNERSHIP } from './speakingCommunicationContentCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const existingOwner = (config) => freeze({
  subject: 'speaking-communication',
  intent: 'informational',
  ownerRole: 'editorial-pillar',
  hubPath: '/resources/speaking',
  supportingPaths: freezeList(config.supportingPaths),
  forbiddenCompetingOwners: freezeList([]),
  publicationWave: 'speaking-semantic-r22',
  ...config,
});

/**
 * R22 names seven substantial existing speaking resources so the semantic
 * journey layer can connect them without inventing new URLs or moving any
 * established commercial/informational owner.
 */
export const R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  existingOwner({
    id: 'speech-structure-guide',
    ownerPath: '/blog/speaking-structure',
    queryIntent: 'public speaking structure for kids',
    supportingPaths: ['/resources/speaking', '/blog/how-to-teach-storytelling-to-kids', '/blog/public-speaking-delivery-for-kids'],
  }),
  existingOwner({
    id: 'speaking-visual-aids-guide',
    ownerPath: '/blog/speaking-visual-aids',
    queryIntent: 'visual aids for public speaking kids',
    supportingPaths: ['/resources/speaking', '/blog/speaking-structure', '/blog/public-speaking-delivery-for-kids'],
  }),
  existingOwner({
    id: 'speaking-debate-guide',
    ownerPath: '/blog/speaking-debate-starters',
    queryIntent: 'debate skills for kids',
    supportingPaths: ['/resources/speaking', '/blog/conversation-skills-for-kids', '/blog/speaking-confidence-seeds'],
  }),
  existingOwner({
    id: 'speaking-video-feedback-guide',
    intent: 'practice',
    ownerRole: 'activity-guide',
    ownerPath: '/blog/speaking-video-feedback',
    queryIntent: 'video feedback for kids public speaking',
    supportingPaths: ['/resources/speaking', '/blog/public-speaking-delivery-for-kids', '/blog/speaking-structure'],
  }),
  existingOwner({
    id: 'speaking-competition-preparation-guide',
    ownerPath: '/blog/speaking-competition-prep',
    queryIntent: 'public speaking competition preparation for kids',
    supportingPaths: ['/resources/speaking', '/blog/speaking-structure', '/blog/public-speaking-delivery-for-kids'],
  }),
  existingOwner({
    id: 'speaking-family-showcase-practice',
    intent: 'practice',
    ownerRole: 'activity-guide',
    ownerPath: '/blog/speaking-family-showcase',
    queryIntent: 'family speaking practice for kids',
    supportingPaths: ['/resources/speaking', '/blog/speaking-confidence-seeds', '/blog/conversation-skills-for-kids'],
  }),
  existingOwner({
    id: 'story-card-speaking-bridge',
    intent: 'practice',
    ownerRole: 'activity-guide',
    ownerPath: '/blog/grammar-speaking-bridge',
    queryIntent: 'story cards speaking practice for kids',
    supportingPaths: ['/resources/speaking', '/resources/grammar', '/blog/how-to-teach-storytelling-to-kids'],
  }),
]);

export const R22_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R21_CANONICAL_TOPIC_OWNERSHIP,
  ...R22_SPEAKING_COMMUNICATION_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R22_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R22_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R22 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(R22_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
export const getR22CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getR22CanonicalTopicOwnerPath = (topicId) => getR22CanonicalTopicOwner(topicId)?.ownerPath ?? null;
