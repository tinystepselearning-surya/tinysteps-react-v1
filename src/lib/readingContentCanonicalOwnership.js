import { R12_CANONICAL_TOPIC_OWNERSHIP } from './phonicsWave2CanonicalOwnership.js';
import { getPublishedReadingContentExecutions } from './readingContentExecutionRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const executionById = new Map(getPublishedReadingContentExecutions().map((item) => [item.id, item]));

const owned = (executionId, config) => {
  const execution = executionById.get(executionId);
  if (!execution) throw new Error(`R15 canonical ownership requires published execution: ${executionId}`);
  return freeze({
    id: config.id,
    subject: 'phonics-reading',
    intent: config.intent,
    ownerPath: execution.path,
    ownerRole: 'editorial-pillar',
    hubPath: '/resources/phonics',
    queryIntent: config.queryIntent,
    supportingPaths: freezeList(config.supportingPaths),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'reading-content-r15',
  });
};

export const R15_READING_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  owned('phonological-phonemic-phonics-boundary', {
    id: 'phonological-phonemic-phonics-boundary',
    intent: 'informational',
    queryIntent: 'phonological awareness vs phonemic awareness vs phonics',
    supportingPaths: ['/resources/phonics', '/blog/what-is-phonics-for-kids', '/blog/how-kids-learn-blending'],
  }),
  owned('vocabulary-reading-connection', {
    id: 'vocabulary-reading-comprehension',
    intent: 'informational',
    queryIntent: 'how vocabulary supports reading comprehension',
    supportingPaths: ['/resources/phonics', '/blog/phonics-comprehension', '/blog/why-child-reads-words-but-does-not-understand-story'],
  }),
  owned('automatic-word-recognition', {
    id: 'automatic-word-recognition',
    intent: 'informational',
    queryIntent: 'how children recognise words automatically after phonics',
    supportingPaths: ['/resources/phonics', '/blog/sight-words-or-phonics-first', '/blog/what-is-phonics-for-kids'],
  }),
]);

export const R15_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R12_CANONICAL_TOPIC_OWNERSHIP,
  ...R15_READING_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R15_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R15_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R15 canonical ownership contains duplicate ${label}.`);
}
