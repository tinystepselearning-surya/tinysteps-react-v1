export type GrammarWritingSkillCluster =
  | 'sentence-foundations'
  | 'word-grammar'
  | 'sentence-expansion'
  | 'sentence-connection'
  | 'verb-control'
  | 'sentence-conventions'
  | 'writing'
  | 'transfer';

export type GrammarWritingSkillId =
  | 'sentence-foundations'
  | 'nouns-pronouns'
  | 'verbs'
  | 'adjectives-adverbs'
  | 'articles-determiners'
  | 'prepositions'
  | 'conjunctions'
  | 'subject-verb-agreement'
  | 'tenses'
  | 'clauses-sentence-combining'
  | 'punctuation'
  | 'paragraph-writing'
  | 'descriptive-narrative-writing'
  | 'editing-revision';

export type GrammarWritingR17DomainId =
  | 'word-classes-morphology'
  | 'sentence-core'
  | 'sentence-expansion'
  | 'verb-tense-agreement'
  | 'clauses-connectives'
  | 'punctuation-conventions'
  | 'cohesion-paragraphs'
  | 'composition-idea-development'
  | 'editing-transfer';

export interface GrammarWritingSkill {
  readonly id: GrammarWritingSkillId;
  readonly order: number;
  readonly label: string;
  readonly cluster: GrammarWritingSkillCluster;
  readonly primaryDomainId: GrammarWritingR17DomainId;
  readonly summary: string;
  readonly includedConcepts: readonly string[];
  readonly prerequisiteSkillIds: readonly GrammarWritingSkillId[];
  readonly nextSkillIds: readonly GrammarWritingSkillId[];
}

export interface GrammarWritingSkillEdge {
  readonly sourceSkillId: GrammarWritingSkillId;
  readonly relation: 'next';
  readonly targetSkillId: GrammarWritingSkillId;
}

export const GRAMMAR_WRITING_TAXONOMY_REVISION: '2026-09-10-gr1';
export const GRAMMAR_WRITING_TAXONOMY_ROOT_ID: 'sentence-foundations';
export const GRAMMAR_WRITING_TAXONOMY_TERMINAL_ID: 'editing-revision';
export const GRAMMAR_WRITING_SKILL_TAXONOMY: readonly GrammarWritingSkill[];
export const GRAMMAR_WRITING_SKILL_EDGES: readonly GrammarWritingSkillEdge[];

export function getGrammarWritingSkill(id: string): GrammarWritingSkill | null;
export function getGrammarWritingPrerequisiteSkills(id: string): readonly GrammarWritingSkill[];
export function getGrammarWritingNextSkills(id: string): readonly GrammarWritingSkill[];
export function getGrammarWritingSkillsForDomain(domainId: string): readonly GrammarWritingSkill[];
