export type GrammarWritingPracticeLevel = 'guided' | 'independent' | 'transfer';
export type GrammarWritingPracticeKind =
  | 'tense-comparison'
  | 'sentence-builder'
  | 'sentence-expansion'
  | 'error-correction'
  | 'punctuation-challenge'
  | 'editing-practice'
  | 'paragraph-organiser'
  | 'conjunction-practice'
  | 'tense-choice';

export type GrammarWritingPracticeBlueprint = Readonly<{
  id: string;
  practiceKind: GrammarWritingPracticeKind;
  level: GrammarWritingPracticeLevel;
  taskType: string;
  promptTemplate: string;
  requiredDataFields: readonly string[];
  variationAxes: readonly string[];
  evaluationRule: string;
}>;

export type GrammarWritingPracticeUtility = Readonly<{
  id: GrammarWritingPracticeKind;
  order: number;
  label: string;
  responseMode: string;
  purpose: string;
  targetParentProblemIds: readonly string[];
  targetGr1SkillIds: readonly string[];
  targetGr2TenseIds: readonly string[];
  targetGr3WritingStageIds: readonly string[];
  levels: readonly GrammarWritingPracticeLevel[];
  scaffoldSteps: readonly string[];
  successCriteria: readonly string[];
  feedbackRules: readonly string[];
  primaryPublicTopicId: string;
  publicAnchorTopicIds: readonly string[];
  blueprints: readonly GrammarWritingPracticeBlueprint[];
}>;

export type GrammarWritingPracticeTask = Readonly<{
  practiceKind: GrammarWritingPracticeKind;
  utilityLabel: string;
  level: GrammarWritingPracticeLevel;
  taskType: string;
  prompt: string;
  evaluationRule: string;
  successCriteria: readonly string[];
  feedbackRules: readonly string[];
}>;

export const GRAMMAR_WRITING_PRACTICE_REVISION: '2026-09-10-gr5';
export const GRAMMAR_WRITING_PRACTICE_LEVELS: readonly GrammarWritingPracticeLevel[];
export const GRAMMAR_WRITING_PRACTICE_PRINCIPLES: readonly Readonly<{ id: string; statement: string }>[];
export const GRAMMAR_WRITING_PRACTICE_UTILITIES: readonly GrammarWritingPracticeUtility[];
export const GRAMMAR_WRITING_PRACTICE_BLUEPRINTS: readonly GrammarWritingPracticeBlueprint[];

export function getGrammarWritingPracticeUtility(id: string): GrammarWritingPracticeUtility | null;
export function getGrammarWritingPracticeBlueprint(id: string): GrammarWritingPracticeBlueprint | null;
export function getGrammarWritingPracticeBlueprintsForUtility(practiceKind: string): readonly GrammarWritingPracticeBlueprint[];
export function getGrammarWritingPracticeUtilitiesForParentProblem(problemId: string): readonly GrammarWritingPracticeUtility[];
export function getGrammarWritingPracticeUtilitiesForSkill(skillId: string): readonly GrammarWritingPracticeUtility[];
export function getGrammarWritingPracticeUtilitiesForTense(tenseId: string): readonly GrammarWritingPracticeUtility[];
export function getGrammarWritingPracticeUtilitiesForWritingStage(stageId: string): readonly GrammarWritingPracticeUtility[];
export function renderGrammarWritingPracticePrompt(blueprintId: string, data?: Record<string, unknown>): string;
export function buildGrammarWritingPracticeTask(practiceKind: string, level: GrammarWritingPracticeLevel, data?: Record<string, unknown>): GrammarWritingPracticeTask;
