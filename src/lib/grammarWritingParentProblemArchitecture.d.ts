export type GrammarWritingParentProblemId =
  | 'knows-rules-but-does-not-use-them'
  | 'mixes-tenses'
  | 'incomplete-sentences'
  | 'very-short-sentences'
  | 'repetitive-sentence-beginnings'
  | 'limited-descriptive-vocabulary'
  | 'cannot-organise-paragraphs'
  | 'poor-punctuation'
  | 'weak-editing'
  | 'speaking-grammar-does-not-transfer-to-writing';

export type GrammarWritingParentProblemCoverageMode =
  | 'direct-existing-owner'
  | 'supported-by-existing-owners';

export type GrammarWritingGr5PracticeKind =
  | 'tense-comparison'
  | 'sentence-builder'
  | 'sentence-expansion'
  | 'error-correction'
  | 'punctuation-challenge'
  | 'editing-practice'
  | 'paragraph-organiser'
  | 'conjunction-practice'
  | 'tense-choice';

export interface GrammarWritingParentProblemPrinciple {
  readonly id: string;
  readonly statement: string;
}

export interface GrammarWritingParentProblem {
  readonly id: GrammarWritingParentProblemId;
  readonly order: number;
  readonly label: string;
  readonly problemClass: string;
  readonly parentObservation: string;
  readonly observableSignals: readonly string[];
  readonly diagnosticQuestions: readonly string[];
  readonly likelyBreakdowns: readonly string[];
  readonly firstTeachingMove: string;
  readonly gr1SkillIds: readonly string[];
  readonly gr2TenseIds: readonly string[];
  readonly gr3WritingStageIds: readonly string[];
  readonly relatedProblemIds: readonly GrammarWritingParentProblemId[];
  readonly interventionSequence: readonly string[];
  readonly progressSignals: readonly string[];
  readonly recommendedPracticeKinds: readonly GrammarWritingGr5PracticeKind[];
  readonly coverageMode: GrammarWritingParentProblemCoverageMode;
  readonly primaryPublicTopicId: string;
  readonly publicAnchorTopicIds: readonly string[];
  readonly coverageRationale: string;
}

export interface GrammarWritingParentProblemSkillEdge {
  readonly problemId: GrammarWritingParentProblemId;
  readonly relation: 'depends-on-skill';
  readonly skillId: string;
}

export interface GrammarWritingParentProblemTenseEdge {
  readonly problemId: GrammarWritingParentProblemId;
  readonly relation: 'depends-on-tense-control';
  readonly tenseId: string;
}

export interface GrammarWritingParentProblemWritingEdge {
  readonly problemId: GrammarWritingParentProblemId;
  readonly relation: 'appears-in-writing-stage';
  readonly writingStageId: string;
}

export const GRAMMAR_WRITING_PARENT_PROBLEM_REVISION: '2026-09-10-gr4';
export const GRAMMAR_WRITING_PARENT_PROBLEM_PRINCIPLES: readonly GrammarWritingParentProblemPrinciple[];
export const GRAMMAR_WRITING_GR5_PRACTICE_KINDS: readonly GrammarWritingGr5PracticeKind[];
export const GRAMMAR_WRITING_PARENT_PROBLEMS: readonly GrammarWritingParentProblem[];
export const GRAMMAR_WRITING_PARENT_PROBLEM_SKILL_EDGES: readonly GrammarWritingParentProblemSkillEdge[];
export const GRAMMAR_WRITING_PARENT_PROBLEM_TENSE_EDGES: readonly GrammarWritingParentProblemTenseEdge[];
export const GRAMMAR_WRITING_PARENT_PROBLEM_WRITING_EDGES: readonly GrammarWritingParentProblemWritingEdge[];

export function getGrammarWritingParentProblem(id: string): GrammarWritingParentProblem | null;
export function getGrammarWritingParentProblemsForSkill(skillId: string): readonly GrammarWritingParentProblem[];
export function getGrammarWritingParentProblemsForTense(tenseId: string): readonly GrammarWritingParentProblem[];
export function getGrammarWritingParentProblemsForWritingStage(stageId: string): readonly GrammarWritingParentProblem[];
export function getGrammarWritingParentProblemsForPracticeKind(practiceKind: string): readonly GrammarWritingParentProblem[];
export function getGrammarWritingParentProblemsByCoverageMode(coverageMode: string): readonly GrammarWritingParentProblem[];
