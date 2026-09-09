const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const domain = (id, order, label, summary, adjacentDomainIds = []) => freeze({
  id,
  order,
  label,
  summary,
  adjacentDomainIds: freezeList(adjacentDomainIds),
});
const auditRecord = (config) => freeze({
  canonicalTopicId: null,
  path: null,
  proposedPath: null,
  reasons: freezeList(config.reasons),
  ...config,
});

export const GRAMMAR_WRITING_KNOWLEDGE_REVISION = '2026-09-09-r17';
export const GRAMMAR_WRITING_CONTENT_ACTIONS = Object.freeze(['keep', 'refresh', 'consolidate', 'create']);

/**
 * R17 is a knowledge map, not a claim that grammar and writing develop in one
 * rigid staircase. Children can work across several domains at once, and oral
 * language, vocabulary, reading and writing all interact with grammar use.
 */
export const GRAMMAR_WRITING_KNOWLEDGE_DOMAINS = freezeList([
  domain('word-classes-morphology', 1, 'Word classes & morphology', 'How nouns, verbs, adjectives, pronouns, articles, plurals and word forms contribute meaning inside sentences rather than as labels learned in isolation.', ['sentence-core', 'verb-tense-agreement']),
  domain('sentence-core', 2, 'Sentence core', 'How a child expresses one complete idea with a clear subject-predicate relationship, usable word order and enough structure for the sentence to stand independently.', ['word-classes-morphology', 'sentence-expansion', 'verb-tense-agreement']),
  domain('sentence-expansion', 3, 'Sentence expansion', 'How children add useful detail about where, when, how, why or which one while keeping the underlying sentence clear and grammatically manageable.', ['sentence-core', 'clauses-connectives']),
  domain('verb-tense-agreement', 4, 'Verb systems: tense & agreement', 'How verb forms express time and agree with the subject, including the practical transfer of present, past and future forms into connected speaking and writing.', ['sentence-core', 'word-classes-morphology', 'clauses-connectives']),
  domain('clauses-connectives', 5, 'Clauses & connectives', 'How conjunctions and clause relationships connect ideas such as addition, contrast, cause and result without encouraging children to make every sentence longer.', ['sentence-expansion', 'cohesion-paragraphs']),
  domain('punctuation-conventions', 6, 'Punctuation & conventions', 'How capitals, sentence-ending punctuation, commas and other age-appropriate conventions help readers see sentence boundaries and intended meaning.', ['sentence-core', 'editing-transfer', 'cohesion-paragraphs']),
  domain('cohesion-paragraphs', 7, 'Cohesion & paragraphs', 'How related sentences stay focused on one main idea through logical order, reference, connectives and paragraph structure rather than being a loose list of sentences.', ['clauses-connectives', 'punctuation-conventions', 'composition-idea-development']),
  domain('composition-idea-development', 8, 'Composition & idea development', 'How children plan, develop and organise ideas for stories and other writing while grammar serves communication rather than replacing idea generation.', ['cohesion-paragraphs', 'editing-transfer']),
  domain('editing-transfer', 9, 'Editing & independent transfer', 'How known grammar and writing choices survive in fresh speaking and writing, and how children learn to notice, explain and repair errors without relying on prompts every time.', ['punctuation-conventions', 'composition-idea-development', 'verb-tense-agreement']),
]);

/**
 * High-value content audit only. Existing pages are preserved when they already
 * own a useful parent intent. CREATE is reserved for a genuine missing utility,
 * not a reason to split every grammar label into a separate article.
 */
export const GRAMMAR_WRITING_CONTENT_AUDIT = freezeList([
  auditRecord({
    id: 'grammar-roadmap',
    domainId: 'sentence-core',
    action: 'keep',
    path: '/blog/grammar-nouns-to-paragraphs',
    canonicalTopicId: 'grammar-progression',
    reasons: ['Established broad parent roadmap from words into sentences and paragraphs.', 'Already explains word classes in context, so a separate generic parts-of-speech pillar would add little value.'],
  }),
  auditRecord({
    id: 'sentence-formation',
    domainId: 'sentence-core',
    action: 'keep',
    path: '/blog/how-to-improve-sentence-formation-in-kids',
    canonicalTopicId: 'sentence-formation',
    reasons: ['Established diagnostic owner for building and expanding a complete sentence.', 'Should remain distinct from grammar-rule transfer and one-word speaking responses.'],
  }),
  auditRecord({
    id: 'grammar-transfer',
    domainId: 'editing-transfer',
    action: 'keep',
    path: '/blog/child-knows-grammar-but-makes-mistakes',
    canonicalTopicId: 'grammar-transfer-mistakes',
    reasons: ['Established problem-aware owner for rules that disappear in spontaneous use.', 'Provides the correct destination when worksheet knowledge does not transfer.'],
  }),
  auditRecord({
    id: 'tenses-parent-guide',
    domainId: 'verb-tense-agreement',
    action: 'keep',
    path: '/blog/grammar-tenses',
    reasons: ['Existing focused guide owns simple present, past and future for children.', 'A second generic tenses article would duplicate a strong established route.'],
  }),
  auditRecord({
    id: 'subject-verb-agreement-guide',
    domainId: 'verb-tense-agreement',
    action: 'keep',
    path: '/blog/grammar-subject-verb',
    reasons: ['Existing focused guide owns subject-verb agreement mistakes and correction.', 'Agreement should remain distinct from the broader tenses guide.'],
  }),
  auditRecord({
    id: 'conjunctions-guide',
    domainId: 'clauses-connectives',
    action: 'keep',
    path: '/blog/grammar-conjunctions',
    reasons: ['Existing guide already owns practical use of and, but, because and so.', 'No need to generate separate thin articles for each beginner conjunction.'],
  }),
  auditRecord({
    id: 'creative-writing-scaffolds',
    domainId: 'composition-idea-development',
    action: 'keep',
    path: '/blog/grammar-creative-writing',
    reasons: ['Existing resource owns scaffolded creative-writing support rather than grammar labels.', 'Keeps idea development separate from the mechanics of punctuation and editing.'],
  }),
  auditRecord({
    id: 'editing-practice',
    domainId: 'editing-transfer',
    action: 'keep',
    path: '/blog/grammar-editing-camp',
    reasons: ['Existing editing resource gives children a find-and-fix application route.', 'Supports transfer without competing with the diagnostic grammar-mistakes page.'],
  }),
  auditRecord({
    id: 'grammar-assessment',
    domainId: 'editing-transfer',
    action: 'keep',
    path: '/blog/grammar-assessment',
    reasons: ['Existing parent checklist observes patterns across grammar skills and fresh writing.', 'It is an observational support resource, not a reason to create separate assessment pages per grammar label.'],
  }),
  auditRecord({
    id: 'punctuation-capitalisation-parent-guide',
    domainId: 'punctuation-conventions',
    action: 'create',
    proposedPath: '/blog/punctuation-and-capital-letters-for-kids',
    reasons: ['Punctuation appears inside roadmap and editing content but lacks one clear parent-facing owner for sentence boundaries, capitals and beginner punctuation choices.', 'One substantial conventions guide is preferable to thin pages for full stops, question marks, exclamation marks and capitals separately.'],
  }),
  auditRecord({
    id: 'paragraph-writing-parent-guide',
    domainId: 'cohesion-paragraphs',
    action: 'create',
    proposedPath: '/blog/how-to-teach-paragraph-writing-to-kids',
    reasons: ['The broad grammar roadmap reaches paragraphs and creative-writing content uses scaffolds, but there is no dedicated parent owner for moving from connected sentences into one coherent paragraph.', 'A future guide should focus on main idea, relevant detail, order, cohesion and revision rather than enforcing one fixed paragraph formula.'],
  }),
]);

const domainsById = new Map(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((item) => [item.id, item]));
const auditsById = new Map(GRAMMAR_WRITING_CONTENT_AUDIT.map((item) => [item.id, item]));

export const getGrammarWritingKnowledgeDomain = (id) => domainsById.get(String(id || '')) ?? null;
export const getGrammarWritingContentAuditRecord = (id) => auditsById.get(String(id || '')) ?? null;
export const getGrammarWritingContentAuditForDomain = (domainId) => freezeList(GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.domainId === String(domainId || '')));
export const getGrammarWritingContentAuditByAction = (action) => freezeList(GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.action === String(action || '')));
