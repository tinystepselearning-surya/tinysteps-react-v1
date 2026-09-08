import { CANONICAL_TOPIC_OWNERSHIP } from './canonicalTopicOwnershipRegistry.js';
import { PHONICS_WAVE_2_PAGES } from './phonicsWave2Publication.js';

const freezeList = (values = []) => Object.freeze([...values]);
const freeze = (value) => Object.freeze(value);

export const PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP = freezeList(
  PHONICS_WAVE_2_PAGES.map((page) => freeze({
    id: page.topicId,
    subject: 'phonics-reading',
    intent: 'informational',
    ownerPath: page.path,
    ownerRole: 'skill-guide',
    hubPath: '/resources/phonics',
    queryIntent: page.concept.searchIntent,
    supportingPaths: freezeList(['/resources/phonics', ...page.concept.supportingPaths]),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'expansion-wave-2',
  })),
);

/**
 * R12 deliberately leaves the historical R5/R9 registry untouched and composes
 * an additive full ownership view for the expansion engine. New resource waves
 * must enter through an explicit publication layer before they can own intent.
 */
export const R12_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...CANONICAL_TOPIC_OWNERSHIP,
  ...PHONICS_WAVE_2_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R12_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R12_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) {
    throw new Error(`R12 canonical ownership contains duplicate ${label}.`);
  }
}
