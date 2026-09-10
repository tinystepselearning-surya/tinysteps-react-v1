export type GrammarWritingGr7FreezeCriterion = {
  readonly id: string;
  readonly label: string;
  readonly requirement: string;
};

export type GrammarWritingGr7Counts = {
  readonly r17Domains: number;
  readonly gr1Skills: number;
  readonly gr2Tenses: number;
  readonly gr2Comparisons: number;
  readonly gr2ErrorPatterns: number;
  readonly gr3WritingStages: number;
  readonly gr4ParentProblems: number;
  readonly gr5PracticeUtilities: number;
  readonly gr5PracticeBlueprints: number;
  readonly gr6SemanticNodes: number;
  readonly gr6SemanticEdges: number;
  readonly publicOwners: number;
  readonly publicJourneys: number;
};

export type GrammarWritingGr7PublicationPolicy = {
  readonly informationalExpansion: 'frozen';
  readonly thinMicroPages: 'hold';
  readonly duplicateIntentPages: 'hold';
  readonly newCanonicalOwners: 'evidence-required';
  readonly practicePublication: 'separate-execution-decision';
  readonly commercialSeoExpansion: 'separate-project';
  readonly rule: string;
};

export const GRAMMAR_WRITING_GR7_CLOSURE_REVISION: '2026-09-10-gr7';
export const GRAMMAR_WRITING_GR7_STATUS: 'frozen';
export const GRAMMAR_WRITING_GR7_EXPECTED_REVISIONS: Readonly<Record<'gr1' | 'gr2' | 'gr3' | 'gr4' | 'gr5' | 'gr6' | 'gr7', string>>;
export const GRAMMAR_WRITING_GR7_FREEZE_CRITERIA: readonly GrammarWritingGr7FreezeCriterion[];
export const GRAMMAR_WRITING_GR7_COUNTS: GrammarWritingGr7Counts;
export const GRAMMAR_WRITING_GR7_FROZEN_PARENT_PROBLEM_IDS: readonly string[];
export const GRAMMAR_WRITING_GR7_FROZEN_PRACTICE_KINDS: readonly string[];
export const GRAMMAR_WRITING_GR7_PUBLICATION_POLICY: GrammarWritingGr7PublicationPolicy;

export function getGrammarWritingGr7ClosureSnapshot(): Readonly<{
  revision: '2026-09-10-gr7';
  status: 'frozen';
  counts: GrammarWritingGr7Counts;
  criteria: readonly GrammarWritingGr7FreezeCriterion[];
  parentProblemIds: readonly string[];
  practiceKinds: readonly string[];
  publicOwnerIds: readonly string[];
  publicationPolicy: GrammarWritingGr7PublicationPolicy;
}>;
