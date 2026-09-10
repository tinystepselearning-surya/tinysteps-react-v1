import { GRAMMAR_WRITING_KNOWLEDGE_DOMAINS } from './grammarWritingKnowledgeArchitecture.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const skill = (config) => freeze({
  id: config.id,
  order: config.order,
  label: config.label,
  cluster: config.cluster,
  primaryDomainId: config.primaryDomainId,
  summary: config.summary,
  includedConcepts: freezeList(config.includedConcepts),
  prerequisiteSkillIds: freezeList(config.prerequisiteSkillIds),
  nextSkillIds: freezeList(config.nextSkillIds),
});

export const GRAMMAR_WRITING_TAXONOMY_REVISION = '2026-09-10-gr1';
export const GRAMMAR_WRITING_TAXONOMY_ROOT_ID = 'sentence-foundations';
export const GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID = 'editing-revision';

/**
 * GR1 refines the nine R17 grammar/writing domains into a stable skill graph.
 * The order is for navigation and curriculum reasoning, not a claim that every
 * child must master the nodes in one rigid sequence. Prerequisite and next-skill
 * edges are explicit so later tense, writing, practice and semantic-journey
 * bricks can attach to one canonical model without creating a second taxonomy.
 */
export const GRAMMAR_WRITING_SKILL_TAXONOMY = freezeList([
  skill({
    id: 'sentence-foundations',
    order: 1,
    label: 'Sentence Foundations',
    cluster: 'sentence-foundations',
    primaryDomainId: 'sentence-core',
    summary: 'Build the idea of a complete sentence: one clear message with workable word order, a subject-predicate relationship and a visible boundary between a complete sentence and a fragment.',
    includedConcepts: ['complete ideas', 'subject and predicate', 'basic word order', 'sentence versus fragment'],
    prerequisiteSkillIds: [],
    nextSkillIds: ['nouns-pronouns', 'verbs', 'punctuation'],
  }),
  skill({
    id: 'nouns-pronouns',
    order: 2,
    label: 'Nouns & Pronouns',
    cluster: 'word-grammar',
    primaryDomainId: 'word-classes-morphology',
    summary: 'Use naming words and pronouns as functional sentence choices, including clear reference, common and proper nouns, singular and plural forms, and avoiding unnecessary repetition.',
    includedConcepts: ['common and proper nouns', 'singular and plural nouns', 'personal pronouns', 'clear pronoun reference'],
    prerequisiteSkillIds: ['sentence-foundations'],
    nextSkillIds: ['verbs', 'adjectives-adverbs', 'articles-determiners', 'subject-verb-agreement'],
  }),
  skill({
    id: 'verbs',
    order: 3,
    label: 'Verbs',
    cluster: 'word-grammar',
    primaryDomainId: 'word-classes-morphology',
    summary: 'Understand verbs as the part of a sentence that carries action, state or helping meaning, and build enough control of verb forms to support later agreement and tense work.',
    includedConcepts: ['action verbs', 'being and linking verbs', 'helping verbs', 'base and inflected verb forms'],
    prerequisiteSkillIds: ['sentence-foundations', 'nouns-pronouns'],
    nextSkillIds: ['adjectives-adverbs', 'subject-verb-agreement', 'tenses'],
  }),
  skill({
    id: 'adjectives-adverbs',
    order: 4,
    label: 'Adjectives & Adverbs',
    cluster: 'word-grammar',
    primaryDomainId: 'sentence-expansion',
    summary: 'Add meaningful description and precision to sentences by choosing adjectives and adverbs that clarify which person or thing, what kind, how, when or where without padding sentences with unnecessary words.',
    includedConcepts: ['describing nouns', 'describing actions', 'how when and where detail', 'precise word choice'],
    prerequisiteSkillIds: ['nouns-pronouns', 'verbs'],
    nextSkillIds: ['prepositions', 'clauses-sentence-combining', 'descriptive-narrative-writing'],
  }),
  skill({
    id: 'articles-determiners',
    order: 5,
    label: 'Articles & Determiners',
    cluster: 'word-grammar',
    primaryDomainId: 'word-classes-morphology',
    summary: 'Use articles and common determiners to signal whether a noun is general, specific, singular, plural, near, far or quantified, with meaning taking priority over memorised labels.',
    includedConcepts: ['a an and the', 'this that these those', 'some any and quantity words', 'specific versus general reference'],
    prerequisiteSkillIds: ['nouns-pronouns'],
    nextSkillIds: ['prepositions', 'punctuation'],
  }),
  skill({
    id: 'prepositions',
    order: 6,
    label: 'Prepositions',
    cluster: 'sentence-expansion',
    primaryDomainId: 'sentence-expansion',
    summary: 'Use prepositions and prepositional phrases to express useful relationships of place, time, movement and position while keeping the sentence core easy to identify.',
    includedConcepts: ['place relationships', 'time relationships', 'movement and direction', 'prepositional phrases'],
    prerequisiteSkillIds: ['adjectives-adverbs', 'articles-determiners'],
    nextSkillIds: ['conjunctions', 'clauses-sentence-combining'],
  }),
  skill({
    id: 'conjunctions',
    order: 7,
    label: 'Conjunctions',
    cluster: 'sentence-connection',
    primaryDomainId: 'clauses-connectives',
    summary: 'Connect words, phrases and ideas with conjunctions that express a real relationship such as addition, contrast, choice, cause or result instead of making sentences longer for its own sake.',
    includedConcepts: ['and but or', 'because and so', 'coordinating connections', 'meaning between joined ideas'],
    prerequisiteSkillIds: ['prepositions'],
    nextSkillIds: ['clauses-sentence-combining', 'paragraph-writing'],
  }),
  skill({
    id: 'subject-verb-agreement',
    order: 8,
    label: 'Agreement',
    cluster: 'verb-control',
    primaryDomainId: 'verb-tense-agreement',
    summary: 'Match subjects and verb forms accurately across common sentence patterns, including the high-frequency singular and plural contrasts children need before more complex tense control.',
    includedConcepts: ['singular and plural subjects', 'present-tense agreement', 'be and have agreement', 'agreement in expanded sentences'],
    prerequisiteSkillIds: ['nouns-pronouns', 'verbs'],
    nextSkillIds: ['tenses', 'editing-revision'],
  }),
  skill({
    id: 'tenses',
    order: 9,
    label: 'Tenses',
    cluster: 'verb-control',
    primaryDomainId: 'verb-tense-agreement',
    summary: 'Use verb systems to place events in time and maintain time meaning across connected language. GR1 owns the concept node; GR2 will define the detailed simple, continuous, perfect and future-form architecture.',
    includedConcepts: ['present time', 'past time', 'future time', 'tense choice and consistency'],
    prerequisiteSkillIds: ['verbs', 'subject-verb-agreement'],
    nextSkillIds: ['clauses-sentence-combining', 'paragraph-writing', 'descriptive-narrative-writing', 'editing-revision'],
  }),
  skill({
    id: 'clauses-sentence-combining',
    order: 10,
    label: 'Clauses & Sentence Combining',
    cluster: 'sentence-connection',
    primaryDomainId: 'clauses-connectives',
    summary: 'Combine related ideas by recognising complete and dependent clause relationships, choosing an appropriate connection and preserving clarity instead of turning every response into one long sentence.',
    includedConcepts: ['independent clauses', 'dependent clauses', 'sentence combining', 'cause contrast sequence and condition relationships'],
    prerequisiteSkillIds: ['adjectives-adverbs', 'prepositions', 'conjunctions', 'tenses'],
    nextSkillIds: ['punctuation', 'paragraph-writing'],
  }),
  skill({
    id: 'punctuation',
    order: 11,
    label: 'Punctuation',
    cluster: 'sentence-conventions',
    primaryDomainId: 'punctuation-conventions',
    summary: 'Use capitals and age-appropriate punctuation to show sentence boundaries and meaning, then extend that control to punctuation needed inside increasingly connected sentences.',
    includedConcepts: ['capital letters', 'full stops question marks and exclamation marks', 'commas in age-appropriate contexts', 'apostrophes and sentence-boundary editing'],
    prerequisiteSkillIds: ['sentence-foundations', 'articles-determiners', 'clauses-sentence-combining'],
    nextSkillIds: ['paragraph-writing', 'editing-revision'],
  }),
  skill({
    id: 'paragraph-writing',
    order: 12,
    label: 'Paragraph Writing',
    cluster: 'writing',
    primaryDomainId: 'cohesion-paragraphs',
    summary: 'Organise several related sentences around one clear focus using relevant detail, logical order, reference and useful connections so a paragraph reads as one unit rather than a list.',
    includedConcepts: ['main idea and focus', 'relevant supporting detail', 'logical order', 'cohesion across sentences'],
    prerequisiteSkillIds: ['conjunctions', 'tenses', 'clauses-sentence-combining', 'punctuation'],
    nextSkillIds: ['descriptive-narrative-writing', 'editing-revision'],
  }),
  skill({
    id: 'descriptive-narrative-writing',
    order: 13,
    label: 'Descriptive & Narrative Writing',
    cluster: 'writing',
    primaryDomainId: 'composition-idea-development',
    summary: 'Develop and organise description and narrative by selecting purposeful details, maintaining a clear sequence or focus, and using grammar choices to serve meaning rather than treating composition as a grammar worksheet.',
    includedConcepts: ['purposeful descriptive detail', 'event sequence', 'character action and setting', 'coherent narrative development'],
    prerequisiteSkillIds: ['adjectives-adverbs', 'tenses', 'paragraph-writing'],
    nextSkillIds: ['editing-revision'],
  }),
  skill({
    id: 'editing-revision',
    order: 14,
    label: 'Editing & Revision',
    cluster: 'transfer',
    primaryDomainId: 'editing-transfer',
    summary: 'Review fresh writing for meaning, structure, grammar, tense consistency, word choice and punctuation, then make purposeful revisions so known rules transfer beyond controlled exercises.',
    includedConcepts: ['meaning and organisation review', 'grammar and tense correction', 'punctuation correction', 'word-choice and clarity revision'],
    prerequisiteSkillIds: ['subject-verb-agreement', 'tenses', 'punctuation', 'paragraph-writing', 'descriptive-narrative-writing'],
    nextSkillIds: [],
  }),
]);

const domainIds = new Set(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((item) => item.id));
const skillsById = new Map(GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => [item.id, item]));

export const GRAMMAR_WRITING_SKILL_EDGES = freezeList(
  GRAMMAR_WRITING_SKILL_TAXONOMY.flatMap((source) =>
    source.nextSkillIds.map((targetSkillId) => freeze({ sourceSkillId: source.id, relation: 'next', targetSkillId })),
  ),
);

export const getGrammarWritingSkill = (id) => skillsById.get(String(id || '')) ?? null;
export const getGrammarWritingPrerequisiteSkills = (id) => freezeList(
  (getGrammarWritingSkill(id)?.prerequisiteSkillIds ?? []).map((skillId) => getGrammarWritingSkill(skillId)).filter(Boolean),
);
export const getGrammarWritingNextSkills = (id) => freezeList(
  (getGrammarWritingSkill(id)?.nextSkillIds ?? []).map((skillId) => getGrammarWritingSkill(skillId)).filter(Boolean),
);
export const getGrammarWritingSkillsForDomain = (domainId) => freezeList(
  GRAMMAR_WRITING_SKILL_TAXONOMY.filter((item) => item.primaryDomainId === String(domainId || '')),
);

function canReach(startId, targetId) {
  const seen = new Set();
  const queue = [startId];
  while (queue.length) {
    const currentId = queue.shift();
    if (currentId === targetId) return true;
    if (seen.has(currentId)) continue;
    seen.add(currentId);
    const current = skillsById.get(currentId);
    for (const nextId of current?.nextSkillIds ?? []) queue.push(nextId);
  }
  return false;
}

if (skillsById.size !== GRAMMAR_WRITING_SKILL_TAXONOMY.length) throw new Error('GR1 contains duplicate grammar/writing skill IDs.');
if (GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.order).join(',') !== Array.from({ length: 14 }, (_, index) => index + 1).join(',')) {
  throw new Error('GR1 grammar/writing skill order must remain explicit and stable from 1 through 14.');
}
for (const item of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  if (!domainIds.has(item.primaryDomainId)) throw new Error(`GR1 skill has an unknown R17 domain: ${item.id}.`);
  if (!item.summary || item.summary.length < 90) throw new Error(`GR1 skill summary is too thin: ${item.id}.`);
  if (!item.includedConcepts.length) throw new Error(`GR1 skill needs included concepts: ${item.id}.`);
  for (const prerequisiteId of item.prerequisiteSkillIds) {
    if (!skillsById.has(prerequisiteId)) throw new Error(`GR1 skill has an unknown prerequisite: ${item.id} -> ${prerequisiteId}.`);
    if (prerequisiteId === item.id) throw new Error(`GR1 skill cannot prerequisite itself: ${item.id}.`);
    if (!skillsById.get(prerequisiteId).nextSkillIds.includes(item.id)) throw new Error(`GR1 prerequisite edge is not reciprocal: ${prerequisiteId} -> ${item.id}.`);
  }
  for (const nextId of item.nextSkillIds) {
    if (!skillsById.has(nextId)) throw new Error(`GR1 skill has an unknown next skill: ${item.id} -> ${nextId}.`);
    if (nextId === item.id) throw new Error(`GR1 skill cannot point to itself: ${item.id}.`);
    if (!skillsById.get(nextId).prerequisiteSkillIds.includes(item.id)) throw new Error(`GR1 next-skill edge is not reciprocal: ${item.id} -> ${nextId}.`);
  }
}
if (getGrammarWritingSkill(GRAMMAR_WRITING_TAXONOMY_ROOT_ID)?.prerequisiteSkillIds.length) throw new Error('GR1 root skill must not have prerequisites.');
if (getGrammarWritingSkill(GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID)?.nextSkillIds.length) throw new Error('GR1 terminal skill must not have next skills.');
for (const item of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  if (!canReach(GRAMMAR_WRITING_TAXONOMY_ROOT_ID, item.id)) throw new Error(`GR1 skill is unreachable from the root: ${item.id}.`);
  if (!canReach(item.id, GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID)) throw new Error(`GR1 skill cannot reach editing/revision: ${item.id}.`);
}
for (const domainId of domainIds) {
  if (!GRAMMAR_WRITING_SKILL_TAXONOMY.some((item) => item.primaryDomainId === domainId)) throw new Error(`GR1 leaves an R17 domain unmapped: ${domainId}.`);
}
