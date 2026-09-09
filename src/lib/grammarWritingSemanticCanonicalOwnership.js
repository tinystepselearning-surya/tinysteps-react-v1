import { R18_CANONICAL_TOPIC_OWNERSHIP } from './grammarWritingContentCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const existingOwner = (config) => freeze({
  subject: 'grammar-writing',
  ownerRole: 'editorial-pillar',
  hubPath: '/resources/grammar',
  supportingPaths: freezeList(config.supportingPaths),
  forbiddenCompetingOwners: freezeList([]),
  publicationWave: 'grammar-writing-semantic-r19',
  ...config,
});

/**
 * R19 names six strong existing grammar/writing pages that R17 explicitly
 * protected but which did not yet have canonical topic IDs in the additive
 * Resources ownership graph. No URL changes ownership here.
 */
export const R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  existingOwner({
    id: 'grammar-tenses-guide',
    intent: 'informational',
    ownerPath: '/blog/grammar-tenses',
    queryIntent: 'English tenses for kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-nouns-to-paragraphs', '/blog/child-knows-grammar-but-makes-mistakes'],
  }),
  existingOwner({
    id: 'subject-verb-agreement-guide',
    intent: 'informational',
    ownerPath: '/blog/grammar-subject-verb',
    queryIntent: 'subject verb agreement for kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-tenses', '/blog/child-knows-grammar-but-makes-mistakes'],
  }),
  existingOwner({
    id: 'conjunctions-guide',
    intent: 'informational',
    ownerPath: '/blog/grammar-conjunctions',
    queryIntent: 'conjunctions for kids',
    supportingPaths: ['/resources/grammar', '/blog/how-to-improve-sentence-formation-in-kids', '/blog/how-to-teach-paragraph-writing-to-kids'],
  }),
  existingOwner({
    id: 'creative-writing-guide',
    intent: 'informational',
    ownerPath: '/blog/grammar-creative-writing',
    queryIntent: 'creative writing scaffolds for kids',
    supportingPaths: ['/resources/grammar', '/blog/how-to-teach-paragraph-writing-to-kids', '/writing-classes-for-kids'],
  }),
  existingOwner({
    id: 'grammar-editing-guide',
    intent: 'practice',
    ownerPath: '/blog/grammar-editing-camp',
    queryIntent: 'grammar editing practice for kids',
    supportingPaths: ['/resources/grammar', '/blog/punctuation-and-capital-letters-for-kids', '/blog/child-knows-grammar-but-makes-mistakes'],
  }),
  existingOwner({
    id: 'grammar-assessment-guide',
    intent: 'informational',
    ownerPath: '/blog/grammar-assessment',
    queryIntent: 'grammar assessment checklist for parents',
    supportingPaths: ['/resources/grammar', '/blog/grammar-nouns-to-paragraphs', '/blog/child-knows-grammar-but-makes-mistakes'],
  }),
]);

export const R19_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R18_CANONICAL_TOPIC_OWNERSHIP,
  ...R19_GRAMMAR_WRITING_EXISTING_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R19 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));

export const getR19CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getR19CanonicalTopicOwnerPath = (topicId) => getR19CanonicalTopicOwner(topicId)?.ownerPath ?? null;
