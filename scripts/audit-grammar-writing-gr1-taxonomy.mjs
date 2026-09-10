#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_WRITING_KNOWLEDGE_DOMAINS } from '../src/lib/grammarWritingKnowledgeArchitecture.js';
import {
  GRAMMAR_WRITING_SKILL_EDGES,
  GRAMMAR_WRITING_SKILL_TAXONOMY,
  GRAMMAR_WRITING_TAXONOMY_REVISION,
  GRAMMAR_WRITING_TAXONOMY_ROOT_ID,
  GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID,
  getGrammarWritingNextSkills,
  getGrammarWritingPrerequisiteSkills,
  getGrammarWritingSkill,
  getGrammarWritingSkillsForDomain,
} from '../src/lib/grammarWritingKnowledgeTaxonomy.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

const expectedIds = [
  'sentence-foundations',
  'nouns-pronouns',
  'verbs',
  'adjectives-adverbs',
  'articles-determiners',
  'prepositions',
  'conjunctions',
  'subject-verb-agreement',
  'tenses',
  'clauses-sentence-combining',
  'punctuation',
  'paragraph-writing',
  'descriptive-narrative-writing',
  'editing-revision',
];

const actualIds = GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.id);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) add('taxonomy-order', 'grammar-writing', `Expected ${expectedIds.join(', ')}, got ${actualIds.join(', ')}.`);
if (new Set(actualIds).size !== actualIds.length) add('duplicate-skill-id', 'grammar-writing', 'Skill IDs must be unique.');
if (GRAMMAR_WRITING_SKILL_TAXONOMY.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9,10,11,12,13,14') add('unstable-order', 'grammar-writing', 'Skill order must remain 1 through 14.');

const domainIds = new Set(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((item) => item.id));
for (const skill of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  if (!domainIds.has(skill.primaryDomainId)) add('unknown-domain', skill.id, skill.primaryDomainId);
  if (!skill.summary || skill.summary.length < 90) add('thin-summary', skill.id, 'Skill summary is too thin for downstream architecture work.');
  if (!skill.includedConcepts?.length) add('missing-concepts', skill.id, 'Every skill must declare included concepts.');
  if (skill.id !== GRAMMAR_WRITING_TAXONOMY_ROOT_ID && !skill.prerequisiteSkillIds?.length) add('missing-prerequisite', skill.id, 'Only the taxonomy root may omit prerequisites.');
  if (skill.id !== GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID && !skill.nextSkillIds?.length) add('missing-next', skill.id, 'Only editing/revision may omit next skills.');

  const forbiddenPublicationFields = ['path', 'ownerPath', 'proposedPath', 'canonicalTopicId', 'queryIntent', 'publicationApproved'];
  for (const field of forbiddenPublicationFields) {
    if (Object.prototype.hasOwnProperty.call(skill, field)) add('publication-boundary', skill.id, `GR1 taxonomy must not define ${field}.`);
  }

  for (const prerequisite of getGrammarWritingPrerequisiteSkills(skill.id)) {
    if (!prerequisite.nextSkillIds.includes(skill.id)) add('nonreciprocal-prerequisite', skill.id, prerequisite.id);
  }
  for (const next of getGrammarWritingNextSkills(skill.id)) {
    if (!next.prerequisiteSkillIds.includes(skill.id)) add('nonreciprocal-next', skill.id, next.id);
  }
}

for (const domain of GRAMMAR_WRITING_KNOWLEDGE_DOMAINS) {
  if (!getGrammarWritingSkillsForDomain(domain.id).length) add('unmapped-r17-domain', domain.id, 'Every R17 domain must be represented in GR1.');
}

if (getGrammarWritingSkill(GRAMMAR_WRITING_TAXONOMY_ROOT_ID)?.label !== 'Sentence Foundations') add('wrong-root', GRAMMAR_WRITING_TAXONOMY_ROOT_ID, 'Sentence Foundations must remain the root node.');
if (getGrammarWritingSkill(GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID)?.label !== 'Editing & Revision') add('wrong-terminal', GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID, 'Editing & Revision must remain the terminal transfer node.');
if (!getGrammarWritingSkill('tenses')?.summary.includes('GR2')) add('tense-boundary', 'tenses', 'GR1 must explicitly defer detailed tense architecture to GR2.');

const edgeKeys = GRAMMAR_WRITING_SKILL_EDGES.map((edge) => `${edge.sourceSkillId}->${edge.targetSkillId}`);
if (new Set(edgeKeys).size !== edgeKeys.length) add('duplicate-edge', 'grammar-writing', 'Skill edges must be unique.');
for (const edge of GRAMMAR_WRITING_SKILL_EDGES) {
  if (edge.relation !== 'next') add('unexpected-edge-relation', edge.sourceSkillId, edge.relation);
  if (!getGrammarWritingSkill(edge.sourceSkillId) || !getGrammarWritingSkill(edge.targetSkillId)) add('unresolved-edge', edge.sourceSkillId, edge.targetSkillId);
}

const taxonomySource = fs.readFileSync(path.join(root, 'src/lib/grammarWritingKnowledgeTaxonomy.js'), 'utf8');
if (!taxonomySource.includes('not a claim that every')) add('nonlinear-boundary-copy', 'grammar-writing', 'GR1 must preserve the non-rigid learning-sequence boundary in source documentation.');
if (!taxonomySource.includes('without creating a second taxonomy')) add('single-taxonomy-boundary', 'grammar-writing', 'GR1 must explicitly remain an extension of the R17 canonical model.');

const summary = {
  revision: GRAMMAR_WRITING_TAXONOMY_REVISION,
  skills: GRAMMAR_WRITING_SKILL_TAXONOMY.length,
  edges: GRAMMAR_WRITING_SKILL_EDGES.length,
  r17DomainsCovered: GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.filter((domain) => getGrammarWritingSkillsForDomain(domain.id).length).length,
  root: GRAMMAR_WRITING_TAXONOMY_ROOT_ID,
  terminal: GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID,
};

const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/grammar-writing-gr1-taxonomy.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: GR1 freezes ${summary.skills} grammar/writing skill nodes across all ${summary.r17DomainsCovered} R17 domains with ${summary.edges} explicit next-skill edges.`);
