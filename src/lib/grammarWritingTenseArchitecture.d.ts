export type GrammarWritingCurriculumAnchor = Readonly<{
  courseSlug: 'basic-grammar' | 'advanced-grammar';
  lessonNumber: number;
  lessonTitle: string;
}>;

export type GrammarWritingTenseTeachingPrinciple = Readonly<{
  id: string;
  statement: string;
}>;

export type GrammarWritingTenseNode = Readonly<{
  id: string;
  order: number;
  label: string;
  family: 'simple' | 'continuous' | 'future' | 'future-system' | 'perfect' | 'transfer';
  timeFrame: string;
  childFriendlyMeaning: string;
  formPatterns: readonly string[];
  meaningUses: readonly string[];
  timeClues: readonly string[];
  examples: readonly string[];
  teachingBoundary: string;
  prerequisiteTenseIds: readonly string[];
  nextTenseIds: readonly string[];
  comparisonIds: readonly string[];
  commonErrorIds: readonly string[];
  writingApplications: readonly string[];
  curriculumAnchors: readonly GrammarWritingCurriculumAnchor[];
}>;

export type GrammarWritingTenseComparison = Readonly<{
  id: string;
  order: number;
  label: string;
  tenseIds: readonly string[];
  decisionQuestion: string;
  distinction: string;
  contrastExamples: readonly string[];
  commonErrorIds: readonly string[];
  curriculumAnchors: readonly GrammarWritingCurriculumAnchor[];
}>;

export type GrammarWritingTenseErrorPattern = Readonly<{
  id: string;
  category: 'form' | 'meaning' | 'morphology' | 'consistency' | 'strategy' | 'transfer';
  tenseIds: readonly string[];
  incorrectExample: string;
  correction: string;
  diagnosis: string;
  teachingResponse: string;
}>;

export type GrammarWritingTenseNextEdge = Readonly<{
  sourceTenseId: string;
  relation: 'next';
  targetTenseId: string;
}>;

export const GRAMMAR_WRITING_TENSE_REVISION: string;
export const GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID: 'tenses';
export const GRAMMAR_WRITING_TENSE_ROOT_ID: 'simple-present';
export const GRAMMAR_WRITING_TENSE_TERMINAL_ID: 'tense-consistency-transfer';
export const GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES: readonly GrammarWritingTenseTeachingPrinciple[];
export const GRAMMAR_WRITING_TENSE_NODES: readonly GrammarWritingTenseNode[];
export const GRAMMAR_WRITING_TENSE_COMPARISONS: readonly GrammarWritingTenseComparison[];
export const GRAMMAR_WRITING_TENSE_ERROR_PATTERNS: readonly GrammarWritingTenseErrorPattern[];
export const GRAMMAR_WRITING_TENSE_NEXT_EDGES: readonly GrammarWritingTenseNextEdge[];

export function getGrammarWritingTense(id: string): GrammarWritingTenseNode | null;
export function getGrammarWritingTensePrerequisites(id: string): readonly GrammarWritingTenseNode[];
export function getGrammarWritingNextTenses(id: string): readonly GrammarWritingTenseNode[];
export function getGrammarWritingTenseComparison(id: string): GrammarWritingTenseComparison | null;
export function getGrammarWritingTenseComparisonsForTense(tenseId: string): readonly GrammarWritingTenseComparison[];
export function getGrammarWritingTenseErrorPattern(id: string): GrammarWritingTenseErrorPattern | null;
export function getGrammarWritingTenseErrorsForTense(tenseId: string): readonly GrammarWritingTenseErrorPattern[];
