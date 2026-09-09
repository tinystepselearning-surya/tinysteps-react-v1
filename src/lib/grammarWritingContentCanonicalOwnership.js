import { R16_CANONICAL_TOPIC_OWNERSHIP } from './readingSemanticCanonicalOwnership.js';
import { getPublishedGrammarWritingContentExecutions } from './grammarWritingContentExecutionRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const executionById = new Map(getPublishedGrammarWritingContentExecutions().map((item) => [item.id, item]));

const owned = (executionId, config) => {
  const execution = executionById.get(executionId);
  if (!execution) throw new Error(`R18 canonical ownership requires published execution: ${executionId}`);
  return freeze({
    id: config.id,
    subject: 'grammar-writing',
    intent: config.intent,
    ownerPath: execution.path,
    ownerRole: 'editorial-pillar',
    hubPath: '/resources/grammar',
    queryIntent: config.queryIntent,
    supportingPaths: freezeList(config.supportingPaths),
    forbiddenCompetingOwners: freezeList([]),
    publicationWave: 'grammar-writing-content-r18',
  });
};

export const R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  owned('punctuation-capitalisation-parent-guide', {
    id: 'punctuation-capitalisation-guide',
    intent: 'informational',
    queryIntent: 'punctuation and capital letters for kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-nouns-to-paragraphs', '/blog/grammar-editing-camp'],
  }),
  owned('paragraph-writing-parent-guide', {
    id: 'paragraph-writing-guide',
    intent: 'informational',
    queryIntent: 'how to teach paragraph writing to kids',
    supportingPaths: ['/resources/grammar', '/blog/grammar-nouns-to-paragraphs', '/blog/how-to-improve-sentence-formation-in-kids', '/blog/grammar-creative-writing'],
  }),
]);

export const R18_CANONICAL_TOPIC_OWNERSHIP = freezeList([
  ...R16_CANONICAL_TOPIC_OWNERSHIP,
  ...R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP,
]);

for (const [label, values] of [
  ['topic id', R18_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', R18_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) {
  if (new Set(values).size !== values.length) throw new Error(`R18 canonical ownership contains duplicate ${label}.`);
}

const byId = new Map(R18_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
export const getR18CanonicalTopicOwner = (topicId) => byId.get(String(topicId || '')) ?? null;
export const getR18CanonicalTopicOwnerPath = (topicId) => getR18CanonicalTopicOwner(topicId)?.ownerPath ?? null;
