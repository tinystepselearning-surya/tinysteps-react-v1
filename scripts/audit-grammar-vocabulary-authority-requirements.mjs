import {
  AUTHORITY_PAGE_REQUIRED_SECTIONS,
  AUTHORITY_PUBLICATION_GATES,
  GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS,
  GRAMMAR_VOCABULARY_AUTHORITY_REVISION,
  GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS,
  GRAMMAR_VOCABULARY_SOURCE_BASIS,
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_HUB_REQUIREMENT,
  VOCABULARY_KNOWLEDGE_STAGES,
} from '../src/lib/grammarVocabularyAuthorityRequirements.js';
import {
  GRAMMAR_PROGRAMMATIC_PATHS,
  GRAMMAR_PROGRAMMATIC_SEQUENCE,
} from '../src/lib/grammarProgrammaticRegistry.js';

const fail = (code, detail) => {
  console.error(`[GV1:${code}] ${detail}`);
  process.exitCode = 1;
};

if (GRAMMAR_VOCABULARY_AUTHORITY_REVISION !== '2026-09-27-gv1') {
  fail('revision', `Unexpected revision: ${GRAMMAR_VOCABULARY_AUTHORITY_REVISION}`);
}
if (GRAMMAR_PROGRAMMATIC_SEQUENCE.length !== 38) {
  fail('grammar-core-boundary', `Expected the established 38-step Grammar sequence; found ${GRAMMAR_PROGRAMMATIC_SEQUENCE.length}.`);
}
if (GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS.length !== 12) {
  fail('grammar-reference-count', `Expected 12 Grammar reference-extension requirements; found ${GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS.length}.`);
}
if (VOCABULARY_KNOWLEDGE_STAGES.length !== 6) {
  fail('vocabulary-stage-count', `Expected 6 Vocabulary stages; found ${VOCABULARY_KNOWLEDGE_STAGES.length}.`);
}
if (VOCABULARY_AUTHORITY_REQUIREMENTS.length !== 16) {
  fail('vocabulary-topic-count', `Expected 16 Vocabulary authority requirements; found ${VOCABULARY_AUTHORITY_REQUIREMENTS.length}.`);
}
if (VOCABULARY_HUB_REQUIREMENT.proposedPath !== '/resources/vocabulary') {
  fail('vocabulary-hub', 'Vocabulary authority hub must remain /resources/vocabulary.');
}
if (VOCABULARY_HUB_REQUIREMENT.practicePath !== '/free-games/word-meaning-flashcards') {
  fail('vocabulary-practice-boundary', 'Vocabulary Adventure must remain the declared practice surface.');
}

if (AUTHORITY_PUBLICATION_GATES.minimumKnowledgeWords < 600) {
  fail('thin-content-gate', 'Authority pages must require at least 600 knowledge words before publication.');
}
if (AUTHORITY_PUBLICATION_GATES.minimumAuthoritativeReferences < 2) {
  fail('reference-gate', 'Authority pages must require at least two authoritative references.');
}
if (AUTHORITY_PAGE_REQUIRED_SECTIONS.length < 10 || !AUTHORITY_PAGE_REQUIRED_SECTIONS.includes('references')) {
  fail('section-contract', 'Authority-page section contract is incomplete.');
}

const existingGrammarPaths = new Set(GRAMMAR_PROGRAMMATIC_PATHS);
const allRequirements = [...GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS, ...VOCABULARY_AUTHORITY_REQUIREMENTS];
const seenIds = new Set();
const seenPaths = new Set();

for (const item of allRequirements) {
  if (seenIds.has(item.id)) fail('duplicate-id', item.id);
  seenIds.add(item.id);
  if (seenPaths.has(item.proposedPath)) fail('duplicate-path', item.proposedPath);
  seenPaths.add(item.proposedPath);
  if (item.publicationApproved !== false) fail('premature-publication', item.id);
  if (item.requiredSections.length !== AUTHORITY_PAGE_REQUIRED_SECTIONS.length) fail('section-parity', item.id);
  if (!item.evidenceFamilyIds.length) fail('evidence-family', item.id);
  if (!item.childOutcomes.length) fail('child-outcomes', item.id);
}

for (const item of GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS) {
  if (!item.proposedPath.startsWith('/resources/grammar/')) fail('grammar-namespace', item.proposedPath);
  if (existingGrammarPaths.has(item.proposedPath)) fail('grammar-collision', item.proposedPath);
  if (!item.rationale || item.rationale.length < 90) fail('grammar-rationale', item.id);
  if ((item.practiceTargets || []).length < 3) fail('grammar-practice', item.id);
}

for (const item of VOCABULARY_AUTHORITY_REQUIREMENTS) {
  if (!item.proposedPath.startsWith('/resources/vocabulary/')) fail('vocabulary-namespace', item.proposedPath);
  if ((item.semanticDomains || []).length < 2) fail('vocabulary-domains', item.id);
  if ((item.practiceModes || []).length < 3) fail('vocabulary-practice', item.id);
  if (!(item.crossLinks || []).length) fail('vocabulary-crosslinks', item.id);
}

const stagedTopicIds = VOCABULARY_KNOWLEDGE_STAGES.flatMap((stage) => stage.topicIds);
if (stagedTopicIds.length !== VOCABULARY_AUTHORITY_REQUIREMENTS.length) {
  fail('stage-topic-count', `Stages expose ${stagedTopicIds.length} placements for ${VOCABULARY_AUTHORITY_REQUIREMENTS.length} topics.`);
}
if (new Set(stagedTopicIds).size !== stagedTopicIds.length) {
  fail('stage-topic-duplicate', 'A Vocabulary authority topic appears in more than one stage.');
}
for (const topic of VOCABULARY_AUTHORITY_REQUIREMENTS) {
  if (!stagedTopicIds.includes(topic.id)) fail('stage-topic-missing', topic.id);
}

for (const source of Object.values(GRAMMAR_VOCABULARY_SOURCE_BASIS)) {
  if (!source.url.startsWith('https://')) fail('source-url', source.id);
  if (!source.use || source.use.length < 60) fail('source-use', source.id);
}

for (const [key, value] of Object.entries(GRAMMAR_VOCABULARY_CROSS_DOMAIN_REQUIREMENTS)) {
  if (!value || value.length < 80) fail('boundary', key);
}

if (!process.exitCode) {
  console.log(JSON.stringify({
    brick: 'GV1',
    revision: GRAMMAR_VOCABULARY_AUTHORITY_REVISION,
    grammarCoreStepsPreserved: GRAMMAR_PROGRAMMATIC_SEQUENCE.length,
    grammarReferenceRequirements: GRAMMAR_REFERENCE_EXTENSION_REQUIREMENTS.length,
    vocabularyStages: VOCABULARY_KNOWLEDGE_STAGES.length,
    vocabularyAuthorityRequirements: VOCABULARY_AUTHORITY_REQUIREMENTS.length,
    vocabularyHub: VOCABULARY_HUB_REQUIREMENT.proposedPath,
    qualityGate: AUTHORITY_PUBLICATION_GATES,
    publicationApproved: false,
    status: 'PASS',
  }, null, 2));
}
