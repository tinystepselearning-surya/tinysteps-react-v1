import { R15_CANONICAL_TOPIC_OWNERSHIP } from './readingContentCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  freeze({
    id: 'reading-comprehension-bridge',
    subject: 'phonics-reading',
    intent: 'informational',
    ownerPath: '/blog/phonics-comprehension',
    ownerRole: 'editorial-pillar',
    hubPath: '/resources/phonics',
    queryIntent: 'how to move from decoding to reading comprehension',
    supportingPaths: freezeList([
      '/resources/phonics',
      '/blog/how-vocabulary-supports-reading-comprehension',
      '/blog/how-to-improve-reading-fluency-in-children',
    ]),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'reading-semantic-r16',
  }),
  freeze({
    id: 'story-comprehension-diagnostic',
    subject: 'phonics-reading',
    intent: 'problem-aware',
    ownerPath: '/blog/why-child-reads-words-but-does-not-understand-story',
    ownerRole: 'diagnostic-owner',
    hubPath: '/resources/phonics',
    queryIntent: 'child reads words but does not understand stories',
    supportingPaths: freezeList([
      '/resources/phonics',
      '/blog/phonics-comprehension',
      '/blog/how-vocabulary-supports-reading-comprehension',
    ]),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'reading-semantic-r16',
  }),
]);

export const R16_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R15_CANONICAL_TOPIC_OWNERSHIP,
  ...R16_READING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R16 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(R16_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));

export const getR16CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getR16CanonicalTopicOwnerPath = (topicId) => getR16CanonicalTopicOwner(topicId)?.ownerPath ?? null;
